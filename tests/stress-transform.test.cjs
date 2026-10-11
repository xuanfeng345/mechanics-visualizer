'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { planeStress } = require('../engine/stress-transform.js');

function close(actual, expected, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= Math.max(1e-12, Math.abs(expected) * tolerance), `${actual} != ${expected}`);
}

test('principal stresses and von Mises agree with Mohr-circle formulas', () => {
  const r = planeStress({ sigmaX: 80, sigmaY: -20, tauXY: 30, yieldStress: 250, safetyFactor: 2 });
  close(r.averageStress, 30);
  close(r.maxShearStress, Math.sqrt(3400));
  close(r.sigma1, 30 + Math.sqrt(3400));
  close(r.sigma2, 30 - Math.sqrt(3400));
  close(r.vonMises, Math.sqrt(80 ** 2 - 80 * -20 + (-20) ** 2 + 3 * 30 ** 2));
  close(r.utilization, r.vonMises / 125);
  assert.equal(r.safe, r.utilization <= 1);
  assert.equal(r.diagnostics.units.stress, 'MPa');
});

test('standard rotation preserves invariants and transforms at 45 degrees', () => {
  const r = planeStress({ sigmaX: 100, sigmaY: 0, tauXY: 0, angle: Math.PI / 4, yieldStress: 300 });
  close(r.rotatedStress.sigmaX, 50);
  close(r.rotatedStress.sigmaY, 50);
  close(r.rotatedStress.tauXY, -50);
  close(r.rotatedStress.sigmaX + r.rotatedStress.sigmaY, 100);
});

test('defaults angle and safety factor and rejects non-finite/coerced values', () => {
  const base = { sigmaX: 10, sigmaY: 5, tauXY: 2, yieldStress: 100 };
  const r = planeStress(base);
  assert.equal(r.safe, true);
  for (const field of ['sigmaX', 'sigmaY', 'tauXY', 'yieldStress']) {
    for (const value of [NaN, Infinity, -Infinity, '1', null, true, {}, [], 1n]) {
      assert.throws(() => planeStress({ ...base, [field]: value }), TypeError);
    }
  }
  for (const value of [NaN, Infinity, -Infinity, '1', null, true]) {
    assert.throws(() => planeStress({ ...base, angle: value }), TypeError);
    assert.throws(() => planeStress({ ...base, safetyFactor: value }), TypeError);
  }
  for (const value of [0, -1, 0.999]) assert.throws(() => planeStress({ ...base, safetyFactor: value }), RangeError);
  for (const value of [0, -1]) assert.throws(() => planeStress({ ...base, yieldStress: value }), RangeError);
  for (const value of [undefined, null, [], 1, 'x']) assert.throws(() => planeStress(value), TypeError);
});

test('safe boundary is inclusive and result is immutable', () => {
  const r = planeStress({ sigmaX: 100, sigmaY: 0, tauXY: 0, yieldStress: 100 });
  assert.equal(r.vonMises, 100);
  assert.equal(r.utilization, 1);
  assert.equal(r.safe, true);
  assert.ok(Object.isFrozen(r));
  assert.ok(Object.isFrozen(r.rotatedStress));
  assert.ok(Object.isFrozen(r.diagnostics));
});
