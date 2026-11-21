const loginScreen = document.querySelector('#login-screen');
const appShell = document.querySelector('#app-shell');
const loginForm = document.querySelector('#login-form');
const loginPassword = document.querySelector('#login-password');
const loginSubmit = document.querySelector('#login-submit');
const loginMessage = document.querySelector('#login-message');
const loginRemember = document.querySelector('#login-remember');
const passwordToggle = document.querySelector('#password-toggle');
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
  moreLabel.textContent = `Ältere Meldungen (${remaining})`;
}
const sectionNames = ['weight', 'supplies', 'activity', 'camera', 'warnings', 'actions', 'values', 'functions'];
const settingsForm = document.querySelector('#settings-form');
const settingsMessage = document.querySelector('#settings-message');
const pushMessage = document.querySelector('#push-message');
const pushEnable = document.querySelector('#push-enable');
const pushDisable = document.querySelector('#push-disable');
const pushTest = document.querySelector('#push-test');
let pushRegistration = null;
let pushKey = null;
let currentSubscription = null;

async function loadPreferences() {
  try {
    const response = await fetch('/api/preferences', { cache: 'no-store' });
    const settings = await response.json();
    if (!response.ok) throw new Error(settings.error || 'Einstellungen konnten nicht geladen werden.');
    applyPreferences(settings);
    document.querySelector('#settings-save').disabled = false;
    settingsMessage.textContent = 'Auf dem Server gespeichert.';
  } catch (error) {
    settingsMessage.textContent = friendlyError(error, 'Einstellungen konnten nicht geladen werden.');
  }
}

function applyPreferences(settings) {
  document.body.dataset.theme = settings.theme;
  document.querySelector('#setting-dark').checked = settings.theme === 'dark';
  for (const name of sectionNames) {
    document.querySelector(`#setting-${name}`).checked = settings.sections[name];
    document.querySelector(`[data-section="${name}"]`).dataset.hidden = String(!settings.sections[name]);
  }
}

settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const settings = {
    theme: document.querySelector('#setting-dark').checked ? 'dark' : 'light',
    sections: Object.fromEntries(sectionNames.map((name) => [name, document.querySelector(`#setting-${name}`).checked]))
  };
  settingsMessage.textContent = 'Einstellungen werden gespeichert…';
  try {
    const response = await fetch('/api/preferences', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(settings)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Einstellungen konnten nicht gespeichert werden.');
    applyPreferences(result);
    settingsMessage.textContent = 'Gespeichert. Auf anderen Geräten nach erneutem Öffnen sichtbar.';
  } catch (error) {
    settingsMessage.textContent = friendlyError(error, 'Einstellungen konnten nicht gespeichert werden.');
  }
});

function pushAvailable() {
  return window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function pushUnavailableMessage() {
  const missing = [];
  if (!window.isSecureContext) missing.push('sicherer Kontext (HTTPS)');
  if (!('serviceWorker' in navigator)) missing.push('Service Worker');
  if (!('PushManager' in window)) missing.push('Push API');
  if (!('Notification' in window)) missing.push('Benachrichtigungs-API');
  const standalone = navigator.standalone === true ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches);
  return `Push nicht verfügbar. Fehlend: ${missing.join(', ') || 'unbekannt'}. Home-Bildschirm-Modus: ${standalone ? 'ja' : 'nein'}.`;
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
    if (!response.ok) throw new Error(data.error || 'Push-Status nicht verfügbar.');
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
      if (!status.ok) throw new Error(result.error || 'Push-Status nicht verfügbar.');
      registered = result.registered;
    }
    pushMessage.textContent = data.error || (registered ? 'Push ist auf diesem Gerät aktiviert.' : 'Push ist auf diesem Gerät noch nicht aktiviert.');
    pushEnable.disabled = false;
  } catch (error) {
    pushMessage.textContent = friendlyError(error, 'Push-Status nicht verfügbar.');
  }
}

pushEnable.addEventListener('click', async () => {
  if (!pushAvailable() || !pushRegistration || !pushKey) {
    pushMessage.textContent = 'Push ist noch nicht bereit. Bitte die Seite neu laden.';
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
    if (!saved.ok) throw new Error(result.error || 'Push konnte nicht gespeichert werden.');
    currentSubscription = subscription;
    pushMessage.textContent = 'Push ist auf diesem Gerät aktiviert.';
  } catch (error) {
    if (created && subscription) {
      try {
        if (!await subscription.unsubscribe()) throw new Error('Abonnement nicht entfernt.');
      } catch {
        pushMessage.textContent = 'Push konnte nicht eingerichtet oder lokal entfernt werden. Bitte Browser-Einstellungen prüfen.';
        pushEnable.disabled = pushDisable.disabled = false;
        return;
      }
    }
    if (Notification.permission === 'denied') {
      pushMessage.textContent = 'Benachrichtigungen wurden nicht erlaubt. Bitte die Geräteeinstellungen prüfen.';
      return;
    }
    pushMessage.textContent = friendlyError(error, 'Push konnte nicht aktiviert werden.');
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
      if (!response.ok) throw new Error(data.error || 'Push konnte nicht entfernt werden.');
      if (!await subscription.unsubscribe()) throw new Error('Push konnte auf dem Gerät nicht entfernt werden.');
      currentSubscription = null;
    }
    pushMessage.textContent = 'Push ist auf diesem Gerät deaktiviert.';
  } catch (error) {
    pushMessage.textContent = friendlyError(error, 'Push konnte nicht deaktiviert werden.');
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
    if (!subscription) throw new Error('Bitte Push zuerst auf diesem Gerät aktivieren.');
    const response = await fetch('/api/push', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'test', endpoint: subscription.endpoint })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Testnachricht konnte nicht gesendet werden.');
    pushMessage.textContent = 'Test an den Push-Dienst übergeben. Die Zustellung kann verzögert sein.';
  } catch (error) {
    pushMessage.textContent = friendlyError(error, 'Testnachricht konnte nicht gesendet werden.');
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
    supply.remaining.textContent = valid ? `${days} von ${supply.max} Tagen` : 'Nicht verfügbar';
    supply.progress.hidden = !valid;
    if (valid) supply.progress.value = Math.round(days * 100 / supply.max);
  }
}

function durationLabel(seconds) {
  return `${Math.floor(seconds / 60)} Min. ${String(seconds % 60).padStart(2, '0')} Sek.`;
}

function renderActivity(data, force = false) {
  latestActivityData = data;
  const activity = data.activity;
  activityCard.hidden = data.mode !== 'local' || !activity || !Array.isArray(activity.days) || activity.days.length !== 7;
  if (activityCard.hidden) {
    activitySignature = null;
    return;
  }
  const signature = JSON.stringify([activity, data.monitor && data.monitor.connected]);
  if (!force && signature === activitySignature) return;
  activitySignature = signature;
  const days = activity.days;
  const today = days[days.length - 1];
  if (!days.some((day) => day.date === selectedActivityDate)) selectedActivityDate = today.date;
  todayVisits.textContent = activity.error ? '–' : String(today.count);
  todayStay.textContent = activity.error ? '–' : durationLabel(today.seconds);
  const started = new Date(activity.startedAt);
  activityNote.textContent = `Lokal erfasst seit ${Number.isNaN(started.getTime()) ? 'unbekannt' : started.toLocaleString('de-DE')}. Frühere Besuche fehlen; bei Verbindungsabbrüchen oder doppelten Meldungen können Werte abweichen. Tagesgrenzen: Zeitzone des Raspberry Pi. Aufbewahrung: 30 Tage.`;
  if (data.monitor && !data.monitor.connected) activityNote.textContent += ' Verbindung unterbrochen.';
  if (activity.truncated) activityNote.textContent += ' Der Verlauf wurde wegen der Größenbegrenzung gekürzt.';
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
    dayVisitsNote.textContent = 'Besuche nicht verfügbar.';
    activityEvents.replaceChildren();
    activityOlder.replaceChildren();
    activityMore.hidden = true;
    weightChart.replaceChildren();
    dayHeading.textContent = 'Tagesansicht nicht verfügbar';
    return;
  }

  weightChart.replaceChildren();
  const weights = Array.isArray(activity.weights) ? activity.weights : [];
  if (!weights.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Noch keine gültigen Gewichtsmessungen aufgezeichnet.';
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
      value.textContent = `${(item.grams / 1000).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
      row.title = new Date(item.time).toLocaleString('de-DE');
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
    button.setAttribute('aria-label', day.covered === false ? `${day.date}: keine Aufzeichnung` : `${day.date}: ${day.count} Besuche`);
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
    option.textContent = `${day.date.slice(8, 10)}.${day.date.slice(5, 7)}.${day.date.slice(0, 4)}${day.covered === false ? ' – keine Aufzeichnung' : ''}`;
    daySelect.append(option);
  }
  daySelect.value = selected.date;
  dayHeading.textContent = selected.covered === false
    ? `Tagesansicht ${selected.date}: keine Aufzeichnung`
    : `Tagesansicht ${selected.date}: ${selected.count} Besuche · ${durationLabel(selected.seconds)}`;
  const maxHour = Math.max(1, ...selected.hours);
  dayChart.replaceChildren();
  dayAxis.hidden = selected.covered === false;
  dayChart.setAttribute('aria-label', selected.covered === false
    ? 'Keine Aufzeichnung für diesen Tag'
    : `Besuche nach Stunde: ${selected.hours.map((count, hour) => `${String(hour).padStart(2, '0')} Uhr: ${count}`).join(', ')}`);
  (selected.covered === false ? [] : selected.hours).forEach((count, hour) => {
    const bar = document.createElement('span');
    bar.className = 'day-bar';
    bar.style.height = `${Math.round(count / maxHour * 100)}%`;
    bar.title = `${String(hour).padStart(2, '0')}:00 – ${count} Besuche`;
    dayChart.append(bar);
  });
  const visits = Array.isArray(selected.visits) && selected.covered !== false ? selected.visits : [];
  prepareHistory(visits, dayVisits, dayMore, dayMoreLabel, dayOlder);
  dayMoreLabel.textContent = `Weitere Besuche (${Math.max(0, visits.length - visibleHistoryLimit)})`;
  dayVisitsNote.textContent = selected.count > visits.length && Array.isArray(selected.visits)
    ? `Es werden die letzten ${visits.length} von ${selected.count} Besuchen angezeigt.`
    : '';
  if (!visits.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = selected.covered === false ? 'Für diesen Tag gibt es keine Aufzeichnung.'
      : !Array.isArray(selected.visits) ? 'Einzelne Besuche sind nicht verfügbar.'
        : 'Keine Besuche aufgezeichnet.';
    dayVisits.append(empty);
  }
  for (const [index, visit] of visits.entries()) {
    const row = document.createElement('div');
    row.className = 'value-row';
    const time = document.createElement('span');
    time.textContent = `${visit.localTime} Uhr`;
    const description = document.createElement('strong');
    const weightLabel = visit.grams === null ? 'Gewicht nicht verfügbar'
      : `${(visit.grams / 1000).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
    description.textContent = `${durationLabel(visit.seconds)} · ${weightLabel}`;
    row.append(time, description);
    (index < visibleHistoryLimit ? dayVisits : dayOlder).append(row);
  }
  prepareHistory(activity.events, activityEvents, activityMore, activityMoreLabel, activityOlder);
  if (!activity.events.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Noch keine Ereignisse lokal aufgezeichnet.';
    activityEvents.append(empty);
  }
  for (const [index, item] of activity.events.entries()) {
    const row = document.createElement('div');
    row.className = 'value-row';
    const time = document.createElement('span');
    time.textContent = new Date(item.time).toLocaleString('de-DE');
    const description = document.createElement('strong');
    description.textContent = item.code === 'visit'
      ? `Besuch gemeldet: ${durationLabel(item.value)}`
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
    return 'Dashboard-Server nicht erreichbar. Starte ihn mit „npm start“ und prüfe die Verbindung.';
  }
  return error.message || fallback;
}

function showLogin(messageText = '') {
  dashboardGeneration += 1;
  window.clearTimeout(refreshTimer);
  refreshTimer = null;
  appShell.hidden = true;
  loginScreen.hidden = false;
  loginPassword.value = '';
  setPasswordVisible(false);
  loginMessage.textContent = messageText;
}

function setPasswordVisible(visible) {
  loginPassword.type = visible ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', String(visible));
  const label = visible ? 'Passwort verbergen' : 'Passwort anzeigen';
  passwordToggle.setAttribute('aria-label', label);
  passwordToggle.title = label;
}

passwordToggle.addEventListener('click', () => setPasswordVisible(loginPassword.type !== 'text'));

function showDashboard() {
  loginScreen.hidden = true;
  appShell.hidden = false;
  loadPreferences();
  refreshPushStatus();
}

function labelFor(item, mode) {
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
    interior_radar_fault: 'Radar-Fehlermeldung',
    roll_fault: 'Fehler: Trommelposition ungewöhnlich',
    box_full_fault: 'Behälter-voll-Meldung',
    clear_inte: 'Reinigung unterbrochen'
  };
  return Object.hasOwn(labels, code) ? `${labels[code]} (${code})` : `Unbekannte Meldung (${code})`;
}

function renderWarnings(data) {
  warningsCard.hidden = data.mode !== 'local' || !data.monitor || !data.warnings;
  if (warningsCard.hidden) return;
  const fault = (Array.isArray(data.status) ? data.status : []).find((item) => item.code === 'DP 109');
  warningCurrent.textContent = !data.monitor.connected
    ? 'Keine aktuelle Meldung verfügbar: Verbindung unterbrochen.'
    : fault && typeof fault.value === 'string'
      ? `Letzte Gerätemeldung: ${faultLabel(fault.value)}`
      : 'Keine Fehlermeldung im aktuellen Status enthalten.';
  warningNote.textContent = data.warnings.error
    ? `${data.warnings.error} Neue Meldungen werden nicht gespeichert.`
    : 'Vergangene Meldungen können bereits behoben sein. Verbindungsunterbrechungen können Lücken verursachen; die Anzeige ersetzt keine Sicherheitsprüfung.';
  const history = Array.isArray(data.warnings.history) ? data.warnings.history : [];
  warningCount.textContent = `${history.length} ${history.length === 1 ? 'Meldung' : 'Meldungen'}`;
  prepareHistory(history, warningHistory, warningMore, warningMoreLabel, warningOlder);
  if (!history.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Noch keine Meldungen aufgezeichnet.';
    warningHistory.append(empty);
    return;
  }
  for (const [index, item] of history.entries()) {
    const row = document.createElement('div');
    row.className = 'value-row';
    const time = document.createElement('span');
    const date = new Date(item.time);
    time.textContent = Number.isNaN(date.getTime()) ? item.time : date.toLocaleString('de-DE');
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
    ? `${(visit.grams / 1000).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
    : '–';
  if (visit) {
    const time = new Date(visit.time);
    const date = Number.isNaN(time.getTime()) ? 'unbekannte Zeit' : time.toLocaleString('de-DE');
    weightNote.textContent = validWeight
      ? `Zuletzt aufgezeichnet: ${date} · Gerätemessung, kann ungenau sein`
      : `Gewicht der Meldung vom ${date} nicht auswertbar`;
    if (validWeight && visit.invalidAt) {
      const invalidTime = new Date(visit.invalidAt);
      weightNote.textContent += ` · Neuere Meldung vom ${Number.isNaN(invalidTime.getTime()) ? 'unbekannten Zeitpunkt' : invalidTime.toLocaleString('de-DE')} ohne auswertbares Gewicht`;
    }
  } else {
    weightNote.textContent = 'Warte auf einen lokal erfassten Besuch';
  }
  if (data.monitor && !data.monitor.connected) weightNote.textContent += ' · Verbindung unterbrochen';
  if (data.visitError) weightNote.textContent += ` · ${data.visitError}`;
}

function displayValue(value, code, mode) {
  if ((code === 'delay_clean_time' || (mode === 'local' && code === 'DP 5')) && typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    const minutes = (value / 60).toLocaleString('de-DE', { maximumFractionDigits: 2 });
    return `${minutes} Min. (${value} Sek.)`;
  }
  if (mode === 'local' && code === 'DP 131' && Number.isSafeInteger(value) && value >= 0) {
    return `${Math.floor(value / 60)} Min. ${value % 60} Sek.`;
  }
  if (mode === 'local' && ['DP 101', 'smelly_box_margin', 'DP 105', 'cat_litter_margin', 'DP 126', 'box_time'].includes(code) && Number.isSafeInteger(value) && value >= 0) {
    return `${value} ${value === 1 ? 'Tag' : 'Tage'}`;
  }
  if (mode === 'local' && ['DP 124', 'DP 125', 'DP 130'].includes(code) && value === true) {
    return 'Gemeldet, Erfolg und Zeitpunkt unbekannt';
  }
  if (mode === 'local' && code === 'DP 110') {
    if (value === 'cat_in_basin') return 'Katze im Behälter gemeldet';
    if (value === 'cat_leave_basin') return 'Verlassen des Behälters gemeldet';
  }
  if (value === true) return 'Ein';
  if (value === false) return 'Aus';
  if (value === null || value === undefined) return '–';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function renderValues(status = [], mode = 'cloud') {
  const rows = Array.isArray(status) ? status : [];
  valueCount.textContent = `${rows.length} ${rows.length === 1 ? 'Wert' : 'Werte'}`;
  values.replaceChildren();

  if (!rows.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Das Gerät meldet aktuell keine Statuswerte.';
    values.append(empty);
    weight.textContent = '–';
    weightNote.textContent = 'Kein aktueller Gerätestatus verfügbar';
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
    name.textContent = 'Reinigungszeitplan (DP 121)';
    const value = document.createElement('strong');
    value.textContent = 'Nicht im aktuellen Status';
    row.append(name, value);
    values.append(row);
  }

  const weightItem = mode === 'cloud'
    ? rows.find((item) => /weight|gewicht/i.test(`${item.code || ''} ${item.name || ''}`))
    : null;
  if (weightItem) {
    const raw = Number(weightItem.value);
    weight.textContent = Number.isFinite(raw) ? `${raw} kg` : displayValue(weightItem.value);
    weightNote.textContent = weightItem.name || weightItem.code || 'Zuletzt gemeldeter Gewichtswert';
  } else {
    weight.textContent = '–';
    weightNote.textContent = mode === 'local'
      ? 'Lokaler Gewichtswert noch nicht zugeordnet'
      : 'Kein einzelner Gewichtswert im aktuellen Status';
  }

  const onlineItem = rows.find((item) => /online|connect|verbind/i.test(`${item.code || ''} ${item.name || ''}`));
  if (onlineItem) {
    const online = onlineItem.value === true || onlineItem.value === 'true' || onlineItem.value === 1;
    deviceState.textContent = online ? 'Online' : 'Offline';
    deviceSubtitle.textContent = 'Status laut Gerätemeldung';
    statusTrack.classList.toggle('offline', !online);
  } else {
    deviceState.textContent = 'Erreichbar';
    deviceSubtitle.textContent = 'Statusdaten erfolgreich abgerufen';
    statusTrack.classList.remove('offline');
  }
}

function renderFunctions(data = [], mode = 'cloud') {
  const rows = Array.isArray(data) ? data : data && Array.isArray(data.functions) ? data.functions : [];
  functionCount.textContent = `${rows.length} ${rows.length === 1 ? 'Befehl' : 'Befehle'}`;
  functionsList.replaceChildren();

  if (!rows.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = mode === 'local'
      ? 'Lokale Reinigung bleibt deaktiviert. Die Zählersteuerung ist separat verfügbar.'
      : 'Die Cloud meldet keine verfügbaren Befehle.';
    functionsList.append(empty);
    return;
  }

  for (const item of rows) {
    const row = document.createElement('div');
    row.className = 'value-row';
    const name = document.createElement('span');
    name.textContent = item.name || item.code || 'Unbekannter Befehl';
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
    connection.lastChild.textContent = ' Verbinde…';
    message.textContent = '';
  }
  deviceRequest = fetch('/api/device', { cache: 'no-store' });
  try {
    const response = await deviceRequest;
    const data = await response.json();
    if (generation !== dashboardGeneration || appShell.hidden) return;
    if (response.status === 401) {
      showLogin(data.error || 'Bitte erneut anmelden.');
      return;
    }
    if (!response.ok) throw new Error(data.error || 'Gerätedaten konnten nicht geladen werden.');
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
      ? 'Startet nach deiner Bestätigung'
      : data.mode === 'local'
        ? 'Lokale Reinigung noch nicht sicher zugeordnet'
        : 'Befehlscode fehlt noch in der Konfiguration';
    const disconnected = data.mode === 'local' && data.monitor && !data.monitor.connected;
    if (disconnected) {
      connection.classList.add('error');
      connection.lastChild.textContent = ' Nicht verbunden';
      deviceState.textContent = 'Nicht erreichbar';
      deviceSubtitle.textContent = 'Lokale Verbindung wird erneut aufgebaut';
      statusTrack.classList.add('offline');
      message.textContent = data.monitor.error || 'Lokale Verbindung unterbrochen.';
      deviceError = true;
    } else {
      connection.classList.remove('error');
      connection.querySelector('i').className = '';
      connection.lastChild.textContent = ' Verbunden';
    }
    const updateTime = data.updatedAt ? new Date(data.updatedAt) : null;
    updated.textContent = updateTime && !Number.isNaN(updateTime.getTime())
      ? updateTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '–';
  } catch (error) {
    if (generation !== dashboardGeneration || appShell.hidden) return;
    connection.classList.add('error');
    connection.lastChild.textContent = ' Nicht verbunden';
    deviceState.textContent = 'Nicht erreichbar';
    deviceSubtitle.textContent = 'Bitte Einrichtung und Internetzugang prüfen';
    if (!warningsCard.hidden) warningCurrent.textContent = 'Keine aktuelle Meldung verfügbar: Dashboard nicht erreichbar.';
    statusTrack.classList.add('offline');
    cleanButton.disabled = true;
    counterAvailable = false;
    renderSupplies({ mode: deviceMode, status: [], monitor: { connected: false } });
    deodorantReset.disabled = litterSave.disabled = boxSave.disabled = true;
    deviceError = true;
    message.textContent = friendlyError(error, 'Gerätedaten konnten nicht geladen werden.');
  } finally {
    deviceRequest = null;
    if (generation === dashboardGeneration) scheduleRefresh();
    else if (!appShell.hidden && !document.hidden) loadDevice();
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginSubmit.disabled = true;
  loginMessage.textContent = 'Anmeldung wird geprüft…';
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: loginPassword.value, remember: loginRemember.checked })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Anmeldung fehlgeschlagen.');
    loginPassword.value = '';
    showDashboard();
    await loadDevice();
  } catch (error) {
    loginMessage.textContent = friendlyError(error, 'Anmeldung fehlgeschlagen.');
    loginPassword.select();
  } finally {
    loginSubmit.disabled = false;
  }
});

document.querySelector('#logout').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/logout', { method: 'POST' });
    if (!response.ok) throw new Error('Die Abmeldung konnte nicht bestätigt werden.');
    showLogin('Du wurdest abgemeldet.');
  } catch (error) {
    showLogin(friendlyError(error, 'Abmeldung fehlgeschlagen.'));
  }
});

cleanButton.addEventListener('click', async () => {
  if (!window.confirm('Manuelle Reinigung starten? Stelle sicher, dass sich keine Katze im Gerät befindet.')) return;
  cleanButton.disabled = true;
  message.textContent = 'Reinigungsbefehl wird gesendet…';
  try {
    const response = await fetch('/api/clean', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: true })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Reinigungsbefehl fehlgeschlagen.');
    message.textContent = 'Befehl wurde an die Tuya-Cloud übermittelt.';
    window.setTimeout(loadDevice, 2500);
  } catch (error) {
    message.textContent = friendlyError(error, 'Reinigungsbefehl fehlgeschlagen.');
  } finally {
    cleanButton.disabled = false;
  }
});

deodorantReset.addEventListener('click', async () => {
  if (counterPending || deodorantReset.disabled) return;
  if (!window.confirm('Deodorant-Zähler zurücksetzen? Der Reset ersetzt nicht den Austausch des Deodorants.')) return;
  counterPending = true;
  deodorantReset.disabled = litterSave.disabled = boxSave.disabled = true;
  deodorantMessage.textContent = 'Reset wird gesendet…';
  try {
    const response = await fetch('/api/deodorant-reset', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: true })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Reset konnte nicht gesendet werden.');
    deodorantMessage.textContent = 'Reset-Befehl gesendet. Bitte den gemeldeten Wert prüfen.';
  } catch (error) {
    deodorantMessage.textContent = friendlyError(error, 'Reset konnte nicht gesendet werden.');
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
      output.textContent = `Bitte eine ganze Zahl von 0 bis ${maximum} eingeben.`;
      return;
    }
    if (!window.confirm(`${name} auf ${days} Tage setzen? Das ersetzt weder den Streuwechsel noch das Leeren des Behälters.`)) return;
    counterPending = true;
    deodorantReset.disabled = litterSave.disabled = boxSave.disabled = true;
    output.textContent = 'Wert wird gesendet…';
    try {
      const response = await fetch('/api/counter-days', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ counter, days, confirm: true })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Tageswert konnte nicht gesendet werden.');
      output.textContent = 'Befehl gesendet. Bitte den gemeldeten Wert prüfen.';
    } catch (error) {
      output.textContent = friendlyError(error, 'Tageswert konnte nicht gesendet werden.');
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
    if (!response.ok) throw new Error(session.error || 'Anmeldestatus konnte nicht geladen werden.');
    if (!session.passwordConfigured) {
      loginSubmit.disabled = true;
      loginMessage.textContent = 'DASHBOARD_PASSWORD ist noch nicht auf dem Raspberry Pi eingerichtet.';
      return;
    }
    if (session.authenticated) {
      showDashboard();
      await loadDevice();
    }
  } catch (error) {
    loginMessage.textContent = friendlyError(error, 'Anmeldestatus konnte nicht geladen werden.');
  }
}

initialize();
