// 3D-Posen aller Übungen. Schlüssel = ID der Übung im Katalog.
// Wechselseitige Übungen sind für die rechte Seite gestellt (rechtes Bein vorn,
// rechter Arm arbeitet, gedehnt wird die rechte Seite); die linke entsteht durch Spiegeln.
// Winkel in Grad, Bedeutung siehe js/figure3d.js.
//
// Nicht angegeben werden, weil der Katalog sie liefert: modus (aus statisch/dynamisch),
// zyklus und requisit. Ausnahme: modus 'kreisen' für Kreisbewegungen.

const P = (vor, seit = 0, dreh = 0) => [vor, seit, dreh];
const beide = (k, v) => ({ [`${k}L`]: v, [`${k}R`]: v });
const gekippt = (kippen, extra = {}) => ({ becken: { pos: [0, 0], rot: [kippen, 0, 0] }, ...extra });

// ---------- Grundhaltungen ----------

const STAND = { ...beide('schulter', P(0, 7)), ...beide('ellbogen', 10), ...beide('hueft', P(0, 3)) };
// Sitz auf dem Stuhl: Oberschenkel waagrecht, Füße flach, Hände auf den Oberschenkeln.
const STUHL = { ...beide('hueft', P(88, 5)), ...beide('knie', 88), ...beide('schulter', P(25, 8)), ...beide('ellbogen', 55) };
// Vierfüßlerstand: Becken nach vorn gekippt, Arme und Oberschenkel senkrecht.
const VIERF = { ...gekippt(78), hals: P(-20), ...beide('schulter', P(78, 2)), ...beide('hueft', P(78, 3)), ...beide('knie', 90), ...beide('fuss', 80) };
// Fersensitz: Gesäß auf den Fersen, Fußrücken am Boden.
const FERSENSITZ = { ...beide('hueft', P(90, 6)), ...beide('knie', 172), ...beide('fuss', 92), ...beide('schulter', P(15, 8)), ...beide('ellbogen', 30) };
// Rückenlage mit gestreckten Beinen, Kopf in Richtung -Z.
const RL = { ...gekippt(-90), ...beide('schulter', P(0, 8)), ...beide('ellbogen', 5), ...beide('hueft', P(0, 3)), ...beide('fuss', 10) };
// Rückenlage mit aufgestellten Füßen.
const RLB = { ...RL, ...beide('hueft', P(45, 4)), ...beide('knie', 90), ...beide('fuss', 45) };
// Bauchlage, Kopf in Richtung +Z.
const BL = { ...gekippt(90), hals: P(-10), ...beide('hueft', P(0, 3)), ...beide('fuss', 75), ...beide('schulter', P(100, 25)), ...beide('ellbogen', 60) };
// Langsitz: Beine gestreckt nach vorn.
const LANGSITZ = { ...beide('hueft', P(90, 4)), ...beide('fuss', -5), ...beide('schulter', P(30, 10)), ...beide('ellbogen', 20) };
// Herabschauender Hund.
const HUND = { ...gekippt(135), hals: P(10), ...beide('hueft', P(90, 3)), ...beide('fuss', -25), ...beide('schulter', P(178, 8)) };

export const POSEN_3D = {
  // ===================== Stehend =====================
  nackenneigung: { kamera: [0, 6], posen: [STAND, { ...STAND, hals: P(0, -30) }] },
  'nacken-halbkreise': {
    kamera: [20, 5],
    posen: [{ ...STAND, hals: P(28, -28) }, { ...STAND, hals: P(38) }, { ...STAND, hals: P(28, 28) }],
  },
  'kinn-zur-brust': { kamera: [-60, 5], posen: [STAND, { ...STAND, hals: P(42), brust: P(4) }] },
  schulterkreisen: {
    modus: 'kreisen', kamera: [-55, 8],
    posen: [P(40, 70, 90), P(0, 95, 90), P(-40, 70, 90), P(0, 45, 90)].map((s) => ({ ...STAND, ...beide('schulter', s), ...beide('ellbogen', 150) })),
  },
  armkreisen: {
    modus: 'kreisen', kamera: [-75, 8], bildZeit: 1.3,
    posen: [0, 45, 90, 135, 180, 225, 270, 315].map((w) => ({ ...STAND, ...beide('schulter', P(w, 8)), ...beide('ellbogen', 5) })),
  },
  'schulterdehnung-quer': {
    kamera: [25, 10],
    posen: [STAND, { ...STAND, schulterR: P(92, -50), ellbogenR: 5, schulterL: P(45, -15), ellbogenL: 110 }],
  },
  trizepsdehnung: {
    kamera: [-35, 10],
    posen: [STAND, { ...STAND, schulterR: P(165, 15), ellbogenR: 145, schulterL: P(140, -30), ellbogenL: 95, hals: P(-5) }],
  },
  'brustoeffner-stehend': {
    kamera: [-70, 8],
    posen: [STAND, { ...STAND, ...beide('schulter', P(-45, -6)), ...beide('ellbogen', 5), brust: P(-8), hals: P(-10) }],
  },
  'umarmen-oeffnen': {
    kamera: [25, 10],
    posen: [
      { ...STAND, ...beide('schulter', P(-10, 88)), ...beide('ellbogen', 10), brust: P(-6), hals: P(-5) },
      { ...STAND, ...beide('schulter', P(90, -35)), ...beide('ellbogen', 45), brust: P(14), hals: P(15) },
    ],
  },
  'seitbeuge-stehend': {
    kamera: [20, 8],
    posen: [STAND, {
      ...STAND, becken: { pos: [-0.05, 0], rot: [0, 0, 0] },
      lende: P(0, 14), brust: P(0, 20), hals: P(0, 12),
      schulterR: P(0, 172), ellbogenR: 12, schulterL: P(0, 10), ellbogenL: 5,
    }],
  },
  'rumpfrotation-stehend': {
    kamera: [20, 10],
    posen: [
      { ...STAND, lende: P(0, 0, 15), brust: P(0, 0, 30), hals: P(0, 0, 15), schulterR: P(75, -25), ellbogenR: 35, schulterL: P(-15, 30), ellbogenL: 70 },
      { ...STAND, lende: P(0, 0, -15), brust: P(0, 0, -30), hals: P(0, 0, -15), schulterL: P(75, -25), ellbogenL: 35, schulterR: P(-15, 30), ellbogenR: 70 },
    ],
  },
  hueftkreisen: {
    // Das Becken zieht einen Kreis, die Füße bleiben stehen, der Oberkörper gleicht aus.
    modus: 'kreisen', kamera: [30, 12],
    posen: [
      { becken: { pos: [0.06, 0], rot: [0, 0, 0] }, hueftL: P(0, -1), hueftR: P(0, 7), lende: P(0, -6), brust: P(0, -4) },
      { becken: { pos: [0, 0.06], rot: [0, 0, 0] }, ...beide('hueft', P(-4, 3)), ...beide('fuss', -4), lende: P(-6), brust: P(-4) },
      { becken: { pos: [-0.06, 0], rot: [0, 0, 0] }, hueftL: P(0, 7), hueftR: P(0, -1), lende: P(0, 6), brust: P(0, 4) },
      { becken: { pos: [0, -0.06], rot: [0, 0, 0] }, ...beide('hueft', P(4, 3)), ...beide('fuss', 4), lende: P(6), brust: P(4) },
    ].map((p) => ({ ...beide('schulter', P(-15, 35)), ...beide('ellbogen', 95), ...p })),
  },
  'beinpendel-vor-zurueck': {
    kamera: [-80, 6],
    posen: [
      { ...STAND, hueftR: P(50), knieR: 12, fussR: -10, schulterL: P(35, 8), schulterR: P(-25, 8) },
      { ...STAND, hueftR: P(-30), knieR: 8, fussR: 20, schulterL: P(-25, 8), schulterR: P(35, 8) },
    ],
  },
  'beinpendel-seitlich': {
    kamera: [0, 6],
    posen: [
      { ...STAND, hueftR: P(6, 38), ...beide('schulter', P(0, 45)), lende: P(0, 6) },
      { ...STAND, hueftR: P(12, -22), ...beide('schulter', P(0, 45)), lende: P(0, -2) },
    ],
  },
  'vorbeuge-stehend': {
    kamera: [-75, 10],
    posen: [STAND, {
      ...gekippt(90), ...beide('hueft', P(90, 3)), ...beide('knie', 10), ...beide('fuss', -10),
      lende: P(20), brust: P(25), hals: P(25), ...beide('schulter', P(105, 6)), ...beide('ellbogen', 35),
    }],
  },
  'wirbelsaeule-abrollen': {
    kamera: [-75, 8],
    posen: [
      STAND,
      { ...STAND, hals: P(40), brust: P(30), lende: P(10), ...beide('schulter', P(35, 6)) },
      {
        ...gekippt(80), ...beide('hueft', P(85, 3)), ...beide('knie', 18), ...beide('fuss', -10),
        lende: P(25), brust: P(30), hals: P(30), ...beide('schulter', P(115, 6)), ...beide('ellbogen', 20),
      },
    ],
  },
  'oberschenkeldehnung-stehend': {
    kamera: [-80, 8],
    posen: [STAND, { ...STAND, hueftR: P(-8), knieR: 150, fussR: 40, schulterR: P(-40, 6), ellbogenR: 25, schulterL: P(15, 40), ellbogenL: 10 }],
  },
  'wadendehnung-wand': {
    kamera: [-90, 8],
    posen: [
      { ...STAND, ...beide('schulter', P(80, 8)), ...beide('ellbogen', 30) },
      {
        ...gekippt(12), ...beide('schulter', P(80, 8)), ...beide('ellbogen', 30), hals: P(-5),
        hueftR: P(-13, 4), fussR: -25, hueftL: P(45, 4), knieL: 25, fussL: 8,
      },
    ],
  },
  fersenheben: { kamera: [-70, 5], posen: [STAND, { ...STAND, ...beide('fuss', 35) }] },
  'tiefe-hocke': {
    kamera: [35, 12],
    posen: [STAND, {
      ...gekippt(25), lende: P(10), hals: P(-10), ...beide('hueft', P(125, 22, 15)), ...beide('knie', 140), ...beide('fuss', -38),
      ...beide('schulter', P(60, -12)), ...beide('ellbogen', 80),
    }],
  },
  kosakenhocke: {
    kamera: [0, 10],
    posen: [
      {
        becken: { pos: [-0.3, 0], rot: [30, 0, 0] }, lende: P(5),
        hueftR: P(84, 13), knieR: 111, fussR: -45, hueftL: P(30, 56), fussL: -60,
        ...beide('schulter', P(70, -10)), ...beide('ellbogen', 70),
      },
      { ...gekippt(15), ...beide('hueft', P(15, 29)), ...beide('schulter', P(50, -5)), ...beide('ellbogen', 60) },
      {
        becken: { pos: [0.3, 0], rot: [30, 0, 0] }, lende: P(5),
        hueftL: P(84, 13), knieL: 111, fussL: -45, hueftR: P(30, 56), fussR: -60,
        ...beide('schulter', P(70, -10)), ...beide('ellbogen', 70),
      },
    ],
  },
  'handgelenk-dehnung': {
    kamera: [-60, 8],
    posen: [STAND, { ...STAND, schulterR: P(90), ellbogenR: 0, handgelenkR: 70, schulterL: P(70, -25), ellbogenL: 50 }],
  },
  handgelenkkreisen: {
    kamera: [-50, 8],
    posen: [50, -50].map((w) => ({ ...STAND, ...beide('schulter', P(10, 8)), ...beide('ellbogen', 90), ...beide('handgelenk', w) })),
  },
  'knie-zur-brust-stehend': {
    kamera: [-70, 8],
    posen: [STAND, { ...STAND, hueftR: P(125), knieR: 125, fussR: 20, ...beide('schulter', P(30, -8)), ...beide('ellbogen', 25) }],
  },
  hueftbeuge: {
    kamera: [-80, 8],
    posen: [
      { ...STAND, ...beide('schulter', P(30, -35)), ...beide('ellbogen', 125) },
      { ...gekippt(70), hals: P(-15), ...beide('hueft', P(72, 3)), ...beide('knie', 15), ...beide('fuss', -13), ...beide('schulter', P(30, -35)), ...beide('ellbogen', 125) },
    ],
  },

  // ===================== Sitzend (Stuhl) =====================
  'sitz-figur-4': {
    kamera: [-30, 15],
    posen: [STUHL, { ...STUHL, ...gekippt(5), hueftL: P(93, 5), hueftR: P(115, 12, 25), knieR: 100, fussR: 10 }, {
      ...STUHL, ...gekippt(25), hueftL: P(115, 5), hueftR: P(105, 30, 60), knieR: 100, fussR: 20,
      brust: P(5), hals: P(-5), ...beide('schulter', P(45, 5)), ...beide('ellbogen', 40),
    }],
  },
  'sitz-vorbeuge': {
    kamera: [-70, 10],
    posen: [STUHL, { ...STUHL, ...gekippt(35), ...beide('hueft', P(125, 8)), lende: P(20), brust: P(20), hals: P(30), ...beide('schulter', P(70, 6)), ...beide('ellbogen', 10) }],
  },
  'sitz-drehung': {
    kamera: [20, 15],
    posen: [STUHL, { ...STUHL, lende: P(0, 0, -15), brust: P(0, 0, -30), hals: P(0, 0, -20), schulterR: P(-30, 25), ellbogenR: 30, schulterL: P(40, -35), ellbogenL: 30 }],
  },
  'sitz-seitbeuge': {
    kamera: [0, 10],
    posen: [STUHL, { ...STUHL, lende: P(0, 10), brust: P(0, 18), hals: P(0, 10), schulterR: P(0, 168), ellbogenR: 10, schulterL: P(0, 22), ellbogenL: 10 }],
  },
  'sitz-katze-kuh': {
    kamera: [-80, 8],
    posen: [
      { ...STUHL, ...gekippt(-10), ...beide('hueft', P(78, 5)), lende: P(15), brust: P(25), hals: P(30), ...beide('schulter', P(50, 5)), ...beide('ellbogen', 15) },
      { ...STUHL, ...gekippt(10), ...beide('hueft', P(98, 5)), lende: P(-10), brust: P(-15), hals: P(-15), ...beide('schulter', P(40, 5)), ...beide('ellbogen', 10) },
    ],
  },
  'sitz-brustoeffner': {
    kamera: [35, 12],
    posen: [STUHL, { ...STUHL, lende: P(-5), brust: P(-14), hals: P(-10), ...beide('schulter', P(-25, 110, 90)), ...beide('ellbogen', 125) }],
  },
  'sitz-beinstrecker': {
    kamera: [-75, 10],
    posen: [STUHL, { ...STUHL, ...gekippt(15), hueftL: P(105, 5), hueftR: P(110, 3), knieR: 45, fussR: -10 }, {
      ...STUHL, ...gekippt(30), hueftL: P(120, 5), hueftR: P(92, 3), knieR: 0, fussR: -20,
      lende: P(5), brust: P(5), hals: P(10), ...beide('schulter', P(60, 5)), ...beide('ellbogen', 10),
    }],
  },
  'sitz-knie-zur-brust': {
    kamera: [-70, 8],
    posen: [STUHL, { ...STUHL, ...gekippt(-5), hueftL: P(83, 5), hueftR: P(128), knieR: 125, fussR: 15, ...beide('schulter', P(28, -8)), ...beide('ellbogen', 30) }],
  },
  'sitz-hueftbeuger': {
    // Seitlich auf der Stuhlkante: Der Stuhl steht etwas nach links versetzt, damit das rechte Bein frei ist.
    kamera: [-85, 10], stuhlX: 0.15,
    posen: [STUHL, { ...STUHL, hueftR: P(105, 50), knieR: 110, fussR: -20 }, { ...STUHL, hueftR: P(30, 62), knieR: 125, fussR: -20 }, { ...STUHL, ...gekippt(-5), hueftL: P(83, 5), hueftR: P(-40, 6), knieR: 55, fussR: 70, lende: P(-5), brust: P(-5), schulterR: P(20, 8), ellbogenR: 40 }],
  },
  'sitz-fusswippen': {
    kamera: [-75, 8],
    posen: [-25, 40].map((w) => ({ ...STUHL, hueftR: P(88, 3), knieR: 5, fussR: w })),
  },
  'sitz-rudern': {
    kamera: [-70, 10],
    posen: [
      { ...STUHL, ...beide('schulter', P(88, 5)), ...beide('ellbogen', 0), brust: P(10), hals: P(10) },
      { ...STUHL, ...beide('schulter', P(-25, 15)), ...beide('ellbogen', 100), brust: P(-10), hals: P(-5) },
    ],
  },
  'sitz-nacken-diagonal': {
    kamera: [25, 12],
    posen: [STUHL, { ...STUHL, hals: P(30, 0, -35), schulterR: P(130, 30), ellbogenR: 125, schulterL: P(10, 15), ellbogenL: 5 }],
  },
  'sitz-gebetshaltung': {
    kamera: [25, 10],
    posen: [STUHL, { ...STUHL, ...beide('schulter', P(30, 40, -60)), ...beide('ellbogen', 100) }],
  },
  'sitz-armstrecken': {
    kamera: [10, 10],
    posen: [
      { ...STUHL, schulterR: P(175, 10), ellbogenR: 5, lende: P(0, 3), brust: P(0, 4) },
      { ...STUHL, schulterL: P(175, 10), ellbogenL: 5, lende: P(0, -3), brust: P(0, -4) },
    ],
  },

  // ===================== Am Boden =====================
  'katze-kuh': {
    kamera: [-80, 10], stuetzen: { handL: 'fest', handR: 'fest' },
    posen: [
      { ...VIERF, ...gekippt(65), ...beide('hueft', P(65, 3)), lende: P(12), brust: P(13), hals: P(30) },
      { ...VIERF, ...gekippt(100), ...beide('hueft', P(100, 3)), lende: P(-5), brust: P(-5), hals: P(-35) },
    ],
  },
  kindhaltung: {
    kamera: [-75, 12], stuetzen: { handL: 'boden', handR: 'boden' },
    posen: [VIERF, {
      ...FERSENSITZ, ...gekippt(55), ...beide('hueft', P(145, 8)), lende: P(20), brust: P(20), hals: P(15),
      ...beide('schulter', P(175, 12)), ...beide('ellbogen', 0),
    }],
  },
  kobra: {
    kamera: [-75, 10], stuetzen: { handL: 'boden', handR: 'boden' },
    posen: [BL, { ...BL, lende: P(-25), brust: P(-25), hals: P(-20), ...beide('schulter', P(60, 15)), ...beide('ellbogen', 10) }],
  },
  'herabschauender-hund': { kamera: [-85, 10], stuetzen: { handL: 'boden', handR: 'boden' }, posen: [VIERF, HUND] },
  'hund-kobra-fluss': {
    kamera: [-85, 10], stuetzen: { handL: 'fest', handR: 'fest' },
    posen: [HUND, {
      becken: { pos: [0, 0.24], rot: [75, 0, 0] }, ...beide('hueft', P(-5, 3)), ...beide('fuss', 80),
      lende: P(-20), brust: P(-25), hals: P(-20), ...beide('schulter', P(60, 8)),
    }],
  },
  'tiefer-ausfallschritt': {
    kamera: [-80, 10],
    posen: [
      { hueftR: P(90, 5), knieR: 90, hueftL: P(0, 5), knieL: 90, fussL: 90, ...beide('schulter', P(40, 5)), ...beide('ellbogen', 30) },
      {
        becken: { pos: [0, 0.276], rot: [0, 0, 0] }, hueftR: P(94, 5), knieR: 129, fussR: -35, hueftL: P(-40, 5), knieL: 50, fussL: 90,
        lende: P(-5), brust: P(-5), ...beide('schulter', P(175, 10)), ...beide('ellbogen', 5),
      },
    ],
  },
  'weltbeste-dehnung': {
    kamera: [-55, 15], stuetzen: { handL: 'fest' },
    posen: [
      { ...gekippt(75), hueftR: P(165, 8), knieR: 120, fussR: -30, hueftL: P(9, 4), lende: P(10), brust: P(5), hals: P(-15), schulterL: P(90), schulterR: P(70, -5), ellbogenR: 60 },
      { ...gekippt(75), hueftR: P(165, 8), knieR: 120, fussR: -30, hueftL: P(9, 4), lende: P(10, 0, -15), brust: P(5, 0, -45), hals: P(0, 0, -40), schulterL: P(90), schulterR: P(10, 100) },
    ],
  },
  taube: {
    kamera: [-55, 16], stuetzen: { handL: 'fest', handR: 'fest' },
    posen: [{
      ...gekippt(85), lende: P(10), brust: P(10), hals: P(10),
      hueftR: P(172, 8, 75), knieR: 110, fussR: 40, hueftL: P(-5), fussL: 85, ...beide('schulter', P(90, 12)),
    }, {
      ...gekippt(60), lende: P(-5), brust: P(0), hals: P(-20),
      hueftR: P(147, 8, 75), knieR: 110, fussR: 40, hueftL: P(-30), fussL: 85,
      ...beide('schulter', P(40, 12)),
    }],
  },
  'figur-4-liegend': {
    kamera: [-60, 25],
    posen: [RLB, {
      ...RL, hueftL: P(95, 3), knieL: 90, fussL: 30, hueftR: P(90, 30, 55), knieR: 100, fussR: 10,
      ...beide('schulter', P(75)), ...beide('ellbogen', 60),
    }],
  },
  'knie-zur-brust-liegend': {
    kamera: [-65, 20],
    posen: [RL, { ...RL, hueftR: P(125), knieR: 130, fussR: 20, hals: P(15), ...beide('schulter', P(50, -8)), ...beide('ellbogen', 20) }],
  },
  'glueckliches-baby': {
    kamera: [-35, 30],
    posen: [RLB, { ...RL, ...beide('hueft', P(150, 45)), ...beide('knie', 60), ...beide('fuss', 0), ...beide('schulter', P(70, 25)), ...beide('ellbogen', 20) }],
  },
  schulterbruecke: {
    kamera: [-80, 12], stuetzen: { handL: 'boden', handR: 'boden' },
    posen: [
      { ...RLB, ...beide('schulter', P(-10, 10)) },
      { ...gekippt(-120), ...beide('hueft', P(-25, 4)), ...beide('knie', 112), ...beide('fuss', -17), brust: P(25), hals: P(20), ...beide('schulter', P(-55, 10)) },
    ],
  },
  schmetterling: {
    kamera: [15, 18],
    posen: [25, 55].map((seit) => ({
      ...beide('hueft', P(85, seit, seit === 25 ? 35 : 50)), ...beide('knie', 120), ...beide('fuss', 30),
      ...beide('schulter', P(40, -5)), ...beide('ellbogen', 30), lende: P(-3),
    })),
  },
  'langsitz-vorbeuge': {
    kamera: [-70, 15], stuetzen: { handL: 'boden', handR: 'boden' },
    posen: [{ ...LANGSITZ, ...gekippt(15), lende: P(10), ...beide('hueft', P(105, 4)), ...beide('schulter', P(20, 12)) }, { ...LANGSITZ, ...gekippt(35), ...beide('hueft', P(125, 4)), lende: P(20), brust: P(15), hals: P(25), ...beide('schulter', P(90, 12)) }],
  },
  drehsitz: {
    kamera: [-50, 22],
    posen: [
      { ...LANGSITZ, ...gekippt(-15), ...beide('hueft', P(75, 4)), schulterR: P(-35, 20), ellbogenR: 0 },
      {
        ...LANGSITZ, ...gekippt(-15), hueftL: P(75, 4), hueftR: P(105, -15), knieR: 120, fussR: 0, lende: P(0, 0, -15), brust: P(0, 0, -35), hals: P(0, 0, -30),
        schulterL: P(60, -45), ellbogenL: 100, schulterR: P(-35, 20), ellbogenR: 0,
      },
    ],
  },
  'faden-durchs-nadeloehr': {
    kamera: [-35, 20], stuetzen: { handL: 'fest', handR: 'boden' },
    posen: [VIERF, { ...VIERF, lende: P(0, 0, 15), brust: P(50, 0, 45), hals: P(5, 0, 30), schulterR: P(95, -70), ellbogenR: 0 }],
  },
  'brustwirbel-rotation': {
    kamera: [-50, 18], stuetzen: { handL: 'fest' },
    posen: [
      { ...VIERF, brust: P(4), hals: P(-15), schulterR: P(0, 115, 90), ellbogenR: 135 },
      { ...VIERF, lende: P(0, 0, -12), brust: P(0, 0, -50), hals: P(-15, 0, -30), schulterR: P(0, 115, 90), ellbogenR: 135 },
    ],
  },
  welpenhaltung: {
    kamera: [-80, 12], stuetzen: { handL: 'boden', handR: 'boden' },
    posen: [VIERF, { ...VIERF, ...gekippt(120), ...beide('hueft', P(120, 3)), brust: P(10), hals: P(-20), ...beide('schulter', P(178, 10)), ...beide('ellbogen', 0) }],
  },
  'halber-spagat': {
    kamera: [-80, 12], stuetzen: { handL: 'boden', handR: 'boden' },
    posen: [
      { ...gekippt(55), hueftL: P(55, 4), knieL: 90, fussL: 90, hueftR: P(115, 4), fussR: -20, lende: P(25), brust: P(25), hals: P(10), ...beide('schulter', P(100, 10)) },
      {
        ...gekippt(65), hueftL: P(65, 4), knieL: 90, fussL: 90, hueftR: P(125, 4), fussR: -20,
        lende: P(30), brust: P(25), hals: P(20), ...beide('schulter', P(115, 8)),
      },
    ],
  },
  'kniende-oberschenkeldehnung': {
    kamera: [-80, 10],
    posen: [
      { hueftL: P(90, 5), knieL: 90, hueftR: P(-10, 5), knieR: 80, fussR: 90, ...beide('schulter', P(40, 5)), ...beide('ellbogen', 30) },
      { hueftL: P(90, 5), knieL: 90, hueftR: P(-10, 5), knieR: 150, fussR: 30, lende: P(-5), schulterL: P(40, 5), ellbogenL: 30, schulterR: P(-45, 10), ellbogenR: 20 },
    ],
  },
  'beinheben-liegend': {
    kamera: [-80, 15],
    posen: [3, 85].map((w) => ({ ...RL, hueftL: P(45, 4), knieL: 90, fussL: 45, hueftR: P(w, 3), fussR: w > 45 ? 0 : 10 })),
  },
  'handgelenke-vierfuessler': {
    kamera: [-80, 15], stuetzen: { handL: 'fest', handR: 'fest' }, fingerZurueck: true,
    posen: [VIERF, { ...VIERF, becken: { pos: [0, -0.12], rot: [78, 0, 0] }, ...beide('hueft', P(62, 3)), ...beide('knie', 74) }],
  },
  'vierfuessler-wiegen': {
    kamera: [-85, 12], stuetzen: { handL: 'fest', handR: 'fest' },
    posen: [VIERF, {
      ...VIERF, becken: { pos: [0, -0.42], rot: [70, 0, 0] }, ...beide('hueft', P(150, 4)), ...beide('knie', 170), ...beide('fuss', 80),
      lende: P(5), brust: P(5), hals: P(-5),
    }],
  },
  'liegender-schmetterling': {
    kamera: [-30, 35],
    posen: [RLB, { ...RL, ...beide('hueft', P(45, 50, 40)), ...beide('knie', 110), ...beide('fuss', 20), ...beide('schulter', P(170, 15)), ...beide('ellbogen', 40) }],
  },
  'ausfallschritt-wiegen': {
    kamera: [-80, 12], stuetzen: { handL: 'fest', handR: 'fest' },
    posen: [
      {
        becken: { pos: [0, 0.25], rot: [60, 0, 0] }, hueftR: P(160, 5), knieR: 86, fussR: 15, hueftL: P(25, 5), knieL: 55, fussL: 90,
        lende: P(25), brust: P(15), hals: P(5), ...beide('schulter', P(95, 12)),
      },
      {
        ...gekippt(60), hueftL: P(60, 5), knieL: 90, fussL: 90, hueftR: P(126, 4), fussR: -20,
        lende: P(30), brust: P(20), hals: P(20), ...beide('schulter', P(110, 8)),
      },
    ],
  },
};
