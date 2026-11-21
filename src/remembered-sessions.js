const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const validToken = (token) => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);

class RememberedSessions {
  constructor(file, password) {
    this.file = file;
    this.password = password;
    this.loading = null;
    this.key = null;
    this.salt = null;
    this.verifier = null;
    this.sessions = null;
  }

  async load() {
    if (!this.loading) this.loading = this.read();
    await this.loading;
  }

  async read() {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (!data || typeof data.salt !== 'string' || !/^[a-f0-9]{32}$/.test(data.salt) ||
          !validToken(data.verifier) || !Array.isArray(data.sessions) || data.sessions.length > 50 || data.sessions.some((entry) =>
        !entry || !validToken(entry.hash) || !Number.isSafeInteger(entry.expiresAt))) {
        throw new Error('Ungueltiges Format.');
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error('Gespeicherte Anmeldungen konnten nicht gelesen werden. Datei und Zugriffsrechte pruefen.');
      data = { salt: crypto.randomBytes(16).toString('hex'), verifier: null, sessions: [] };
    }
    this.salt = data.salt;
    this.key = await scrypt(this.password, Buffer.from(this.salt, 'hex'), 32);
    this.verifier = crypto.createHmac('sha256', this.key).update('smartklo-remembered-sessions-v1').digest('hex');
    this.sessions = data.sessions.filter((entry) => entry.expiresAt > Date.now());
    if (data.verifier !== null && !crypto.timingSafeEqual(Buffer.from(data.verifier, 'hex'), Buffer.from(this.verifier, 'hex'))) {
      this.save([]);
    }
  }

  hash(token) {
    return crypto.createHmac('sha256', this.key).update(token).digest('hex');
  }

  async has(token) {
    if (!this.password || !validToken(token)) return false;
    await this.load();
    const hash = this.hash(token);
    return this.sessions.some((entry) => entry.hash === hash && entry.expiresAt > Date.now());
  }

  save(entries) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true, mode: 0o700 });
    fs.writeFileSync(`${this.file}.tmp`, JSON.stringify({ salt: this.salt, verifier: this.verifier, sessions: entries }), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(`${this.file}.tmp`, this.file);
    this.sessions = entries;
  }

  async add(token, expiresAt) {
    if (!this.password || !validToken(token) || !Number.isSafeInteger(expiresAt)) throw new Error('Ungueltige Anmeldung.');
    await this.load();
    const hash = this.hash(token);
    const entries = this.sessions.filter((entry) => entry.expiresAt > Date.now());
    if (entries.length >= 50) throw new Error('Zu viele gespeicherte Anmeldungen. Bitte auf einem Geraet abmelden.');
    this.save([...entries, { hash, expiresAt }]);
  }

  async remove(token) {
    if (!this.password || !validToken(token)) return;
    await this.load();
    const hash = this.hash(token);
    const entries = this.sessions.filter((entry) => entry.hash !== hash && entry.expiresAt > Date.now());
    if (entries.length !== this.sessions.length) this.save(entries);
  }
}

module.exports = { RememberedSessions };
