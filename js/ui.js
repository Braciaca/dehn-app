// Kleine DOM-Helfer und wiederverwendete Bausteine der Oberfläche.
import { KOERPERTEILE, ARTEN, POSITIONEN, LABEL } from './data/exercises.js';
import { mountFigure } from './figure.js';
import { mountFigure3d, standbild3d, hat3d } from './figure3d.js';

export function h(tag, attrs = {}, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k in el && k !== 'list' && k !== 'type') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kind of kinder.flat()) {
    if (kind === null || kind === undefined || kind === false) continue;
    el.append(kind.nodeType ? kind : document.createTextNode(String(kind)));
  }
  return el;
}

export const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5h4.5v15H6zM13.5 4.5H18v15h-4.5z" fill="currentColor"/></svg>',
  vor: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v14l10-7zM16.5 5H19v14h-2.5z" fill="currentColor"/></svg>',
  zurueck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5v14L9 12zM5 5h2.5v14H5z" fill="currentColor"/></svg>',
  pfeil: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  zu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};
export function icon(name) {
  const s = h('span', { class: 'icon' });
  s.innerHTML = ICON[name];
  return s;
}

export function tags(u) {
  return h('div', { class: 'tags' },
    h('span', { class: `tag tag-${u.art}` }, LABEL.art[u.art]),
    h('span', { class: 'tag' }, LABEL.position[u.position]),
    u.wechselseitig ? h('span', { class: 'tag' }, 'Wechselseitig') : null);
}

// ---------- Figur ----------
// Bewegte Figur: eigene 3D-Fläche. Standbild: Bild aus dem geteilten 3D-Renderer,
// gezeichnet erst, wenn die Karte sichtbar wird. Ohne WebGL die 2D-Figur.

const warteschlange = [];
let arbeitet = false;
const sichtbar = typeof IntersectionObserver === 'function'
  ? new IntersectionObserver((eintraege) => {
    for (const e of eintraege) {
      if (!e.isIntersecting) continue;
      sichtbar.unobserve(e.target);
      warteschlange.push(e.target);
    }
    abarbeiten();
  }, { rootMargin: '200px' })
  : null;

function abarbeiten() {
  if (arbeitet) return;
  arbeitet = true;
  const schritt = () => {
    const el = warteschlange.shift();
    if (!el) { arbeitet = false; return; }
    if (el.isConnected) zeichneStandbild(el);
    setTimeout(schritt, 0); // zwischen zwei Bildern bleibt die Seite bedienbar
  };
  schritt();
}

function zeichneStandbild(el) {
  const { u, seite } = el.figurDaten;
  try {
    const bild = h('img', { class: 'figur-bild', alt: '', src: standbild3d(u.id, u.animation3d, { seite }) });
    el.replaceChildren(bild);
  } catch {
    mountFigure(el, u.animation, { seite, standbild: true });
  }
}

export function figur(u, { seite = null, standbild = false } = {}) {
  const el = h('div', { class: 'figur-box' });
  el.stoppeFigur = () => {};
  if (u.animation3d && hat3d()) {
    if (standbild) {
      el.figurDaten = { u, seite };
      if (sichtbar) sichtbar.observe(el); else zeichneStandbild(el);
      el.stoppeFigur = () => sichtbar?.unobserve(el);
      return el;
    }
    try {
      const handle = mountFigure3d(el, u.animation3d, { seite });
      el.classList.add('figur-3d');
      el.title = 'Zum Drehen ziehen';
      el.stoppeFigur = () => handle.stop();
      return el;
    } catch {
      // WebGL nicht nutzbar: weiter mit der 2D-Figur.
    }
  }
  const handle = mountFigure(el, u.animation, { seite, standbild });
  el.stoppeFigur = () => handle.stop();
  return el;
}

function chips(liste, istAktiv, onToggle) {
  return h('div', { class: 'chips' }, liste.map((eintrag) => {
    const b = h('button', {
      type: 'button', class: 'chip', 'aria-pressed': String(istAktiv(eintrag.key)),
      onclick: () => onToggle(eintrag.key),
    }, eintrag.label);
    return b;
  }));
}

// Suchfeld und Filter-Chips. `zustand` wird direkt verändert, danach ruft die Leiste onChange auf.
export function filterLeiste(zustand, onChange) {
  const wurzel = h('div', { class: 'filter' });
  const zeichne = () => {
    const such = h('input', {
      type: 'search', class: 'suche', placeholder: 'Übung suchen', value: zustand.suche, 'aria-label': 'Übung suchen',
      oninput: (e) => { zustand.suche = e.target.value; onChange(); },
    });
    const einzel = (feld) => (key) => { zustand[feld] = zustand[feld] === key ? null : key; neu(); };
    const anzahl = zustand.koerperteile.length + (zustand.art ? 1 : 0) + (zustand.position ? 1 : 0);
    wurzel.replaceChildren(...[
      such,
      h('div', { class: 'filter-zeile' },
        chips(POSITIONEN, (k) => zustand.position === k, einzel('position')),
        chips(ARTEN, (k) => zustand.art === k, einzel('art'))),
      h('details', { class: 'filter-koerper', open: zustand.koerperteile.length > 0 || zustand.offen },
        h('summary', { onclick: () => { zustand.offen = !zustand.offen; } },
          `Körperteile${zustand.koerperteile.length ? ` (${zustand.koerperteile.length})` : ''}`),
        chips(KOERPERTEILE, (k) => zustand.koerperteile.includes(k), (key) => {
          zustand.koerperteile = zustand.koerperteile.includes(key)
            ? zustand.koerperteile.filter((k) => k !== key) : [...zustand.koerperteile, key];
          zustand.offen = true;
          neu();
        })),
      anzahl ? h('button', {
        type: 'button', class: 'link', onclick: () => { zustand.koerperteile = []; zustand.art = null; zustand.position = null; neu(); },
      }, 'Filter zurücksetzen') : null,
    ].filter(Boolean));
  };
  const neu = () => { zeichne(); onChange(); };
  zeichne();
  return wurzel;
}

let toastTimer = 0;
export function toast(text) {
  let el = document.getElementById('toast');
  if (!el) { el = h('div', { id: 'toast', role: 'status' }); document.body.append(el); }
  el.textContent = text;
  el.classList.add('sichtbar');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('sichtbar'), 2200);
}

// Modaler Dialog. Liefert { el, schliessen }.
export function dialog(titel, inhalt, { gross = false } = {}) {
  const d = h('dialog', { class: gross ? 'dialog dialog-gross' : 'dialog' });
  const schliessen = () => { d.close(); };
  d.append(
    h('div', { class: 'dialog-kopf' }, h('h2', {}, titel),
      h('button', { type: 'button', class: 'rund', 'aria-label': 'Schließen', onclick: schliessen }, icon('zu'))),
    h('div', { class: 'dialog-inhalt' }, inhalt));
  d.addEventListener('close', () => {
    d.querySelectorAll('.figur-box').forEach((f) => f.stoppeFigur?.());
    d.remove();
  });
  d.addEventListener('click', (e) => { if (e.target === d) schliessen(); });
  document.body.append(d);
  d.showModal();
  return { el: d, schliessen };
}

export function stoppeFiguren(wurzel) {
  wurzel.querySelectorAll('.figur-box').forEach((f) => f.stoppeFigur?.());
}
