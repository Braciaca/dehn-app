// Detailansicht einer Übung, dazu Vorschau- und Umbenennen-Dialog für andere Ansichten.
import { UEBUNGEN_BY_ID, LABEL } from '../data/exercises.js';
import { h, figur, tags, dialog, toast } from '../ui.js';

export function eintragFuer(u) {
  return { uebungId: u.id, dauer: u.standardDauer, seite: u.wechselseitig ? 'beide' : 'keine' };
}

// Dialog zum Umbenennen einer Übung. Der Name gilt überall in der App.
export function umbenennenDialog(u, ctx, onFertig = () => {}) {
  const feld = h('input', { type: 'text', value: u.name, maxLength: 60, 'aria-label': 'Name der Übung' });
  const fertig = (name) => {
    ctx.benenneUm(u, name);
    d.schliessen();
    onFertig();
    toast(name ? 'Name gespeichert' : 'Originalname wiederhergestellt');
  };
  const formular = h('form', { class: 'liste', onsubmit: (e) => { e.preventDefault(); fertig(feld.value.trim()); } },
    h('label', { class: 'feld' }, h('span', {}, 'Dein Name für diese Übung'), feld),
    h('p', { class: 'leise' }, `Original: ${u.originalName ?? u.name}. Der Name gilt im Katalog, in allen Routinen und im Player.`),
    h('button', { type: 'submit', class: 'knopf knopf-haupt' }, 'Speichern'),
    u.name !== (u.originalName ?? u.name)
      ? h('button', { type: 'button', class: 'knopf', onclick: () => fertig('') }, 'Originalnamen wiederherstellen') : null);
  const d = dialog('Übung umbenennen', formular);
  feld.select();
  return d;
}

// Figur mit Umschalter für die Seite. `start` ist 'links', 'rechts' oder null.
function buehneMitSeite(u, start = null) {
  let seite = u.wechselseitig ? (start || 'rechts') : null;
  const buehne = h('div', { class: 'buehne' });
  const zeigeFigur = () => {
    buehne.querySelector('.figur-box')?.stoppeFigur();
    buehne.replaceChildren(figur(u, { seite }));
  };
  zeigeFigur();
  const seitenwahl = u.wechselseitig ? h('div', { class: 'segment', role: 'group', 'aria-label': 'Seite der Vorschau' },
    ['links', 'rechts'].map((s) => h('button', {
      type: 'button', 'aria-pressed': String(s === seite),
      onclick: (e) => {
        seite = s;
        e.currentTarget.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
        zeigeFigur();
      },
    }, s === 'links' ? 'Links' : 'Rechts'))) : null;
  return h('div', { class: 'detail-bild' }, buehne, seitenwahl);
}

function beschreibung(u) {
  return [
    tags(u),
    h('p', { class: 'koerperteile' }, u.koerperteile.map((k) => LABEL.koerperteil[k]).join(' · ')),
    h('h2', {}, 'Ausführung'),
    h('p', {}, u.beschreibung),
    h('h2', {}, 'Darauf achten'),
    h('p', {}, u.hinweise),
  ];
}

// Vorschau einer Übung als Dialog, z. B. aus dem Routinen-Editor.
export function vorschauDialog(u, ctx, { seite = null, onGeaendert = () => {} } = {}) {
  const inhalt = h('div', { class: 'detail-text' });
  const d = dialog(u.name, inhalt);
  const titel = d.el.querySelector('h2');
  inhalt.append(
    buehneMitSeite(u, seite),
    ...beschreibung(u),
    h('button', {
      type: 'button', class: 'knopf',
      onclick: () => umbenennenDialog(u, ctx, () => { titel.textContent = u.name; onGeaendert(); }),
    }, 'Umbenennen'));
  return d;
}

function zuRoutineHinzufuegen(u, ctx) {
  const liste = h('div', { class: 'liste' });
  const d = dialog('Zu Routine hinzufügen', liste);
  const hinzu = (routine) => {
    routine.eintraege.push(eintragFuer(u));
    ctx.store.speichere(routine);
    d.schliessen();
    toast(`Zu „${routine.name}“ hinzugefügt`);
  };
  const eigene = ctx.store.routinen();
  liste.append(
    ...eigene.map((r) => h('button', { type: 'button', class: 'zeile', onclick: () => hinzu(r) },
      h('span', {}, r.name), h('span', { class: 'leise' }, `${r.eintraege.length} Übungen`))),
    eigene.length ? '' : h('p', { class: 'leise' }, 'Du hast noch keine eigene Routine.'),
    h('button', {
      type: 'button', class: 'knopf',
      onclick: () => hinzu({ name: 'Neue Routine', pause: 10, eintraege: [] }),
    }, 'Neue Routine anlegen'));
}

export function render(el, ctx) {
  const u = UEBUNGEN_BY_ID[ctx.param];
  if (!u) {
    ctx.setTitel('Übung', '#/uebungen');
    el.append(h('p', { class: 'leer' }, 'Diese Übung gibt es nicht.'));
    return;
  }
  ctx.setTitel(u.name, '#/uebungen');

  el.append(h('div', { class: 'detail' },
    buehneMitSeite(u),
    h('div', { class: 'detail-text' },
      ...beschreibung(u),
      h('p', { class: 'leise' }, `Empfohlene Dauer: ${u.standardDauer} Sekunden${u.wechselseitig ? ' pro Seite' : ''}`),
      h('button', { type: 'button', class: 'knopf knopf-haupt', onclick: () => zuRoutineHinzufuegen(u, ctx) }, 'Zu Routine hinzufügen'),
      h('button', {
        type: 'button', class: 'knopf',
        onclick: () => umbenennenDialog(u, ctx, () => ctx.setTitel(u.name, '#/uebungen')),
      }, 'Umbenennen'))));
}
