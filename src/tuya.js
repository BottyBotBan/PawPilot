const crypto = require('node:crypto');

const EMPTY_SHA256 = crypto.createHash('sha256').update('').digest('hex');

function hmac(secret, value) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex').toUpperCase();
}

function makeSignature({
  accessId,
  accessSecret,
  accessToken = '',
  method,
  path,
  body = '',
  timestamp,
  nonce
}) {
  const stringToSign = [
    method.toUpperCase(),
    crypto.createHash('sha256').update(body).digest('hex'),
    '',
    path
  ].join('\n');
  const signContent = `${accessId}${accessToken}${timestamp}${nonce}${stringToSign}`;
  return hmac(accessSecret, signContent);
}

class TuyaClient {
  constructor({ endpoint, accessId, accessSecret, deviceId, fetchImpl = fetch }) {
    this.endpoint = new URL(endpoint);
    if (this.endpoint.protocol !== 'https:') {
      throw new Error('Der Tuya-Endpunkt muss HTTPS verwenden.');
    }

    this.accessId = accessId;
    this.accessSecret = accessSecret;
    this.deviceId = deviceId;
    this.fetchImpl = fetchImpl;
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  async request(method, path, bodyObject, authenticated = true) {
    const body = bodyObject === undefined ? '' : JSON.stringify(bodyObject);
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const accessToken = authenticated ? await this.getToken() : '';
    const headers = {
      client_id: this.accessId,
      sign: makeSignature({
        accessId: this.accessId,
        accessSecret: this.accessSecret,
        accessToken,
        method,
        path,
        body,
        timestamp,
        nonce
      }),
      t: timestamp,
      sign_method: 'HMAC-SHA256',
      nonce
    };

    if (accessToken) headers.access_token = accessToken;
    if (body) headers['content-type'] = 'application/json';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await this.fetchImpl(new URL(path, this.endpoint), {
        method,
        headers,
        body: body || undefined,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.success !== true) {
      const code = payload && payload.code ? ` (${payload.code})` : '';
      throw new Error(`Tuya-Anfrage fehlgeschlagen${code}. Bitte Cloud-Projekt und API-Berechtigungen pruefen.`);
    }
    return payload.result;
  }

  async getToken() {
    if (this.token && Date.now() < this.tokenExpiresAt - 60000) return this.token;

    const result = await this.request('GET', '/v1.0/token?grant_type=1', undefined, false);
    if (!result || typeof result.access_token !== 'string' || !result.access_token) {
      throw new Error('Tuya hat kein gueltiges Zugriffstoken zurueckgegeben.');
    }
    this.token = result.access_token;
    this.tokenExpiresAt = Date.now() + Number(result.expire_time || 0) * 1000;
    return this.token;
  }

  async getDeviceData() {
    const base = `/v1.0/iot-03/devices/${encodeURIComponent(this.deviceId)}`;
    const [status, functions] = await Promise.all([
      this.request('GET', `${base}/status`),
      this.request('GET', `${base}/functions`)
    ]);
    return { status, functions };
  }

  sendCommand(code, value) {
    const path = `/v1.0/iot-03/devices/${encodeURIComponent(this.deviceId)}/commands`;
    return this.request('POST', path, { commands: [{ code, value }] });
  }
}

module.exports = { TuyaClient, makeSignature, EMPTY_SHA256 };
