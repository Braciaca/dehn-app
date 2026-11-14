// Spielt eine Routine ab: Animation, Timer, Töne.
import { UEBUNGEN_BY_ID } from '../data/exercises.js';
import { buildSequence, totalDuration } from '../sequence.js';
import { createTimer } from '../timer.js';
import { formatDauer } from '../filter.js';
import { h, icon, figur } from '../ui.js';

const PHASE = { vorbereitung: 'Mach dich bereit', pause: 'Pause', seitenwechsel: 'Seite wechseln' };
const SEITE = { links: 'Links', rechts: 'Rechts' };
const UMFANG = 2 * Math.PI * 54;

// Nummer der Übung (1-basiert) für jeden Schritt: Vorbereitung und Pause zählen zur folgenden Übung.
function uebungsNummern(steps) {
  let nr = 0;
  return steps.map((s, i) => {
    const vorher = steps[i - 1];
    const neuerBlock = s.art === 'vorbereitung' || s.art === 'pause' || (s.art === 'uebung' && vorher?.art === 'uebung');
    if (neuerBlock) nr += 1;
    return Math.max(1, nr);
  });
}

export function render(el, ctx) {
  const routine = ctx.findeRoutine(ctx.param);
  const steps = routine ? buildSequence(routine, UEBUNGEN_BY_ID) : [];
  const zurueck = routine && !routine.vorlage ? `#/routine/${routine.id}` : '#/routinen';
  if (!steps.length) {
    ctx.setTitel('Routine', '#/routinen');
    document.body.classList.remove('im-player');
    el.append(h('p', { class: 'leer' }, 'Diese Routine enthält keine abspielbaren Übungen.'));
    return null;
  }

  const timer = createTimer(steps);
  const nummern = uebungsNummern(steps);
  const anzahl = nummern[nummern.length - 1];
  const gesamtMs = totalDuration(steps) * 1000;
  const startZeit = Date.now();

  const buehne = h('div', { class: 'buehne player-buehne' });
  const phase = h('p', { class: 'player-phase' });
  const name = h('h2', { class: 'player-name' });
  const seite = h('span', { class: 'player-seite' });
  const danach = h('p', { class: 'player-danach' });
  const zeit = h('span', { class: 'ring-zeit' });
  const ring = h('div', { class: 'ring' });
  ring.innerHTML = `<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-bahn" cx="60" cy="60" r="54"/><circle class="ring-wert" cx="60" cy="60" r="54" stroke-dasharray="${UMFANG.toFixed(1)}" transform="rotate(-90 60 60)"/></svg>`;
  ring.append(zeit);
  const ringWert = ring.querySelector('.ring-wert');
  const fortschritt = h('div', { class: 'fortschritt' }, h('div', {}));
  const zaehler = h('span', { class: 'player-zaehler' });
  const pauseKnopf = h('button', { type: 'button', class: 'rund rund-gross', onclick: () => umschalten() });

  el.append(h('div', { class: 'player' },
    h('div', { class: 'player-kopf' },
      h('a', { class: 'rund', href: zurueck, 'aria-label': 'Routine beenden' }, icon('zu')),
      h('span', { class: 'player-titel' }, routine.name), zaehler),
    fortschritt,
    buehne,
    h('div', { class: 'player-info' }, phase, h('div', { class: 'player-zeile' }, name, seite), danach),
    h('div', { class: 'player-unten' },
      ring,
      h('div', { class: 'player-knoepfe' },
        h('button', { type: 'button', class: 'rund', 'aria-label': 'Zurück', onclick: () => springe('prev') }, icon('zurueck')),
        pauseKnopf,
        h('button', { type: 'button', class: 'rund', 'aria-label': 'Weiter', onclick: () => springe('next') }, icon('vor'))))));

  function naechsteUebung(i) {
    for (let j = i + 1; j < steps.length; j++) {
      if (steps[j].art === 'uebung') return steps[j];
    }
    return null;
  }

  function zeigeSchritt(i) {
    const s = steps[i];
    const u = UEBUNGEN_BY_ID[s.uebungId];
    buehne.querySelector('.figur-box')?.stoppeFigur();
    buehne.replaceChildren(figur(u, { seite: s.seite }));
    el.firstElementChild.dataset.art = s.art;
    phase.textContent = PHASE[s.art] || `Übung ${nummern[i]} von ${anzahl}`;
    name.textContent = u.name;
    seite.textContent = s.seite ? SEITE[s.seite] : '';
    seite.hidden = !s.seite;
    zaehler.textContent = `${nummern[i]} / ${anzahl}`;
    if (s.art === 'uebung') {
      const n = naechsteUebung(i);
      const nName = n ? UEBUNGEN_BY_ID[n.uebungId].name + (n.seite ? ` (${SEITE[n.seite].toLowerCase()})` : '') : null;
      danach.textContent = nName ? `Danach: ${nName}` : 'Letzte Übung';
    } else {
      danach.textContent = s.art === 'seitenwechsel' ? 'Gleiche Übung, andere Seite' : 'Gleich geht es los';
    }
  }

  function zeigePauseKnopf(pausiert) {
    pauseKnopf.replaceChildren(icon(pausiert ? 'play' : 'pause'));
    pauseKnopf.setAttribute('aria-label', pausiert ? 'Fortsetzen' : 'Pausieren');
    el.firstElementChild.classList.toggle('pausiert', pausiert);
  }

  function zeichneZeit() {
    const st = timer.state(Date.now());
    if (st.finished) return;
    zeit.textContent = Math.ceil(st.remainingMs / 1000);
    const anteil = st.remainingMs / (st.step.dauer * 1000);
    ringWert.style.strokeDashoffset = (UMFANG * (1 - anteil)).toFixed(1);
    fortschritt.firstElementChild.style.width = `${Math.min(100, (st.elapsedTotalMs / gesamtMs) * 100).toFixed(2)}%`;
  }

  function verarbeite(events) {
    for (const e of events) {
      if (e.type === 'beep') ctx.audio.beep(e.n);
      else if (e.type === 'wechsel') { ctx.audio.wechsel(); zeigeSchritt(e.index); }
      else if (e.type === 'fertig') { ctx.audio.fertig(); zeigeFertig(); }
    }
  }

  let fertig = false;
  function takt() {
    if (fertig) return;
    verarbeite(timer.tick(Date.now()));
    if (!fertig) zeichneZeit();
  }

  function umschalten() {
    if (fertig) return;
    const jetzt = Date.now();
    if (timer.state(jetzt).paused) timer.resume(jetzt); else timer.pause(jetzt);
    zeigePauseKnopf(timer.state(jetzt).paused);
  }

  function springe(richtung) {
    if (fertig) return;
    const events = richtung === 'next' ? timer.next(Date.now()) : timer.prev(Date.now());
    // Beim Springen von Hand gibt es keinen Wechselton, nur das Ende wird angesagt.
    for (const e of events) {
      if (e.type === 'wechsel') zeigeSchritt(e.index);
      else if (e.type === 'fertig') { ctx.audio.fertig(); zeigeFertig(); }
    }
    if (!fertig) zeichneZeit();
  }

  function zeigeFertig() {
    fertig = true;
    aufraeumen();
    buehne.querySelector('.figur-box')?.stoppeFigur();
    const dauer = Math.round((Date.now() - startZeit) / 1000);
    el.replaceChildren(h('div', { class: 'player player-fertig' },
      h('div', { class: 'fertig-haken', 'aria-hidden': 'true' }, '✓'),
      h('h2', {}, 'Geschafft!'),
      h('p', {}, `${routine.name} · ${formatDauer(dauer)} min`),
      h('a', { class: 'knopf knopf-haupt', href: '#/routinen' }, 'Fertig')));
  }

  // --- Bildschirm anlassen ---
  let wakeLock = null;
  async function haltWach() {
    try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { wakeLock = null; }
  }
  const sichtbarkeit = () => {
    if (document.visibilityState === 'visible' && !fertig) { haltWach(); takt(); }
  };
  const taste = (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); umschalten(); }
    else if (e.code === 'ArrowRight') springe('next');
    else if (e.code === 'ArrowLeft') springe('prev');
  };

  // Die Anzeige läuft über requestAnimationFrame; das Intervall hält den Timer
  // auch dann am Laufen, wenn der Browser im Hintergrund keine Bilder zeichnet.
  let raf = 0;
  const bild = () => { takt(); if (!fertig) raf = requestAnimationFrame(bild); };
  const intervall = setInterval(takt, 250);
  document.addEventListener('visibilitychange', sichtbarkeit);
  document.addEventListener('keydown', taste);

  let aufgeraeumt = false;
  function aufraeumen() {
    if (aufgeraeumt) return;
    aufgeraeumt = true;
    clearInterval(intervall);
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', sichtbarkeit);
    document.removeEventListener('keydown', taste);
    wakeLock?.release?.().catch(() => {});
    wakeLock = null;
  }

  ctx.setTitel(routine.name);
  timer.start(Date.now());
  zeigeSchritt(0);
  zeigePauseKnopf(false);
  zeichneZeit();
  haltWach();
  raf = requestAnimationFrame(bild);

  return aufraeumen;
}
