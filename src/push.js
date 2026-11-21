const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const https = require('node:https');
const authorizationCache = new Map();

function generateKeys() {
  const key = crypto.createECDH('prime256v1');
  key.generateKeys();
  const privateKey = Buffer.alloc(32);
  const rawPrivateKey = key.getPrivateKey();
  rawPrivateKey.copy(privateKey, 32 - rawPrivateKey.length);
  return { publicKey: key.getPublicKey().toString('base64url'), privateKey: privateKey.toString('base64url') };
}

function authorization(endpoint, keys) {
  const audience = new URL(endpoint).origin;
  const cacheKey = `${audience}:${keys.publicKey}`;
  const cached = authorizationCache.get(cacheKey);
  if (cached && cached.until > Date.now()) return cached.value;
  const publicKey = Buffer.from(keys.publicKey, 'base64url');
  const privateKey = crypto.createPrivateKey({
    key: { kty: 'EC', crv: 'P-256', x: publicKey.subarray(1, 33).toString('base64url'),
      y: publicKey.subarray(33, 65).toString('base64url'), d: keys.privateKey },
    format: 'jwk'
  });
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ typ: 'JWT', alg: 'ES256' })}.${encode({
    aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60
  })}`;
  const signature = crypto.sign('sha256', Buffer.from(unsigned), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  const value = `vapid t=${unsigned}.${signature}, k=${keys.publicKey}`;
  authorizationCache.set(cacheKey, { value, until: Date.now() + 60 * 60 * 1000 });
  return value;
}

function sendPush(subscription, keys) {
  return new Promise((resolve, reject) => {
    const request = https.request(subscription.endpoint, {
      method: 'POST', headers: { Authorization: authorization(subscription.endpoint, keys), TTL: '3600', 'Content-Length': '0' },
      timeout: 10000
    }, (response) => {
      response.resume();
      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) resolve();
        else {
          const error = new Error('Push-Dienst hat die Anfrage abgelehnt.');
          error.statusCode = response.statusCode;
          reject(error);
        }
      });
      response.on('error', reject);
    });
    request.on('timeout', () => request.destroy(new Error('Zeitlimit beim Push-Versand erreicht.')));
    request.on('error', reject);
    request.end();
  });
}

function validSubscription(subscription) {
  if (!subscription || typeof subscription !== 'object' || typeof subscription.endpoint !== 'string' ||
      subscription.endpoint.length > 2000 || !subscription.keys || typeof subscription.keys !== 'object') return false;
  let endpoint;
  try {
    endpoint = new URL(subscription.endpoint);
  } catch {
    return false;
  }
  const host = endpoint.hostname;
  if (endpoint.protocol !== 'https:' || endpoint.port || endpoint.username || endpoint.password ||
      !(host === 'web.push.apple.com' || host.endsWith('.push.apple.com') ||
        host === 'fcm.googleapis.com' || host === 'updates.push.services.mozilla.com')) return false;
  const validKey = (key, size) => typeof key === 'string' && /^[A-Za-z0-9_-]+$/.test(key) &&
    Buffer.from(key, 'base64url').length === size && Buffer.from(key, 'base64url').toString('base64url') === key;
  return validKey(subscription.keys.p256dh, 65) && validKey(subscription.keys.auth, 16);
}

class PushNotifications {
  constructor(file, send = sendPush) {
    this.file = file;
    this.send = send;
    this.error = null;
    this.data = null;
    this.sending = Promise.resolve();
    this.faultTimes = new Map();
  }

  load() {
    if (this.data) return;
    try {
      const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (!data || !data.keys || typeof data.keys.publicKey !== 'string' ||
          typeof data.keys.privateKey !== 'string' || !Array.isArray(data.subscriptions) ||
          data.subscriptions.some((entry) => !entry || !validSubscription(entry.subscription)) ||
          typeof data.boxZero !== 'boolean') throw new Error('Ungueltiges Format.');
      const key = crypto.createECDH('prime256v1');
      const privateKey = Buffer.from(data.keys.privateKey, 'base64url');
      if (privateKey.length !== 32) throw new Error('Ungueltiger Schluessel.');
      key.setPrivateKey(privateKey);
      if (key.getPublicKey().toString('base64url') !== data.keys.publicKey) throw new Error('Ungueltiger Schluessel.');
      this.data = data;
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error('Push-Daten konnten nicht gelesen werden. Datei und Zugriffsrechte pruefen.');
      this.data = { keys: generateKeys(), subscriptions: [], boxZero: false };
      try {
        this.save();
      } catch (saveError) {
        this.data = null;
        throw saveError;
      }
    }
  }

  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true, mode: 0o700 });
    fs.writeFileSync(`${this.file}.tmp`, JSON.stringify(this.data), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(`${this.file}.tmp`, this.file);
  }

  subscribe(subscription) {
    if (!validSubscription(subscription)) throw new Error('Ungueltiges Push-Abonnement.');
    this.load();
    const subscriptions = this.data.subscriptions.filter((entry) => entry.subscription.endpoint !== subscription.endpoint);
    if (subscriptions.length >= 20) throw new Error('Maximal 20 Push-Geraete sind erlaubt.');
    subscriptions.push({ subscription: { endpoint: subscription.endpoint, keys: subscription.keys } });
    this.replaceSubscriptions(subscriptions);
  }

  unsubscribe(endpoint) {
    if (typeof endpoint !== 'string' || endpoint.length > 2000) throw new Error('Ungueltiges Push-Abonnement.');
    this.load();
    this.replaceSubscriptions(this.data.subscriptions.filter((entry) => entry.subscription.endpoint !== endpoint));
  }

  replaceSubscriptions(subscriptions) {
    const previous = this.data.subscriptions;
    this.data.subscriptions = subscriptions;
    try {
      this.save();
    } catch (error) {
      this.data.subscriptions = previous;
      throw error;
    }
  }

  observe(message) {
    this.load();
    let notify = false;
    if (message.type === 'update' && typeof message.fault === 'string' && message.fault &&
        Date.now() - (this.faultTimes.get(message.fault) || 0) >= 60000) {
      notify = true;
      this.faultTimes.set(message.fault, Date.now());
      if (this.faultTimes.size > 200) this.faultTimes.delete(this.faultTimes.keys().next().value);
    }
    const box = message.status.find((item) => item && ['DP 126', 'box_time'].includes(item.code));
    if (box && Number.isInteger(box.value) && box.value >= 0 && box.value <= 14) {
      const zero = box.value === 0;
      if (zero && !this.data.boxZero) notify = true;
      if (zero !== this.data.boxZero) {
        this.data.boxZero = zero;
        try {
          this.save();
        } catch (error) {
          this.data.boxZero = !zero;
          throw error;
        }
      }
    }
    if (notify && this.data.subscriptions.length) {
      this.sending = this.sending.then(() => this.deliver()).catch((error) => {
        this.error = 'Push-Nachricht konnte nicht versendet werden. Dienstprotokoll pruefen.';
        console.error('Push-Versand fehlgeschlagen:', error.message);
      });
    }
  }

  async deliver() {
    let failed = false;
    for (const entry of [...this.data.subscriptions]) {
      try {
        if (!this.data.subscriptions.some((item) => item.subscription.endpoint === entry.subscription.endpoint)) continue;
        await this.send(entry.subscription, this.data.keys);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          this.replaceSubscriptions(this.data.subscriptions.filter((item) => item.subscription.endpoint !== entry.subscription.endpoint));
          failed = true;
          console.error('Push-Abonnement abgelaufen oder ungueltig.');
        } else {
          failed = true;
          console.error('Push-Versand fehlgeschlagen:', error.statusCode || error.message);
        }
      }
    }
    this.error = failed ? 'Push-Versand fehlgeschlagen. Dienstprotokoll pruefen.' : null;
  }

  async test(endpoint) {
    this.load();
    const entry = this.data.subscriptions.find((item) => item.subscription.endpoint === endpoint);
    if (!entry) throw new Error('Push ist auf diesem Geraet nicht aktiviert.');
    try {
      await this.send(entry.subscription, this.data.keys);
      this.error = null;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        this.replaceSubscriptions(this.data.subscriptions.filter((item) => item !== entry));
      }
      this.error = 'Testnachricht konnte nicht versendet werden. Dienstprotokoll pruefen.';
      console.error('Push-Test fehlgeschlagen:', error.statusCode || error.message);
      throw new Error(this.error);
    }
  }
}

module.exports = { PushNotifications, validSubscription, authorization, generateKeys, sendPush };
