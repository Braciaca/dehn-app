// Start der App und Navigation zwischen den Ansichten.
import { UEBUNGEN } from './data/exercises.js';
import { VORLAGEN } from './data/templates.js';
import { createStore } from './store.js';
import { createAudio } from './audio.js';
import { h, icon, stoppeFiguren } from './ui.js';
import * as uebungen from './views/uebungen.js';
import * as detail from './views/detail.js';
import * as routinen from './views/routinen.js';
import * as editor from './views/editor.js';
import * as player from './views/player.js';
import * as einstellungen from './views/einstellungen.js';

function sichererSpeicher() {
  try {
    const s = window.localStorage;
    s.getItem('dehnapp.test');
    return s;
  } catch {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
  }
}

const store = createStore(sichererSpeicher(), new Set(UEBUNGEN.map((u) => u.id)));
const audio = createAudio();
const anwenden = () => {
  const e = store.einstellungen();
  audio.setLautstaerke(e.lautstaerke);
  audio.setAn(e.toeneAn);
};
anwenden();

// Eigene Namen überschreiben die Namen im Katalog; der Originalname bleibt erhalten.
function namenAnwenden() {
  const eigene = store.namen();
  for (const u of UEBUNGEN) {
    u.originalName ??= u.name;
    u.name = eigene[u.id] || u.originalName;
  }
}
namenAnwenden();
// Der Browser gibt Ton erst nach einer Nutzeraktion frei.
document.addEventListener('pointerdown', () => audio.entsperren(), { capture: true });
document.addEventListener('keydown', () => audio.entsperren(), { capture: true });

const ROUTEN = {
  uebungen: { view: uebungen, nav: 'uebungen' },
  uebung: { view: detail, nav: 'uebungen' },
  routinen: { view: routinen, nav: 'routinen' },
  routine: { view: editor, nav: 'routinen' },
  play: { view: player, nav: null },
  einstellungen: { view: einstellungen, nav: 'einstellungen' },
};

const ansicht = document.getElementById('ansicht');
const kopf = document.getElementById('kopf');
let aufraeumen = null;

const ctx = {
  store,
  audio,
  einstellungenGeaendert: anwenden,
  namenAnwenden,
  benenneUm(u, name) { store.setzeName(u.id, name); namenAnwenden(); },
  navigate: (hash) => { location.hash = hash; },
  findeRoutine: (id) => store.routine(id) || VORLAGEN.find((v) => v.id === id) || null,
  setTitel(titel, zurueck = null) {
    document.title = `${titel} · Dehnen`;
    kopf.replaceChildren(...[
      zurueck ? h('a', { class: 'rund', href: zurueck, 'aria-label': 'Zurück' }, icon('pfeil')) : null,
      h('h1', {}, titel),
    ].filter(Boolean));
  },
};

function zeige() {
  const [, name = 'routinen', param = ''] = location.hash.split('/');
  const route = ROUTEN[name] || ROUTEN.routinen;
  if (aufraeumen) { try { aufraeumen(); } catch { /* Ansicht war schon weg */ } }
  aufraeumen = null;
  stoppeFiguren(ansicht);
  document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  ansicht.replaceChildren();
  document.body.classList.toggle('im-player', route.view === player);
  document.querySelectorAll('#nav a').forEach((a) => {
    if (a.dataset.nav === route.nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
  aufraeumen = route.view.render(ansicht, { ...ctx, param: decodeURIComponent(param) }) || null;
}

window.addEventListener('hashchange', zeige);
zeige();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
