# PawPilot

Ein selbstgebautes, privates Web-Dashboard für die automatische Katzentoilette **KuzmoTec YJE030**. Es entstand aus dem Wunsch nach einer übersichtlicheren Alternative zur vorhandenen App. Vielleicht hilft das Projekt auch anderen mit demselben Gerät.

> **Experimentelles Hobbyprojekt:** Datenpunkte und Funktionen sind nicht vollständig verifiziert. PawPilot ersetzt weder die Hersteller-App noch Sicherheitseinrichtungen, Warnungen oder die regelmäßige Kontrolle der Katzentoilette. Die lokale manuelle Reinigung ist aus Sicherheitsgründen deaktiviert.

## Entstehung und Mitmachen

PawPilot wurde in großen Teilen mit Unterstützung von KI entwickelt, da dem Projektinitiator noch Programmierkenntnisse fehlen. Das Projekt ist ein Lernprozess und kann Fehler enthalten. Rückmeldungen, Tests und Verbesserungsvorschläge sind willkommen. Bitte in öffentlichen Beiträgen keine Zugangsdaten, Local Keys, Geräte-IDs, privaten Adressen oder persönlichen Aufzeichnungen teilen.

PawPilot steht unter der [GNU General Public License Version 3](LICENSE) (GPL-3.0-only). Bei der Weitergabe veränderter Versionen gelten die Bedingungen dieser Lizenz, einschließlich der Bereitstellung des zugehörigen Quellcodes.

## Was PawPilot bereits kann

- Responsives Dashboard mit Anmeldung, optionalem Dark Mode und anpassbaren Bereichen.
- Lokaler Status und ausgewählte Meldungen der getesteten YJE030; alternativ existiert ein Cloud-Modus.
- Lokale Besuchsstatistik und Gewichtsverlauf auf Basis empfangener Ereignisse; fehlende oder doppelte Meldungen können die Ergebnisse beeinflussen.
- Erinnerungszähler für Deodorant, Katzenstreu und Abfallbehälter. Die Prozentanzeigen sind keine Füllstandsmessung.
- Allgemeine Web-Push-Hinweise für lokale Gerätefehler und die Abfallbehälter-Erinnerung bei 0 Tagen.
- Webcam-Platzhalter; eine Kameraanbindung ist geplant, aber noch nicht implementiert.

Der lokale Modus liest das Gerät direkt im Heimnetz. Für Fernzugriff kann Tailscale Serve verwendet werden; der Server bindet standardmäßig an `127.0.0.1`. Push-Nachrichten verwenden den Push-Dienst des jeweiligen Browsers, beim iPhone Apple.

## Hardware und Kompatibilität

| Hardware | Stand |
| --- | --- |
| Raspberry Pi 4 | Bisherige Projektplattform mit Raspberry Pi OS. |
| Raspberry Pi Zero 2 W | Möglicher Kandidat mit einem passenden Linux-System, aber bislang nicht getestet; Leistung und Einrichtung müssen noch geprüft werden. |
| Raspberry Pi Pico WH | Mikrocontroller mit WLAN, kein Linux-Rechner: Die aktuelle Node.js-/Python-Anwendung läuft darauf nicht unverändert. Ein Einsatz als separates Kameramodul ist eine ungetestete Projektidee. |

Die Zuordnung der Datenpunkte wurde an einer YJE030 untersucht. Andere Modelle und Firmware-Versionen sind nicht bestätigt. Unbekannte Datenpunkte nicht beschreiben.

### Geplant: Infrarotkamera und Halterung

Eine Idee für die Zukunft ist eine separate Infrarotkamera mit einem Raspberry Pi Pico WH, die Bilder per WLAN an PawPilot übermittelt. Dafür soll auch eine eigene 3D-gedruckte Halterung entstehen, die an der Katzentoilette angebracht werden kann.

Das ist bisher **nicht implementiert oder getestet**. Ein passendes Kameramodul, seine Verbindung zum Pico, eine eigene Firmware sowie Bildübertragung, Leistung und Stromversorgung müssen erst untersucht werden. Für Aufnahmen bei Dunkelheit könnte zusätzlich eine geeignete Infrarotbeleuchtung nötig sein. Ein Pico WH ersetzt dabei nicht den Raspberry Pi, auf dem PawPilot läuft.

Die Halterung darf die Katze nicht gefährden und keine Bewegung oder Sicherheitseinrichtung der Toilette behindern. Vor einer Umsetzung müssen außerdem privater Zugriff, Übertragung und mögliche Speicherung der Bilder geklärt werden. Die Webcam-Kachel ist derzeit nur ein Platzhalter und überträgt oder speichert keine Bilder.

## Zugangsdaten und Datenschutz

`.env`, Tuya-Gerätelisten wie `devices.json`, private Schlüssel und der Ordner `data/` dürfen nicht veröffentlicht werden. `.env.example` enthält nur Vorlagen. Die `.gitignore` hilft, schützt aber weder bereits eingecheckte Dateien noch manuelle Uploads zuverlässig. Vor einer Veröffentlichung die Dateiliste und Inhalte einschließlich Screenshots und Git-Verlauf prüfen. Niemals echte Zugangsdaten in Issues, Screenshots oder Beispielkonfigurationen posten.

## Voraussetzungen

- Raspberry Pi OS und Node.js 20 oder neuer
- Python 3 mit TinyTuya aus `requirements.txt` für den lokalen Modus
- Eine lokal erreichbare YJE030, ihre IP-Adresse und die vom TinyTuya-Wizard erstellte `devices.json` mit Local Key
- Tailscale auf dem Pi und auf den Geräten, von denen du zugreifen willst

## Lokale Einrichtung auf dem Raspberry Pi

Der TinyTuya-Wizard kann den Local Key einmalig über ein Tuya-Cloud-Projekt beschaffen. Im laufenden lokalen Betrieb werden keine Tuya-Cloud-API-Aufrufe für Statusdaten gemacht. `devices.json` enthält den geheimen Local Key und möglicherweise weitere Geräte; nur per sicherer Verbindung übertragen, nicht teilen oder ins Repository einchecken.

1. Das Projekt auf den Pi kopieren. Lege `devices.json` außerhalb des Projektverzeichnisses ab, z. B. in `~/SmartKlo-Lokaltest/devices.json`, und beschränke den Zugriff mit `chmod 700 ~/SmartKlo-Lokaltest` und `chmod 600 ~/SmartKlo-Lokaltest/devices.json`.
2. Im Projektordner eine Python-Umgebung erstellen und die Abhängigkeit installieren:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

3. Falls noch keine `.env` existiert, `cp .env.example .env` ausführen. Eine bestehende `.env` nicht überschreiben. Setze mit `nano .env` ein eigenes `DASHBOARD_PASSWORD` mit mindestens 14 Zeichen und ergänze diese Werte:

```env
TUYA_MODE=local
TUYA_DEVICE_ID=deine_geraete_id
TUYA_LOCAL_IP=die_ip_des_geraets
TUYA_LOCAL_VERSION=3.5
TUYA_LOCAL_DEVICE_FILE=/home/DEIN_BENUTZERNAME/SmartKlo-Lokaltest/devices.json
TUYA_LOCAL_PYTHON=/home/DEIN_BENUTZERNAME/SmartKlo/.venv/bin/python
```

Ersetze `DEIN_BENUTZERNAME` und passe die Pfade an deine Installation an. Die Geräte-ID steht in Smart Life unter Geräteinformationen und im privaten `devices.json`. Die IP und Protokollversion müssen zum Gerät passen; bei einer anderen Installation können sie abweichen. Eine DHCP-Reservierung im Router verhindert IP-Änderungen. Speichere die `.env` und schränke die Zugriffsrechte mit `chmod 600 .env` ein. Nach Änderungen den Server neu starten.

Die Local-Key-Datei und das Passwort müssen für denselben Benutzer lesbar sein, unter dem der Server läuft. Wenn das Gerät neu gekoppelt wird, kann sich der Local Key ändern und muss erneut beschafft werden.

## Optional: Tuya Cloud

Für den bisherigen Cloud-Betrieb `TUYA_MODE=cloud`, `TUYA_ACCESS_ID`, `TUYA_ACCESS_SECRET`, `TUYA_DEVICE_ID` und den zum Datenzentrum passenden `TUYA_ENDPOINT` in `.env` setzen. Das Projekt muss mit dem Smart-Life-Konto verknüpft und für die benötigten APIs freigeschaltet sein. Cloud-Aufrufe können einem Kontingent oder Kosten unterliegen.

## Starten

```sh
npm start
```

Auf dem Pi lokal erreichbar unter `http://127.0.0.1:3000`. Beim Start ohne lokale Einrichtung zeigt das Dashboard einen Fehler an; es erfolgt kein automatischer Rückfall auf die Cloud.

## Fernzugriff mit Tailscale

Installiere und melde den Pi sowie dein Smartphone/Notebook bei demselben Tailscale-Konto an. Starte den Webserver mit `npm start` und danach auf dem Pi:

```sh
tailscale serve --bg 3000
```

Tailscale zeigt eine HTTPS-Adresse an, die nur in deinem Tailnet erreichbar ist. Aktiviere HTTPS-Zertifikate, falls Tailscale danach fragt. Veröffentliche den Node.js-Port nicht über Portweiterleitung oder eine öffentliche Reverse-Proxy-Regel.

Zusätzlich ist die App mit einem Passwort geschützt. Sitzungen sind HTTP-only und nur für HTTPS gedacht. Ohne Auswahl von **Angemeldet bleiben** laufen sie nach 12 Stunden oder beim Serverneustart ab. Die optionale Anmeldung bleibt auf dem jeweiligen Gerät bis zu 30 Tage auch nach einem Serverneustart bestehen; **Abmelden** beendet sie. Nach einer Änderung des Dashboard-Passworts und einem Serverneustart sind gespeicherte Anmeldungen ungültig. Die App speichert dazu ein geschütztes Sitzungstoken im Browser und kryptographische Prüfwerte für Passwort und Token in `data/remembered-sessions.json` auf dem Pi, weder Passwort noch Token im Klartext. Der Token gewährt bis zur Abmeldung oder zum Ablauf Zugang: nur auf eigenen, gesperrten Geräten nutzen. Die Datei ist privat; ihr Löschen bei gestopptem Dienst beendet alle gespeicherten Anmeldungen. Fünf falsche Anmeldeversuche sperren weitere Versuche für 15 Minuten. Teile den Pi nicht über Tailscale mit anderen und verwende kein Tailscale Funnel, wenn ausschließlich du Zugriff haben sollst.

Auf dem Smartphone kann die HTTPS-Seite über das Browser-Menü zum Startbildschirm hinzugefügt werden (auf dem iPhone in Safari über „Teilen“). Dabei wird das Katzen-Icon verwendet. Das Dashboard benötigt weiterhin die Netzwerkverbindung und die Anmeldung.

## Einstellungen und Push auf dem iPhone

Unter **Einstellungen** lassen sich Deutsch oder Englisch, Dark Mode und die angezeigten Dashboard-Bereiche wählen. Die Auswahl wird auf dem Pi in `data/preferences.json` gespeichert und nach erneutem Öffnen auch auf anderen Geräten geladen. Der Katzen-Schalter in der Dashboard-Kopfzeile speichert den Dark Mode direkt auf dem Pi, ohne andere Einstellungen zu verändern; nicht gespeicherte Eingaben im Einstellungsformular bleiben erhalten. Der Browser merkt sich die zuletzt verwendete Sprache für die Anmeldeseite, sofern lokaler Speicher verfügbar ist; nach der Anmeldung gilt die gespeicherte Server-Einstellung. Der Katzen-Schalter auf der Anmeldeseite ändert die Darstellung nur für die Anmeldung auf diesem Gerät und speichert sie im Browser. Nach der Anmeldung gilt wieder die Dashboard-Einstellung vom Pi. Technische Fehlermeldungen des Servers und Push-Hinweise können weiterhin auf Deutsch erscheinen. Ausgeblendete Bereiche bleiben in Betrieb; Warnungen werden dadurch nicht abgeschaltet.

Für Push ist iOS 16.4 oder neuer, HTTPS und eine Internetverbindung erforderlich:

1. Die Tailscale-HTTPS-Adresse in Safari öffnen, **Teilen > Zum Home-Bildschirm** wählen und die neue App vom Home-Bildschirm öffnen.
2. Anmelden, **Einstellungen > Push-Benachrichtigungen > Auf diesem Gerät aktivieren** wählen und die Erlaubnis erteilen.
3. **Testnachricht senden** antippen. Die Bestätigung bedeutet nur, dass der Push-Dienst die Nachricht angenommen hat; die Zustellung auf dem iPhone muss geprüft werden.
4. Bei Bedarf Push in denselben Einstellungen auf jedem Gerät einzeln deaktivieren. Abmelden allein deaktiviert Push nicht.

Der Pi sendet an den Push-Dienst des Browsers (beim iPhone Apple) einen leeren Push ohne Gerätewerte, Passwort oder Dashboard-Adresse; der Service Worker zeigt einen allgemeinen Hinweis an. Der Push-Dienst sieht das Abonnement und den Zeitpunkt. Zum Öffnen der Details braucht das iPhone Tailscale und gegebenenfalls eine neue Anmeldung. Die privaten Push-Schlüssel und Abonnements liegen in `data/push.json`; diese Datei und `data/preferences.json` nicht teilen oder öffentlich bereitstellen. Gehen die Push-Schlüssel verloren, müssen Push-Abonnements auf den Geräten entfernt und neu eingerichtet werden.

Im lokalen Modus wird ein Push bei einer neu empfangenen DP-109-Fehlermeldung oder beim Wechsel des Abfallbehälter-Erinnerungszählers auf 0 Tage ausgelöst. Identische Fehlermeldungen innerhalb einer Minute werden zusammengefasst. Ein beim Start gelesener alter Fehler löst keinen Push aus; 0 Tage beim ersten Status können einen Push auslösen. Wird Push erst aktiviert, nachdem 0 Tage bereits erkannt wurden, erfolgt keine nachträgliche Meldung. Der Zähler misst keinen Füllstand, und die Behälter-voll-Gerätemeldung ist nicht unabhängig bestätigt. Bei Verbindungsverlust, gestopptem Pi oder fehlendem Internet können Meldungen fehlen; Push ersetzt keine Sicherheitskontrolle. Der Push-Dienst kann Nachrichten bis zu einer Stunde vorhalten, garantiert aber keine Zustellung.

## Manuelle Reinigung

Im lokalen Modus ist die Reinigung absichtlich gesperrt: Der exakte Reinigungsbefehl und die Sicherheitsbedingungen sind noch nicht ausreichend bestätigt. Eine Konfiguration von Cloud-Befehlen aktiviert die lokale Steuerung nicht. Keine unbekannten Datenpunkte beschreiben.

Im optionalen Cloud-Modus bleibt die Reinigung ebenfalls deaktiviert, bis der exakte Funktionscode und Wert bestätigt sind:

1. Starte die App mit Tuya-Zugangsdaten und rufe das Dashboard auf. Unter **Gerätewerte** erscheinen die aktuellen Statuscodes und Werte; unter **Verfügbare Befehle** die Funktionscodes.
2. Vergleiche die angezeigten Codes mit der in Smart Life sichtbaren Funktion für manuelles Reinigen. Die Code-Zuordnung muss bestätigt sein, bevor du sie konfigurierst.
3. Trage ausschließlich den bestätigten Reinigungsbefehl in `.env` ein:

```env
TUYA_CLEAN_COMMAND_CODE=DEIN_BESTAETIGTER_CODE
TUYA_CLEAN_COMMAND_VALUE=true
```

Der Wert muss der vom Tuya-Gerätemodell vorgegebenen JSON-Darstellung entsprechen (zum Beispiel `true`, `1` oder ein Textwert). Danach den Server neu starten. Die Webseite fragt vor dem Senden nochmals nach, ob sich keine Katze im Gerät befindet. Der Befehl wird nur an die YJE030 gesendet; beliebige Gerätebefehle sind nicht über die Webseite verfügbar.

## Datenpunkte der getesteten YJE030

Die Tabelle enthält bisher untersuchte oder in der Gerätedefinition beschriebene Datenpunkte, nicht notwendigerweise alle Datenpunkte des Modells. Die Zuordnungen gelten nicht automatisch für andere Geräte oder Firmware-Versionen. **Unbekannte Datenpunkte nicht beschreiben; keine Meldung ersetzt eine Sicherheitsprüfung.**

**Status:** ✅ Zuordnung beobachtet und im Dashboard nutzbar (gegebenenfalls nur lesend); ⚠️ teilweise zugeordnet oder Funktion noch nicht vollständig bestätigt; 🔍 Bedeutung oder Format noch zu prüfen. Ein Häkchen bestätigt weder eine Sicherheitsfunktion noch die Zuverlässigkeit jeder Gerätemeldung.

| DP | Herausgefundene Funktion | Status | Stand und Verwendung |
| --- | --- | --- | --- |
| 4 | Auto Clean / Sensormodus | ✅ | Durch Ein- und Ausschalten beobachtet; Anzeige ist lesend. |
| 5 | Reinigungsverzögerung | ✅ | Sekunden; 180 und 600 entsprechen den in Smart Life eingestellten drei und zehn Minuten. |
| 101 | Verbleibende Deodorant-Tage | ✅ | Erinnerungswert, kein gemessener Zustand. Direkte Schreibversuche auf 4 und 20 wurden nicht übernommen. |
| 105 | Verbleibende Katzenstreu-Tage | ✅ | Erinnerungswert, 0–30 Tage. Lokal nach Bestätigung setzbar; gemeldeten Wert anschließend prüfen. |
| 109 | Fehlermeldung | ⚠️ | Warnungen werden lokal aufgezeichnet; Meldungen können veraltet sein. Fehlerzuordnung laut Gerätedefinition, nicht unabhängig diagnostiziert. |
| 110 | Letzte Gerätemeldung | ✅ | Kann veraltet sein und belegt weder Sicherheit noch die Abwesenheit einer Katze. |
| 111 | Besuchsdauer und Gewicht | ⚠️ | Vier Bytes: je zwei für Sekunden und interpretiertes Gewicht in Gramm. In fünf Ereignissen beobachtet; ein Gewicht mit Smart Life verglichen. Weitere unabhängige Vergleiche fehlen. |
| 112 | Kitten-Modus | ✅ | Durch Ein- und Ausschalten beobachtet; Anzeige ist lesend. |
| 113 | Kinderriegel | ✅ | Durch Ein- und Ausschalten beobachtet; Anzeige ist lesend. |
| 114 | Nicht stören: Anzeigelicht | ⚠️ | Einstellung beobachtet; die Uhrzeiten und der aktuell aktive Zeitplan sind nicht zugeordnet. |
| 115 | Tägliche Luft-/Reinigungseinstellung | 🔍 | Laut Gerätedefinition; praktische Bedeutung und Skalierung noch zu prüfen. |
| 117 | Luftvorhang nach Toilettennutzung | ⚠️ | Laut Gerätevergleich zugeordnet; Aktivierungszeiten noch unbekannt. |
| 119 | Nicht stören: Signalton | ⚠️ | Einstellung beobachtet; die Uhrzeiten und der aktuell aktive Zeitplan sind nicht zugeordnet. |
| 121 | Reinigungszeitplan | 🔍 | Als Ereignis beobachtet; Format nicht sicher entschlüsselt. Das Dashboard zeigt den Rohwert nur, wenn er im Status enthalten ist. |
| 122 | Nicht stören: Reinigung deaktivieren | ⚠️ | Einstellung beobachtet; die Uhrzeiten und der aktuell aktive Zeitplan sind nicht zugeordnet. |
| 124 | Deodorant-Reset-Signal | ⚠️ | Dashboard sendet nach Bestätigung einen Reset. Ein Smart-Life-Eintrag wurde beobachtet; eine Zählererhöhung von weniger als 30 Tagen ist nicht bestätigt. Gemeldeten Wert prüfen. |
| 125 | Katzenstreu-Reset-Signal | ⚠️ | Beim Reset beobachtet; das Dashboard sendet keinen Reset für Katzenstreu. |
| 126 | Verbleibende Abfallbehälter-Tage | ✅ | Erinnerungswert, 0–14 Tage. Lokal nach Bestätigung setzbar; gemeldeten Wert anschließend prüfen. |
| 128 | Timer-Modus / regelmäßige Reinigung | ✅ | Durch Ein- und Ausschalten beobachtet; Anzeige ist lesend. |
| 130 | Toiletten-Reset-Signal | ⚠️ | Beim Reset beobachtet; das Dashboard sendet keinen Reset für die Toilette. |
| 131 | Letzte Besuchsdauer | ✅ | Sekunden; bei zwei Berichten verglichen. |
| 132 | Besuchsmeldung | 🔍 | Ein Wert von 1 wurde pro Besuch beobachtet; nicht als Gesamtzähler bestätigt. |
| 133 | Lüfterstatus | 🔍 | Laut Gerätedefinition; praktische Zuordnung noch zu prüfen. |
| 134 | Diagnose-Rohdaten | 🔍 | Änderungen nach einer Drehung beobachtet. Eine Bedeutung als Motorposition ist nicht bestätigt; kein Positions- oder Sicherheitsnachweis. |
| 136 | Luftvorhang: tägliche Reinigung | ⚠️ | Laut Gerätevergleich zugeordnet; Aktivierungszeiten noch unbekannt. |

Ein gemeldetes `true` bei DP 124, 125 oder 130 bestätigt weder Erfolg noch Zeitpunkt eines Resets; der Wert kann veraltet sein. Die Prozentanzeigen für DP 101, 105 und 126 berechnen sich aus den verbleibenden Tagen (Modell-Maximum 30, 30 bzw. 14 Tage), nicht aus einem gemessenen Füllstand. Ein erfolgreicher Sendevorgang für DP 105 oder 126 bestätigt die Übernahme nicht. Bei Fehler oder Zeitüberschreitung kann der Erfolg unklar sein; es gibt keinen automatischen erneuten Versuch. Diese Erinnerungswerte ersetzen weder Streuwechsel noch das Leeren des Behälters.

## Aktueller Umfang

- Live-Status und Datenpunkte über das lokale Netz; unbekannte Werte werden als DP-Nummern angezeigt.
- Im lokalen Modus hält ein Beobachter die Geräteverbindung offen und führt Status und Ereignisse zusammen. Er liest Daten und sendet nur den Deodorant-Reset sowie die oben beschriebenen Tageszähler. Bei Verbindungsverlust versucht er erneut zu verbinden. Ein sichtbares Dashboard fragt das Backend etwa alle drei Sekunden ab; Hintergrund-Tabs pausieren. Ereignisse können bei Verbindungsverlust oder durch das Gerät verloren gehen. Eine zweite lokale Verbindung, etwa die separate Testaufzeichnung, kann stören. Im Cloud-Modus bleibt das Intervall bei einer Minute.
- Der Beobachter speichert DP-109-Meldungen mit Zeitstempel in `data/warnings.json` und behält die letzten 200 Einträge. Der Ordner und die Datei sind privat und nicht für die Cloud oder das Repository gedacht. Der Verlauf wird nur angemeldeten Benutzern angezeigt und beginnt erst nach Aktivierung; alte Testaufzeichnungen werden nicht importiert. Bei Speicherfehlern zeigt das Dashboard eine Warnung. Löschen der Datei entfernt den Verlauf nach einem Dienstneustart.
- Radar-, Trommelpositions- und Behälter-voll-Meldungen sind anhand der Gerätedefinition benannt, nicht durch unabhängige Fehlerdiagnose bestätigt. `clear_inte` bezeichnet laut Gerätedefinition eine unterbrochene Reinigung und ist kein Rücksetzungs- oder Entwarnungssignal. Der letzte gemeldete Wert kann veraltet sein. Das Dashboard ist keine Sicherheitsüberwachung; Herstellerwarnungen und Prüfungen bleiben maßgeblich.
- Die Gewichtskachel zeigt den zuletzt lokal aufgezeichneten gültigen Gewichtswert mit Zeitstempel. Eine neuere ungültige Meldung wird gekennzeichnet. Die Messung kann ungenau sein und ist nicht für Sicherheitsentscheidungen geeignet.
- Der letzte Gewichtswert wird lokal in `data/last-visit.json` gespeichert. Bei Verbindungsverlust können Besuche fehlen, bei Speicherfehlern zeigt das Dashboard einen Hinweis.
- Tageszahlen und Diagramme werden aus lokal empfangenen, gültig kodierten DP-111-Besuchsmeldungen berechnet. Pro Meldung wird ein Besuch gezählt; doppelte oder fehlende Gerätemeldungen können die Ergebnisse verfälschen. Der lokale Aktivitätsverlauf enthält ausgewählte Gerätemeldungen und Besuche, nicht den vollständigen Smart-Life-Verlauf. Er beginnt erst nach Aktivierung, wird in `data/activity.json` gespeichert und nach 30 Tagen gelöscht (bei laufendem Dienst stündlich, sonst beim nächsten Start). Jeweils höchstens 10.000 Besuchs- und Ereigniseinträge bleiben erhalten; eine Kürzung wird angezeigt. Tagesgrenzen und Stunden verwenden die Zeitzone des Raspberry Pi.
- Für die letzten sieben Tage zeigt die Tagesansicht einzelne lokal empfangene Besuche mit Empfangszeit, Dauer und, falls auswertbar, Gewicht. Zuerst werden fünf gezeigt, weitere lassen sich aufklappen. Bei mehr als 50 Besuchsmeldungen pro Tag sind nur die neuesten 50 einzeln sichtbar; die Tageszahlen umfassen weiterhin alle gespeicherten Meldungen.
- Im Aktivitäts- und Warnungsverlauf erscheinen zuerst die fünf neuesten Meldungen; weitere lassen sich aufklappen. Der Aktivitätsverlauf zeigt wie bisher höchstens die 30 zuletzt gemeldeten Ereignisse, der Warnungsverlauf höchstens 200.
- Der Gewichtsverlauf zeigt aus denselben Besuchsmeldungen den letzten gültigen Wert je Tag innerhalb des 30-Tage-Fensters. Tage ohne Messwert fehlen; die Anzeige ordnet Messungen keiner einzelnen Katze zu und ist keine medizinische Messung.
- Die Webcam-Kachel ist nur ein Platzhalter; sie überträgt und speichert keine Bilder.
- manuelle Reinigung ausschließlich im Cloud-Modus nach expliziter Konfiguration des verifizierten Tuya-Befehls
- Telegram und Zeitpläne sind noch nicht angebunden

Das Gewicht ist eine gemeldete Besuchsmessung, kein aktuelles Live-Gewicht.
