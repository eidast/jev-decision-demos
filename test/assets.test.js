import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

test('copied portraits match the documented source hashes', () => {
  const manifest = readFileSync(new URL('../THIRD_PARTY_ASSETS.md', import.meta.url), 'utf8');
  const rows = [...manifest.matchAll(/\| `([a-z]+_passenger\.svg)` \| `([a-f0-9]{64})` \|/g)];
  assert.equal(rows.length, 15);
  for (const [, file, expected] of rows) {
    const source = readFileSync(new URL(`../public/assets/moral-machine/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(source).digest('hex'), expected, file);
    assert.equal(/<script\b|\bonload\s*=|\bhref\s*=\s*["']https?:/i.test(source.toString()), false, file);
  }
});
