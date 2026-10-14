import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CRYPTO_SLAB_WINDOWS,
  slabPart,
  railU,
  cryptoRailSpec,
  coinTopPx,
  coinSafeTopPx,
} from '../lib/crypto-slabs.ts';
import { flowState } from '../lib/caption-flow.ts';
import { uniqueLocalFrames } from '../lib/frame-sequence/sources.ts';

const W = CRYPTO_SLAB_WINDOWS;
const COUNTS = { intro: 4, teach: 4, close: 2 };

test('slab windows are ordered and separate', () => {
  assert.ok(W.intro.outTo <= W.teach.inFrom);
  assert.ok(W.teach.outTo <= W.close.inFrom);
  for (const w of Object.values(W)) assert.ok(w.inFrom < w.inTo && w.inTo <= w.outFrom && w.outFrom < w.outTo);
});

function allAt(id, s, check) {
  for (let j = 0; j < COUNTS[id]; j++) check(slabPart(s, W[id], j, COUNTS[id]), j);
}

test('fully shown at the stops', () => {
  const shown = (o) => { assert.equal(o.opacity, 1); assert.equal(o.y, 0); };
  allAt('intro', 0, shown);
  allAt('intro', 1, shown);
  allAt('teach', 2, shown);
  allAt('close', 3, shown);
});

test('hidden where they should be', () => {
  const hidden = (o) => assert.equal(o.opacity, 0);
  for (const id of ['intro', 'teach', 'close']) allAt(id, -1, hidden);
  allAt('intro', 1.3, hidden);
  allAt('intro', 4, hidden);
  allAt('teach', 1, hidden);
  allAt('teach', 3, hidden);
  allAt('close', 2.5, hidden);
  allAt('close', 2, hidden);
  allAt('close', 3.28, hidden);
  allAt('close', 4, hidden);
});

test('continuity over s', () => {
  for (const id of ['intro', 'teach', 'close']) {
    for (let j = 0; j < COUNTS[id]; j++) {
      let prev = slabPart(-1, W[id], j, COUNTS[id]);
      let po = prev.opacity;
      let py = prev.y;
      for (let s = -1; s <= 4; s += 1e-4) {
        const o = slabPart(s, W[id], j, COUNTS[id]);
        assert.ok(Math.abs(o.opacity - po) < 0.01);
        assert.ok(Math.abs(o.y - py) < 0.1);
        po = o.opacity;
        py = o.y;
      }
    }
  }
  const s = (W.intro.inFrom + W.intro.inTo) / 2;
  assert.ok(slabPart(s, W.intro, 0, 4).opacity >= slabPart(s, W.intro, 3, 4).opacity);
});

test('reduced motion is discrete', () => {
  for (const id of ['intro', 'teach', 'close']) {
    const w = W[id];
    const a = (w.inFrom + w.inTo) / 2;
    const b = (w.outFrom + w.outTo) / 2;
    for (let s = -1; s <= 4; s += 0.01) {
      for (let j = 0; j < COUNTS[id]; j++) {
        const o = slabPart(s, w, j, COUNTS[id], true);
        assert.ok(o.opacity === 0 || o.opacity === 1);
        assert.equal(o.y, 0);
        if (s > a + 1e-9 && s < b - 1e-9) assert.equal(o.opacity, 1);
        if (s < a - 1e-9 || s > b + 1e-9) assert.equal(o.opacity, 0);
      }
    }
  }
});

test('close text only while the coin is low', () => {
  const U = uniqueLocalFrames();
  for (let s = 2; s <= 4; s += 0.001) {
    let any = false;
    for (let j = 0; j < 2; j++) if (slabPart(s, W.close, j, 2).opacity > 0) any = true;
    if (!any) continue;
    const list = s < 3 ? 110 + (s - 2) * 32 : 142 + (s - 3) * 49;
    for (const i of [Math.floor(list), Math.ceil(list)]) {
      const raw = U[i] + 1;
      assert.ok(raw >= 157 && raw <= 198, `s=${s} list=${list} raw=${raw}`);
    }
  }
});

test('coin clearance for the slab 3 text', () => {
  for (let w = 320; w <= 3840; w += 8) {
    for (let h = 320; h <= 1600; h += 8) {
      assert.ok(coinSafeTopPx(w, h) <= coinTopPx(w, h), `${w}x${h}`);
    }
  }
});

test('rail holds sit on the stops', () => {
  const spec = cryptoRailSpec();
  [0, 2, 3, 4].forEach((idx, k) => {
    const f = flowState(railU(k), spec);
    assert.equal(f.index, idx);
    assert.equal(f.draw, 0);
    assert.equal(f.advance, 0);
    assert.equal(f.enter, 1);
    assert.equal(f.exit, 0);
  });
  assert.equal(flowState(railU(3.4), spec).exit, 1);
  assert.ok(spec.from < spec.steps[0].start);
  for (let i = 1; i < spec.steps.length; i++) assert.ok(spec.steps[i].start > spec.steps[i - 1].end);
  assert.ok(spec.steps[4].end < spec.to);
});
