// Die animierte Figur: Geometrie (ohne DOM) und Zeichnen als SVG.
//
// Winkel in Grad, absolut im Bild: 0 = nach oben, positiv im Uhrzeigersinn.
// In der Seitenansicht blickt die Figur nach rechts. "N" ist die rechte
// Körperseite (in der Seitenansicht dem Betrachter zugewandt, in der
// Frontansicht links im Bild), "F" die linke.

export const BREITE = 240;
export const HOEHE = 200;
export const BODEN_Y = 177;
export const MITTE_X = 120;

export const LEN = {
  torsoU: 28, torsoO: 28, hals: 8, kopfR: 10,
  oberarm: 26, unterarm: 24, oberschenkel: 38, unterschenkel: 36, fuss: 12, fussFront: 7,
  schulterHalb: 14, hueftHalb: 8,
};

export const STAND = Object.freeze({
  hip: [MITTE_X, BODEN_Y - LEN.oberschenkel - LEN.unterschenkel],
  torso: 0, spine: 0, head: 0,
  armN: [178, 176], armF: [178, 176],
  legN: [180, 180], legF: [180, 180],
  footN: 90, footF: 90,
});

const PAARE = ['hip', 'armN', 'armF', 'legN', 'legF'];
const EINZEL = ['torso', 'spine', 'head', 'footN', 'footF'];
const zahl = (v, ersatz) => (Number.isFinite(v) ? v : ersatz);

export function vollePose(pose = {}) {
  const p = {};
  for (const k of PAARE) {
    const v = Array.isArray(pose?.[k]) ? pose[k] : [];
    p[k] = [zahl(v[0], STAND[k][0]), zahl(v[1], STAND[k][1])];
  }
  for (const k of EINZEL) p[k] = zahl(pose?.[k], STAND[k]);
  return p;
}

const RAD = Math.PI / 180;
const schritt = ([x, y], winkel, laenge) => [x + Math.sin(winkel * RAD) * laenge, y - Math.cos(winkel * RAD) * laenge];
const quer = ([x, y], winkel, abstand) => [x + Math.cos(winkel * RAD) * abstand, y + Math.sin(winkel * RAD) * abstand];

export function gelenke(pose, ansicht = 'seite') {
  const p = vollePose(pose);
  const front = ansicht === 'front';
  const hip = p.hip;
  const mid = schritt(hip, p.torso, LEN.torsoU);
  const oben = p.torso + p.spine;
  const shoulder = schritt(mid, oben, LEN.torsoO);
  const head = schritt(shoulder, p.head, LEN.hals + LEN.kopfR);
  const sh = front ? LEN.schulterHalb : 0;
  const hh = front ? LEN.hueftHalb : 0;
  const fuss = front ? LEN.fussFront : LEN.fuss;

  const g = { hip, mid, shoulder, head };
  for (const [s, vz] of [['N', -1], ['F', 1]]) {
    const schulter = quer(shoulder, oben, vz * sh);
    const huefte = quer(hip, p.torso, vz * hh);
    const arm = p[`arm${s}`];
    const bein = p[`leg${s}`];
    const ellbogen = schritt(schulter, arm[0], LEN.oberarm);
    const knie = schritt(huefte, bein[0], LEN.oberschenkel);
    const knoechel = schritt(knie, bein[1], LEN.unterschenkel);
    g[`shoulder${s}`] = schulter;
    g[`hip${s}`] = huefte;
    g[`elbow${s}`] = ellbogen;
    g[`hand${s}`] = schritt(ellbogen, arm[1], LEN.unterarm);
    g[`knee${s}`] = knie;
    g[`ankle${s}`] = knoechel;
    g[`toe${s}`] = schritt(knoechel, p[`foot${s}`], fuss);
  }
  return g;
}

// Verschiebt die Pose senkrecht, bis ihr tiefster Punkt auf dem Boden liegt.
export function erden(pose, ansicht = 'seite') {
  const p = vollePose(pose);
  const tief = Math.max(...Object.values(gelenke(p, ansicht)).map((q) => q[1]));
  p.hip = [p.hip[0], p.hip[1] + (BODEN_Y - tief)];
  return p;
}

function zwischen(a, b, t, kreis) {
  if (!kreis) return a + (b - a) * t;
  const delta = ((((b - a) % 360) + 540) % 360) - 180;
  return a + delta * t;
}

export function mischen(a, b, t, kreis = false) {
  const p = {};
  p.hip = [a.hip[0] + (b.hip[0] - a.hip[0]) * t, a.hip[1] + (b.hip[1] - a.hip[1]) * t];
  for (const k of PAARE) if (k !== 'hip') p[k] = [zwischen(a[k][0], b[k][0], t, kreis), zwischen(a[k][1], b[k][1], t, kreis)];
  for (const k of EINZEL) p[k] = zwischen(a[k], b[k], t, kreis);
  return p;
}

export function spiegeln(pose, ansicht = 'seite') {
  const p = vollePose(pose);
  const s = { ...p, armN: p.armF, armF: p.armN, legN: p.legF, legF: p.legN, footN: p.footF, footF: p.footN };
  if (ansicht !== 'front') return s;
  const neg = (v) => (v === 0 ? 0 : -v);
  return {
    hip: [2 * MITTE_X - s.hip[0], s.hip[1]],
    torso: neg(s.torso), spine: neg(s.spine), head: neg(s.head),
    armN: s.armN.map(neg), armF: s.armF.map(neg), legN: s.legN.map(neg), legF: s.legF.map(neg),
    footN: neg(s.footN), footF: neg(s.footF),
  };
}

const weich = (t) => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t)))) / 2;
const EINSTIEG_S = 1.5;
const ATMUNG_GRAD = 1.5;

export function poseZurZeit(animation, tSek) {
  const posen = (animation?.posen?.length ? animation.posen : [{}]).map(vollePose);
  const n = posen.length;
  const zyklus = animation?.zyklus > 0 ? animation.zyklus : 4;
  const t = Math.max(0, zahl(tSek, 0));
  if (n === 1) return posen[0];

  if (animation.modus === 'halten') {
    if (t < EINSTIEG_S) {
      const f = weich(t / EINSTIEG_S) * (n - 1);
      const i = Math.min(n - 2, Math.floor(f));
      return mischen(posen[i], posen[i + 1], f - i);
    }
    const ende = { ...posen[n - 1] };
    ende.spine += ATMUNG_GRAD * Math.sin((2 * Math.PI * (t - EINSTIEG_S)) / zyklus);
    return ende;
  }

  const anteil = (t % zyklus) / zyklus;
  if (animation.modus === 'kreisen') {
    const f = anteil * n;
    const i = Math.min(n - 1, Math.floor(f));
    return mischen(posen[i], posen[(i + 1) % n], f - i, true);
  }

  // pendeln: 0 → 1 → … → letzte → … → 0
  const segmente = 2 * (n - 1);
  const f = anteil * segmente;
  const i = Math.min(segmente - 1, Math.floor(f));
  const u = weich(f - i);
  return i < n - 1 ? mischen(posen[i], posen[i + 1], u) : mischen(posen[segmente - i], posen[segmente - i - 1], u);
}

// ---------- Zeichnen ----------

const NS = 'http://www.w3.org/2000/svg';
const pkt = (liste) => liste.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

function requisitSvg(animation) {
  const x = zahl(animation.requisitX, animation.requisit === 'wand' ? 196 : 108);
  if (animation.requisit === 'stuhl') {
    const y = BODEN_Y - LEN.unterschenkel + 7;
    return `<path class="fig-requisit" d="M${x - 22} ${y - 44}V${BODEN_Y + 5}M${x - 22} ${y}H${x + 22}V${BODEN_Y + 5}"/>`;
  }
  if (animation.requisit === 'wand') {
    return `<path class="fig-requisit fig-wand" d="M${x} 14V${BODEN_Y + 6}"/>`;
  }
  return '';
}

export function figurSvg(animation) {
  return `<svg class="figur" viewBox="0 -12 ${BREITE} ${HOEHE + 4}" role="img" aria-hidden="true">
    <path class="fig-boden" d="M14 ${BODEN_Y + 6}H${BREITE - 14}"/>
    ${requisitSvg(animation)}
    <polyline class="fig-fern" data-t="legF"/><polyline class="fig-fern" data-t="armF"/>
    <polyline class="fig-rumpf" data-t="rumpf"/><circle class="fig-kopf" data-t="kopf" r="${LEN.kopfR}"/>
    <polyline class="fig-nah" data-t="legN"/><polyline class="fig-nah" data-t="armN"/>
  </svg>`;
}

function zeichne(teile, pose, ansicht) {
  const g = gelenke(pose, ansicht);
  teile.legF.setAttribute('points', pkt([g.hipF, g.kneeF, g.ankleF, g.toeF]));
  teile.legN.setAttribute('points', pkt([g.hipN, g.kneeN, g.ankleN, g.toeN]));
  teile.armF.setAttribute('points', pkt([g.shoulderF, g.elbowF, g.handF]));
  teile.armN.setAttribute('points', pkt([g.shoulderN, g.elbowN, g.handN]));
  teile.rumpf.setAttribute('points', pkt([g.hip, g.mid, g.shoulder]));
  teile.kopf.setAttribute('cx', g.head[0].toFixed(1));
  teile.kopf.setAttribute('cy', g.head[1].toFixed(1));
}

// Zeichnet die Figur in `el` und animiert sie. Liefert { stop() }.
export function mountFigure(el, animation, { seite = null, standbild = false } = {}) {
  const ansicht = animation.ansicht === 'front' ? 'front' : 'seite';
  const posen = animation.posen.map((p) => (seite === 'links' ? spiegeln(p, ansicht) : vollePose(p)));
  const anim = { ...animation, posen };

  el.innerHTML = figurSvg(animation);
  const svg = el.firstElementChild;
  svg.classList.toggle('figur-front', ansicht === 'front');
  if (seite === 'links' && ansicht === 'front' && animation.requisit) svg.classList.add('figur-requisit-gespiegelt');
  const teile = {};
  for (const n of svg.querySelectorAll('[data-t]')) teile[n.dataset.t] = n;

  const ruhig = standbild || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (ruhig) {
    zeichne(teile, posen[posen.length - 1], ansicht);
    return { stop() {} };
  }

  let raf = 0;
  let sichtbar = true;
  let gestoppt = false;
  let start = null;
  const bild = (jetzt) => {
    raf = 0;
    if (gestoppt || !el.isConnected) return;
    if (start === null) start = jetzt;
    zeichne(teile, poseZurZeit(anim, (jetzt - start) / 1000), ansicht);
    if (sichtbar) raf = requestAnimationFrame(bild);
  };
  zeichne(teile, poseZurZeit(anim, 0), ansicht);
  raf = requestAnimationFrame(bild);

  let beobachter = null;
  if (typeof IntersectionObserver === 'function') {
    beobachter = new IntersectionObserver((eintraege) => {
      sichtbar = eintraege[eintraege.length - 1].isIntersecting;
      if (sichtbar && !raf && !gestoppt) raf = requestAnimationFrame(bild);
    });
    beobachter.observe(el);
  }

  return {
    stop() {
      gestoppt = true;
      if (raf) cancelAnimationFrame(raf);
      beobachter?.disconnect();
    },
  };
}
