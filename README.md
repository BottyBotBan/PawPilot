# PawPilot

Ein selbstgebautes, privates Web-Dashboard fuer die automatische Katzentoilette **KuzmoTec YJE030**. Es entstand aus dem Wunsch nach einer uebersichtlicheren Alternative zur vorhandenen App. Vielleicht hilft das Projekt auch anderen mit demselben Geraet.

> **Experimentelles Hobbyprojekt:** Datenpunkte und Funktionen sind nicht vollstaendig verifiziert. PawPilot ersetzt weder die Hersteller-App noch Sicherheitseinrichtungen, Warnungen oder die regelmaessige Kontrolle der Katzentoilette. Die lokale manuelle Reinigung ist aus Sicherheitsgruenden deaktiviert.

## Entstehung und Mitmachen

PawPilot wurde in grossen Teilen mit Unterstuetzung von KI entwickelt, da dem Projektinitiator noch Programmierkenntnisse fehlen. Das Projekt ist ein Lernprozess und kann Fehler enthalten. Rueckmeldungen, Tests und Verbesserungsvorschlaege sind willkommen. Bitte in oeffentlichen Beitraegen keine Zugangsdaten, Local Keys, Geraete-IDs, privaten Adressen oder persoenlichen Aufzeichnungen teilen.

PawPilot steht unter der [GNU General Public License Version 3](LICENSE) (GPL-3.0-only). Bei der Weitergabe veraenderter Versionen gelten die Bedingungen dieser Lizenz, einschliesslich der Bereitstellung des zugehoerigen Quellcodes.

## Was PawPilot bereits kann

- Responsives Dashboard mit Anmeldung, optionalem Dark Mode und anpassbaren Bereichen.
- Lokaler Status und ausgewaehlte Meldungen der getesteten YJE030; alternativ existiert ein Cloud-Modus.
- Lokale Besuchsstatistik und Gewichtsverlauf auf Basis empfangener Ereignisse; fehlende oder doppelte Meldungen koennen die Ergebnisse beeinflussen.
- Erinnerungszaehler fuer Deodorant, Katzenstreu und Abfallbehaelter. Die Prozentanzeigen sind keine Fuellstandsmessung.
- Allgemeine Web-Push-Hinweise fuer lokale Geraetefehler und die Abfallbehaelter-Erinnerung bei 0 Tagen.
- Webcam-Platzhalter; eine Kameraanbindung ist geplant, aber noch nicht implementiert.

Der lokale Modus liest das Geraet direkt im Heimnetz. Fuer Fernzugriff kann Tailscale Serve verwendet werden; der Server bindet standardmaessig an `127.0.0.1`. Push-Nachrichten verwenden den Push-Dienst des jeweiligen Browsers, beim iPhone Apple.

## Hardware und Kompatibilitaet

| Hardware | Stand |
| --- | --- |
| Raspberry Pi 4 | Bisherige Projektplattform mit Raspberry Pi OS. |
| Raspberry Pi Zero 2 W | Moeglicher Kandidat mit einem passenden Linux-System, aber bislang nicht getestet; Leistung und Einrichtung muessen noch geprueft werden. |
| Raspberry Pi Pico WH | Mikrocontroller, kein Linux-Rechner: Die aktuelle Node.js-/Python-Anwendung laeuft darauf nicht unveraendert. |

Die Zuordnung der Datenpunkte wurde an einer YJE030 untersucht. Andere Modelle und Firmware-Versionen sind nicht bestaetigt. Unbekannte Datenpunkte nicht beschreiben.

## Zugangsdaten und Datenschutz

`.env`, Tuya-Geraetelisten wie `devices.json`, private Schluessel und der Ordner `data/` duerfen nicht veroeffentlicht werden. `.env.example` enthaelt nur Vorlagen. Die `.gitignore` hilft, schuetzt aber weder bereits eingecheckte Dateien noch manuelle Uploads zuverlaessig. Vor einer Veroeffentlichung die Dateiliste und Inhalte einschliesslich Screenshots und Git-Verlauf pruefen. Niemals echte Zugangsdaten in Issues, Screenshots oder Beispielkonfigurationen posten.

## Voraussetzungen

- Raspberry Pi OS und Node.js 20 oder neuer
- Python 3 mit TinyTuya aus `requirements.txt` fuer den lokalen Modus
- Eine lokal erreichbare YJE030, ihre IP-Adresse und die vom TinyTuya-Wizard erstellte `devices.json` mit Local Key
- Tailscale auf dem Pi und auf den Geraeten, von denen du zugreifen willst

## Lokale Einrichtung auf dem Raspberry Pi

Der TinyTuya-Wizard kann den Local Key einmalig ueber ein Tuya-Cloud-Projekt beschaffen. Im laufenden lokalen Betrieb werden keine Tuya-Cloud-API-Aufrufe fuer Statusdaten gemacht. `devices.json` enthaelt den geheimen Local Key und moeglicherweise weitere Geraete; nur per sicherer Verbindung uebertragen, nicht teilen oder ins Repository einchecken.

1. Das Projekt auf den Pi kopieren. Lege `devices.json` ausserhalb des Projektverzeichnisses ab, z. B. in `~/SmartKlo-Lokaltest/devices.json`, und beschraenke den Zugriff mit `chmod 700 ~/SmartKlo-Lokaltest` und `chmod 600 ~/SmartKlo-Lokaltest/devices.json`.
2. Im Projektordner eine Python-Umgebung erstellen und die Abhaengigkeit installieren:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

3. Falls noch keine `.env` existiert, `cp .env.example .env` ausfuehren. Eine bestehende `.env` nicht ueberschreiben. Setze mit `nano .env` ein eigenes `DASHBOARD_PASSWORD` mit mindestens 14 Zeichen und ergaenze diese Werte:

```env
TUYA_MODE=local
TUYA_DEVICE_ID=deine_geraete_id
TUYA_LOCAL_IP=die_ip_des_geraets
TUYA_LOCAL_VERSION=3.5
TUYA_LOCAL_DEVICE_FILE=/home/DEIN_BENUTZERNAME/SmartKlo-Lokaltest/devices.json
TUYA_LOCAL_PYTHON=/home/DEIN_BENUTZERNAME/SmartKlo/.venv/bin/python
```

Ersetze `DEIN_BENUTZERNAME` und passe die Pfade an deine Installation an. Die Geraete-ID steht in Smart Life unter Geraeteinformationen und im privaten `devices.json`. Die IP und Protokollversion muessen zum Geraet passen; bei einer anderen Installation koennen sie abweichen. Eine DHCP-Reservierung im Router verhindert IP-Aenderungen. Speichere die `.env` und schraenke die Zugriffsrechte mit `chmod 600 .env` ein. Nach Aenderungen den Server neu starten.

Die Local-Key-Datei und das Passwort muessen fuer denselben Benutzer lesbar sein, unter dem der Server laeuft. Wenn das Geraet neu gekoppelt wird, kann sich der Local Key aendern und muss erneut beschafft werden.

## Optional: Tuya Cloud

Fuer den bisherigen Cloud-Betrieb `TUYA_MODE=cloud`, `TUYA_ACCESS_ID`, `TUYA_ACCESS_SECRET`, `TUYA_DEVICE_ID` und den zum Datenzentrum passenden `TUYA_ENDPOINT` in `.env` setzen. Das Projekt muss mit dem Smart-Life-Konto verknuepft und fuer die benoetigten APIs freigeschaltet sein. Cloud-Aufrufe koennen einem Kontingent oder Kosten unterliegen.

## Starten

```sh
npm start
```

Auf dem Pi lokal erreichbar unter `http://127.0.0.1:3000`. Beim Start ohne lokale Einrichtung zeigt das Dashboard einen Fehler an; es erfolgt kein automatischer Rueckfall auf die Cloud.

## Fernzugriff mit Tailscale

Installiere und melde den Pi sowie dein Smartphone/Notebook bei demselben Tailscale-Konto an. Starte den Webserver mit `npm start` und danach auf dem Pi:

```sh
tailscale serve --bg 3000
```

Tailscale zeigt eine HTTPS-Adresse an, die nur in deinem Tailnet erreichbar ist. Aktiviere HTTPS-Zertifikate, falls Tailscale danach fragt. Veroeffentliche den Node.js-Port nicht ueber Portweiterleitung oder eine oeffentliche Reverse-Proxy-Regel.

Zusaetzlich ist die App mit einem Passwort geschuetzt. Sitzungen sind HTTP-only und nur fuer HTTPS gedacht. Ohne Auswahl von **Angemeldet bleiben** laufen sie nach 12 Stunden oder beim Serverneustart ab. Die optionale Anmeldung bleibt auf dem jeweiligen Geraet bis zu 30 Tage auch nach einem Serverneustart bestehen; **Abmelden** beendet sie. Nach einer Aenderung des Dashboard-Passworts und einem Serverneustart sind gespeicherte Anmeldungen ungueltig. Die App speichert dazu ein geschuetztes Sitzungstoken im Browser und kryptographische Pruefwerte fuer Passwort und Token in `data/remembered-sessions.json` auf dem Pi, weder Passwort noch Token im Klartext. Der Token gewaehrt bis zur Abmeldung oder zum Ablauf Zugang: nur auf eigenen, gesperrten Geraeten nutzen. Die Datei ist privat; ihr Loeschen bei gestopptem Dienst beendet alle gespeicherten Anmeldungen. Fuenf falsche Anmeldeversuche sperren weitere Versuche fuer 15 Minuten. Teile den Pi nicht ueber Tailscale mit anderen und verwende kein Tailscale Funnel, wenn ausschliesslich du Zugriff haben sollst.

Auf dem Smartphone kann die HTTPS-Seite ueber das Browser-Menue zum Startbildschirm hinzugefuegt werden (auf dem iPhone in Safari ueber „Teilen“). Dabei wird das Katzen-Icon verwendet. Das Dashboard benoetigt weiterhin die Netzwerkverbindung und die Anmeldung.

## Einstellungen und Push auf dem iPhone

Unter **Einstellungen** lassen sich Dark Mode und Dashboard-Bereiche ein- oder ausblenden. Die Auswahl wird auf dem Pi in `data/preferences.json` gespeichert und nach erneutem Oeffnen auch auf anderen Geraeten geladen. Ausgeblendete Bereiche bleiben in Betrieb; Warnungen werden dadurch nicht abgeschaltet.

Fuer Push ist iOS 16.4 oder neuer, HTTPS und eine Internetverbindung erforderlich:

1. Die Tailscale-HTTPS-Adresse in Safari oeffnen, **Teilen > Zum Home-Bildschirm** waehlen und die neue App vom Home-Bildschirm oeffnen.
2. Anmelden, **Einstellungen > Push-Benachrichtigungen > Auf diesem Geraet aktivieren** waehlen und die Erlaubnis erteilen.
3. **Testnachricht senden** antippen. Die Bestaetigung bedeutet nur, dass der Push-Dienst die Nachricht angenommen hat; die Zustellung auf dem iPhone muss geprueft werden.
4. Bei Bedarf Push in denselben Einstellungen auf jedem Geraet einzeln deaktivieren. Abmelden allein deaktiviert Push nicht.

Der Pi sendet an den Push-Dienst des Browsers (beim iPhone Apple) einen leeren Push ohne Geraetewerte, Passwort oder Dashboard-Adresse; der Service Worker zeigt einen allgemeinen Hinweis an. Der Push-Dienst sieht das Abonnement und den Zeitpunkt. Zum Oeffnen der Details braucht das iPhone Tailscale und gegebenenfalls eine neue Anmeldung. Die privaten Push-Schluessel und Abonnements liegen in `data/push.json`; diese Datei und `data/preferences.json` nicht teilen oder oeffentlich bereitstellen. Gehen die Push-Schluessel verloren, muessen Push-Abonnements auf den Geraeten entfernt und neu eingerichtet werden.

Im lokalen Modus wird ein Push bei einer neu empfangenen DP-109-Fehlermeldung oder beim Wechsel des Abfallbehaelter-Erinnerungszaehlers auf 0 Tage ausgeloest. Identische Fehlermeldungen innerhalb einer Minute werden zusammengefasst. Ein beim Start gelesener alter Fehler loest keinen Push aus; 0 Tage beim ersten Status koennen einen Push ausloesen. Wird Push erst aktiviert, nachdem 0 Tage bereits erkannt wurden, erfolgt keine nachtraegliche Meldung. Der Zaehler misst keinen Fuellstand, und die Behälter-voll-Geraetemeldung ist nicht unabhaengig bestaetigt. Bei Verbindungsverlust, gestopptem Pi oder fehlendem Internet koennen Meldungen fehlen; Push ersetzt keine Sicherheitskontrolle. Der Push-Dienst kann Nachrichten bis zu einer Stunde vorhalten, garantiert aber keine Zustellung.

## Manuelle Reinigung

Im lokalen Modus ist die Reinigung absichtlich gesperrt: Der exakte Reinigungsbefehl und die Sicherheitsbedingungen sind noch nicht ausreichend bestaetigt. Eine Konfiguration von Cloud-Befehlen aktiviert die lokale Steuerung nicht. Keine unbekannten Datenpunkte beschreiben.

Im optionalen Cloud-Modus bleibt die Reinigung ebenfalls deaktiviert, bis der exakte Funktionscode und Wert bestaetigt sind:

1. Starte die App mit Tuya-Zugangsdaten und rufe das Dashboard auf. Unter **Gerätewerte** erscheinen die aktuellen Statuscodes und Werte; unter **Verfügbare Befehle** die Funktionscodes.
2. Vergleiche die angezeigten Codes mit der in Smart Life sichtbaren Funktion fuer manuelles Reinigen. Die Code-Zuordnung muss bestaetigt sein, bevor du sie konfigurierst.
3. Trage ausschliesslich den bestaetigten Reinigungsbefehl in `.env` ein:

```env
TUYA_CLEAN_COMMAND_CODE=DEIN_BESTAETIGTER_CODE
TUYA_CLEAN_COMMAND_VALUE=true
```

Der Wert muss der vom Tuya-Geraetemodell vorgegebenen JSON-Darstellung entsprechen (zum Beispiel `true`, `1` oder ein Textwert). Danach den Server neu starten. Die Webseite fragt vor dem Senden nochmals nach, ob sich keine Katze im Geraet befindet. Der Befehl wird nur an die YJE030 gesendet; beliebige Geraetebefehle sind nicht ueber die Webseite verfuegbar.

## Aktueller Umfang

- Live-Status und Datenpunkte ueber das lokale Netz; unbekannte Werte werden als DP-Nummern angezeigt.
- Im lokalen Modus haelt ein Beobachter die Geraeteverbindung offen und fuehrt Status und Ereignisse zusammen. Er liest Daten und sendet nur den bestaetigten Deodorant-Reset sowie die unten beschriebenen Tageszaehler. Bei Verbindungsverlust versucht er erneut zu verbinden. Ein sichtbares Dashboard fragt das Backend etwa alle drei Sekunden ab; Hintergrund-Tabs pausieren. Ereignisse koennen bei Verbindungsverlust oder durch das Geraet verloren gehen. Eine zweite lokale Verbindung, etwa die separate Testaufzeichnung, kann stoeren. Im Cloud-Modus bleibt das Intervall bei einer Minute.
- Der Beobachter speichert DP-109-Meldungen mit Zeitstempel in `data/warnings.json` und behaelt die letzten 200 Eintraege. Der Ordner und die Datei sind privat und nicht fuer die Cloud oder das Repository gedacht. Der Verlauf wird nur angemeldeten Benutzern angezeigt und beginnt erst nach Aktivierung; alte Testaufzeichnungen werden nicht importiert. Bei Speicherfehlern zeigt das Dashboard eine Warnung. Loeschen der Datei entfernt den Verlauf nach einem Dienstneustart.
- Radar-, Trommelpositions- und Behaelter-voll-Meldungen sind anhand der Geraetedefinition benannt, nicht durch unabhaengige Fehlerdiagnose bestaetigt. `clear_inte` bezeichnet laut Geraetedefinition eine unterbrochene Reinigung und ist kein Ruecksetzungs- oder Entwarnungssignal. Der letzte gemeldete Wert kann veraltet sein. Das Dashboard ist keine Sicherheitsueberwachung; Herstellerwarnungen und Pruefungen bleiben massgeblich.
- DP 5 (`delay_clean_time`) wird als Reinigungshaeufigkeit / Verzoegerung in Minuten und Sekunden angezeigt; bei der getesteten YJE030 entsprechen 180 bzw. 600 Sekunden den in Smart Life eingestellten drei bzw. zehn Minuten.
- DP 101 zeigt die verbleibenden Deodorant-Tage. Direkte Schreibversuche auf 4 und 20 Tage wurden nicht uebernommen. Der Zaehler belegt keinen tatsaechlichen Zustand des Deodorants.
- DP 105 zeigt die verbleibenden Katzenstreu-Tage (0 bis 30), DP 126 die verbleibenden Abfallbehaelter-Tage (0 bis 14). Beide koennen lokal nach Bestaetigung als ganze Zahlen gesetzt werden. Ein erfolgreicher Sendevorgang bestaetigt die Uebernahme nicht: Den spaeter gemeldeten Wert im Dashboard oder in Smart Life pruefen. Bei Fehler oder Zeitueberschreitung kann der Erfolg unklar sein; es gibt keinen automatischen erneuten Versuch. Es sind Erinnerungszaehler, keine Messung des Inhalts und kein Ersatz fuer Streuwechsel oder Leerung.
- Die Prozentbalken fuer DP 101, 105 und 126 berechnen die verbleibenden Tage relativ zum Modell-Maximum (30, 30 bzw. 14 Tage), gerundet auf ganze Prozent. Fehlende oder ungueltige Werte und eine unterbrochene Verbindung werden als nicht verfuegbar angezeigt. Sie messen keinen Fuellstand.
- DP 124, 125 und 130 wurden beim Betaetigen der Reset-Tasten fuer Deodorant, Katzenstreu und Toilette beobachtet. Ein gemeldetes `true` bestaetigt weder den Erfolg noch den Zeitpunkt eines Resets; der Wert kann veraltet sein. Fuer Katzenstreu und Toilette sendet das Dashboard keine Reset-Befehle.
- Der Deodorant-Reset sendet nach Bestaetigung einmal DP 124. Dies erzeugte einen Smart-Life-Verlaufseintrag, eine Zaehlererhoehung von weniger als 30 Tagen wurde noch nicht bestaetigt. Den gemeldeten Wert pruefen; bei Fehlern kann der Erfolg unklar sein.
- Bei der getesteten YJE030 wurde DP 112 durch Ein- und Ausschalten als Anzeige des Kitten-Modus beobachtet; die Anzeige ist rein lesend.
- DP 113 wurde bei derselben YJE030 durch Ein- und Ausschalten dem Kinderriegel zugeordnet; die Anzeige ist rein lesend.
- DP 114, 119 und 122 wurden bei derselben YJE030 den Nicht-stoeren-Einstellungen fuer Anzeigelicht, Signalton und Reinigung zugeordnet. Sie zeigen die Einstellung, nicht zwingend einen aktuell aktiven Zeitplan; die Uhrzeiten sind nicht zugeordnet.
- Laut Geraetevergleich gehoeren DP 117 und 136 zu den Luftvorhang-Einstellungen nach Toilettennutzung bzw. taegliche Reinigung. Die Aktivierungszeiten sind noch nicht zugeordnet.
- DP 131 entsprach bei zwei Berichten der Besuchsdauer in Sekunden und wird lokal als letzte Besuchsdauer dargestellt.
- DP 110 wird als letzte Geraetemeldung dargestellt. Einzelne Meldungen koennen veraltet sein und duerfen nicht als Sicherheitspruefung oder als Nachweis fuer die Abwesenheit einer Katze verwendet werden.
- DP 128 wurde bei der getesteten YJE030 durch Ein- und Ausschalten dem Timer-Modus bzw. der regelmaessigen Reinigung zugeordnet; auch diese Anzeige ist rein lesend.
- DP 4 (`auto_clean`) wurde bei der getesteten YJE030 durch Ein- und Ausschalten Auto Clean bzw. dem Sensormodus zugeordnet; auch diese Anzeige ist rein lesend.
- DP 121 wurde bei Zeitplanaenderungen als lokales Ereignis beobachtet. Sein Format ist nicht sicher entschluesselt: Das Dashboard zeigt nur einen Rohwert, falls er im abgefragten Status enthalten ist, sonst einen Hinweis. Die separate Ereignisaufzeichnung wird nicht ins Dashboard eingelesen.
- DP 111 wurde in fuenf Besuchsereignissen beobachtet. Seine ersten zwei Bytes entsprachen jeweils der Besuchsdauer in Sekunden; die zweiten zwei Bytes werden als Gramm interpretiert. Ein Wert wurde mit Smart Life verglichen, weitere unabhaengige Vergleiche stehen aus. Die Gewichtskachel zeigt den zuletzt lokal aufgezeichneten gueltigen Gewichtswert mit Zeitstempel. Eine neuere ungueltige Meldung wird gekennzeichnet. Die Messung kann ungenau sein und ist nicht fuer Sicherheitsentscheidungen geeignet.
- Der letzte Gewichtswert wird lokal in `data/last-visit.json` gespeichert. Bei Verbindungsverlust koennen Besuche fehlen, bei Speicherfehlern zeigt das Dashboard einen Hinweis.
- Tageszahlen und Diagramme werden aus lokal empfangenen, gueltig kodierten DP-111-Besuchsmeldungen berechnet. Pro Meldung wird ein Besuch gezaehlt; doppelte oder fehlende Geraetemeldungen koennen die Ergebnisse verfaelschen. Der lokale Aktivitaetsverlauf enthaelt ausgewaehlte Geraetemeldungen und Besuche, nicht den vollstaendigen Smart-Life-Verlauf. Er beginnt erst nach Aktivierung, wird in `data/activity.json` gespeichert und nach 30 Tagen geloescht (bei laufendem Dienst stuendlich, sonst beim naechsten Start). Jeweils hoechstens 10.000 Besuchs- und Ereigniseintraege bleiben erhalten; eine Kuerzung wird angezeigt. Tagesgrenzen und Stunden verwenden die Zeitzone des Raspberry Pi.
- Fuer die letzten sieben Tage zeigt die Tagesansicht einzelne lokal empfangene Besuche mit Empfangszeit, Dauer und, falls auswertbar, Gewicht. Zuerst werden fuenf gezeigt, weitere lassen sich aufklappen. Bei mehr als 50 Besuchsmeldungen pro Tag sind nur die neuesten 50 einzeln sichtbar; die Tageszahlen umfassen weiterhin alle gespeicherten Meldungen.
- Im Aktivitaets- und Warnungsverlauf erscheinen zuerst die fuenf neuesten Meldungen; weitere lassen sich aufklappen. Der Aktivitaetsverlauf zeigt wie bisher hoechstens die 30 zuletzt gemeldeten Ereignisse, der Warnungsverlauf hoechstens 200.
- Der Gewichtsverlauf zeigt aus denselben Besuchsmeldungen den letzten gueltigen Wert je Tag innerhalb des 30-Tage-Fensters. Tage ohne Messwert fehlen; die Anzeige ordnet Messungen keiner einzelnen Katze zu und ist keine medizinische Messung.
- Die Webcam-Kachel ist nur ein Platzhalter; sie uebertraegt und speichert keine Bilder.
- manuelle Reinigung ausschliesslich im Cloud-Modus nach expliziter Konfiguration des verifizierten Tuya-Befehls
- Telegram und Zeitplaene sind noch nicht angebunden

Das Gewicht ist eine gemeldete Besuchsmessung, kein aktuelles Live-Gewicht.
