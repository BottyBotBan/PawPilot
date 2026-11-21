const fs = require('node:fs');
const path = require('node:path');

const retentionMs = 30 * 24 * 60 * 60 * 1000;
const limit = 10000;
const trackedCodes = new Set([
  'DP 109', 'cat_room_error_push', 'DP 110', 'cat_room_msg_push',
  'DP 101', 'smelly_box_margin', 'DP 105', 'cat_litter_margin', 'DP 126', 'box_time',
  'DP 123', 'close_clear_time_state'
]);

function decodeVisit(raw) {
  if (typeof raw !== 'string' || !/^[A-Za-z0-9+/]{6}==$/.test(raw)) return null;
  const bytes = Buffer.from(raw, 'base64');
  if (bytes.length !== 4 || bytes.toString('base64') !== raw) return null;
  return { seconds: bytes.readUInt16BE(0), grams: bytes.readUInt16BE(2) || null };
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

class LocalActivity {
  constructor(file) {
    this.file = file;
    this.error = null;
    this.data = { startedAt: new Date().toISOString(), visits: [], events: [], truncated: false };
    try {
      const loaded = JSON.parse(fs.readFileSync(file, 'utf8'));
      const validTime = (time) => typeof time === 'string' && Number.isFinite(Date.parse(time));
      if (!loaded || !validTime(loaded.startedAt) || !Array.isArray(loaded.visits) ||
          !Array.isArray(loaded.events) || typeof loaded.truncated !== 'boolean' ||
          loaded.visits.some((visit) => !visit || !validTime(visit.time) ||
            !Number.isInteger(visit.seconds) || visit.seconds < 0 || visit.seconds > 65535 ||
            !(visit.grams === null || (Number.isInteger(visit.grams) && visit.grams > 0 && visit.grams <= 65535))) ||
          loaded.events.some((event) => !event || !validTime(event.time) || typeof event.code !== 'string' ||
            !['string', 'number', 'boolean'].includes(typeof event.value))) {
        throw new Error('Ungueltiges Format');
      }
      this.data = loaded;
    } catch (error) {
      if (error.code !== 'ENOENT') this.error = 'Aktivitaetsverlauf konnte nicht geladen werden. Datei und Zugriffsrechte pruefen.';
    }
    if (!this.error) this.save();
  }

  save() {
    if (this.error) return;
    const cutoff = Date.now() - retentionMs;
    this.data.visits = this.data.visits.filter((visit) => Date.parse(visit.time) >= cutoff);
    this.data.events = this.data.events.filter((event) => Date.parse(event.time) >= cutoff);
    if (this.data.visits.length > limit || this.data.events.length > limit) this.data.truncated = true;
    this.data.visits = this.data.visits.slice(-limit);
    this.data.events = this.data.events.slice(-limit);
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true, mode: 0o700 });
      fs.writeFileSync(`${this.file}.tmp`, JSON.stringify(this.data), { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(`${this.file}.tmp`, this.file);
    } catch {
      this.error = 'Aktivitaetsverlauf konnte nicht gespeichert werden. Datei und Zugriffsrechte pruefen.';
    }
  }

  record(message) {
    if (this.error) return;
    const time = new Date().toISOString();
    const visit = Object.hasOwn(message, 'visit') ? decodeVisit(message.visit) : null;
    if (visit) {
      this.data.visits.push({ time, ...visit });
      this.data.events.push({ time, code: 'visit', value: visit.seconds });
    }
    for (const item of message.status) {
      if (item && trackedCodes.has(item.code) && ['string', 'number', 'boolean'].includes(typeof item.value)) {
        this.data.events.push({ time, code: item.code, value: item.value });
      }
    }
    if (visit || message.status.some((item) => item && trackedCodes.has(item.code))) this.save();
  }

  expire() {
    const cutoff = Date.now() - retentionMs;
    if (this.data.visits.some((visit) => Date.parse(visit.time) < cutoff) ||
        this.data.events.some((event) => Date.parse(event.time) < cutoff)) this.save();
  }

  summary() {
    this.expire();
    const today = new Date();
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      days.push({ date: dateKey(date), covered: end.getTime() > Date.parse(this.data.startedAt), count: 0, seconds: 0, hours: Array(24).fill(0), visits: [] });
    }
    const byDate = new Map(days.map((day) => [day.date, day]));
    const weights = new Map();
    for (const visit of this.data.visits) {
      const time = new Date(visit.time);
      if (visit.grams !== null) {
        const key = dateKey(time);
        const previous = weights.get(key);
        if (!previous || Date.parse(previous.time) <= time.getTime()) {
          weights.set(key, { date: key, time: visit.time, grams: visit.grams });
        }
      }
      const day = byDate.get(dateKey(time));
      if (!day) continue;
      day.count += 1;
      day.seconds += visit.seconds;
      day.hours[time.getHours()] += 1;
      day.visits.push({
        time: visit.time,
        localTime: [time.getHours(), time.getMinutes(), time.getSeconds()].map((value) => String(value).padStart(2, '0')).join(':'),
        seconds: visit.seconds,
        grams: visit.grams
      });
    }
    for (const day of days) {
      day.visits.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
      day.visits = day.visits.slice(0, 50);
    }
    return {
      startedAt: this.data.startedAt,
      days,
      weights: [...weights.values()].sort((a, b) => a.date.localeCompare(b.date)),
      events: this.data.events.slice(-30).reverse(),
      error: this.error,
      truncated: this.data.truncated
    };
  }
}

module.exports = { LocalActivity, decodeVisit };
