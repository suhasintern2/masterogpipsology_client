import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cascade, staged, enterAt, leaveAt, unitStyle, unitTransform, splitWords, splitChars,
  TM_RISE_PCT, TM_LIFT_PCT, TM_TILT_IN_DEG, TM_TILT_OUT_DEG,
  TM_IN_PART_OVERLAP, TM_IN_UNIT_OVERLAP, TM_OUT_PART_OVERLAP, TM_OUT_UNIT_OVERLAP,
} from '../lib/text-motion.ts';
import { spreadWindows, flowState, stepTextPhase } from '../lib/caption-flow.ts';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} !~ ${b} (eps ${eps})`);

test('cascade bounds', () => {
  for (let n = 1; n <= 60; n++) {
    for (const ov of [0, 0.55, 0.82, 0.9, 0.99, 1.5, -1]) {
      const first = cascade(2, 5, 0, n, ov);
      const last = cascade(2, 5, n - 1, n, ov);
      near(first.a, 2, 1e-12);
      near(last.b, 5, 1e-12);
      const len = first.b - first.a;
      let prevA = -Infinity;
      for (let k = 0; k < n; k++) {
        const c = cascade(2, 5, k, n, ov);
        near(c.b - c.a, len, 1e-12);
        assert.ok(c.a >= prevA);
        prevA = c.a;
        assert.ok(c.a >= 2 - 1e-12 && c.b <= 5 + 1e-12);
      }
      if (n === 1) { near(first.a, 2); near(first.b, 5); }
    }
  }
});

test('nested containment', () => {
  const combos = [[TM_IN_PART_OVERLAP, TM_IN_UNIT_OVERLAP], [TM_OUT_PART_OVERLAP, TM_OUT_UNIT_OVERLAP]];
  for (const [po, uo] of combos) {
    for (let parts = 1; parts <= 6; parts++) {
      for (let units = 1; units <= 60; units++) {
        for (let p = 0; p < parts; p++) {
          for (const u of [0, Math.floor(units / 2), units - 1]) {
            assert.equal(staged(1 - 1e-9, 1, 2, p, parts, u, units, po, uo), 0);
            assert.equal(staged(2 + 1e-9, 1, 2, p, parts, u, units, po, uo), 1);
          }
        }
      }
    }
  }
});

test('enterAt / leaveAt', () => {
  const P = 5;
  const U = 12;
  for (const fn of [enterAt, leaveAt]) {
    for (let p = 0; p < P; p++) {
      for (let u = 0; u < U; u++) {
        assert.equal(fn(0, 0, 1, p, P, u, U), 0);
        assert.equal(fn(1, 0, 1, p, P, u, U), 1);
        assert.equal(fn(NaN, 0, 1, p, P, u, U), 0);
        let prev = -1;
        for (let x = -0.1; x <= 1.1; x += 1e-3) {
          const v = fn(x, 0, 1, p, P, u, U);
          assert.ok(v >= prev - 1e-12);
          prev = v;
        }
      }
    }
    for (let x = -0.1; x <= 1.1; x += 0.01) {
      for (let p = 0; p < P; p++) {
        for (let u = 0; u + 1 < U; u++) assert.ok(fn(x, 0, 1, p, P, u, U) >= fn(x, 0, 1, p, P, u + 1, U) - 1e-12);
      }
      for (let p = 0; p + 1 < P; p++) {
        assert.ok(fn(x, 0, 1, p, P, 3, U) >= fn(x, 0, 1, p + 1, P, 3, U) - 1e-12);
      }
    }
  }
});

test('continuity of the cascade', () => {
  for (let p = 0; p < 5; p++) {
    for (const u of [0, 20, 59]) {
      let pe = enterAt(0, 0, 0.5, p, 5, u, 60);
      let pl = leaveAt(0, 0, 0.5, p, 5, u, 60);
      for (let x = 1e-4; x <= 0.5; x += 1e-4) {
        const e = enterAt(x, 0, 0.5, p, 5, u, 60);
        const l = leaveAt(x, 0, 0.5, p, 5, u, 60);
        assert.ok(Math.abs(e - pe) < 0.03);
        assert.ok(Math.abs(l - pl) < 0.03);
        pe = e;
        pl = l;
      }
    }
  }
});

test('unitStyle', () => {
  for (const kind of ['tilt', 'rise', 'line', 'pop']) {
    assert.deepEqual(unitStyle(kind, 1, 0), { opacity: 1, y: 0, rot: 0, x: 0, scale: 1 });
    const b = unitStyle(kind, 0, 0);
    assert.equal(b.opacity, 0);
    if (kind === 'line') assert.equal(b.scale, 0);
    assert.equal(unitStyle(kind, 1, 1).opacity, 0);
  }
  const t0 = unitStyle('tilt', 0, 0);
  assert.equal(t0.y, TM_RISE_PCT);
  assert.equal(t0.rot, TM_TILT_IN_DEG);
  const t1 = unitStyle('tilt', 1, 1);
  assert.equal(t1.y, -TM_LIFT_PCT);
  assert.equal(t1.rot, -TM_TILT_OUT_DEG);
  const l = unitStyle('line', 1, 0.5);
  assert.equal(l.scale, 0.5);
  assert.equal(l.x, 50);
});

test('unitTransform', () => {
  assert.equal(unitTransform('tilt', unitStyle('tilt', 1, 0), 1), 'translate3d(0,0.00%,0) rotateX(0.00deg)');
  assert.equal(unitTransform('rise', unitStyle('rise', 1, 0), 1), 'translate3d(0,0.00%,0)');
  assert.equal(unitTransform('line', unitStyle('line', 1, 0), 1), 'translate3d(0.00%,0,0) scaleX(1.0000)');
  assert.equal(unitTransform('pop', unitStyle('pop', 1, 0), 1), 'rotate(45deg) scale(1.0000)');
  assert.equal(unitTransform('line', unitStyle('line', 1, 0.5), -1), 'translate3d(-50.00%,0,0) scaleX(0.5000)');
});

test('splitWords / splitChars', () => {
  assert.deepEqual(splitWords('  a  b\nc '), ['a', 'b', 'c']);
  assert.deepEqual(splitWords(''), []);
  assert.equal(splitChars('next.').length, 5);
});

test('stepTextPhase', () => {
  const spec = { from: 0.05, to: 0.95, steps: spreadWindows(5, 0.1, 0.9) };
  for (let i = 0; i < 5; i++) {
    const mid = (spec.steps[i].start + spec.steps[i].end) / 2;
    const f = flowState(mid, spec);
    assert.equal(f.index, i);
    for (let j = 0; j < 5; j++) {
      const ph = stepTextPhase(j, f);
      if (j <= i) assert.equal(ph.vin, 1);
      else assert.equal(ph.vin, 0);
      if (j < i - 1) assert.equal(ph.vout, 1);
      if (j === i - 1 || j === i) assert.equal(ph.vout, 0);
    }
  }
  for (let j = 0; j < 5; j++) {
    const first = stepTextPhase(j, flowState(0, spec));
    let pin = first.vin;
    let pout = first.vout;
    for (let p = 1e-4; p <= 1 + 1e-9; p += 1e-4) {
      const ph = stepTextPhase(j, flowState(p, spec));
      assert.ok(Math.abs(ph.vin - pin) < 0.02, `vin j=${j} p=${p}`);
      assert.ok(Math.abs(ph.vout - pout) < 0.02, `vout j=${j} p=${p}`);
      pin = ph.vin;
      pout = ph.vout;
    }
  }
  const end = flowState(1, spec);
  for (let j = 0; j < 5; j++) assert.equal(stepTextPhase(j, end).vout, 1);
});
