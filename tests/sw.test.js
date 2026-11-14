import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const quelle = readFileSync(join(wurzel, 'sw.js'), 'utf8');
const gelistet = [...quelle.match(/const DATEIEN = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

function alle(ordner) {
  return readdirSync(join(wurzel, ordner)).flatMap((name) => {
    const rel = `${ordner}/${name}`;
    return statSync(join(wurzel, rel)).isDirectory() ? alle(rel) : [rel];
  });
}

test('jede gelistete Datei existiert', () => {
  for (const d of gelistet.filter((x) => x !== './')) assert.ok(existsSync(join(wurzel, d)), d);
});

test('jede App-Datei steht in der Cache-Liste', () => {
  const noetig = ['index.html', 'styles.css', 'manifest.webmanifest', ...alle('js'), ...alle('icons')];
  for (const d of noetig) assert.ok(gelistet.includes(d), `${d} fehlt in sw.js`);
  assert.ok(gelistet.includes('./'));
});

test('Manifest verweist auf vorhandene Icons und nutzt relative Pfade', () => {
  const m = JSON.parse(readFileSync(join(wurzel, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.start_url, './');
  assert.equal(m.display, 'standalone');
  for (const i of m.icons) {
    assert.ok(!i.src.startsWith('/'));
    assert.ok(existsSync(join(wurzel, i.src)), i.src);
  }
});
