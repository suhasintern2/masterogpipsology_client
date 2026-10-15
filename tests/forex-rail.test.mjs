import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FOREX_CHAIN_STOPS, FOREX_S1_F, forexRailSpec, forexRailU, forexRailStopU, spreadEven,
} from '../lib/forex-rail.ts';
import { chainStopIndices, FOREX_STOPS_RAW, STOCK_STOPS_RAW } from '../lib/step-scroll.ts';
import { UNIQUE_LOCAL } from '../lib/frame-sequence/sources.ts';
import { flowState, spreadWindows } from '../lib/caption-flow.ts';

const spec = forexRailSpec();
const st = (u) => flowState(u, spec);

test('chain stops are locked to the raw picks', () => {
  assert.deepEqual([...FOREX_CHAIN_STOPS], chainStopIndices([FOREX_STOPS_RAW, STOCK_STOPS_RAW], UNIQUE_LOCAL));
  assert.deepEqual([UNIQUE_LOCAL[50] + 1, UNIQUE_LOCAL[88] + 1, UNIQUE_LOCAL[154] + 1, UNIQUE_LOCAL[25] + 1], [64, 111, 194, 32]);
  assert.equal(FOREX_S1_F, 217 / 575);
});

test('spec windows', () => {
  assert.equal(spec.steps.length, 15);
  spec.steps.forEach((w, i) => {
    assert.ok(w.start >= 0 && w.end <= 1);
    assert.ok(w.start < w.end);
    if (i < 14) assert.ok(w.end < spec.steps[i + 1].start);
  });
  assert.ok(Math.abs(spec.from - 0.04) < 1e-12);
  assert.ok(Math.abs(spec.to - 0.91327) < 1e-4);
});

test('stops are fully in place', () => {
  for (let k = 0; k <= 4; k++) {
    const s = st(forexRailU(k, k === 4 ? FOREX_S1_F : 0));
    assert.equal(s.index, k);
    assert.equal(s.draw, 0);
    assert.equal(s.advance, 0);
    assert.equal(s.enter, 1);
    assert.equal(s.exit, 0);
  }
});

test('captions change only between stops', () => {
  for (let k = 0; k < 4; k++) {
    for (let s = k; s < k + 0.9 - 1e-9; s += 0.01) assert.equal(st(forexRailU(s, 0)).index, k, `s=${s}`);
    assert.equal(st(forexRailU(k + 0.95, 0)).index, k + 1);
    assert.ok(st(forexRailU(k + 0.5, 0)).draw > 0);
  }
});

test('entry', () => {
  assert.equal(st(forexRailU(-1, 0)).enter, 0);
  assert.equal(st(forexRailU(-0.5, 0)).enter, 0);
  const e = st(forexRailU(-0.3, 0)).enter;
  assert.ok(e > 0 && e < 1);
});

test('continuity at S1', () => {
  assert.equal(forexRailU(4, FOREX_S1_F), 0.4);
  assert.ok(Math.abs(forexRailU(4.0001, FOREX_S1_F + 1e-6) - 0.4) < 1e-5);
  const s = st(forexRailU(4.5, FOREX_S1_F + 10 / 575));
  assert.equal(s.index, 4);
  assert.equal(s.advance, 0);
});

test('spreadEven equals spreadWindows; opportunity windows regression', () => {
  assert.deepEqual(spreadEven(6, 217 / 575, 2 / 3), spreadWindows(6, 217 / 575, 2 / 3));
  assert.deepEqual(spreadEven(5, 2 / 3, 0.91), spreadWindows(5, 2 / 3, 0.91));
  const b = spreadWindows(5, 2 / 3, 0.91);
  const P = (f) => 0.4 + 0.6 * Math.min(1, Math.max(0, (f - FOREX_S1_F) / (1 - FOREX_S1_F)));
  b.forEach((w, i) => {
    assert.ok(Math.abs(spec.steps[10 + i].start - P(w.start)) < 1e-12);
    assert.ok(Math.abs(spec.steps[10 + i].end - P(w.end)) < 1e-12);
  });
});

test('NaN s', () => {
  assert.equal(forexRailU(NaN, 0.5), 0);
  assert.equal(forexRailStopU(-5), 0);
});
