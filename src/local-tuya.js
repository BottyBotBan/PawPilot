const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { LocalActivity, decodeVisit } = require('./local-activity');

class LocalTuyaClient {
  constructor(config, options = {}) {
    this.config = config;
    this.spawn = options.spawn || spawn;
    this.onMessage = options.onMessage || (() => {});
    this.historyFile = options.historyFile || path.join(__dirname, '..', 'data', 'warnings.json');
    this.visitFile = options.visitFile || path.join(path.dirname(this.historyFile), 'last-visit.json');
    this.activity = new LocalActivity(options.activityFile || path.join(path.dirname(this.historyFile), 'activity.json'));
    this.history = [];
    this.historyError = null;
    this.lastVisit = null;
    this.visitError = null;
    this.connected = false;
    this.connectionId = null;
    this.pendingCommand = null;
    this.error = 'Lokale Verbindung wird aufgebaut.';
    this.status = new Map();
    this.updatedAt = null;
    this.running = false;
    this.child = null;
    this.retry = null;
    this.activityTimer = null;
    this.loadHistory();
    this.loadVisit();
  }

  loadVisit() {
    try {
      const visit = JSON.parse(fs.readFileSync(this.visitFile, 'utf8'));
      if (!visit || typeof visit.time !== 'string' || !Number.isFinite(Date.parse(visit.time)) ||
          !(visit.grams === null || (Number.isInteger(visit.grams) && visit.grams > 0 && visit.grams <= 65535)) ||
          (visit.invalidAt !== undefined && (typeof visit.invalidAt !== 'string' || !Number.isFinite(Date.parse(visit.invalidAt))))) {
        throw new Error('Ungueltiges Format');
      }
      this.lastVisit = visit;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.visitError = 'Letzter Besuch konnte nicht geladen werden. Datei und Zugriffsrechte pruefen.';
      }
    }
  }

  saveVisit(raw) {
    const visit = decodeVisit(raw);
    const grams = visit ? visit.grams : null;
    const time = new Date().toISOString();
    this.lastVisit = grams === null && this.lastVisit && this.lastVisit.grams !== null
      ? { ...this.lastVisit, invalidAt: time }
      : { time, grams };
    if (this.visitError) return;
    const directory = path.dirname(this.visitFile);
    try {
      fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
      fs.writeFileSync(`${this.visitFile}.tmp`, JSON.stringify(this.lastVisit), { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(`${this.visitFile}.tmp`, this.visitFile);
    } catch {
      this.visitError = 'Letzter Besuch konnte nicht gespeichert werden. Datei und Zugriffsrechte pruefen.';
    }
  }

  loadHistory() {
    try {
      const history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
      if (!Array.isArray(history) || history.some((row) =>
        !row || typeof row.time !== 'string' || typeof row.code !== 'string')) {
        throw new Error('Ungueltiges Format');
      }
      this.history = history.slice(-200);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.historyError = 'Warnungsverlauf konnte nicht geladen werden. Datei und Zugriffsrechte pruefen.';
      }
    }
  }

  saveFault(code) {
    if (typeof code !== 'string' || !code) return;
    if (this.historyError) return;
    const history = [...this.history, { time: new Date().toISOString(), code }].slice(-200);
    const directory = path.dirname(this.historyFile);
    const temporary = `${this.historyFile}.tmp`;
    try {
      fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
      fs.writeFileSync(temporary, JSON.stringify(history), { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(temporary, this.historyFile);
      this.history = history;
    } catch {
      this.historyError = 'Warnungsverlauf konnte nicht gespeichert werden. Datei und Zugriffsrechte pruefen.';
    }
  }

  handleMessage(message) {
    if (message.type === 'command-result') {
      if (!this.pendingCommand || message.id !== this.pendingCommand.id) return;
      const pending = this.pendingCommand;
      this.pendingCommand = null;
      clearTimeout(pending.timeout);
      if (message.ok === true) pending.resolve();
      else pending.reject(new Error(message.error || 'Keine eindeutige Antwort auf den Befehl.'));
      return;
    }
    if (message.type === 'error') {
      this.connected = false;
      this.connectionId = null;
      this.error = message.error || 'Lokale Verbindung unterbrochen.';
      this.status.clear();
      this.rejectCommand('Verbindung unterbrochen. Ob der Befehl gesendet wurde, ist unklar.');
      return;
    }
    if ((message.type !== 'connected' && message.type !== 'update') || !Array.isArray(message.status)) {
      this.connected = false;
      this.error = 'Ungueltige Antwort vom lokalen Beobachter.';
      this.status.clear();
      if (this.child) this.child.kill();
      return;
    }
    if (message.type === 'connected') {
      if (typeof message.connection !== 'string' || !message.connection) {
        this.connected = false;
        this.error = 'Ungueltige Antwort vom lokalen Beobachter.';
        if (this.child) this.child.kill();
        return;
      }
      this.connectionId = message.connection;
      this.status.clear();
    }
    for (const item of message.status) {
      if (item && typeof item.code === 'string') this.status.set(item.code, item);
    }
    this.connected = true;
    this.error = null;
    this.updatedAt = new Date().toISOString();
    this.saveFault(message.fault);
    if (message.type === 'update') {
      if (Object.hasOwn(message, 'visit')) this.saveVisit(message.visit);
      this.activity.record(message);
    }
    this.onMessage(message);
  }

  rejectCommand(message) {
    if (!this.pendingCommand) return;
    const pending = this.pendingCommand;
    this.pendingCommand = null;
    clearTimeout(pending.timeout);
    pending.reject(new Error(message));
  }

  resetDeodorant() {
    return this.sendLocalAction('reset-deodorant');
  }

  setCounterDays(counter, days) {
    const limits = { litter: 30, box: 14 };
    if (typeof counter !== 'string' || !Object.hasOwn(limits, counter) || !Number.isInteger(days) || days < 0 || days > limits[counter]) {
      return Promise.reject(new Error('Ungueltiger Zaehler oder Tageswert.'));
    }
    const actions = { litter: 'set-litter-days', box: 'set-box-days' };
    return this.sendLocalAction(actions[counter], days);
  }

  sendLocalAction(action, days) {
    if (!this.connected || !this.connectionId || !this.child || !this.child.stdin.writable) {
      return Promise.reject(new Error('Keine lokale Geraeteverbindung. Befehl nicht gesendet.'));
    }
    if (this.pendingCommand) {
      return Promise.reject(new Error('Ein Befehl wird bereits bearbeitet.'));
    }
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.rejectCommand('Zeitlimit erreicht. Ob der Befehl gesendet wurde, ist unklar.');
      }, 20000);
      this.pendingCommand = { id, resolve, reject, timeout };
      this.child.stdin.write(JSON.stringify({
        id, action, days, connection: this.connectionId, expiresAt: Date.now() + 12000
      }) + '\n', (error) => {
        if (error && this.pendingCommand && this.pendingCommand.id === id) {
          this.rejectCommand('Befehl konnte nicht an den Beobachter uebermittelt werden.');
        }
      });
    });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.activityTimer = setInterval(() => this.activity.expire(), 60 * 60 * 1000);
    this.activityTimer.unref();
    this.connect();
  }

  connect() {
    if (!this.running) return;
    const child = this.spawn(this.config.python, [path.join(__dirname, 'local_monitor.py')], {
      stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true
    });
    this.child = child;
    const lines = readline.createInterface({ input: child.stdout });
    lines.on('line', (line) => {
      try {
        this.handleMessage(JSON.parse(line));
      } catch {
        this.connected = false;
        this.error = 'Ungueltige Antwort vom lokalen Beobachter.';
        child.kill();
      }
    });
    child.stderr.on('data', (data) => {
      this.connected = false;
      this.error = 'Der lokale Beobachter hat einen Fehler gemeldet. Bitte Dienstprotokoll pruefen.';
      process.stderr.write(data);
    });
    child.on('error', () => {
      this.connected = false;
      this.error = 'Python konnte nicht gestartet werden. Bitte TUYA_LOCAL_PYTHON und TinyTuya pruefen.';
    });
    child.on('close', () => {
      lines.close();
      this.child = null;
      this.connected = false;
      this.connectionId = null;
      this.status.clear();
      this.rejectCommand('Beobachter beendet. Ob der Befehl gesendet wurde, ist unklar.');
      if (!this.running) return;
      if (!this.error) this.error = 'Lokaler Beobachter beendet. Neuer Verbindungsversuch folgt.';
      this.retry = setTimeout(() => this.connect(), 10000);
    });
    child.stdin.on('error', () => {
      this.rejectCommand('Verbindung zum Beobachter unterbrochen. Erfolg des Befehls unklar.');
    });
    child.stdin.write(JSON.stringify({
      device_file: this.config.deviceFile,
      device_id: this.config.deviceId,
      device_ip: this.config.deviceIp,
      version: this.config.version
    }) + '\n');
  }

  stop() {
    this.running = false;
    clearTimeout(this.retry);
    clearInterval(this.activityTimer);
    this.rejectCommand('Beobachter beendet. Ob der Befehl gesendet wurde, ist unklar.');
    if (this.child) this.child.kill();
  }

  async getDeviceData() {
    return {
      status: this.connected ? [...this.status.values()] : [],
      functions: [],
      updatedAt: this.updatedAt,
      monitor: { connected: this.connected, error: this.error },
      warnings: { history: [...this.history].reverse(), error: this.historyError },
      lastVisit: this.lastVisit,
      visitError: this.visitError,
      activity: this.activity.summary()
    };
  }
}

module.exports = { LocalTuyaClient };
