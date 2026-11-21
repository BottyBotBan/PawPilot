const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const net = require('node:net');
const { TuyaClient } = require('./tuya');
const { LocalTuyaClient } = require('./local-tuya');
const { Preferences, validSettings } = require('./preferences');
const { PushNotifications, validSubscription } = require('./push');
const { RememberedSessions } = require('./remembered-sessions');

const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const scrypt = promisify(crypto.scrypt);
const sessionCookie = 'yje_session';
const sessionDurationMs = 12 * 60 * 60 * 1000;
const rememberedDurationMs = 30 * 24 * 60 * 60 * 1000;

function loadEnvFile() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadEnvFile();

function getConfig() {
  const mode = process.env.TUYA_MODE || 'cloud';
  if (mode === 'local') {
    const { TUYA_DEVICE_ID, TUYA_LOCAL_DEVICE_FILE, TUYA_LOCAL_IP } = process.env;
    if (!TUYA_DEVICE_ID || !TUYA_LOCAL_DEVICE_FILE || !TUYA_LOCAL_IP) return null;
    if (net.isIP(TUYA_LOCAL_IP) !== 4) {
      throw new Error('TUYA_LOCAL_IP muss eine gueltige IPv4-Adresse sein.');
    }
    const version = process.env.TUYA_LOCAL_VERSION || '3.5';
    if (!['3.1', '3.2', '3.3', '3.4', '3.5'].includes(version)) {
      throw new Error('TUYA_LOCAL_VERSION ist ungueltig.');
    }
    return {
      mode,
      deviceId: TUYA_DEVICE_ID,
      deviceFile: path.resolve(root, TUYA_LOCAL_DEVICE_FILE),
      deviceIp: TUYA_LOCAL_IP,
      version,
      python: process.env.TUYA_LOCAL_PYTHON || 'python3'
    };
  }
  if (mode !== 'cloud') throw new Error('TUYA_MODE muss cloud oder local sein.');
  const { TUYA_ACCESS_ID, TUYA_ACCESS_SECRET, TUYA_DEVICE_ID } = process.env;
  if (!TUYA_ACCESS_ID || !TUYA_ACCESS_SECRET || !TUYA_DEVICE_ID) return null;

  const endpoint = process.env.TUYA_ENDPOINT || 'https://openapi.tuyaeu.com';
  const commandCode = process.env.TUYA_CLEAN_COMMAND_CODE || '';
  if (commandCode && !/^[A-Za-z0-9_]+$/.test(commandCode)) {
    throw new Error('TUYA_CLEAN_COMMAND_CODE enthaelt ungueltige Zeichen.');
  }

  let commandValue;
  try {
    commandValue = JSON.parse(process.env.TUYA_CLEAN_COMMAND_VALUE || 'true');
  } catch {
    throw new Error('TUYA_CLEAN_COMMAND_VALUE muss ein gueltiger JSON-Wert sein.');
  }

  return {
    mode,
    endpoint,
    accessId: TUYA_ACCESS_ID,
    accessSecret: TUYA_ACCESS_SECRET,
    deviceId: TUYA_DEVICE_ID,
    commandCode,
    commandValue
  };
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  response.end(JSON.stringify(value));
}

function isSameOrigin(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return url.host === host && (url.protocol === 'https:' || url.hostname === '127.0.0.1' || url.hostname === 'localhost');
  } catch {
    return false;
  }
}

function getCookie(request, name) {
  const prefix = `${name}=`;
  const cookie = (request.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return cookie ? cookie.slice(prefix.length) : '';
}

function getClientKey(request) {
  return request.socket.remoteAddress || 'unknown';
}

function serveStatic(request, response) {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const relativePath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).slice(1);
  const filePath = path.resolve(publicRoot, relativePath);
  if (!filePath.startsWith(`${publicRoot}${path.sep}`) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404);
    response.end('Nicht gefunden');
    return;
  }

  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.webmanifest': 'application/manifest+json'
  };
  response.writeHead(200, {
    'content-type': types[path.extname(filePath)] || 'application/octet-stream',
    'cache-control': 'no-cache',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'self'; connect-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"
  });
  fs.createReadStream(filePath).pipe(response);
}

async function readJson(request) {
  let text = '';
  for await (const chunk of request) {
    text += chunk;
    if (text.length > 2048) throw new Error('Die Anfrage ist zu gross.');
  }
  return text ? JSON.parse(text) : {};
}

function createServer({
  getConfigFn = getConfig,
  getPasswordFn = () => process.env.DASHBOARD_PASSWORD,
  createClientFn = (config, options) => config.mode === 'local' ? new LocalTuyaClient(config, options) : new TuyaClient(config),
  dataDirectory = path.join(root, 'data')
} = {}) {
  const configuredPassword = getPasswordFn();
  const password = typeof configuredPassword === 'string' && configuredPassword ? configuredPassword : null;
  if (password && password.length < 14) {
    throw new Error('DASHBOARD_PASSWORD muss mindestens 14 Zeichen lang sein.');
  }
  const passwordSalt = password ? crypto.randomBytes(16) : null;
  const passwordHashPromise = password ? scrypt(password, passwordSalt, 64) : null;
  const sessions = new Map();
  const rememberedSessions = new RememberedSessions(path.join(dataDirectory, 'remembered-sessions.json'), password);
  const loginAttempts = new Map();
  let localRequest = null;
  let localCache = null;
  let localClient = null;
  const preferences = new Preferences(path.join(dataDirectory, 'preferences.json'));
  const push = new PushNotifications(path.join(dataDirectory, 'push.json'));
  const clientOptions = { onMessage(message) {
    try {
      push.observe(message);
    } catch (error) {
      push.error = 'Push-Daten konnten nicht verarbeitet werden. Dienstprotokoll pruefen.';
      console.error('Push-Verarbeitung fehlgeschlagen:', error.message);
    }
  } };

  async function isAuthenticated(token) {
    const session = sessions.get(token);
    if (session && session.expiresAt > Date.now()) return true;
    if (session) sessions.delete(token);
    return rememberedSessions.has(token);
  }

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/api/session') {
        const token = getCookie(request, sessionCookie);
        const authenticated = await isAuthenticated(token);
        sendJson(response, 200, { authenticated, passwordConfigured: Boolean(password) });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/login') {
        if (!isSameOrigin(request)) {
          sendJson(response, 403, { error: 'Ungueltige Herkunft der Anfrage.' });
          return;
        }
        if (!password) {
          sendJson(response, 503, { error: 'DASHBOARD_PASSWORD ist auf dem Raspberry Pi noch nicht eingerichtet.' });
          return;
        }

        const clientKey = getClientKey(request);
        const attempt = loginAttempts.get(clientKey);
        if (attempt && attempt.blockedUntil > Date.now()) {
          sendJson(response, 429, { error: 'Zu viele Anmeldeversuche. Bitte spaeter erneut versuchen.' });
          return;
        }

        const body = await readJson(request);
        if (!body || typeof body !== 'object' || Array.isArray(body) ||
            (body.remember !== undefined && typeof body.remember !== 'boolean')) {
          sendJson(response, 400, { error: 'Ungueltige Anmeldeoption.' });
          return;
        }
        const suppliedPassword = typeof body.password === 'string' ? body.password : '';
        const validLength = suppliedPassword.length <= 256;
        const suppliedHash = await scrypt(validLength ? suppliedPassword : '', passwordSalt, 64);
        const expectedHash = await passwordHashPromise;
        const valid = validLength && crypto.timingSafeEqual(suppliedHash, expectedHash);
        if (!valid) {
          const nextCount = attempt && attempt.resetAt > Date.now() ? attempt.count + 1 : 1;
          loginAttempts.set(clientKey, {
            count: nextCount,
            resetAt: Date.now() + 15 * 60 * 1000,
            blockedUntil: nextCount >= 5 ? Date.now() + 15 * 60 * 1000 : 0
          });
          sendJson(response, nextCount >= 5 ? 429 : 401, {
            error: nextCount >= 5
              ? 'Zu viele Anmeldeversuche. Bitte 15 Minuten warten.'
              : 'Passwort stimmt nicht.'
          });
          return;
        }

        loginAttempts.delete(clientKey);
        const token = crypto.randomBytes(32).toString('hex');
        const duration = body.remember === true ? rememberedDurationMs : sessionDurationMs;
        const expiresAt = Date.now() + duration;
        if (body.remember === true) await rememberedSessions.add(token, expiresAt);
        else sessions.set(token, { expiresAt });
        response.setHeader('set-cookie', `${sessionCookie}=${token}; Path=/; Max-Age=${duration / 1000}; HttpOnly; Secure; SameSite=Strict`);
        sendJson(response, 200, { authenticated: true });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/logout') {
        if (!isSameOrigin(request)) {
          sendJson(response, 403, { error: 'Ungueltige Herkunft der Anfrage.' });
          return;
        }
        const token = getCookie(request, sessionCookie);
        if (!sessions.has(token)) await rememberedSessions.remove(token);
        sessions.delete(token);
        response.setHeader('set-cookie', `${sessionCookie}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
        sendJson(response, 200, { authenticated: false });
        return;
      }

      if (url.pathname.startsWith('/api/')) {
        const token = getCookie(request, sessionCookie);
        if (!await isAuthenticated(token)) {
          sendJson(response, 401, { error: 'Bitte zuerst anmelden.' });
          return;
        }

        if (url.pathname === '/api/preferences') {
          if (request.method === 'GET') {
            sendJson(response, 200, preferences.read());
            return;
          }
          if (request.method === 'POST') {
            if (!isSameOrigin(request)) {
              sendJson(response, 403, { error: 'Ungueltige Herkunft der Anfrage.' });
              return;
            }
            const body = await readJson(request);
            if (!validSettings(body)) {
              sendJson(response, 400, { error: 'Ungueltige Einstellungen.' });
              return;
            }
            sendJson(response, 200, preferences.write(body));
            return;
          }
        }

        if (url.pathname === '/api/push' && request.method === 'GET') {
          push.load();
          sendJson(response, 200, { publicKey: push.data.keys.publicKey, error: push.error });
          return;
        }
        if (url.pathname === '/api/push' && request.method === 'POST') {
          if (!isSameOrigin(request)) {
            sendJson(response, 403, { error: 'Ungueltige Herkunft der Anfrage.' });
            return;
          }
          const body = await readJson(request);
          if (body.action === 'subscribe' && validSubscription(body.subscription) &&
              request.headers.origin.startsWith('https://')) {
            push.subscribe(body.subscription);
          } else if (body.action === 'status' && typeof body.endpoint === 'string') {
            push.load();
            sendJson(response, 200, { registered: push.data.subscriptions.some((entry) => entry.subscription.endpoint === body.endpoint), error: push.error });
            return;
          } else if (body.action === 'unsubscribe' && typeof body.endpoint === 'string') {
            push.unsubscribe(body.endpoint);
          } else if (body.action === 'test' && typeof body.endpoint === 'string') {
            await push.test(body.endpoint);
          } else {
            sendJson(response, 400, { error: 'Ungueltige Push-Anfrage oder fehlendes HTTPS.' });
            return;
          }
          sendJson(response, 200, { ok: true });
          return;
        }

        const config = getConfigFn();
        if (!config) {
          sendJson(response, 503, { error: 'Tuya-Zugangsdaten fehlen. Bitte die .env-Datei einrichten.' });
          return;
        }

        const client = config.mode === 'local'
          ? (localClient || (localClient = createClientFn(config, clientOptions)))
          : createClientFn(config);
        if (request.method === 'GET' && url.pathname === '/api/device') {
          let device;
          if (config.mode === 'local') {
            if (localCache && Date.now() - localCache.time < 2000) {
              device = localCache.data;
            } else {
              if (!localRequest) {
                localRequest = client.getDeviceData().then((data) => {
                  localCache = { data: { ...data, updatedAt: data.updatedAt === undefined ? new Date().toISOString() : data.updatedAt }, time: Date.now() };
                  return localCache.data;
                }).catch((error) => {
                  localCache = null;
                  throw error;
                }).finally(() => { localRequest = null; });
              }
              device = await localRequest;
            }
          } else {
            device = await client.getDeviceData();
          }
          sendJson(response, 200, {
            ...device,
            mode: config.mode || 'cloud',
            cleanConfigured: config.mode !== 'local' && Boolean(config.commandCode)
          });
          return;
        }

        if (request.method === 'POST' && url.pathname === '/api/clean') {
          if (!isSameOrigin(request)) {
            sendJson(response, 403, { error: 'Ungueltige Herkunft der Anfrage.' });
            return;
          }
          if (config.mode === 'local' || !config.commandCode) {
            sendJson(response, 409, { error: 'Der Reinigungsbefehl ist noch nicht bestaetigt und eingerichtet.' });
            return;
          }
          const body = await readJson(request);
          if (body.confirm !== true) {
            sendJson(response, 400, { error: 'Die Reinigung muss ausdruecklich bestaetigt werden.' });
            return;
          }
          const result = await client.sendCommand(config.commandCode, config.commandValue);
          sendJson(response, 200, { ok: true, result });
          return;
        }

        if (request.method === 'POST' && url.pathname === '/api/deodorant-reset') {
          if (!isSameOrigin(request)) {
            sendJson(response, 403, { error: 'Ungueltige Herkunft der Anfrage.' });
            return;
          }
          if (config.mode !== 'local' || typeof client.resetDeodorant !== 'function') {
            sendJson(response, 409, { error: 'Deodorant-Reset ist nur lokal verfuegbar.' });
            return;
          }
          const body = await readJson(request);
          if (body.confirm !== true || Object.keys(body).some((key) => key !== 'confirm')) {
            sendJson(response, 400, { error: 'Der Deodorant-Reset muss ausdruecklich bestaetigt werden.' });
            return;
          }
          try {
            await client.resetDeodorant();
          } finally {
            localCache = null;
          }
          sendJson(response, 200, { ok: true });
          return;
        }

        if (request.method === 'POST' && url.pathname === '/api/counter-days') {
          if (!isSameOrigin(request)) {
            sendJson(response, 403, { error: 'Ungueltige Herkunft der Anfrage.' });
            return;
          }
          if (config.mode !== 'local' || typeof client.setCounterDays !== 'function') {
            sendJson(response, 409, { error: 'Tageszaehler sind nur lokal verfuegbar.' });
            return;
          }
          const body = await readJson(request);
          const limits = { litter: 30, box: 14 };
          if (!body || typeof body !== 'object' || Array.isArray(body) ||
              Object.keys(body).some((key) => !['counter', 'days', 'confirm'].includes(key)) ||
              body.confirm !== true || typeof body.counter !== 'string' || !Object.hasOwn(limits, body.counter) ||
              !Number.isInteger(body.days) || body.days < 0 || body.days > limits[body.counter]) {
            sendJson(response, 400, { error: 'Ungueltiger Tageswert oder fehlende Bestaetigung.' });
            return;
          }
          try {
            await client.setCounterDays(body.counter, body.days);
          } finally {
            localCache = null;
          }
          sendJson(response, 200, { ok: true });
          return;
        }

        sendJson(response, 404, { error: 'API-Endpunkt nicht gefunden.' });
        return;
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { allow: 'GET, HEAD' });
        response.end();
        return;
      }
      serveStatic(request, response);
    } catch (error) {
      const status = error instanceof SyntaxError ? 400 : 502;
      sendJson(response, status, { error: error.message || 'Interner Fehler.' });
    }
  });

  server.on('listening', () => {
    if (password) {
      rememberedSessions.load().catch((error) => {
        console.error('Gespeicherte Anmeldungen konnten nicht vorbereitet werden:', error.message);
      });
    }
    try {
      const config = getConfigFn();
      if (config && config.mode === 'local') {
        localClient = createClientFn(config, clientOptions);
        if (typeof localClient.start === 'function') localClient.start();
      }
    } catch (error) {
      console.error('Lokaler Beobachter konnte nicht gestartet werden:', error.message);
    }
  });
  server.on('close', () => {
    if (localClient && typeof localClient.stop === 'function') localClient.stop();
  });
  return server;
}

if (require.main === module) {
  const server = createServer();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  server.listen(port, host, () => {
    console.log(`YJE030 Dashboard laeuft auf http://${host}:${port}`);
  });
}

module.exports = { createServer, getConfig };
