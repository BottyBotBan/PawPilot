const fs = require('node:fs');
const path = require('node:path');

const sections = ['weight', 'supplies', 'activity', 'camera', 'warnings', 'actions', 'values', 'functions'];
const defaults = { theme: 'light', sections: Object.fromEntries(sections.map((name) => [name, true])) };

function validSettings(value) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === 2 && ['light', 'dark'].includes(value.theme) &&
    value.sections && typeof value.sections === 'object' && !Array.isArray(value.sections) &&
    Object.keys(value.sections).length === sections.length &&
    sections.every((name) => typeof value.sections[name] === 'boolean');
}

class Preferences {
  constructor(file) {
    this.file = file;
  }

  read() {
    try {
      const value = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (!validSettings(value)) throw new Error('Ungueltige Einstellungen.');
      return value;
    } catch (error) {
      if (error.code === 'ENOENT') return structuredClone(defaults);
      throw new Error('Einstellungen konnten nicht gelesen werden. Datei und Zugriffsrechte pruefen.');
    }
  }

  write(value) {
    if (!validSettings(value)) throw new Error('Ungueltige Einstellungen.');
    fs.mkdirSync(path.dirname(this.file), { recursive: true, mode: 0o700 });
    fs.writeFileSync(`${this.file}.tmp`, JSON.stringify(value), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(`${this.file}.tmp`, this.file);
    return value;
  }
}

module.exports = { Preferences, validSettings };
