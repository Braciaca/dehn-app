# Dehn- und Mobilitäts-App: Design

Stand: 2026-11-12

## Ziel

Eine persönliche App für Dehn- und Mobilitätsübungen. Sie läuft in erster Linie auf einem Android-Smartphone und zusätzlich auf dem Laptop. Der Nutzer stellt eigene Routinen zusammen und lässt sich von einem Timer mit Animation und Tonsignalen durch die Routine führen.

Erfolgskriterium: Der Nutzer kann auf dem Handy eine Routine anlegen, starten und ohne Blick auf die Uhr durchturnen. Die App funktioniert dabei auch ohne Internet.

## Nicht Teil dieser Version

- Abgleich zwischen Geräten (NAS, Cloud). Ersatz: Export und Import als Datei.
- Benutzerkonten, Statistiken, Erinnerungen, Sprachausgabe.
- Native Android-App (APK).

## Technik

- Installierbare Web-App (PWA) aus reinem HTML, CSS und JavaScript (ES-Module), ohne Framework und ohne Build-Schritt.
- Alle Daten liegen lokal im Browser (`localStorage`).
- Ein Service Worker legt alle Dateien im Cache ab, damit die App offline läuft.
- Für die Installation auf dem Handy muss die App über HTTPS erreichbar sein. Vorgesehen ist eine kostenlose Veröffentlichung als statische Seite (z. B. GitHub Pages). Die Veröffentlichung ist ein eigener Schritt nach der Fertigstellung und braucht die Zustimmung des Nutzers.
- Oberfläche auf Deutsch, für Hochformat am Handy entworfen, am Laptop mit breiterem Layout.

## Bereiche der App

Navigation über eine Leiste unten mit drei Einträgen: Übungen, Routinen, Einstellungen.

### Übungen

- Liste aller Übungen als Karten mit kleiner Animation, Name und Merkmalen.
- Suche nach Name.
- Filter, die sich kombinieren lassen:
  - Körperteil (Mehrfachauswahl): Nacken, Schultern, Brust, oberer Rücken, unterer Rücken, Rumpf seitlich, Hüfte, Gesäß, Oberschenkel vorn, Oberschenkel hinten, Adduktoren, Waden und Sprunggelenk, Handgelenke und Unterarme.
  - Art: statisch, dynamisch.
  - Position: stehend, sitzend, am Boden.
- Detailansicht: große Animation, Beschreibung der Ausführung, Hinweise, Merkmale und die Schaltfläche „Zu Routine hinzufügen“.

### Routinen

- Liste eigener Routinen und mitgelieferter Vorlagen, jeweils mit Gesamtdauer und Anzahl der Übungen.
- Vorlagen sind schreibgeschützt und lassen sich kopieren. Geplant: Morgenroutine, Büro-Pause, Hüfte und unterer Rücken, Schultern und Nacken, Abendroutine.
- Editor einer Routine:
  - Name.
  - Pause zwischen den Übungen in Sekunden (gilt für die ganze Routine, 0 ist erlaubt).
  - Liste der Übungen, per Schaltflächen nach oben und unten sortierbar, einzeln entfernbar.
  - Je Übung: Dauer in Sekunden. Bei wechselseitigen Übungen zusätzlich die Seite: beide nacheinander, nur links, nur rechts.
  - Übungen hinzufügen über den Katalog mit denselben Filtern.
- Routinen lassen sich duplizieren und löschen (mit Rückfrage).

### Player

- Vor dem Start läuft eine Vorbereitungsphase von 5 Sekunden mit der ersten Übung als Vorschau.
- Anzeige während der Übung: große Animation, Name, Seite (falls wechselseitig), Restzeit als Zahl und als Ring, Fortschritt in der Routine, Name der nächsten Übung.
- Anzeige während der Pause: Restzeit und Animation der nächsten Übung.
- Bedienung: Pause und Weiter, vorheriger Schritt, nächster Schritt, Beenden.
- Der Bildschirm bleibt während der Routine an (Wake Lock), sofern der Browser das unterstützt.
- Am Ende erscheint ein Abschlussbildschirm mit der Gesamtdauer.

### Einstellungen

- Lautstärke der Töne (Regler) und Töne an/aus, mit Testton.
- Export aller eigenen Routinen als JSON-Datei und Import einer solchen Datei.

## Ablauf und Timer

Eine Routine wird vor dem Start in eine flache Liste von Schritten übersetzt. Jeder Schritt hat eine Art, eine Dauer und gegebenenfalls Übung und Seite.

- Übung ohne Seitenbezug: ein Schritt mit der eingestellten Dauer.
- Wechselseitige Übung, „beide“: Schritt links mit der eingestellten Dauer, Seitenwechsel von 3 Sekunden, Schritt rechts mit der eingestellten Dauer. Die Dauer gilt also pro Seite.
- Wechselseitige Übung, „nur links“ oder „nur rechts“: ein Schritt für diese Seite.
- Zwischen zwei Übungen liegt ein Pausenschritt mit der Pausendauer der Routine. Ist sie 0, entfällt der Schritt.
- Nach der letzten Übung folgt keine Pause.

Tonsignale:

- In den letzten 3 Sekunden jedes Schritts ertönt je ein leiser, kurzer Piepton bei 3, 2 und 1 Sekunde Restzeit.
- Beim Wechsel in den nächsten Schritt ertönt ein etwas höherer, längerer Ton.
- Ist ein Schritt kürzer als 3 Sekunden, ertönen nur die Töne, die in seine Dauer passen.
- Die Töne werden mit der Web Audio API erzeugt, es gibt keine Audiodateien.

Die Restzeit wird aus der Systemuhr berechnet und nicht hochgezählt, damit der Timer nicht wegläuft, wenn der Browser Bildwiederholungen auslässt. Beim Pausieren wird die Restzeit eingefroren.

## Animationen

- Eine Figur wird als Skelett in SVG gezeichnet: Kopf, Rumpf (zwei Segmente), Ober- und Unterarme, Ober- und Unterschenkel, Füße. Die körperferne Seite wird heller gezeichnet, damit beide Arme und Beine unterscheidbar sind.
- Eine Pose besteht aus der Position des Beckens und den Winkeln aller Segmente.
- Jede Übung definiert zwei oder mehr Posen und eine Zyklusdauer. Die App blendet weich zwischen den Posen über.
  - Statische Übungen: Die Figur geht in die Endposition und bewegt sich dort minimal (Atmung).
  - Dynamische Übungen: Die Figur pendelt fortlaufend zwischen den Posen.
- Jede Übung gibt eine Ansicht an: Seitenansicht (Standard) oder Frontansicht für Bewegungen zur Seite und Drehungen.
- Links und rechts entstehen durch Spiegeln beziehungsweise durch Tauschen der Glieder der körpernahen und körperfernen Seite.
- Hilfsmittel wie Stuhl oder Wand werden als einfache Formen gezeichnet, wenn die Übung sie braucht.
- Bei „Bewegung reduzieren“ in den Systemeinstellungen zeigt die App die Endpose als Standbild.

Grenze: Die Figur ist eine vereinfachte 2D-Darstellung. Drehungen um die Körperlängsachse lassen sich nur andeuten. Die Textbeschreibung jeder Übung nennt deshalb die Ausführung vollständig.

## Daten

Übung (fest im Code):

- `id`, `name`, `beschreibung`, `hinweise`
- `koerperteile` (Liste), `art` (statisch | dynamisch), `position` (stehend | sitzend | boden)
- `wechselseitig` (ja/nein), `standardDauer` in Sekunden
- `animation`: Ansicht, Posen, Zyklusdauer, Hilfsmittel

Routine (lokal gespeichert):

- `id`, `name`, `pause` in Sekunden, `geaendert` (Zeitstempel)
- `eintraege`: Liste aus `uebungId`, `dauer`, `seite` (beide | links | rechts | keine)

Einstellungen: `lautstaerke` (0 bis 1), `toeneAn`.

Der Katalog umfasst rund 60 Übungen und deckt jeden Körperteil, beide Arten und alle drei Positionen ab. Die Auswahl besteht aus verbreiteten Dehn-, Yoga- und Mobility-Übungen.

## Aufteilung des Codes

| Datei | Aufgabe |
|---|---|
| `index.html`, `styles.css` | Grundgerüst und Gestaltung |
| `js/app.js` | Start, Navigation zwischen den Ansichten |
| `js/data/exercises.js` | Übungskatalog mit Posen |
| `js/data/templates.js` | Vorlagen-Routinen |
| `js/figure.js` | Zeichnen und Animieren der Figur |
| `js/store.js` | Laden, Speichern, Export, Import |
| `js/sequence.js` | Routine in Schritte übersetzen, Gesamtdauer |
| `js/timer.js` | Zustand des Ablaufs, Restzeit, Ereignisse für Töne |
| `js/audio.js` | Pieptöne |
| `js/views/*.js` | Übungen, Detail, Routinen, Editor, Player, Einstellungen |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installation und Offline-Betrieb |
| `tests/` | Tests |

`sequence.js` und `timer.js` kennen weder die Oberfläche noch die Uhr des Browsers. Der Timer bekommt die Zeit von außen übergeben, damit er sich testen lässt.

## Fehlerfälle

- Gespeicherte Daten unlesbar: Die App startet mit den Vorlagen und zeigt einen Hinweis. Die defekten Daten werden unter einem anderen Schlüssel aufbewahrt.
- Import einer ungültigen Datei: Abbruch mit Meldung, vorhandene Routinen bleiben unverändert.
- Routine verweist auf eine unbekannte Übung: Der Eintrag wird im Editor markiert und beim Abspielen übersprungen.
- Routine ohne Übungen: Start ist gesperrt.
- Browser blockiert Ton bis zur ersten Berührung: Der Ton wird beim Tippen auf „Start“ freigeschaltet.
- Wake Lock nicht verfügbar: Die Routine läuft trotzdem, der Bildschirm kann dann ausgehen.

## Prüfung

- Automatische Tests mit dem eingebauten Testläufer von Node.js für `sequence.js` (Seiten, Pausen, Gesamtdauer), `timer.js` (Wechsel, Pausieren, Springen, Zeitpunkte der Töne), `store.js` (Import-Prüfung) und den Katalog (jede Übung hat gültige Merkmale und Posen, jede Vorlage verweist nur auf vorhandene Übungen).
- Prüfung der Oberfläche im Browser in Handy- und Laptop-Größe: Filtern, Routine anlegen, Routine durchspielen, Töne, Installation und Offline-Start.
