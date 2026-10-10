'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { circularShaft } = require('../engine/torsion.js');

const baseline = { torque: 1000, radius: 0.02, length: 1.5, shearModulus: 80e9, yieldShear: 200e6, safetyFactor: 2 };
function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= Math.max(1e-30, Math.abs(expected) * 1e-12), `${actual} != ${expected}`);
}

test('solid circular shaft agrees with independently evaluated SI formulas', () => {
  const r = circularShaft(baseline);
  close(r.polarInertia, 2.5132741228718345e-7);
  close(r.maxShearStress, 79577471.54594767);
  close(r.twist, 0.07460387957432593);
  assert.equal(r.allowableShear, 100e6);
  close(r.utilization, 0.7957747154594768);
  assert.equal(r.safe, true);
  assert.equal(r.diagnostics.units.twist, 'rad');
  assert.equal(r.diagnostics.warnings.length, 0);
  assert.ok(Object.isFrozen(r));
  assert.ok(Object.isFrozen(r.diagnostics));
});

test('negative torque reverses twist but not strength utilization', () => {
  const positive = circularShaft(baseline);
  const negative = circularShaft({ ...baseline, torque: -baseline.torque });
  assert.equal(negative.maxShearStress, positive.maxShearStress);
  assert.equal(negative.twist, -positive.twist);
  assert.equal(negative.utilization, positive.utilization);
  assert.equal(negative.safe, positive.safe);
});

test('zero torque gives exact zero responses and is safe', () => {
  for (const torque of [0, -0]) {
    const r = circularShaft({ ...baseline, torque });
    assert.equal(r.maxShearStress, 0);
    assert.equal(r.twist, 0);
    assert.equal(r.utilization, 0);
    assert.equal(r.safe, true);
  }
});

test('default safety factor and inclusive allowable-strength boundary', () => {
  const p = { torque: Math.PI / 2, radius: 1, length: 1, shearModulus: 1, yieldShear: 1 };
  const atLimit = circularShaft(p);
  assert.equal(atLimit.maxShearStress, 1);
  assert.equal(atLimit.allowableShear, 1);
  assert.equal(atLimit.utilization, 1);
  assert.equal(atLimit.safe, true);
  assert.equal(circularShaft({ ...p, torque: p.torque * (1 + 1e-10) }).safe, false);
  const safetyLimited = circularShaft({ ...p, torque: p.torque * 0.75, safetyFactor: 2 });
  assert.equal(safetyLimited.safe, false);
  assert.equal(safetyLimited.diagnostics.warnings.length, 0);
  const yielded = circularShaft({ ...p, torque: Math.PI });
  assert.equal(yielded.safe, false);
  assert.equal(yielded.diagnostics.warnings.length, 1);
});

test('doubling radius reduces stress eightfold and twist sixteenfold', () => {
  const a = circularShaft(baseline);
  const b = circularShaft({ ...baseline, radius: 2 * baseline.radius });
  close(b.polarInertia, 16 * a.polarInertia);
  close(b.maxShearStress, a.maxShearStress / 8);
  close(b.twist, a.twist / 16);
});

test('rejects missing options, arrays, primitives and non-finite or coerced values', () => {
  for (const value of [undefined, null, [], 1, 'shaft', true, () => {}]) {
    assert.throws(() => circularShaft(value), TypeError);
  }
  for (const field of Object.keys(baseline)) {
    for (const value of [NaN, Infinity, -Infinity, '1', null, true, {}, [], 1n]) {
      assert.throws(() => circularShaft({ ...baseline, [field]: value }), TypeError, field);
    }
    if (field !== 'safetyFactor') {
      const p = { ...baseline };
      delete p[field];
      assert.throws(() => circularShaft(p), TypeError, field);
    }
  }
});

test('rejects nonpositive geometry/material values and safety factors below one', () => {
  for (const field of ['radius', 'length', 'shearModulus', 'yieldShear']) {
    for (const value of [0, -0, -1]) {
      assert.throws(() => circularShaft({ ...baseline, [field]: value }), RangeError, field);
    }
  }
  for (const safetyFactor of [-1, 0, 0.999]) {
    assert.throws(() => circularShaft({ ...baseline, safetyFactor }), RangeError);
  }
});

test('rejects unrepresentable derived values instead of returning NaN or infinity', () => {
  for (const patch of [
    { radius: 1e100 }, { radius: 1e-100 }, { torque: Number.MAX_VALUE },
    { shearModulus: Number.MIN_VALUE }, { yieldShear: Number.MIN_VALUE, safetyFactor: 2 },
    { torque: Number.MIN_VALUE, radius: 1, length: Number.MIN_VALUE }
  ]) {
    assert.throws(() => circularShaft({ ...baseline, ...patch }), RangeError);
  }
});
