const loginScreen = document.querySelector('#login-screen');
const appShell = document.querySelector('#app-shell');
const loginForm = document.querySelector('#login-form');
const loginPassword = document.querySelector('#login-password');
const loginSubmit = document.querySelector('#login-submit');
const loginMessage = document.querySelector('#login-message');
const loginRemember = document.querySelector('#login-remember');
const passwordToggle = document.querySelector('#password-toggle');
const loginThemeToggle = document.querySelector('#login-theme');
const dashboardThemeToggle = document.querySelector('#dashboard-theme');
let language = 'de';
let loginTheme = null;
const staticTranslations = {
  'Katzenklo - Zuhause': 'Litter box - Home',
  'Startseite': 'Home',
  'Katzenklo': 'Litter box',
  'YJE030 · privater Zugang': 'YJE030 · private access',
  'WILLKOMMEN ZURÜCK': 'WELCOME BACK',
  'Anmelden': 'Sign in',
  'Melde dich mit deinem persönlichen Passwort an.': 'Sign in with your personal password.',
  'Passwort': 'Password',
  'Passwort anzeigen': 'Show password',
  'Dunkelmodus': 'Dark mode',
  'Angemeldet bleiben': 'Stay signed in',
  '30 Tage auf diesem Gerät': '30 days on this device',
  'Sicher anmelden': 'Sign in securely',
  'Der Zugriff ist zusätzlich durch dein privates Tailscale-Netz geschützt.': 'Access is additionally protected by your private Tailscale network.',
  'YJE030 · Zuhause': 'YJE030 · Home',
  'Verbinde…': 'Connecting…',
  'Daten aktualisieren': 'Refresh data',
  'Aktualisieren': 'Refresh',
  'Abmelden': 'Sign out',
  'GERÄTESTATUS': 'DEVICE STATUS',
  'Alles im Blick.': 'Everything at a glance.',
  'Der aktuelle Überblick für dein Katzenklo.': 'Your litter box at a glance.',
  'Zuletzt aktualisiert': 'Last updated',
  'Einstellungen': 'Settings',
  'Darstellung': 'Appearance',
  'Sprache': 'Language',
  'Bereiche anzeigen': 'Show sections',
  'Letztes Gewicht': 'Last weight',
  'Erinnerungszähler': 'Reminder counters',
  'Besuche & Gewichtsverlauf': 'Visits & weight history',
  'Warnungen': 'Warnings',
  'Aktionen': 'Actions',
  'Gerätewerte': 'Device values',
  'Verfügbare Befehle': 'Available commands',
  'Einstellungen speichern': 'Save settings',
  'Push-Benachrichtigungen': 'Push notifications',
  'Gerätemeldungen und Abfallbehälter-Erinnerung bei 0 Tagen. Kein gemessener Füllstand. Auf dem iPhone die Seite zuerst mit Safari zum Home-Bildschirm hinzufügen und dort öffnen.': 'Device alerts and waste-bin reminders at 0 days. The fill level is not measured. On iPhone, first add this page to the Home Screen using Safari and open it there.',
  'Auf diesem Gerät aktivieren': 'Enable on this device',
  'Testnachricht senden': 'Send test notification',
  'Auf diesem Gerät deaktivieren': 'Disable on this device',
  'Gerätestatus': 'Device status',
  'Verbindung': 'Connection',
  'Wird geprüft': 'Checking',
  'Verbindung zum Gerät wird geprüft': 'Checking connection to device',
  'Warte auf Gerätestatus': 'Waiting for device status',
  'ERINNERUNGSZÄHLER': 'REMINDER COUNTERS',
  'Verbleibende Zeit': 'Remaining time',
  'Katzenstreu': 'Cat litter',
  'Abfallbehälter': 'Waste bin',
  'Verbleibende Deodorant-Zeit': 'Deodorant time remaining',
  'Verbleibende Katzenstreu-Zeit': 'Cat litter time remaining',
  'Verbleibende Abfallbehälter-Zeit': 'Waste bin time remaining',
  'Nicht verfügbar': 'Unavailable',
  'Prozent aus den verbleibenden Tagen berechnet, kein gemessener Füllstand.': 'Percentage calculated from remaining days; fill level is not measured.',
  'LOKALE AUFZEICHNUNG': 'LOCAL RECORDING',
  'Besuche': 'Visits',
  'Heute: Toilettenbesuche': 'Today: visits',
  'Heute: Aufenthaltsdauer': 'Today: time spent',
  'Letzte 7 Tage': 'Last 7 days',
  'Besuche der letzten sieben Tage': 'Visits in the last seven days',
  'Tagesansicht': 'Daily view',
  'Tag auswählen': 'Select day',
  'Besuche nach Stunde': 'Visits by hour',
  'Uhrzeit des Raspberry Pi · Besuchsmeldungen, keine Live-Überwachung': 'Raspberry Pi time · visit reports, not live monitoring',
  'Einzelne Besuche': 'Individual visits',
  'Zeitpunkt der empfangenen Meldung · Gewicht ist eine Gerätemessung und kann ungenau sein.': 'Time the report was received · weight is measured by the device and may be inaccurate.',
  'Gewichtsverlauf': 'Weight history',
  'Letzter gültiger Messwert pro Tag, maximal 30 Tage. Gerätemessung, kann ungenau sein; fehlende Besuche werden nicht ergänzt.': 'Last valid reading per day, up to 30 days. Device readings may be inaccurate; missing visits are not filled in.',
  'Aktivitätsverlauf': 'Activity history',
  'Ausgewählte lokal gemeldete Ereignisse; nicht der vollständige Smart-Life-Verlauf.': 'Selected locally reported events; not the complete Smart Life history.',
  'KAMERA': 'CAMERA',
  'Kamera noch nicht eingerichtet': 'Camera not configured',
  'Platzhalter für die Raspberry-Pi-Kamera. Es wird noch kein Bild übertragen oder aufgezeichnet.': 'Placeholder for the Raspberry Pi camera. No image is transmitted or recorded yet.',
  'Livebild öffnen': 'Open live view',
  'LOKALE MELDUNGEN': 'LOCAL ALERTS',
  'Vergangene Meldungen können bereits behoben sein. Die Anzeige ersetzt keine Sicherheitsprüfung.': 'Past alerts may already be resolved. This display does not replace a safety check.',
  'STEUERUNG': 'CONTROLS',
  'Sicherheitsabfrage aktiv': 'Confirmation required',
  'Manuell reinigen': 'Clean manually',
  'Befehl wird erst nach Prüfung eingerichtet': 'Command must be verified before setup',
  'Erinnerungszähler ändern; ersetzt nicht den Austausch von Deodorant oder Streu und nicht das Leeren des Behälters.': 'Changing reminder counters does not replace changing deodorant or litter or emptying the bin.',
  'Deodorant-Zähler': 'Deodorant counter',
  'Zurücksetzen': 'Reset',
  'Katzenstreu-Tage (0–30)': 'Cat litter days (0–30)',
  'Abfallbehälter-Tage (0–14)': 'Waste bin days (0–14)',
  'Speichern': 'Save',
  'LIVE-DATEN': 'LIVE DATA',
  'Nach der Einrichtung erscheinen hier die von der YJE030 gemeldeten Werte.': 'Values reported by the YJE030 will appear here after setup.',
  'GERÄTEMODELL': 'DEVICE MODEL',
  'Die Tuya-Gerätefunktionen erscheinen nach der Verbindung.': 'Tuya device functions will appear after connecting.',
  'Privates Dashboard für deine YJE030': 'Private dashboard for your YJE030',
  'Privater Zugriff · keine öffentlichen Router-Ports': 'Private access · no public router ports'
};
let staticText = null;
function translateStatic() {
  document.documentElement.lang = language;
  document.title = language === 'en' ? staticTranslations['Katzenklo - Zuhause'] : 'Katzenklo - Zuhause';
  if (!staticText) {
    staticText = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const original = node.nodeValue.trim();
      if (Object.hasOwn(staticTranslations, original)) staticText.push({ node, original, text: node.nodeValue });
    }
    for (const element of document.querySelectorAll('[aria-label], [title]')) {
      for (const attribute of ['aria-label', 'title']) {
        const original = element.getAttribute(attribute);
        if (Object.hasOwn(staticTranslations, original)) staticText.push({ element, attribute, original });
      }
    }
  }
  for (const item of staticText) {
    const translated = language === 'en' ? staticTranslations[item.original] : item.original;
    if (item.node) item.node.nodeValue = item.text.replace(item.original, translated);
    else item.element.setAttribute(item.attribute, translated);
  }
  setPasswordVisible(loginPassword.type === 'text');
}
function tr(de, en) { return language === 'en' ? en : de; }
function locale() { return language === 'en' ? 'en-GB' : 'de-DE'; }
function rememberLanguage() {
  try {
    localStorage.setItem('pawpilot-language', language);
  } catch (error) {
    console.warn('Language could not be saved in the browser:', error);
  }
}
function setTheme(theme) {
  document.body.dataset.theme = theme;
  loginThemeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  dashboardThemeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
}
const connection = document.querySelector('#connection');
const deviceState = document.querySelector('#device-state');
const deviceSubtitle = document.querySelector('#device-subtitle');
const statusTrack = document.querySelector('#status-track');
const weight = document.querySelector('#weight');
const weightNote = document.querySelector('#weight-note');
const updated = document.querySelector('#updated');
const values = document.querySelector('#values');
const valueCount = document.querySelector('#value-count');
const functionsList = document.querySelector('#functions');
const functionCount = document.querySelector('#function-count');
const warningsCard = document.querySelector('#warnings-card');
const warningCount = document.querySelector('#warning-count');
const warningCurrent = document.querySelector('#warning-current');
const warningNote = document.querySelector('#warning-note');
const warningHistory = document.querySelector('#warning-history');
const warningMore = document.querySelector('#warning-more');
const warningMoreLabel = document.querySelector('#warning-more-label');
const warningOlder = document.querySelector('#warning-older');
const cleanButton = document.querySelector('#clean');
const cleanNote = document.querySelector('#clean-note');
const message = document.querySelector('#message');
const deodorantReset = document.querySelector('#deodorant-reset');
const deodorantMessage = document.querySelector('#deodorant-message');
const counterActions = document.querySelector('#counter-actions');
const litterDays = document.querySelector('#litter-days');
const boxDays = document.querySelector('#box-days');
const litterSave = document.querySelector('#litter-save');
const boxSave = document.querySelector('#box-save');
const litterMessage = document.querySelector('#litter-message');
const boxMessage = document.querySelector('#box-message');
const activityCard = document.querySelector('#activity-card');
const todayVisits = document.querySelector('#today-visits');
const todayStay = document.querySelector('#today-stay');
const activityNote = document.querySelector('#activity-note');
const weekChart = document.querySelector('#week-chart');
const dayChart = document.querySelector('#day-chart');
const dayHeading = document.querySelector('#day-heading');
const daySelect = document.querySelector('#day-select');
const dayAxis = document.querySelector('#day-axis');
const dayVisits = document.querySelector('#day-visits');
const dayMore = document.querySelector('#day-more');
const dayMoreLabel = document.querySelector('#day-more-label');
const dayOlder = document.querySelector('#day-older');
const dayVisitsNote = document.querySelector('#day-visits-note');
const activityEvents = document.querySelector('#activity-events');
const activityMore = document.querySelector('#activity-more');
const activityMoreLabel = document.querySelector('#activity-more-label');
const activityOlder = document.querySelector('#activity-older');
const weightChart = document.querySelector('#weight-chart');
const suppliesCard = document.querySelector('#supplies-card');
const supplies = [
  { codes: ['DP 101', 'smelly_box_margin'], max: 30, percent: document.querySelector('#deodorant-percent'), progress: document.querySelector('#deodorant-progress'), remaining: document.querySelector('#deodorant-remaining') },
  { codes: ['DP 105', 'cat_litter_margin'], max: 30, percent: document.querySelector('#litter-percent'), progress: document.querySelector('#litter-progress'), remaining: document.querySelector('#litter-remaining') },
  { codes: ['DP 126', 'box_time'], max: 14, percent: document.querySelector('#box-percent'), progress: document.querySelector('#box-progress'), remaining: document.querySelector('#box-remaining') }
];
let refreshTimer = null;
let deviceRequest = null;
let deviceMode = null;
let dashboardGeneration = 0;
let deviceError = false;
let counterAvailable = false;
let counterPending = false;
let selectedActivityDate = null;
let activitySignature = null;
let latestActivityData = null;
const visibleHistoryLimit = 5;

function prepareHistory(items, recent, more, moreLabel, older) {
  recent.replaceChildren();
  older.replaceChildren();
  const remaining = Math.max(0, items.length - visibleHistoryLimit);
  more.hidden = remaining === 0;
  moreLabel.textContent = tr(`Ältere Meldungen (${remaining})`, `Older alerts (${remaining})`);
}
const sectionNames = ['weight', 'supplies', 'activity', 'camera', 'warnings', 'actions', 'values', 'functions'];
const settingsForm = document.querySelector('#settings-form');
const settingsMessage = document.querySelector('#settings-message');
const settingsSave = document.querySelector('#settings-save');
const themeMessage = document.querySelector('#theme-message');
const pushMessage = document.querySelector('#push-message');
const pushEnable = document.querySelector('#push-enable');
const pushDisable = document.querySelector('#push-disable');
const pushTest = document.querySelector('#push-test');
let pushRegistration = null;
let pushKey = null;
let currentSubscription = null;
let preferencesReady = false;
let preferencesBusy = false;

function updatePreferenceControls() {
  settingsSave.disabled = dashboardThemeToggle.disabled = !preferencesReady || preferencesBusy;
}

async function loadPreferences() {
  const generation = dashboardGeneration;
  preferencesReady = false;
  updatePreferenceControls();
  try {
    const response = await fetch('/api/preferences', { cache: 'no-store' });
    const settings = await response.json();
    if (generation !== dashboardGeneration || appShell.hidden) return;
    if (!response.ok) throw new Error(settings.error || tr('Einstellungen konnten nicht geladen werden.', 'Settings could not be loaded.'));
    const previousLanguage = language;
    applyPreferences(settings);
    preferencesReady = true;
    updatePreferenceControls();
    settingsMessage.textContent = tr('Auf dem Server gespeichert.', 'Saved on the server.');
    themeMessage.textContent = '';
    if (language !== previousLanguage && !appShell.hidden) loadDevice();
  } catch (error) {
    if (generation !== dashboardGeneration || appShell.hidden) return;
    const text = friendlyError(error, tr('Einstellungen konnten nicht geladen werden.', 'Settings could not be loaded.'));
    settingsMessage.textContent = text;
    themeMessage.textContent = text;
  }
}

function applyPreferences(settings) {
  language = settings.language || 'de';
  document.querySelector('#setting-language').value = language;
  translateStatic();
  rememberLanguage();
  setTheme(settings.theme);
  document.querySelector('#setting-dark').checked = settings.theme === 'dark';
  for (const name of sectionNames) {
    document.querySelector(`#setting-${name}`).checked = settings.sections[name];
    document.querySelector(`[data-section="${name}"]`).dataset.hidden = String(!settings.sections[name]);
  }
}

settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!preferencesReady || preferencesBusy) return;
  const generation = dashboardGeneration;
  preferencesBusy = true;
  updatePreferenceControls();
  const settings = {
    theme: document.querySelector('#setting-dark').checked ? 'dark' : 'light',
    language: document.querySelector('#setting-language').value,
    sections: Object.fromEntries(sectionNames.map((name) => [name, document.querySelector(`#setting-${name}`).checked]))
  };
  settingsMessage.textContent = tr('Einstellungen werden gespeichert…', 'Saving settings…');
  try {
    const response = await fetch('/api/preferences', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(settings)
    });
    const result = await response.json();
    if (generation !== dashboardGeneration || appShell.hidden) return;
    if (!response.ok) throw new Error(result.error || tr('Einstellungen konnten nicht gespeichert werden.', 'Settings could not be saved.'));
    applyPreferences(result);
    settingsMessage.textContent = tr('Gespeichert. Auf anderen Geräten nach erneutem Öffnen sichtbar.', 'Saved. Visible on other devices when reopened.');
    themeMessage.textContent = '';
    refreshPushStatus();
    if (!appShell.hidden) loadDevice();
  } catch (error) {
    if (generation !== dashboardGeneration || appShell.hidden) return;
    settingsMessage.textContent = friendlyError(error, tr('Einstellungen konnten nicht gespeichert werden.', 'Settings could not be saved.'));
  } finally {
    if (generation === dashboardGeneration) {
      preferencesBusy = false;
      updatePreferenceControls();
    }
  }
});

dashboardThemeToggle.addEventListener('click', async () => {
  if (!preferencesReady || preferencesBusy) return;
  const generation = dashboardGeneration;
  const theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  preferencesBusy = true;
  updatePreferenceControls();
  themeMessage.textContent = tr('Darstellung wird gespeichert…', 'Saving appearance…');
  try {
    const saved = await fetch('/api/preferences', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme })
    });
    const result = await saved.json();
    if (generation !== dashboardGeneration || appShell.hidden) return;
    if (!saved.ok) throw new Error(result.error || tr('Darstellung konnte nicht gespeichert werden.', 'Appearance could not be saved.'));
    setTheme(result.theme);
    document.querySelector('#setting-dark').checked = result.theme === 'dark';
    themeMessage.textContent = tr('Darstellung gespeichert.', 'Appearance saved.');
  } catch (error) {
    if (generation !== dashboardGeneration || appShell.hidden) return;
    themeMessage.textContent = friendlyError(error, tr('Darstellung konnte nicht gespeichert werden.', 'Appearance could not be saved.'));
  } finally {
    if (generation === dashboardGeneration) {
      preferencesBusy = false;
      updatePreferenceControls();
    }
  }
});

function pushAvailable() {
  return window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function pushUnavailableMessage() {
  const missing = [];
  if (!window.isSecureContext) missing.push(tr('sicherer Kontext (HTTPS)', 'secure context (HTTPS)'));
  if (!('serviceWorker' in navigator)) missing.push('Service Worker');
  if (!('PushManager' in window)) missing.push('Push API');
  if (!('Notification' in window)) missing.push(tr('Benachrichtigungs-API', 'Notifications API'));
  const standalone = navigator.standalone === true ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches);
  return tr(`Push nicht verfügbar. Fehlend: ${missing.join(', ') || 'unbekannt'}. Home-Bildschirm-Modus: ${standalone ? 'ja' : 'nein'}.`,
    `Push unavailable. Missing: ${missing.join(', ') || 'unknown'}. Home Screen mode: ${standalone ? 'yes' : 'no'}.`);
}

async function refreshPushStatus() {
  pushEnable.disabled = true;
  if (!pushAvailable()) {
    pushMessage.textContent = pushUnavailableMessage();
    return;
  }
  try {
    const response = await fetch('/api/push', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || tr('Push-Status nicht verfügbar.', 'Push status unavailable.'));
    await navigator.serviceWorker.register('/service-worker.js');
    pushRegistration = await navigator.serviceWorker.ready;
    pushKey = Uint8Array.from(atob(data.publicKey.replace(/-/g, '+').replace(/_/g, '/')), (character) => character.charCodeAt(0));
    const subscription = await pushRegistration.pushManager.getSubscription();
    currentSubscription = subscription;
    let registered = false;
    if (subscription) {
      const status = await fetch('/api/push', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'status', endpoint: subscription.endpoint })
      });
      const result = await status.json();
      if (!status.ok) throw new Error(result.error || tr('Push-Status nicht verfügbar.', 'Push status unavailable.'));
      registered = result.registered;
    }
    pushMessage.textContent = data.error || (registered ? tr('Push ist auf diesem Gerät aktiviert.', 'Push is enabled on this device.') : tr('Push ist auf diesem Gerät noch nicht aktiviert.', 'Push is not enabled on this device yet.'));
    pushEnable.disabled = false;
  } catch (error) {
    pushMessage.textContent = friendlyError(error, tr('Push-Status nicht verfügbar.', 'Push status unavailable.'));
  }
}

pushEnable.addEventListener('click', async () => {
  if (!pushAvailable() || !pushRegistration || !pushKey) {
    pushMessage.textContent = tr('Push ist noch nicht bereit. Bitte die Seite neu laden.', 'Push is not ready yet. Reload the page.');
    return;
  }
  pushEnable.disabled = pushDisable.disabled = true;
  let subscription = currentSubscription;
  let created = false;
  try {
    if (!subscription) {
      subscription = await pushRegistration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: pushKey });
      created = true;
    }
    const saved = await fetch('/api/push', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe', subscription: subscription.toJSON() })
    });
    const result = await saved.json();
    if (!saved.ok) throw new Error(result.error || tr('Push konnte nicht gespeichert werden.', 'Push could not be saved.'));
    currentSubscription = subscription;
    pushMessage.textContent = tr('Push ist auf diesem Gerät aktiviert.', 'Push is enabled on this device.');
  } catch (error) {
    if (created && subscription) {
      try {
        if (!await subscription.unsubscribe()) throw new Error('Abonnement nicht entfernt.');
      } catch {
        pushMessage.textContent = tr('Push konnte nicht eingerichtet oder lokal entfernt werden. Bitte Browser-Einstellungen prüfen.', 'Push could not be enabled or removed locally. Check your browser settings.');
        pushEnable.disabled = pushDisable.disabled = false;
        return;
      }
    }
    if (Notification.permission === 'denied') {
      pushMessage.textContent = tr('Benachrichtigungen wurden nicht erlaubt. Bitte die Geräteeinstellungen prüfen.', 'Notifications were denied. Check your device settings.');
      return;
    }
    pushMessage.textContent = friendlyError(error, tr('Push konnte nicht aktiviert werden.', 'Push could not be enabled.'));
  } finally {
    pushEnable.disabled = pushDisable.disabled = false;
  }
});

pushDisable.addEventListener('click', async () => {
  if (!pushAvailable()) {
    pushMessage.textContent = pushUnavailableMessage();
    return;
  }
  pushEnable.disabled = pushDisable.disabled = true;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = registration && await registration.pushManager.getSubscription();
    if (subscription) {
      const response = await fetch('/api/push', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'unsubscribe', endpoint: subscription.endpoint })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tr('Push konnte nicht entfernt werden.', 'Push could not be removed.'));
      if (!await subscription.unsubscribe()) throw new Error(tr('Push konnte auf dem Gerät nicht entfernt werden.', 'Push could not be removed from this device.'));
      currentSubscription = null;
    }
    pushMessage.textContent = tr('Push ist auf diesem Gerät deaktiviert.', 'Push is disabled on this device.');
  } catch (error) {
    pushMessage.textContent = friendlyError(error, tr('Push konnte nicht deaktiviert werden.', 'Push could not be disabled.'));
  } finally {
    pushEnable.disabled = pushDisable.disabled = false;
  }
});

pushTest.addEventListener('click', async () => {
  if (!pushAvailable()) {
    pushMessage.textContent = pushUnavailableMessage();
    return;
  }
  pushTest.disabled = true;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = registration && await registration.pushManager.getSubscription();
    if (!subscription) throw new Error(tr('Bitte Push zuerst auf diesem Gerät aktivieren.', 'First enable push on this device.'));
    const response = await fetch('/api/push', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'test', endpoint: subscription.endpoint })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || tr('Testnachricht konnte nicht gesendet werden.', 'Test notification could not be sent.'));
    pushMessage.textContent = tr('Test an den Push-Dienst übergeben. Die Zustellung kann verzögert sein.', 'Test sent to the push service. Delivery may be delayed.');
  } catch (error) {
    pushMessage.textContent = friendlyError(error, tr('Testnachricht konnte nicht gesendet werden.', 'Test notification could not be sent.'));
  } finally {
    pushTest.disabled = false;
  }
});

function renderSupplies(data) {
  suppliesCard.hidden = data.mode !== 'local';
  const status = data.monitor && data.monitor.connected && Array.isArray(data.status) ? data.status : [];
  for (const supply of supplies) {
    const item = status.find((value) => value && supply.codes.includes(value.code));
    const days = item && item.value;
    const valid = Number.isInteger(days) && days >= 0 && days <= supply.max;
    supply.percent.textContent = valid ? `${Math.round(days * 100 / supply.max)} %` : '–';
    supply.remaining.textContent = valid ? tr(`${days} von ${supply.max} Tagen`, `${days} of ${supply.max} days`) : tr('Nicht verfügbar', 'Unavailable');
    supply.progress.hidden = !valid;
    if (valid) supply.progress.value = Math.round(days * 100 / supply.max);
  }
}

function durationLabel(seconds) {
  return tr(`${Math.floor(seconds / 60)} Min. ${String(seconds % 60).padStart(2, '0')} Sek.`, `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} sec`);
}

function renderActivity(data, force = false) {
  latestActivityData = data;
  const activity = data.activity;
  activityCard.hidden = data.mode !== 'local' || !activity || !Array.isArray(activity.days) || activity.days.length !== 7;
  if (activityCard.hidden) {
    activitySignature = null;
    return;
  }
  const signature = JSON.stringify([language, activity, data.monitor && data.monitor.connected]);
  if (!force && signature === activitySignature) return;
  activitySignature = signature;
  const days = activity.days;
  const today = days[days.length - 1];
  if (!days.some((day) => day.date === selectedActivityDate)) selectedActivityDate = today.date;
  todayVisits.textContent = activity.error ? '–' : String(today.count);
  todayStay.textContent = activity.error ? '–' : durationLabel(today.seconds);
  const started = new Date(activity.startedAt);
  const startTime = Number.isNaN(started.getTime()) ? tr('unbekannt', 'unknown') : started.toLocaleString(locale());
  activityNote.textContent = tr(`Lokal erfasst seit ${startTime}. Frühere Besuche fehlen; bei Verbindungsabbrüchen oder doppelten Meldungen können Werte abweichen. Tagesgrenzen: Zeitzone des Raspberry Pi. Aufbewahrung: 30 Tage.`,
    `Recorded locally since ${startTime}. Earlier visits are missing; disconnections or duplicate reports can affect counts. Days use the Raspberry Pi time zone. Retention: 30 days.`);
  if (data.monitor && !data.monitor.connected) activityNote.textContent += tr(' Verbindung unterbrochen.', ' Connection lost.');
  if (activity.truncated) activityNote.textContent += tr(' Der Verlauf wurde wegen der Größenbegrenzung gekürzt.', ' History was truncated due to the size limit.');
  if (activity.error) activityNote.textContent += ` ${activity.error}`;
  if (activity.error) {
    weekChart.replaceChildren();
    dayChart.replaceChildren();
    daySelect.replaceChildren();
    daySelect.disabled = true;
    dayAxis.hidden = true;
    dayVisits.replaceChildren();
    dayOlder.replaceChildren();
    dayMore.hidden = true;
    dayVisitsNote.textContent = tr('Besuche nicht verfügbar.', 'Visits unavailable.');
    activityEvents.replaceChildren();
    activityOlder.replaceChildren();
    activityMore.hidden = true;
    weightChart.replaceChildren();
    dayHeading.textContent = tr('Tagesansicht nicht verfügbar', 'Daily view unavailable');
    return;
  }

  weightChart.replaceChildren();
  const weights = Array.isArray(activity.weights) ? activity.weights : [];
  if (!weights.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = tr('Noch keine gültigen Gewichtsmessungen aufgezeichnet.', 'No valid weight readings recorded yet.');
    weightChart.append(empty);
  } else {
    const maxWeight = Math.max(...weights.map((item) => item.grams));
    for (const item of weights) {
      const row = document.createElement('div');
      row.className = 'weight-row';
      const date = document.createElement('time');
      date.dateTime = item.time;
      date.textContent = `${item.date.slice(8, 10)}.${item.date.slice(5, 7)}.`;
      const bar = document.createElement('span');
      bar.className = 'weight-bar';
      bar.style.width = `${Math.max(3, Math.round(item.grams / maxWeight * 100))}%`;
      const value = document.createElement('strong');
      value.textContent = `${(item.grams / 1000).toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
      row.title = new Date(item.time).toLocaleString(locale());
      row.append(date, bar, value);
      weightChart.append(row);
    }
  }

  const maxDay = Math.max(1, ...days.map((day) => day.count));
  weekChart.replaceChildren();
  for (const day of days) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `week-day${day.date === selectedActivityDate ? ' selected' : ''}`;
    button.setAttribute('aria-label', day.covered === false ? tr(`${day.date}: keine Aufzeichnung`, `${day.date}: no recording`) : tr(`${day.date}: ${day.count} Besuche`, `${day.date}: ${day.count} visits`));
    button.setAttribute('aria-pressed', String(day.date === selectedActivityDate));
    const count = document.createElement('span');
    count.textContent = day.covered === false ? '–' : String(day.count);
    const bar = document.createElement('span');
    bar.className = 'week-bar';
    bar.style.height = `${Math.round(day.count / maxDay * 100)}%`;
    const label = document.createElement('span');
    label.textContent = day.date.slice(8, 10) + '.' + day.date.slice(5, 7) + '.';
    button.append(count, bar, label);
    button.addEventListener('click', () => {
      selectedActivityDate = day.date;
      renderActivity(data, true);
    });
    weekChart.append(button);
  }
  const selected = days.find((day) => day.date === selectedActivityDate);
  daySelect.disabled = false;
  daySelect.replaceChildren();
  for (const day of [...days].reverse()) {
    const option = document.createElement('option');
    option.value = day.date;
    option.textContent = `${day.date.slice(8, 10)}.${day.date.slice(5, 7)}.${day.date.slice(0, 4)}${day.covered === false ? tr(' – keine Aufzeichnung', ' – no recording') : ''}`;
    daySelect.append(option);
  }
  daySelect.value = selected.date;
  dayHeading.textContent = selected.covered === false
    ? tr(`Tagesansicht ${selected.date}: keine Aufzeichnung`, `Daily view ${selected.date}: no recording`)
    : tr(`Tagesansicht ${selected.date}: ${selected.count} Besuche · ${durationLabel(selected.seconds)}`, `Daily view ${selected.date}: ${selected.count} visits · ${durationLabel(selected.seconds)}`);
  const maxHour = Math.max(1, ...selected.hours);
  dayChart.replaceChildren();
  dayAxis.hidden = selected.covered === false;
  dayChart.setAttribute('aria-label', selected.covered === false
    ? tr('Keine Aufzeichnung für diesen Tag', 'No recording for this day')
    : tr(`Besuche nach Stunde: ${selected.hours.map((count, hour) => `${String(hour).padStart(2, '0')} Uhr: ${count}`).join(', ')}`, `Visits by hour: ${selected.hours.map((count, hour) => `${String(hour).padStart(2, '0')}:00: ${count}`).join(', ')}`));
  (selected.covered === false ? [] : selected.hours).forEach((count, hour) => {
    const bar = document.createElement('span');
    bar.className = 'day-bar';
    bar.style.height = `${Math.round(count / maxHour * 100)}%`;
    bar.title = tr(`${String(hour).padStart(2, '0')}:00 – ${count} Besuche`, `${String(hour).padStart(2, '0')}:00 – ${count} visits`);
    dayChart.append(bar);
  });
  const visits = Array.isArray(selected.visits) && selected.covered !== false ? selected.visits : [];
  prepareHistory(visits, dayVisits, dayMore, dayMoreLabel, dayOlder);
  dayMoreLabel.textContent = tr(`Weitere Besuche (${Math.max(0, visits.length - visibleHistoryLimit)})`, `More visits (${Math.max(0, visits.length - visibleHistoryLimit)})`);
  dayVisitsNote.textContent = selected.count > visits.length && Array.isArray(selected.visits)
    ? tr(`Es werden die letzten ${visits.length} von ${selected.count} Besuchen angezeigt.`, `Showing the latest ${visits.length} of ${selected.count} visits.`)
    : '';
  if (!visits.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = selected.covered === false ? tr('Für diesen Tag gibt es keine Aufzeichnung.', 'There is no recording for this day.')
      : !Array.isArray(selected.visits) ? tr('Einzelne Besuche sind nicht verfügbar.', 'Individual visits are unavailable.')
        : tr('Keine Besuche aufgezeichnet.', 'No visits recorded.');
    dayVisits.append(empty);
  }
  for (const [index, visit] of visits.entries()) {
    const row = document.createElement('div');
    row.className = 'value-row';
    const time = document.createElement('span');
    time.textContent = tr(`${visit.localTime} Uhr`, visit.localTime);
    const description = document.createElement('strong');
    const weightLabel = visit.grams === null ? tr('Gewicht nicht verfügbar', 'Weight unavailable')
      : `${(visit.grams / 1000).toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
    description.textContent = `${durationLabel(visit.seconds)} · ${weightLabel}`;
    row.append(time, description);
    (index < visibleHistoryLimit ? dayVisits : dayOlder).append(row);
  }
  prepareHistory(activity.events, activityEvents, activityMore, activityMoreLabel, activityOlder);
  if (!activity.events.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = tr('Noch keine Ereignisse lokal aufgezeichnet.', 'No events recorded locally yet.');
    activityEvents.append(empty);
  }
  for (const [index, item] of activity.events.entries()) {
    const row = document.createElement('div');
    row.className = 'value-row';
    const time = document.createElement('span');
    time.textContent = new Date(item.time).toLocaleString(locale());
    const description = document.createElement('strong');
    description.textContent = item.code === 'visit'
      ? tr(`Besuch gemeldet: ${durationLabel(item.value)}`, `Visit reported: ${durationLabel(item.value)}`)
      : `${labelFor({ code: item.code }, 'local')}: ${displayValue(item.value, item.code, 'local')}`;
    row.append(time, description);
    (index < visibleHistoryLimit ? activityEvents : activityOlder).append(row);
  }
}

daySelect.addEventListener('change', () => {
  if (!latestActivityData || !latestActivityData.activity.days.some((day) => day.date === daySelect.value)) return;
  selectedActivityDate = daySelect.value;
  renderActivity(latestActivityData, true);
});

function friendlyError(error, fallback) {
  if (error instanceof TypeError) {
    return tr('Dashboard-Server nicht erreichbar. Starte ihn mit „npm start“ und prüfe die Verbindung.', 'Dashboard server unreachable. Start it with “npm start” and check the connection.');
  }
  if (language === 'en' && error.message) {
    const known = {
      'Passwort stimmt nicht.': 'Incorrect password.',
      'Zu viele Anmeldeversuche. Bitte 15 Minuten warten.': 'Too many sign-in attempts. Please wait 15 minutes.',
      'Zu viele Anmeldeversuche. Bitte spaeter erneut versuchen.': 'Too many sign-in attempts. Please try again later.',
      'Bitte zuerst anmelden.': 'Please sign in first.',
      'Ungueltige Herkunft der Anfrage.': 'Invalid request origin.',
      'Ungueltige Einstellungen.': 'Invalid settings.',
      'Keine lokale Geraeteverbindung. Befehl nicht gesendet.': 'No local device connection. Command not sent.',
      'Ein Befehl wird bereits bearbeitet.': 'A command is already being processed.'
    };
    if (Object.hasOwn(known, error.message)) return known[error.message];
    if (error.message !== fallback) return `${fallback} Details: ${error.message}`;
  }
  return error.message || fallback;
}

function showLogin(messageText = '') {
  dashboardGeneration += 1;
  preferencesReady = false;
  preferencesBusy = false;
  updatePreferenceControls();
  window.clearTimeout(refreshTimer);
  refreshTimer = null;
  appShell.hidden = true;
  loginScreen.hidden = false;
  if (loginTheme) setTheme(loginTheme);
  loginPassword.value = '';
  setPasswordVisible(false);
  loginMessage.textContent = messageText;
}

function setPasswordVisible(visible) {
  loginPassword.type = visible ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', String(visible));
  const label = visible ? tr('Passwort verbergen', 'Hide password') : tr('Passwort anzeigen', 'Show password');
  passwordToggle.setAttribute('aria-label', label);
  passwordToggle.title = label;
}

passwordToggle.addEventListener('click', () => setPasswordVisible(loginPassword.type !== 'text'));
loginThemeToggle.addEventListener('click', () => {
  loginTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(loginTheme);
  try {
    localStorage.setItem('pawpilot-login-theme', loginTheme);
  } catch (error) {
    console.warn('Login theme could not be saved in the browser:', error);
    loginMessage.textContent = tr('Darstellung konnte auf diesem Gerät nicht gespeichert werden.', 'Appearance could not be saved on this device.');
  }
});

function showDashboard() {
  loginScreen.hidden = true;
  appShell.hidden = false;
  loadPreferences().then(() => { if (!appShell.hidden) refreshPushStatus(); });
}

const deviceLabels = {
  'Reinigungshäufigkeit / Verzögerung (DP 5)': 'Cleaning frequency / delay (DP 5)',
  'Reinigungsverzögerung (delay_clean_time)': 'Cleaning delay (delay_clean_time)',
  'Auto Clean / Sensormodus (DP 4)': 'Auto Clean / sensor mode (DP 4)',
  'Deodorant: Verbleibende Tage (DP 101)': 'Deodorant: days remaining (DP 101)',
  'Katzenstreu: Verbleibende Tage (DP 105)': 'Cat litter: days remaining (DP 105)',
  'Letzte Gerätemeldung (DP 110)': 'Last device report (DP 110)',
  'Letzte Fehlermeldung (DP 109)': 'Last error report (DP 109)',
  'Kitten-Modus (DP 112)': 'Kitten mode (DP 112)',
  'Kinderriegel (DP 113)': 'Child lock (DP 113)',
  'Nicht stören: Anzeigelicht (DP 114)': 'Do not disturb: display light (DP 114)',
  'Luftvorhang: Reinigung nach Toilettennutzung (DP 117)': 'Air curtain: cleaning after use (DP 117)',
  'Nicht stören: Signalton (DP 119)': 'Do not disturb: sound (DP 119)',
  'Reinigungszeitplan: Rohwert (DP 121)': 'Cleaning schedule: raw value (DP 121)',
  'Nicht stören: Reinigung deaktivieren (DP 122)': 'Do not disturb: disable cleaning (DP 122)',
  'Deodorant: Reset-Signal (DP 124)': 'Deodorant: reset signal (DP 124)',
  'Katzenstreu: Reset-Signal (DP 125)': 'Cat litter: reset signal (DP 125)',
  'Abfallbehälter: Verbleibende Tage (DP 126)': 'Waste bin: days remaining (DP 126)',
  'Timer-Modus / Regelmäßige Reinigung (DP 128)': 'Timer mode / scheduled cleaning (DP 128)',
  'Toilette: Reset-Signal (DP 130)': 'Litter box: reset signal (DP 130)',
  'Letzte Besuchsdauer (DP 131)': 'Last visit duration (DP 131)',
  'Luftvorhang: Tägliche Reinigung (DP 136)': 'Air curtain: daily cleaning (DP 136)',
  'Unbekannter Wert': 'Unknown value'
};
function labelFor(item, mode) {
  const label = germanLabelFor(item, mode);
  return language === 'en' && Object.hasOwn(deviceLabels, label) ? deviceLabels[label] : label;
}

function germanLabelFor(item, mode) {
  if (mode === 'local' && (item.code === 'delay_clean_time' || item.code === 'DP 5')) return 'Reinigungshäufigkeit / Verzögerung (DP 5)';
  if (item.code === 'delay_clean_time') return 'Reinigungsverzögerung (delay_clean_time)';
  if (mode === 'local' && (item.code === 'auto_clean' || item.code === 'DP 4')) return 'Auto Clean / Sensormodus (DP 4)';
  if (mode === 'local' && (item.code === 'DP 101' || item.code === 'smelly_box_margin')) return 'Deodorant: Verbleibende Tage (DP 101)';
  if (mode === 'local' && (item.code === 'DP 105' || item.code === 'cat_litter_margin')) return 'Katzenstreu: Verbleibende Tage (DP 105)';
  if (mode === 'local' && item.code === 'DP 110') return 'Letzte Gerätemeldung (DP 110)';
  if (mode === 'local' && item.code === 'DP 109') return 'Letzte Fehlermeldung (DP 109)';
  if (mode === 'local' && item.code === 'DP 112') return 'Kitten-Modus (DP 112)';
  if (mode === 'local' && item.code === 'DP 113') return 'Kinderriegel (DP 113)';
  if (mode === 'local' && item.code === 'DP 114') return 'Nicht stören: Anzeigelicht (DP 114)';
  if (mode === 'local' && item.code === 'DP 117') return 'Luftvorhang: Reinigung nach Toilettennutzung (DP 117)';
  if (mode === 'local' && item.code === 'DP 119') return 'Nicht stören: Signalton (DP 119)';
  if (mode === 'local' && item.code === 'DP 121') return 'Reinigungszeitplan: Rohwert (DP 121)';
  if (mode === 'local' && item.code === 'DP 122') return 'Nicht stören: Reinigung deaktivieren (DP 122)';
  if (mode === 'local' && item.code === 'DP 124') return 'Deodorant: Reset-Signal (DP 124)';
  if (mode === 'local' && item.code === 'DP 125') return 'Katzenstreu: Reset-Signal (DP 125)';
  if (mode === 'local' && (item.code === 'DP 126' || item.code === 'box_time')) return 'Abfallbehälter: Verbleibende Tage (DP 126)';
  if (mode === 'local' && item.code === 'DP 128') return 'Timer-Modus / Regelmäßige Reinigung (DP 128)';
  if (mode === 'local' && item.code === 'DP 130') return 'Toilette: Reset-Signal (DP 130)';
  if (mode === 'local' && item.code === 'DP 131') return 'Letzte Besuchsdauer (DP 131)';
  if (mode === 'local' && item.code === 'DP 136') return 'Luftvorhang: Tägliche Reinigung (DP 136)';
  return item.name || item.code || 'Unbekannter Wert';
}

function faultLabel(code) {
  const labels = {
    interior_radar_fault: tr('Radar-Fehlermeldung', 'Radar fault report'),
    roll_fault: tr('Fehler: Trommelposition ungewöhnlich', 'Fault: unusual drum position'),
    box_full_fault: tr('Behälter-voll-Meldung', 'Bin full report'),
    clear_inte: tr('Reinigung unterbrochen', 'Cleaning interrupted')
  };
  return Object.hasOwn(labels, code) ? `${labels[code]} (${code})` : tr(`Unbekannte Meldung (${code})`, `Unknown alert (${code})`);
}

function renderWarnings(data) {
  warningsCard.hidden = data.mode !== 'local' || !data.monitor || !data.warnings;
  if (warningsCard.hidden) return;
  const fault = (Array.isArray(data.status) ? data.status : []).find((item) => item.code === 'DP 109');
  warningCurrent.textContent = !data.monitor.connected
    ? tr('Keine aktuelle Meldung verfügbar: Verbindung unterbrochen.', 'No current alert available: connection lost.')
    : fault && typeof fault.value === 'string'
      ? tr(`Letzte Gerätemeldung: ${faultLabel(fault.value)}`, `Last device alert: ${faultLabel(fault.value)}`)
      : tr('Keine Fehlermeldung im aktuellen Status enthalten.', 'No error alert in the current status.');
  warningNote.textContent = data.warnings.error
    ? tr(`${data.warnings.error} Neue Meldungen werden nicht gespeichert.`, `${data.warnings.error} New alerts are not being saved.`)
    : tr('Vergangene Meldungen können bereits behoben sein. Verbindungsunterbrechungen können Lücken verursachen; die Anzeige ersetzt keine Sicherheitsprüfung.', 'Past alerts may already be resolved. Connection interruptions can cause gaps; this display does not replace a safety check.');
  const history = Array.isArray(data.warnings.history) ? data.warnings.history : [];
  warningCount.textContent = tr(`${history.length} ${history.length === 1 ? 'Meldung' : 'Meldungen'}`, `${history.length} ${history.length === 1 ? 'alert' : 'alerts'}`);
  prepareHistory(history, warningHistory, warningMore, warningMoreLabel, warningOlder);
  if (!history.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = tr('Noch keine Meldungen aufgezeichnet.', 'No alerts recorded yet.');
    warningHistory.append(empty);
    return;
  }
  for (const [index, item] of history.entries()) {
    const row = document.createElement('div');
    row.className = 'value-row';
    const time = document.createElement('span');
    const date = new Date(item.time);
    time.textContent = Number.isNaN(date.getTime()) ? item.time : date.toLocaleString(locale());
    const name = document.createElement('strong');
    name.textContent = faultLabel(item.code);
    row.append(time, name);
    (index < visibleHistoryLimit ? warningHistory : warningOlder).append(row);
  }
}

function renderLocalWeight(data) {
  if (data.mode !== 'local') return;
  const visit = data.lastVisit;
  const validWeight = visit && Number.isInteger(visit.grams) && visit.grams > 0;
  weight.textContent = validWeight
    ? `${(visit.grams / 1000).toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
    : '–';
  if (visit) {
    const time = new Date(visit.time);
    const date = Number.isNaN(time.getTime()) ? tr('unbekannte Zeit', 'unknown time') : time.toLocaleString(locale());
    weightNote.textContent = validWeight
      ? tr(`Zuletzt aufgezeichnet: ${date} · Gerätemessung, kann ungenau sein`, `Last recorded: ${date} · device measurement, may be inaccurate`)
      : tr(`Gewicht der Meldung vom ${date} nicht auswertbar`, `Weight from the ${date} report cannot be interpreted`);
    if (validWeight && visit.invalidAt) {
      const invalidTime = new Date(visit.invalidAt);
      const invalidDate = Number.isNaN(invalidTime.getTime()) ? tr('unbekannten Zeitpunkt', 'unknown time') : invalidTime.toLocaleString(locale());
      weightNote.textContent += tr(` · Neuere Meldung vom ${invalidDate} ohne auswertbares Gewicht`, ` · Newer report at ${invalidDate} without usable weight`);
    }
  } else {
    weightNote.textContent = tr('Warte auf einen lokal erfassten Besuch', 'Waiting for a locally recorded visit');
  }
  if (data.monitor && !data.monitor.connected) weightNote.textContent += tr(' · Verbindung unterbrochen', ' · Connection lost');
  if (data.visitError) weightNote.textContent += ` · ${data.visitError}`;
}

function displayValue(value, code, mode) {
  if ((code === 'delay_clean_time' || (mode === 'local' && code === 'DP 5')) && typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    const minutes = (value / 60).toLocaleString(locale(), { maximumFractionDigits: 2 });
    return tr(`${minutes} Min. (${value} Sek.)`, `${minutes} min (${value} sec)`);
  }
  if (mode === 'local' && code === 'DP 131' && Number.isSafeInteger(value) && value >= 0) {
    return tr(`${Math.floor(value / 60)} Min. ${value % 60} Sek.`, `${Math.floor(value / 60)} min ${value % 60} sec`);
  }
  if (mode === 'local' && ['DP 101', 'smelly_box_margin', 'DP 105', 'cat_litter_margin', 'DP 126', 'box_time'].includes(code) && Number.isSafeInteger(value) && value >= 0) {
    return tr(`${value} ${value === 1 ? 'Tag' : 'Tage'}`, `${value} ${value === 1 ? 'day' : 'days'}`);
  }
  if (mode === 'local' && ['DP 124', 'DP 125', 'DP 130'].includes(code) && value === true) {
    return tr('Gemeldet, Erfolg und Zeitpunkt unbekannt', 'Reported; success and time unknown');
  }
  if (mode === 'local' && code === 'DP 110') {
    if (value === 'cat_in_basin') return tr('Katze im Behälter gemeldet', 'Cat reported in the bin');
    if (value === 'cat_leave_basin') return tr('Verlassen des Behälters gemeldet', 'Cat reported leaving the bin');
  }
  if (value === true) return tr('Ein', 'On');
  if (value === false) return tr('Aus', 'Off');
  if (value === null || value === undefined) return '–';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function renderValues(status = [], mode = 'cloud') {
  const rows = Array.isArray(status) ? status : [];
  valueCount.textContent = tr(`${rows.length} ${rows.length === 1 ? 'Wert' : 'Werte'}`, `${rows.length} ${rows.length === 1 ? 'value' : 'values'}`);
  values.replaceChildren();

  if (!rows.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = tr('Das Gerät meldet aktuell keine Statuswerte.', 'The device currently reports no status values.');
    values.append(empty);
    weight.textContent = '–';
    weightNote.textContent = tr('Kein aktueller Gerätestatus verfügbar', 'No current device status available');
    return;
  }

  for (const item of rows) {
    const row = document.createElement('div');
    row.className = 'value-row';
    const name = document.createElement('span');
    name.textContent = labelFor(item, mode);
    const value = document.createElement('strong');
    value.textContent = displayValue(item.value, item.code, mode);
    row.append(name, value);
    values.append(row);
  }

  if (mode === 'local' && !rows.some((item) => item.code === 'DP 121')) {
    const row = document.createElement('div');
    row.className = 'value-row';
    const name = document.createElement('span');
    name.textContent = tr('Reinigungszeitplan (DP 121)', 'Cleaning schedule (DP 121)');
    const value = document.createElement('strong');
    value.textContent = tr('Nicht im aktuellen Status', 'Not in current status');
    row.append(name, value);
    values.append(row);
  }

  const weightItem = mode === 'cloud'
    ? rows.find((item) => /weight|gewicht/i.test(`${item.code || ''} ${item.name || ''}`))
    : null;
  if (weightItem) {
    const raw = Number(weightItem.value);
    weight.textContent = Number.isFinite(raw) ? `${raw} kg` : displayValue(weightItem.value);
    weightNote.textContent = weightItem.name || weightItem.code || tr('Zuletzt gemeldeter Gewichtswert', 'Last reported weight');
  } else {
    weight.textContent = '–';
    weightNote.textContent = mode === 'local'
      ? tr('Lokaler Gewichtswert noch nicht zugeordnet', 'Local weight value not yet identified')
      : tr('Kein einzelner Gewichtswert im aktuellen Status', 'No individual weight value in the current status');
  }

  const onlineItem = rows.find((item) => /online|connect|verbind/i.test(`${item.code || ''} ${item.name || ''}`));
  if (onlineItem) {
    const online = onlineItem.value === true || onlineItem.value === 'true' || onlineItem.value === 1;
    deviceState.textContent = online ? 'Online' : 'Offline';
    deviceSubtitle.textContent = tr('Status laut Gerätemeldung', 'Status reported by device');
    statusTrack.classList.toggle('offline', !online);
  } else {
    deviceState.textContent = tr('Erreichbar', 'Reachable');
    deviceSubtitle.textContent = tr('Statusdaten erfolgreich abgerufen', 'Status retrieved successfully');
    statusTrack.classList.remove('offline');
  }
}

function renderFunctions(data = [], mode = 'cloud') {
  const rows = Array.isArray(data) ? data : data && Array.isArray(data.functions) ? data.functions : [];
  functionCount.textContent = tr(`${rows.length} ${rows.length === 1 ? 'Befehl' : 'Befehle'}`, `${rows.length} ${rows.length === 1 ? 'command' : 'commands'}`);
  functionsList.replaceChildren();

  if (!rows.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = mode === 'local'
      ? tr('Lokale Reinigung bleibt deaktiviert. Die Zählersteuerung ist separat verfügbar.', 'Local cleaning remains disabled. Counter controls are available separately.')
      : tr('Die Cloud meldet keine verfügbaren Befehle.', 'The cloud reports no available commands.');
    functionsList.append(empty);
    return;
  }

  for (const item of rows) {
    const row = document.createElement('div');
    row.className = 'value-row';
    const name = document.createElement('span');
    name.textContent = item.name || item.code || tr('Unbekannter Befehl', 'Unknown command');
    const code = document.createElement('strong');
    code.textContent = item.code || '–';
    row.append(name, code);
    functionsList.append(row);
  }
}

function scheduleRefresh() {
  window.clearTimeout(refreshTimer);
  if (appShell.hidden || document.hidden) return;
  refreshTimer = window.setTimeout(() => loadDevice(true), deviceMode === 'local' ? 3000 : 60000);
}

async function loadDevice(automatic = false) {
  if (appShell.hidden || deviceRequest) return;
  const generation = dashboardGeneration;
  window.clearTimeout(refreshTimer);
  refreshTimer = null;
  if (automatic !== true) {
    connection.classList.remove('error');
    connection.querySelector('i').className = '';
    connection.lastChild.textContent = tr(' Verbinde…', ' Connecting…');
    message.textContent = '';
  }
  deviceRequest = fetch('/api/device', { cache: 'no-store' });
  try {
    const response = await deviceRequest;
    const data = await response.json();
    if (generation !== dashboardGeneration || appShell.hidden) return;
    if (response.status === 401) {
      showLogin(friendlyError(new Error(data.error || tr('Bitte erneut anmelden.', 'Please sign in again.')), tr('Bitte erneut anmelden.', 'Please sign in again.')));
      return;
    }
    if (!response.ok) throw new Error(data.error || tr('Gerätedaten konnten nicht geladen werden.', 'Device data could not be loaded.'));
    deviceMode = data.mode;
    renderValues(data.status, data.mode);
    renderLocalWeight(data);
    renderWarnings(data);
    renderSupplies(data);
    renderActivity(data);
    renderFunctions(data.functions, data.mode);
    counterActions.hidden = data.mode !== 'local';
    counterAvailable = Boolean(data.mode === 'local' && data.monitor && data.monitor.connected);
    deodorantReset.disabled = litterSave.disabled = boxSave.disabled = counterPending || !counterAvailable;
    if (deviceError) message.textContent = '';
    deviceError = false;
    cleanButton.disabled = !data.cleanConfigured;
    cleanNote.textContent = data.cleanConfigured
      ? tr('Startet nach deiner Bestätigung', 'Starts after your confirmation')
      : data.mode === 'local'
        ? tr('Lokale Reinigung noch nicht sicher zugeordnet', 'Local cleaning has not yet been safely identified')
        : tr('Befehlscode fehlt noch in der Konfiguration', 'Command code is missing from the configuration');
    const disconnected = data.mode === 'local' && data.monitor && !data.monitor.connected;
    if (disconnected) {
      connection.classList.add('error');
      connection.lastChild.textContent = tr(' Nicht verbunden', ' Disconnected');
      deviceState.textContent = tr('Nicht erreichbar', 'Unreachable');
      deviceSubtitle.textContent = tr('Lokale Verbindung wird erneut aufgebaut', 'Reconnecting locally');
      statusTrack.classList.add('offline');
      message.textContent = data.monitor.error || tr('Lokale Verbindung unterbrochen.', 'Local connection lost.');
      deviceError = true;
    } else {
      connection.classList.remove('error');
      connection.querySelector('i').className = '';
      connection.lastChild.textContent = tr(' Verbunden', ' Connected');
    }
    const updateTime = data.updatedAt ? new Date(data.updatedAt) : null;
    updated.textContent = updateTime && !Number.isNaN(updateTime.getTime())
      ? updateTime.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '–';
  } catch (error) {
    if (generation !== dashboardGeneration || appShell.hidden) return;
    connection.classList.add('error');
    connection.lastChild.textContent = tr(' Nicht verbunden', ' Disconnected');
    deviceState.textContent = tr('Nicht erreichbar', 'Unreachable');
    deviceSubtitle.textContent = tr('Bitte Einrichtung und Internetzugang prüfen', 'Check setup and internet connection');
    if (!warningsCard.hidden) warningCurrent.textContent = tr('Keine aktuelle Meldung verfügbar: Dashboard nicht erreichbar.', 'No current alert available: dashboard unreachable.');
    statusTrack.classList.add('offline');
    cleanButton.disabled = true;
    counterAvailable = false;
    renderSupplies({ mode: deviceMode, status: [], monitor: { connected: false } });
    deodorantReset.disabled = litterSave.disabled = boxSave.disabled = true;
    deviceError = true;
    message.textContent = friendlyError(error, tr('Gerätedaten konnten nicht geladen werden.', 'Device data could not be loaded.'));
  } finally {
    deviceRequest = null;
    if (generation === dashboardGeneration) scheduleRefresh();
    else if (!appShell.hidden && !document.hidden) loadDevice();
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginSubmit.disabled = true;
  loginMessage.textContent = tr('Anmeldung wird geprüft…', 'Signing in…');
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: loginPassword.value, remember: loginRemember.checked })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || tr('Anmeldung fehlgeschlagen.', 'Sign-in failed.'));
    loginPassword.value = '';
    showDashboard();
    await loadDevice();
  } catch (error) {
    loginMessage.textContent = friendlyError(error, tr('Anmeldung fehlgeschlagen.', 'Sign-in failed.'));
    loginPassword.select();
  } finally {
    loginSubmit.disabled = false;
  }
});

document.querySelector('#logout').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/logout', { method: 'POST' });
    if (!response.ok) throw new Error(tr('Die Abmeldung konnte nicht bestätigt werden.', 'Sign-out could not be confirmed.'));
    showLogin(tr('Du wurdest abgemeldet.', 'You have been signed out.'));
  } catch (error) {
    showLogin(friendlyError(error, tr('Abmeldung fehlgeschlagen.', 'Sign-out failed.')));
  }
});

cleanButton.addEventListener('click', async () => {
  if (!window.confirm(tr('Manuelle Reinigung starten? Stelle sicher, dass sich keine Katze im Gerät befindet.', 'Start manual cleaning? Make sure no cat is inside the device.'))) return;
  cleanButton.disabled = true;
  message.textContent = tr('Reinigungsbefehl wird gesendet…', 'Sending cleaning command…');
  try {
    const response = await fetch('/api/clean', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: true })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || tr('Reinigungsbefehl fehlgeschlagen.', 'Cleaning command failed.'));
    message.textContent = tr('Befehl wurde an die Tuya-Cloud übermittelt.', 'Command sent to the Tuya cloud.');
    window.setTimeout(loadDevice, 2500);
  } catch (error) {
    message.textContent = friendlyError(error, tr('Reinigungsbefehl fehlgeschlagen.', 'Cleaning command failed.'));
  } finally {
    cleanButton.disabled = false;
  }
});

deodorantReset.addEventListener('click', async () => {
  if (counterPending || deodorantReset.disabled) return;
  if (!window.confirm(tr('Deodorant-Zähler zurücksetzen? Der Reset ersetzt nicht den Austausch des Deodorants.', 'Reset the deodorant counter? Resetting does not replace changing the deodorant.'))) return;
  counterPending = true;
  deodorantReset.disabled = litterSave.disabled = boxSave.disabled = true;
  deodorantMessage.textContent = tr('Reset wird gesendet…', 'Sending reset…');
  try {
    const response = await fetch('/api/deodorant-reset', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: true })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || tr('Reset konnte nicht gesendet werden.', 'Reset could not be sent.'));
    deodorantMessage.textContent = tr('Reset-Befehl gesendet. Bitte den gemeldeten Wert prüfen.', 'Reset command sent. Please check the reported value.');
  } catch (error) {
    deodorantMessage.textContent = friendlyError(error, tr('Reset konnte nicht gesendet werden.', 'Reset could not be sent.'));
  } finally {
    counterPending = false;
    deodorantReset.disabled = litterSave.disabled = boxSave.disabled = !counterAvailable;
    if (!appShell.hidden) await loadDevice();
  }
});

function setupCounterForm(form, input, button, output, counter, name, maximum) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (counterPending || button.disabled) return;
    const raw = input.value.trim();
    const days = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(days) || days < 0 || days > maximum) {
      output.textContent = tr(`Bitte eine ganze Zahl von 0 bis ${maximum} eingeben.`, `Enter a whole number from 0 to ${maximum}.`);
      return;
    }
    const counterName = counter === 'litter' ? 'cat litter counter' : 'waste bin counter';
    if (!window.confirm(tr(`${name} auf ${days} Tage setzen? Das ersetzt weder den Streuwechsel noch das Leeren des Behälters.`, `Set the ${counterName} to ${days} days? This does not replace changing the litter or emptying the bin.`))) return;
    counterPending = true;
    deodorantReset.disabled = litterSave.disabled = boxSave.disabled = true;
    output.textContent = tr('Wert wird gesendet…', 'Sending value…');
    try {
      const response = await fetch('/api/counter-days', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ counter, days, confirm: true })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tr('Tageswert konnte nicht gesendet werden.', 'Day value could not be sent.'));
      output.textContent = tr('Befehl gesendet. Bitte den gemeldeten Wert prüfen.', 'Command sent. Please check the reported value.');
    } catch (error) {
      output.textContent = friendlyError(error, tr('Tageswert konnte nicht gesendet werden.', 'Day value could not be sent.'));
    } finally {
      counterPending = false;
      deodorantReset.disabled = litterSave.disabled = boxSave.disabled = !counterAvailable;
      if (!appShell.hidden) await loadDevice();
    }
  });
}

setupCounterForm(document.querySelector('#litter-form'), litterDays, litterSave, litterMessage, 'litter', 'Katzenstreu-Zähler', 30);
setupCounterForm(document.querySelector('#box-form'), boxDays, boxSave, boxMessage, 'box', 'Abfallbehälter-Zähler', 14);

document.querySelector('#refresh').addEventListener('click', () => loadDevice());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  } else if (!appShell.hidden) {
    loadDevice();
  }
});

async function initialize() {
  try {
    const response = await fetch('/api/session', { cache: 'no-store' });
    const session = await response.json();
    if (!response.ok) throw new Error(session.error || tr('Anmeldestatus konnte nicht geladen werden.', 'Sign-in status could not be loaded.'));
    if (!session.passwordConfigured) {
      loginSubmit.disabled = true;
      loginMessage.textContent = tr('DASHBOARD_PASSWORD ist noch nicht auf dem Raspberry Pi eingerichtet.', 'DASHBOARD_PASSWORD has not yet been configured on the Raspberry Pi.');
      return;
    }
    if (session.authenticated) {
      showDashboard();
      await loadDevice();
    }
  } catch (error) {
    loginMessage.textContent = friendlyError(error, tr('Anmeldestatus konnte nicht geladen werden.', 'Sign-in status could not be loaded.'));
  }
}

if (typeof localStorage !== 'undefined') {
  try {
    const savedTheme = localStorage.getItem('pawpilot-login-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      loginTheme = savedTheme;
      setTheme(loginTheme);
    }
    if (localStorage.getItem('pawpilot-language') === 'en') {
      language = 'en';
      translateStatic();
    }
  } catch (error) {
    console.warn('Language could not be loaded from the browser:', error);
  }
}
initialize();
