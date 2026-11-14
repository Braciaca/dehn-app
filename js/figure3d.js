// 3D-Figur: baut eine Figur mit Körpervolumen, stellt sie in Posen und animiert
// sie. Die Figur lässt sich mit Finger oder Maus drehen.
//
// Achsen: Y zeigt nach oben, die Figur blickt in der Grundstellung nach +Z,
// ihre linke Seite liegt bei +X. Posen stehen in Grad und in Körperbegriffen:
//   Rumpfteile  [vor, seit, dreh]  vor = nach vorn beugen, seit = nach links neigen, dreh = nach links drehen
//   Schulter/Hüfte [vor, seit, dreh]  vor = nach vorn heben, seit = abspreizen, dreh = nach außen drehen
//   Ellbogen/Knie  Zahl = beugen;   Fuß  Zahl = Fußspitze strecken;   Handgelenk  Zahl = Hand beugen
//   becken: { pos: [x, z], rot: [kippen nach vorn, drehen nach links, neigen nach rechts] }
//
// Die Höhe der Figur ergibt sich in jedem Bild von selbst: Der tiefste Punkt von
// Rumpf, Kopf oder Beinen berührt den Boden. Arme zählen dabei nie mit.
// Auf dem Stuhl bleibt das Becken auf der Höhe der ersten Pose.
//
// Hände können sich abstützen: stuetzen: { handL: 'fest' | 'boden' }.
//   'boden' legt die Hand senkrecht unter ihrer freien Lage auf den Boden,
//   'fest' hält sie an der Stelle der ersten Pose. Schulter und Ellbogen werden
//   dann so berechnet, dass die Hand dort bleibt; der Ellbogen beugt sich von selbst.
import * as THREE from '../vendor/three/three.module.min.js';

const G = Math.PI / 180;
const M = {
  huefteX: 0.092, huefteY: -0.06, oberschenkel: 0.43, unterschenkel: 0.42,
  lende: 0.1, brust: 0.16, hals: 0.3, kopf: 0.165,
  schulterX: 0.176, schulterY: 0.222, oberarm: 0.3, unterarm: 0.262, hand: 0.075,
};
const HAND_HOEHE = 0.034; // Höhe des Handgelenks bei aufgelegter Hand
const EINSTIEG = 2; // Sekunden, in denen eine gehaltene Übung in die Endpose geht
const SITZ_UNTER_BECKEN = 0.148;

const NULL3 = [0, 0, 0];
const RUMPF = ['lende', 'brust', 'hals'];
const GLIEDER = ['schulterL', 'schulterR', 'hueftL', 'hueftR'];
const EINFACH = ['ellbogenL', 'ellbogenR', 'knieL', 'knieR', 'fussL', 'fussR', 'handgelenkL', 'handgelenkR'];

export function vollePose3d(p = {}) {
  const drei = (v) => [0, 1, 2].map((i) => (Number.isFinite(v?.[i]) ? v[i] : 0));
  const pose = { becken: { pos: [p.becken?.pos?.[0] || 0, p.becken?.pos?.[1] || 0], rot: drei(p.becken?.rot) } };
  for (const k of [...RUMPF, ...GLIEDER]) pose[k] = drei(p[k]);
  for (const k of EINFACH) pose[k] = Number.isFinite(p[k]) ? p[k] : 0;
  return pose;
}

// Mischt zwei Posen. Mit `kreis` nehmen Winkel den kürzeren Weg (für Kreisbewegungen).
export function mischen3d(a, b, t, kreis = false) {
  const lin = (x, y) => x + (y - x) * t;
  const w = kreis ? (x, y) => x + (((((y - x) % 360) + 540) % 360) - 180) * t : lin;
  const pose = { becken: { pos: a.becken.pos.map((v, i) => lin(v, b.becken.pos[i])), rot: a.becken.rot.map((v, i) => w(v, b.becken.rot[i])) } };
  for (const k of [...RUMPF, ...GLIEDER]) pose[k] = a[k].map((v, i) => w(v, b[k][i]));
  for (const k of EINFACH) pose[k] = w(a[k], b[k]);
  return pose;
}

// Tauscht links und rechts.
export function spiegeln3d(p) {
  const s = vollePose3d(p);
  const rumpf = ([v, se, d]) => [v, -se, -d];
  return {
    becken: { pos: [-s.becken.pos[0], s.becken.pos[1]], rot: [s.becken.rot[0], -s.becken.rot[1], -s.becken.rot[2]] },
    lende: rumpf(s.lende), brust: rumpf(s.brust), hals: rumpf(s.hals),
    schulterL: s.schulterR, schulterR: s.schulterL, hueftL: s.hueftR, hueftR: s.hueftL,
    ellbogenL: s.ellbogenR, ellbogenR: s.ellbogenL, knieL: s.knieR, knieR: s.knieL, fussL: s.fussR, fussR: s.fussL,
    handgelenkL: s.handgelenkR, handgelenkR: s.handgelenkL,
  };
}

export function spiegelnStuetzen(st = {}) {
  const neu = {};
  if (st.handL) neu.handR = st.handL;
  if (st.handR) neu.handL = st.handR;
  return neu;
}

// Sehr weicher Übergang: langsam anfahren, langsam abbremsen.
const weich = (t) => { const x = Math.min(1, Math.max(0, t)); return x * x * x * (x * (x * 6 - 15) + 10); };
const zyklusVon = (a) => (a.zyklus > 0 ? a.zyklus : 4);

export function pose3dZurZeit(animation, tSek) {
  const posen = animation.posen;
  const n = posen.length;
  const zyklus = zyklusVon(animation);
  const t = Math.max(0, Number.isFinite(tSek) ? tSek : 0);
  if (n === 1) return posen[0];
  if (animation.modus === 'halten') {
    if (t < EINSTIEG) {
      const f = weich(t / EINSTIEG) * (n - 1);
      const i = Math.min(n - 2, Math.floor(f));
      return mischen3d(posen[i], posen[i + 1], f - i);
    }
    const ende = mischen3d(posen[n - 1], posen[n - 1], 0);
    ende.brust[0] += 1 * Math.sin((2 * Math.PI * (t - EINSTIEG)) / zyklus);
    return ende;
  }
  const anteil = (t % zyklus) / zyklus;
  if (animation.modus === 'kreisen') {
    // Gleichmäßig im Kreis durch alle Posen, nach der letzten zurück zur ersten.
    const f = anteil * n;
    const i = Math.min(n - 1, Math.floor(f));
    return mischen3d(posen[i], posen[(i + 1) % n], f - i, true);
  }
  const segmente = 2 * (n - 1);
  const f = anteil * segmente;
  const i = Math.min(segmente - 1, Math.floor(f));
  const u = weich(f - i);
  return i < n - 1 ? mischen3d(posen[i], posen[i + 1], u) : mischen3d(posen[segmente - i], posen[segmente - i - 1], u);
}

// Dauer eines Durchlaufs und Zeitpunkt, der als Standbild gezeigt wird.
export function dauer3d(animation) {
  return animation.modus === 'halten' ? EINSTIEG + zyklusVon(animation) : zyklusVon(animation);
}
export function bildZeit3d(animation) {
  if (Number.isFinite(animation.bildZeit)) return animation.bildZeit;
  if (animation.modus === 'halten') return EINSTIEG;
  if (animation.modus === 'kreisen') return 0;
  return zyklusVon(animation) / 2;
}

// ---------- Aufbau der Figur ----------

function dunkel() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

function farben() {
  const d = dunkel();
  return {
    haut: 0xdfb192, shirt: d ? 0x4fb9a1 : 0x2f8572, hose: d ? 0x3a5876 : 0x2c3e55,
    haar: 0x47332a, auge: 0x2b2320, boden: d ? 0x24302e : 0xe4dccd, requisit: d ? 0x5b6b66 : 0xbfb39d,
  };
}

// Rotationskörper aus einem Profil [[Radius, Höhe], …] mit weich gerundeter Kontur.
function drehkoerper(profil, segmente = 32) {
  const kurve = new THREE.SplineCurve(profil.map(([r, y]) => new THREE.Vector2(r, y)));
  const punkte = kurve.getPoints(profil.length * 8).map((p) => new THREE.Vector2(Math.max(0.0005, p.x), p.y));
  return new THREE.LatheGeometry(punkte, segmente);
}
// Glied entlang -Y; Profil als [[Anteil der Länge, Radius], …].
const gliedForm = (laenge, profil) => drehkoerper(profil.map(([t, r]) => [r, -t * laenge]).reverse());

function baueFigur(f) {
  const mat = (farbe, rau = 0.72) => new THREE.MeshStandardMaterial({ color: farbe, roughness: rau, metalness: 0 });
  const haut = mat(f.haut, 0.62); const shirt = mat(f.shirt, 0.85); const hose = mat(f.hose, 0.85);
  const haar = mat(f.haar, 0.9); const auge = mat(f.auge, 0.4);
  const gelenke = {};
  const tasten = []; // { o, r, arm } für Bodenberührung und Bildausschnitt

  const netz = (geo, material, eltern, pos = NULL3, skal = [1, 1, 1]) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(...pos); m.scale.set(...skal); m.castShadow = true;
    eltern.add(m);
    return m;
  };
  const gruppe = (name, eltern, pos, ordnung = 'XZY') => {
    const g = new THREE.Group();
    g.position.set(...pos); g.rotation.order = ordnung;
    eltern.add(g); gelenke[name] = g;
    return g;
  };
  const kugel = new THREE.SphereGeometry(1, 32, 20);
  const ball = (material, eltern, pos, r) => netz(kugel, material, eltern, pos, [r, r, r]);
  const punkt = (eltern, pos, r, arm = false) => {
    const o = new THREE.Object3D();
    o.position.set(...pos); eltern.add(o); tasten.push({ o, r, arm });
    return o;
  };
  const T = 0.7; // Rumpf ist flacher als breit

  const wurzel = new THREE.Group();
  const becken = gruppe('becken', wurzel, NULL3, 'YXZ');
  netz(drehkoerper([[0.02, -0.15], [0.1, -0.135], [0.158, -0.07], [0.168, 0], [0.156, 0.07], [0.146, 0.12]]), hose, becken, NULL3, [1, 1, T + 0.05]);
  punkt(becken, [0, -0.03, -0.02], 0.115);
  punkt(becken, [0, 0.02, -0.06], 0.1);

  const lende = gruppe('lende', becken, [0, M.lende, 0]);
  netz(drehkoerper([[0.146, -0.04], [0.136, 0.05], [0.134, 0.1], [0.146, 0.2]]), shirt, lende, NULL3, [1, 1, T]);
  ball(shirt, lende, [0, 0, 0], 0.1).scale.set(0.146, 0.1, 0.146 * T);
  punkt(lende, [0, 0.08, -0.06], 0.08);
  punkt(lende, [0, 0.08, 0.06], 0.08);

  const brust = gruppe('brust', lende, [0, M.brust, 0]);
  netz(drehkoerper([[0.14, -0.03], [0.158, 0.06], [0.172, 0.14], [0.174, 0.195], [0.168, 0.225], [0.135, 0.262], [0.085, 0.292], [0.054, 0.312], [0.05, 0.325]]), shirt, brust, NULL3, [1, 1, T]);
  ball(shirt, brust, [0, 0, 0], 0.1).scale.set(0.142, 0.1, 0.142 * T);
  punkt(brust, [0, 0.13, 0], 0.125);
  for (const x of [-0.12, 0.12]) { punkt(brust, [x, 0.17, -0.05], 0.07); punkt(brust, [x, 0.17, 0.05], 0.07); }

  const hals = gruppe('hals', brust, [0, M.hals, 0]);
  netz(new THREE.CylinderGeometry(0.046, 0.052, 0.13, 20), haut, hals, [0, 0.04, 0]);
  // Kopf: unten am Kinn schmaler als am Schädel.
  const kopfForm = drehkoerper([[0.01, -0.125], [0.06, -0.105], [0.086, -0.05], [0.098, 0.015], [0.094, 0.07], [0.066, 0.108], [0.01, 0.122]]);
  netz(kopfForm, haut, hals, [0, M.kopf, 0.012], [0.96, 1, 1.1]);
  netz(new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.56), haar, hals, [0, M.kopf + 0.03, -0.006], [0.103, 0.112, 0.118]);
  ball(haar, hals, [0, M.kopf + 0.012, -0.045], 0.09).scale.set(0.097, 0.104, 0.084);
  ball(haut, hals, [0, M.kopf - 0.012, 0.118], 0.02).scale.set(0.015, 0.024, 0.02); // Nase
  for (const x of [-0.034, 0.034]) {
    ball(auge, hals, [x, M.kopf + 0.012, 0.107], 0.01).scale.set(0.012, 0.015, 0.008);
    ball(haut, hals, [x * 2.85, M.kopf - 0.005, 0.008], 0.02).scale.set(0.012, 0.026, 0.018); // Ohr
  }
  punkt(hals, [0, M.kopf, 0], 0.112);

  for (const [s, vz] of [['L', 1], ['R', -1]]) {
    const schulter = gruppe(`schulter${s}`, brust, [vz * M.schulterX, M.schulterY, 0]);
    netz(gliedForm(M.oberarm, [[0, 0.05], [0.3, 0.05], [0.7, 0.043], [1, 0.039]]), haut, schulter);
    netz(gliedForm(M.oberarm * 0.5, [[0, 0.056], [0.5, 0.055], [1, 0.05]]), shirt, schulter); // kurzer Ärmel
    ball(shirt, schulter, NULL3, 0.057);
    punkt(schulter, NULL3, 0.056);
    punkt(schulter, [0, -M.oberarm * 0.5, 0], 0.045, true);
    const ellbogen = gruppe(`ellbogen${s}`, schulter, [0, -M.oberarm, 0]);
    ball(haut, ellbogen, NULL3, 0.039);
    netz(gliedForm(M.unterarm, [[0, 0.039], [0.25, 0.042], [0.7, 0.032], [1, 0.027]]), haut, ellbogen);
    punkt(ellbogen, NULL3, 0.04, true);
    punkt(ellbogen, [0, -M.unterarm * 0.5, 0], 0.035, true);
    const hand = gruppe(`hand${s}`, ellbogen, [0, -M.unterarm, 0]);
    ball(haut, hand, NULL3, 0.028);
    ball(haut, hand, [0, -M.hand * 0.85, 0], 0.03).scale.set(0.04, 0.078, 0.019);
    ball(haut, hand, [vz * -0.034, -0.05, 0.012], 0.02).scale.set(0.013, 0.036, 0.013); // Daumen
    punkt(hand, NULL3, 0.028, true);
    punkt(hand, [0, -M.hand, 0], 0.02, true);

    const hueft = gruppe(`hueft${s}`, becken, [vz * M.huefteX, M.huefteY, 0]);
    netz(gliedForm(M.oberschenkel, [[0, 0.086], [0.2, 0.088], [0.55, 0.074], [0.88, 0.058], [1, 0.056]]), haut, hueft);
    netz(gliedForm(M.oberschenkel * 0.52, [[0, 0.09], [0.4, 0.091], [1, 0.082]]), hose, hueft); // kurze Hose
    ball(hose, hueft, NULL3, 0.09);
    punkt(hueft, NULL3, 0.088);
    punkt(hueft, [0, -M.oberschenkel * 0.5, 0], 0.076);
    const knie = gruppe(`knie${s}`, hueft, [0, -M.oberschenkel, 0]);
    ball(haut, knie, NULL3, 0.056);
    netz(gliedForm(M.unterschenkel, [[0, 0.055], [0.12, 0.058], [0.32, 0.064], [0.62, 0.048], [0.9, 0.036], [1, 0.036]]), haut, knie, [0, 0, -0.004]);
    punkt(knie, NULL3, 0.056);
    punkt(knie, [0, -M.unterschenkel * 0.35, -0.004], 0.06);
    punkt(knie, [0, -M.unterschenkel * 0.7, 0], 0.045);
    const fuss = gruppe(`fuss${s}`, knie, [0, -M.unterschenkel, 0]);
    ball(haut, fuss, NULL3, 0.038);
    ball(haut, fuss, [0, -0.04, 0.062], 0.05).scale.set(0.046, 0.036, 0.125); // Fuß
    ball(haut, fuss, [0, -0.03, -0.02], 0.04).scale.set(0.04, 0.045, 0.05); // Ferse
    punkt(fuss, NULL3, 0.038);
    punkt(fuss, [0, -0.035, -0.035], 0.04);
    punkt(fuss, [0, -0.04, 0.06], 0.036);
    punkt(fuss, [0, -0.042, 0.155], 0.032);
  }
  return { wurzel, gelenke, tasten };
}

function wendeAn(figur, pose) {
  const g = figur.gelenke;
  const b = pose.becken;
  g.becken.position.set(b.pos[0], g.becken.position.y, b.pos[1]);
  g.becken.rotation.set(b.rot[0] * G, b.rot[1] * G, b.rot[2] * G);
  for (const k of RUMPF) g[k].rotation.set(pose[k][0] * G, pose[k][2] * G, -pose[k][1] * G);
  for (const [s, vz] of [['L', 1], ['R', -1]]) {
    for (const k of ['schulter', 'hueft']) {
      const [vor, seit, dreh] = pose[k + s];
      g[k + s].rotation.set(-vor * G, vz * dreh * G, vz * seit * G);
    }
    g[`ellbogen${s}`].rotation.set(-pose[`ellbogen${s}`] * G, 0, 0);
    g[`hand${s}`].rotation.set(pose[`handgelenk${s}`] * G, 0, 0);
    g[`knie${s}`].rotation.x = pose[`knie${s}`] * G;
    g[`fuss${s}`].rotation.x = pose[`fuss${s}`] * G;
  }
}

const hilf = new THREE.Vector3();
// Tiefster Punkt von Rumpf, Kopf und Beinen sowie die Ausdehnung der ganzen Figur.
function vermiss(figur) {
  figur.wurzel.updateMatrixWorld(true);
  const box = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  let tief = Infinity;
  for (const { o, r, arm } of figur.tasten) {
    o.getWorldPosition(hilf);
    if (!arm) tief = Math.min(tief, hilf.y - r);
    ['x', 'y', 'z'].forEach((a, i) => {
      box.min[i] = Math.min(box.min[i], hilf[a] - r);
      box.max[i] = Math.max(box.max[i], hilf[a] + r);
    });
  }
  return { tief, box };
}

// Richtung, in die die Finger einer aufgelegten Hand zeigen: dorthin, wohin der Oberkörper weist.
function fingerRichtung(figur) {
  const r = new THREE.Vector3(0, 1, 0).transformDirection(figur.gelenke.brust.matrixWorld);
  r.y = 0;
  if (r.lengthSq() < 0.04) {
    r.set(0, 0, 1).transformDirection(figur.gelenke.becken.matrixWorld);
    r.y = 0;
  }
  if (r.lengthSq() < 1e-6) r.set(0, 0, 1);
  return r.normalize();
}

// Stellt Schulter und Ellbogen so, dass das Handgelenk das Ziel erreicht (Zwei-Gelenk-Lösung).
// `pol` gibt an, wohin der Ellbogen zeigen soll.
function loeseArm(figur, s, ziel, pol, fingerZurueck) {
  const schulter = figur.gelenke[`schulter${s}`];
  const ellbogen = figur.gelenke[`ellbogen${s}`];
  const a = M.oberarm; const b = M.unterarm;
  const umkehr = schulter.parent.matrixWorld.clone().invert();
  const zumZiel = ziel.clone().applyMatrix4(umkehr).sub(schulter.position);
  const d = Math.min(a + b - 0.004, Math.max(Math.abs(a - b) + 0.02, zumZiel.length()));
  const beuge = Math.PI - Math.acos((a * a + b * b - d * d) / (2 * a * b));
  ellbogen.rotation.set(-beuge, 0, 0);

  const achse = zumZiel.clone().normalize();
  const hand = new THREE.Vector3(0, -a - b * Math.cos(beuge), b * Math.sin(beuge)).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(hand, achse);
  // Um die Achse Schulter–Hand drehen, bis der Ellbogen in Richtung des Pols zeigt.
  const eben = (v) => v.clone().sub(achse.clone().multiplyScalar(v.dot(achse)));
  const e = eben(new THREE.Vector3(0, -a, 0).applyQuaternion(q));
  const p = eben(pol.clone().transformDirection(umkehr));
  if (e.lengthSq() > 1e-8 && p.lengthSq() > 1e-8) {
    e.normalize(); p.normalize();
    const winkel = Math.atan2(achse.dot(new THREE.Vector3().crossVectors(e, p)), e.dot(p));
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(achse, winkel));
  }
  schulter.quaternion.copy(q);

  // Hand flach auf den Boden legen.
  const handGelenk = figur.gelenke[`hand${s}`];
  figur.wurzel.updateMatrixWorld(true);
  const vorn = fingerRichtung(figur);
  if (fingerZurueck) vorn.negate();
  const oben = new THREE.Vector3(0, 1, 0);
  const yAchse = vorn.clone().negate();
  const xAchse = new THREE.Vector3().crossVectors(yAchse, oben);
  const welt = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAchse, yAchse, oben));
  const eltern = handGelenk.parent.getWorldQuaternion(new THREE.Quaternion());
  handGelenk.quaternion.copy(eltern.invert().multiply(welt));
}

// Stellt die Figur in eine Pose: Gelenke, Höhe über dem Boden, abgestützte Hände.
function stelle(figur, pose, ctx) {
  wendeAn(figur, pose);
  const becken = figur.gelenke.becken;
  if (Number.isFinite(ctx.festesBecken)) {
    becken.position.y = ctx.festesBecken;
  } else {
    becken.position.y = 0;
    becken.position.y = -vermiss(figur).tief;
  }
  figur.wurzel.updateMatrixWorld(true);
  for (const h of ctx.haende) {
    const s = h.slice(-1);
    let ziel;
    if (ctx.stuetzen[h] === 'fest') {
      ziel = new THREE.Vector3(...ctx.festeZiele[h]);
    } else {
      figur.gelenke[h].getWorldPosition(hilf);
      ziel = new THREE.Vector3(hilf.x, HAND_HOEHE, hilf.z);
    }
    const pol = new THREE.Vector3(s === 'L' ? 0.35 : -0.35, 0.15, -1);
    loeseArm(figur, s, ziel, pol, ctx.fingerZurueck);
  }
  figur.wurzel.updateMatrixWorld(true);
}

const leererRahmen = () => ({ min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
function erweitere(rahmen, box) {
  for (let k = 0; k < 3; k++) { rahmen.min[k] = Math.min(rahmen.min[k], box.min[k]); rahmen.max[k] = Math.max(rahmen.max[k], box.max[k]); }
}

// Bereitet eine Animation für eine Figur vor: Spiegelung, Stützpunkte, Stuhl,
// Wand und den Bildausschnitt über den ganzen Ablauf.
export function erstelleRig(animation, { seite = null, farbe = farben() } = {}) {
  const figur = baueFigur(farbe);
  const links = seite === 'links';
  const posen = animation.posen.map((p) => (links ? spiegeln3d(p) : vollePose3d(p)));
  const anim = { ...animation, posen };
  const stuetzen = links ? spiegelnStuetzen(animation.stuetzen) : { ...(animation.stuetzen || {}) };
  const ctx = {
    stuetzen,
    haende: ['handL', 'handR'].filter((h) => stuetzen[h]),
    festeZiele: {},
    fingerZurueck: Boolean(animation.fingerZurueck),
    festesBecken: null,
  };

  // Erste Pose ohne Stützen stellen: Daraus ergeben sich feste Handpunkte und die Sitzhöhe.
  stelle(figur, pose3dZurZeit(anim, 0), { ...ctx, haende: [] });
  for (const h of ctx.haende) {
    figur.gelenke[h].getWorldPosition(hilf);
    ctx.festeZiele[h] = [hilf.x, HAND_HOEHE, hilf.z];
  }
  let requisit = null;
  if (animation.requisit === 'stuhl') {
    const b = figur.gelenke.becken.getWorldPosition(new THREE.Vector3());
    ctx.festesBecken = b.y;
    const versatz = (animation.stuhlX || 0) * (links ? -1 : 1);
    requisit = { art: 'stuhl', x: b.x + versatz, y: b.y - SITZ_UNTER_BECKEN, z: b.z };
  }

  const dauer = dauer3d(anim);
  const bildZeit = bildZeit3d(anim);
  const rahmen = leererRahmen();
  for (let k = 0; k <= 24; k++) {
    stelle(figur, pose3dZurZeit(anim, (dauer * k) / 24), ctx);
    erweitere(rahmen, vermiss(figur).box);
  }
  stelle(figur, pose3dZurZeit(anim, bildZeit), ctx);
  erweitere(rahmen, vermiss(figur).box);

  if (animation.requisit === 'wand') {
    const z = Math.max(figur.gelenke.handL.getWorldPosition(new THREE.Vector3()).z, figur.gelenke.handR.getWorldPosition(new THREE.Vector3()).z);
    requisit = { art: 'wand', x: (rahmen.min[0] + rahmen.max[0]) / 2, z: z + 0.04 };
  }
  if (requisit?.art === 'stuhl') {
    erweitere(rahmen, { min: [requisit.x - 0.24, 0, requisit.z - 0.3], max: [requisit.x + 0.24, requisit.y + 0.5, requisit.z + 0.26] });
  }
  rahmen.min[1] = 0;
  const mitte = new THREE.Vector3(...[0, 1, 2].map((i) => (rahmen.min[i] + rahmen.max[i]) / 2));
  const radius = Math.max(0.55, Math.hypot(...[0, 1, 2].map((i) => rahmen.max[i] - rahmen.min[i])) / 2);

  return {
    figur, anim, ctx, requisit, mitte, radius, bildZeit, dauer, links,
    stelle(t) { stelle(figur, pose3dZurZeit(anim, t), ctx); },
    // Für Prüfungen: alle Messpunkte und abgestützten Hände zu einem Zeitpunkt.
    messe(t) {
      stelle(figur, pose3dZurZeit(anim, t), ctx);
      const punkte = figur.tasten.map(({ o, r, arm }) => {
        o.getWorldPosition(hilf);
        return { x: hilf.x, y: hilf.y - r, z: hilf.z, arm };
      });
      const haende = {};
      for (const h of ctx.haende) {
        const ist = figur.gelenke[h].getWorldPosition(new THREE.Vector3());
        const ziel = ctx.stuetzen[h] === 'fest' ? new THREE.Vector3(...ctx.festeZiele[h]) : new THREE.Vector3(ist.x, HAND_HOEHE, ist.z);
        haende[h] = { ist: ist.toArray(), ziel: ziel.toArray(), abstand: ist.distanceTo(ziel) };
      }
      return { punkte, haende, becken: figur.gelenke.becken.getWorldPosition(new THREE.Vector3()).toArray() };
    },
  };
}

// ---------- Szene ----------

function baueSzene(f, rig) {
  const szene = new THREE.Scene();
  szene.add(new THREE.HemisphereLight(0xffffff, 0x9a9f9c, 1.7));
  const sonne = new THREE.DirectionalLight(0xfff4e8, 1.6);
  sonne.castShadow = true;
  sonne.shadow.mapSize.set(1024, 1024);
  Object.assign(sonne.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 10 });
  sonne.shadow.radius = 5;
  sonne.shadow.bias = -0.0015;
  szene.add(sonne);
  const fuell = new THREE.DirectionalLight(0xdfeaff, 0.45);
  szene.add(fuell);
  const boden = new THREE.Mesh(new THREE.CircleGeometry(1.6, 64), new THREE.MeshStandardMaterial({ color: f.boden, roughness: 1 }));
  boden.rotation.x = -Math.PI / 2;
  boden.receiveShadow = true;
  szene.add(boden);

  const { mitte } = rig;
  boden.position.set(mitte.x, 0, mitte.z);
  sonne.target.position.copy(mitte);
  szene.add(sonne.target);
  sonne.position.set(mitte.x + 1.4, 3.6, mitte.z + 2.4);
  fuell.position.set(mitte.x - 2.5, 1.5, mitte.z - 1);
  szene.add(rig.figur.wurzel);
  if (rig.requisit) szene.add(baueRequisit(rig.requisit, f));
  return szene;
}

function baueRequisit(r, f) {
  const g = new THREE.Group();
  if (r.art === 'stuhl') {
    const mat = new THREE.MeshStandardMaterial({ color: f.requisit, roughness: 0.85 });
    const kasten = (b, h, t, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(b, h, t), mat);
      m.position.set(r.x + x, y, r.z + z); m.castShadow = true; m.receiveShadow = true; g.add(m);
    };
    kasten(0.44, 0.035, 0.42, 0, r.y - 0.018, 0.02);
    kasten(0.42, 0.24, 0.03, 0, r.y + 0.32, -0.2);
    for (const x of [-0.2, 0.2]) kasten(0.03, 0.5, 0.03, x, r.y + 0.25, -0.2);
    for (const [x, z] of [[-0.19, -0.17], [0.19, -0.17], [-0.19, 0.21], [0.19, 0.21]]) kasten(0.032, r.y - 0.03, 0.032, x, (r.y - 0.03) / 2, z);
  } else if (r.art === 'wand') {
    const mat = new THREE.MeshStandardMaterial({ color: f.requisit, roughness: 0.95, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.1, 0.04), mat);
    m.position.set(r.x, 1.05, r.z + 0.02);
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}

function entsorge(szene) {
  szene.traverse((o) => {
    o.geometry?.dispose?.();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    if (o.isLight) o.shadow?.map?.dispose?.();
  });
}

function stelleKamera(kamera, rig, azimut, hoehe) {
  const abstand = (rig.radius / Math.sin((kamera.fov * G) / 2)) * (kamera.aspect < 1 ? 1 / kamera.aspect : 1) * 1.02;
  const { mitte } = rig;
  kamera.position.set(
    mitte.x + abstand * Math.sin(azimut) * Math.cos(hoehe),
    mitte.y + abstand * Math.sin(hoehe),
    mitte.z + abstand * Math.cos(azimut) * Math.cos(hoehe));
  kamera.lookAt(mitte);
}
const startAzimut = (animation, links) => (animation.kamera?.[0] ?? 35) * G * (links ? -1 : 1);
const startHoehe = (animation) => (animation.kamera?.[1] ?? 12) * G;

let webgl = null;
// Prüft einmal, ob der Browser WebGL kann.
export function hat3d() {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement('canvas');
    webgl = Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    webgl = false;
  }
  return webgl;
}

// ---------- Standbilder für Listen ----------
// Browser erlauben nur wenige 3D-Flächen gleichzeitig. Listen zeigen deshalb
// Standbilder, die ein einziger, geteilter Renderer nacheinander zeichnet.

let atelier = null;
const bilder = new Map();

export function standbild3d(schluessel, animation, { seite = null, breite = 360, hoehe = 306 } = {}) {
  const key = `${schluessel}|${seite || ''}|${dunkel() ? 'd' : 'h'}|${breite}x${hoehe}`;
  if (bilder.has(key)) return bilder.get(key);
  if (!atelier) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    atelier = { renderer, kamera: new THREE.PerspectiveCamera(28, 1, 0.1, 30) };
  }
  const { renderer, kamera } = atelier;
  const f = farben();
  const rig = erstelleRig(animation, { seite, farbe: f });
  const szene = baueSzene(f, rig);
  rig.stelle(rig.bildZeit);
  renderer.setSize(breite, hoehe, false);
  kamera.aspect = breite / hoehe;
  kamera.updateProjectionMatrix();
  stelleKamera(kamera, rig, startAzimut(animation, rig.links), startHoehe(animation));
  renderer.render(szene, kamera);
  let url = renderer.domElement.toDataURL('image/webp', 0.9);
  if (!url.startsWith('data:image/webp')) url = renderer.domElement.toDataURL('image/png');
  entsorge(szene);
  bilder.set(key, url);
  return url;
}

// ---------- Animierte Figur ----------

// Zeichnet die Figur in `el` und animiert sie. Liefert { stop() }.
export function mountFigure3d(el, animation, { seite = null, standbild = false } = {}) {
  const f = farben();
  const rig = erstelleRig(animation, { seite, farbe: f });
  const szene = baueSzene(f, rig);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const leinwand = renderer.domElement;
  leinwand.className = 'figur3d';
  leinwand.setAttribute('aria-hidden', 'true');
  el.replaceChildren(leinwand);

  const kamera = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
  let azimut = startAzimut(animation, rig.links);
  let hoehe = startHoehe(animation);
  const passeGroesse = () => {
    const b = el.clientWidth || 240; const h = el.clientHeight || 204;
    renderer.setSize(b, h, false);
    kamera.aspect = b / h;
    kamera.updateProjectionMatrix();
    stelleKamera(kamera, rig, azimut, hoehe);
  };

  const ruhig = standbild || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const zeichne = (t) => {
    rig.stelle(t);
    renderer.render(szene, kamera);
  };

  // Drehen mit Finger oder Maus.
  let zieh = null;
  let letzteZeit = rig.bildZeit;
  const runter = (e) => { zieh = { x: e.clientX, y: e.clientY, az: azimut, ho: hoehe }; leinwand.setPointerCapture?.(e.pointerId); };
  const beweg = (e) => {
    if (!zieh) return;
    azimut = zieh.az - (e.clientX - zieh.x) * 0.01;
    hoehe = Math.min(1.2, Math.max(-0.05, zieh.ho + (e.clientY - zieh.y) * 0.006));
    stelleKamera(kamera, rig, azimut, hoehe);
    if (ruhig) zeichne(letzteZeit);
  };
  const hoch = () => { zieh = null; };
  leinwand.addEventListener('pointerdown', runter);
  leinwand.addEventListener('pointermove', beweg);
  leinwand.addEventListener('pointerup', hoch);
  leinwand.addEventListener('pointercancel', hoch);

  let raf = 0; let gestoppt = false; let start = null; let sichtbar = true;
  const bild = (jetzt) => {
    raf = 0;
    if (gestoppt || !el.isConnected) return;
    if (start === null) start = jetzt;
    letzteZeit = (jetzt - start) / 1000;
    zeichne(letzteZeit);
    if (sichtbar) raf = requestAnimationFrame(bild);
  };
  const beobachter = new ResizeObserver(() => { passeGroesse(); if (ruhig || !raf) zeichne(letzteZeit); });
  beobachter.observe(el);
  let sicht = null;
  if (typeof IntersectionObserver === 'function') {
    sicht = new IntersectionObserver((e) => {
      sichtbar = e[e.length - 1].isIntersecting;
      if (sichtbar && !raf && !gestoppt && !ruhig) raf = requestAnimationFrame(bild);
    });
    sicht.observe(el);
  }
  passeGroesse();
  if (ruhig) zeichne(letzteZeit); else raf = requestAnimationFrame(bild);

  return {
    messe: (t) => rig.messe(t),
    setzeKamera(az, ho) { azimut = az * G; hoehe = ho * G; stelleKamera(kamera, rig, azimut, hoehe); zeichne(letzteZeit); },
    stop() {
      if (gestoppt) return;
      gestoppt = true;
      if (raf) cancelAnimationFrame(raf);
      beobachter.disconnect(); sicht?.disconnect();
      entsorge(szene);
      renderer.dispose();
      renderer.forceContextLoss?.();
    },
  };
}
