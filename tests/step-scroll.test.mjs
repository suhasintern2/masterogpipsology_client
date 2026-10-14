import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CRYPTO_STOPS_RAW,
  STEP_FPS,
  STEP_RAMP_S,
  stopListIndex,
  knotProgress,
  framePos,
  progressAt,
  stopScrollY,
  sectionProgressOf,
  stepDuration,
  cruiseEase,
  createWheelGesture,
  feedWheel,
  decideStep,
  stopAt,
  nearestStop,
  stopCoord,
} from '../lib/step-scroll.ts';
import { uniqueLocalFrames } from '../lib/frame-sequence/sources.ts';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} !~ ${b} (eps ${eps})`);
const U = uniqueLocalFrames();
const ST = [0, 89, 110, 142];
const KP = 5 / 7;

test('stopListIndex maps raw files to list indices', () => {
  assert.deepEqual(CRYPTO_STOPS_RAW.map((r) => stopListIndex(r, U)), ST);
  assert.equal(stopListIndex(3, U), 1);
  assert.equal(stopListIndex(240, U), 191);
  assert.equal(stopListIndex(0, U), 0);
});

test('knotProgress', () => {
  near(knotProgress(350, 100), 5 / 7);
});

test('framePos is piecewise linear with a knot at the last stop', () => {
  assert.equal(framePos(0, 192, 142, KP), 0);
  near(framePos(KP, 192, 142, KP), 142);
  assert.equal(framePos(1, 192, 142, KP), 191);
  let prev = -1;
  for (let i = 0; i <= 1000; i++) {
    const v = framePos(i / 1000, 192, 142, KP);
    assert.ok(v >= prev);
    prev = v;
  }
  assert.ok(Math.abs(framePos(KP + 1e-9, 192, 142, KP) - framePos(KP - 1e-9, 192, 142, KP)) < 1e-5);
});

test('framePos / progressAt round trip', () => {
  for (const pos of [0, 44.5, 89, 110, 142, 160, 191]) {
    near(framePos(progressAt(pos, 192, 142, KP), 192, 142, KP), pos, 1e-9);
  }
});

test('desktop stop offsets', () => {
  const ys = ST.map((i) => stopScrollY(i, 192, 142, KP, 1000, 3500));
  assert.equal(ys[0], 1000);
  near(ys[3], 3500);
  for (let k = 1; k < ys.length; k++) assert.ok(ys[k] > ys[k - 1]);
  for (let k = 0; k < ys.length; k++) {
    near(framePos(sectionProgressOf(ys[k], 1000, 4500, 1000), 192, 142, KP), ST[k]);
  }
});

test('mobile: the hand-off stop is never inside the fade', () => {
  const L = 1000;
  for (const D of [1000, 950, 900, 800]) {
    assert.ok(stopScrollY(142, 192, 142, KP, 0, 4.5 * L - D) <= 3.5 * L - D + 1e-9);
  }
});

test('stepDuration', () => {
  near(stepDuration(89), 2.25417, 1e-5);
  near(stepDuration(21), 0.8375);
  near(stepDuration(32), 1.06667, 1e-5);
  for (const f of [89, 21, 32]) near(f / (stepDuration(f) - STEP_RAMP_S), STEP_FPS, 1e-9);
  assert.equal(stepDuration(5), 0.8);
});

test('cruiseEase', () => {
  for (const a of [0, 0.1, 0.37, 0.48, 0.5, 0.9]) {
    near(cruiseEase(0, a), 0);
    near(cruiseEase(1, a), 1);
    const r = Math.min(a, 0.5);
    let prev = -1;
    for (let i = 0; i <= 1000; i++) {
      const t = i / 1000;
      const e = cruiseEase(t, a);
      assert.ok(e >= prev - 1e-12);
      prev = e;
      near(e + cruiseEase(1 - t, a), 1, 1e-12);
      if (i > 0) assert.ok((e - cruiseEase(t - 0.001, a)) / 0.001 <= 1 / (1 - r) + 1e-3);
    }
    if (r > 0 && r < 0.5) {
      near(cruiseEase(r + 1e-7, a), cruiseEase(r - 1e-7, a), 1e-6);
      near(cruiseEase(1 - r + 1e-7, a), cruiseEase(1 - r - 1e-7, a), 1e-6);
      const mid = (cruiseEase(0.5 + 0.0005, a) - cruiseEase(0.5 - 0.0005, a)) / 0.001;
      near(mid, 1 / (1 - r), 1e-6);
    }
  }
  for (const t of [0.1, 0.4, 0.8]) {
    near(cruiseEase(t, 0), t);
    near(cruiseEase(t, 0.9), cruiseEase(t, 0.5));
  }
});

function run(g, events) {
  let fresh = 0;
  for (const [t, d] of events) if (feedWheel(g, t, d)) fresh++;
  return fresh;
}

test('feedWheel gesture splitting', () => {
  // mouse spin
  const a = [];
  for (let i = 0; i < 10; i++) a.push([i * 40, 100]);
  assert.equal(run(createWheelGesture(), a), 1);
  // notches 300 ms apart
  const b = [];
  for (let i = 0; i < 5; i++) b.push([i * 300, 100]);
  assert.equal(run(createWheelGesture(), b), 5);
  // trackpad swipe + decaying tail
  const swipe = [2, 5, 9, 14, 20, 26, 30];
  const c = [];
  let t = 0;
  for (const d of swipe) { c.push([t, d]); t += 16; }
  let tail = 30;
  for (let k = 0; k < 125; k++) { tail *= 0.94; c.push([t, tail]); t += 16; }
  assert.equal(run(createWheelGesture(), c), 1);
  // same tail with a fresh push inserted
  const d = c.slice(0, 7 + 40);
  let tt = d[d.length - 1][0];
  const g = createWheelGesture();
  let freshAt = [];
  let idx = 0;
  for (const [ti, de] of d) { if (feedWheel(g, ti, de)) freshAt.push(idx); idx++; }
  for (const push of [3, 6, 12, 18, 25]) {
    tt += 16;
    if (feedWheel(g, tt, push)) freshAt.push(push);
  }
  assert.equal(freshAt.length, 2);
  assert.equal(freshAt[1], 12);
  // sign flip
  const h = createWheelGesture();
  feedWheel(h, 0, 50);
  assert.equal(feedWheel(h, 16, -50), true);
});

test('decideStep', () => {
  const ys = [1000, 2567, 2937, 3500];
  const base = { target: 0, dir: 1, fresh: true, acted: null, busy: false };
  const d = (o) => decideStep(ys, 2, { ...base, ...o });
  assert.deepEqual(d({ y: 500, target: 900 }), { kind: 'pass' });
  assert.deepEqual(d({ y: 500, target: 1200, acted: 'pass' }), { kind: 'catch', stop: 0 });
  assert.deepEqual(d({ y: 500, target: 400, dir: -1 }), { kind: 'pass' });
  assert.deepEqual(d({ y: 1000.5 }), { kind: 'glide', stop: 1 });
  assert.deepEqual(d({ y: 1000.5, fresh: false, acted: 'consume' }), { kind: 'swallow' });
  assert.deepEqual(d({ y: 1000, dir: -1 }), { kind: 'pass' });
  assert.deepEqual(d({ y: 3500 }), { kind: 'pass' });
  assert.deepEqual(d({ y: 3501, fresh: false, acted: 'pass' }), { kind: 'pass' });
  assert.deepEqual(d({ y: 3500, dir: -1 }), { kind: 'glide', stop: 2 });
  assert.deepEqual(d({ y: 4000, target: 3400, dir: -1 }), { kind: 'catch', stop: 3 });
  assert.deepEqual(d({ y: 2700 }), { kind: 'glide', stop: 2 });
  assert.deepEqual(d({ y: 2700, dir: -1 }), { kind: 'glide', stop: 1 });
  assert.deepEqual(d({ y: 2700, busy: true }), { kind: 'swallow' });
  assert.deepEqual(d({ y: 100, busy: true }), { kind: 'swallow' });
  assert.deepEqual(d({ y: 2937, fresh: false }), { kind: 'swallow' });
});

test('stopAt / nearestStop', () => {
  const ys = [1000, 2567, 2937, 3500];
  assert.equal(stopAt(ys, 1001, 2), 0);
  assert.equal(nearestStop(ys, 1001), 0);
  assert.equal(stopAt(ys, 1003, 2), -1);
  assert.equal(nearestStop(ys, 1003), 0);
  assert.equal(stopAt(ys, 2700, 2), -1);
  assert.equal(nearestStop(ys, 2700), 1);
});

test('stopCoord', () => {
  const ys = [1000, 2567, 2937, 3500];
  for (let k = 0; k < ys.length; k++) near(stopCoord(ys[k], ys, 1000, 1000), k);
  near(stopCoord((ys[1] + ys[2]) / 2, ys, 1000, 1000), 1.5);
  near(stopCoord(500, ys, 1000, 1000), -0.5);
  near(stopCoord(-5000, ys, 1000, 1000), -1);
  near(stopCoord(4000, ys, 1000, 1000), 3.5);
  near(stopCoord(9000, ys, 1000, 1000), 4);
});
