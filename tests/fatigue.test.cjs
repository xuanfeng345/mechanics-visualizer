'use strict';
const assert = require('node:assert/strict');
const { basquinLife } = require('../engine/fatigue');
const base = { stressAmplitude: 100, referenceStress: 100, referenceCycles: 1e6, exponent: 0.1 };
const life = (overrides = {}) => basquinLife({ ...base, ...overrides });
function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * 1e-12, `${actual} != ${expected}`);
}

const reference = life();
assert.equal(reference.cycles, 1e6);
assert.equal(reference.safeAtReference, true);
assert.equal(reference.diagnostics.regime, 'basquin');
assert.equal(reference.diagnostics.enduranceLimitEnabled, false);
close(life({ stressAmplitude: 200 }).cycles, 1e6 / 1024);
assert.equal(life({ stressAmplitude: 200 }).safeAtReference, false);
close(life({ stressAmplitude: 50 }).cycles, 1e6 * 1024);
assert.equal(life({ stressAmplitude: 50 }).safeAtReference, true);

const goodman = life({ meanStress: 100, ultimateStrength: 200 });
assert.equal(goodman.diagnostics.correctedStress, 200);
close(goodman.cycles, 1e6 / 1024);
close(life({ meanStress: -100, ultimateStrength: 100 }).cycles, 1e6 * 1024);
assert.equal(life({ meanStress: 1e100 }).cycles, 1e6);
close(life({ safetyFactor: 2 }).cycles, goodman.cycles);
assert.equal(life({ safetyFactor: 2 }).safeAtReference, false);
assert.equal(life({ stressAmplitude: 50, safetyFactor: 2 }).cycles, 1e6);
assert.equal(life({ meanStress: 100, ultimateStrength: 200, safetyFactor: 2 }).diagnostics.effectiveStress, 400);

for (const stressAmplitude of [0, 49, 50]) {
  const result = life({ stressAmplitude, enduranceLimit: 50 });
  assert.equal(result.cycles, Infinity);
  assert.equal(result.safeAtReference, true);
}
assert.ok(Number.isFinite(life({ stressAmplitude: 51, enduranceLimit: 50 }).cycles));
assert.ok(Number.isFinite(life({ stressAmplitude: 50, enduranceLimit: 50, safetyFactor: 2 }).cycles));
assert.ok(Number.isFinite(life({ stressAmplitude: 50, enduranceLimit: 50, meanStress: 100, ultimateStrength: 200 }).cycles));
assert.equal(life({ stressAmplitude: 0 }).cycles, Infinity);
assert.equal(life({ stressAmplitude: 200, enduranceLimit: 200 }).safeAtReference, true);
assert.equal(life({ stressAmplitude: 0 }).diagnostics.regime, 'zero-amplitude');
assert.equal(life({ enduranceLimit: 100 }).diagnostics.regime, 'endurance-limit');

for (const invalid of [undefined, null, [], 1, 'options', true]) {
  assert.throws(() => basquinLife(invalid), TypeError);
}
for (const name of ['stressAmplitude', 'referenceStress', 'referenceCycles', 'exponent']) {
  const missing = { ...base };
  delete missing[name];
  assert.throws(() => basquinLife(missing), new RegExp(name));
}
for (const name of ['stressAmplitude', 'referenceStress', 'referenceCycles', 'exponent', 'enduranceLimit', 'meanStress', 'safetyFactor']) {
  for (const invalid of [NaN, Infinity, -Infinity, null, '1', true, {}, []]) {
    assert.throws(() => life({ [name]: invalid }), new RegExp(name));
  }
}
for (const name of ['referenceStress', 'referenceCycles', 'exponent', 'safetyFactor', 'ultimateStrength']) {
  for (const invalid of [0, -1]) assert.throws(() => life({ [name]: invalid }), new RegExp(name));
}
for (const name of ['stressAmplitude', 'enduranceLimit']) {
  assert.throws(() => life({ [name]: -1 }), new RegExp(name));
}
for (const invalid of [NaN, -Infinity, null, 'Infinity', true, {}, []]) {
  assert.throws(() => life({ ultimateStrength: invalid }), /ultimateStrength/);
}
for (const meanStress of [100, 101]) {
  assert.throws(() => life({ meanStress, ultimateStrength: 100 }), /meanStress/);
  assert.throws(() => life({ stressAmplitude: 0, meanStress, ultimateStrength: 100 }), /meanStress/);
}
// Validation precedes infinite-life shortcuts.
assert.throws(() => life({ stressAmplitude: 0, exponent: 0 }), /exponent/);
assert.throws(() => life({ enduranceLimit: 1000, safetyFactor: 0 }), /safetyFactor/);
assert.throws(() => life({ stressAmplitude: Number.MAX_VALUE, safetyFactor: 2 }), /effectiveStress/);
assert.throws(() => life({ meanStress: -Number.MAX_VALUE, ultimateStrength: Number.MIN_VALUE }), /Goodman/);
assert.throws(() => life({ stressAmplitude: Number.MIN_VALUE, safetyFactor: Number.MIN_VALUE }), /effectiveStress/);
const overflow = life({ stressAmplitude: Number.MIN_VALUE });
assert.equal(overflow.cycles, Infinity);
assert.equal(overflow.diagnostics.regime, 'numerical-overflow');
const underflow = life({ stressAmplitude: Number.MAX_VALUE });
assert.equal(underflow.cycles, 0);
assert.equal(underflow.diagnostics.regime, 'numerical-underflow');
assert.equal(underflow.safeAtReference, false);
assert.ok(Object.isFrozen(reference));
assert.ok(Object.isFrozen(reference.diagnostics));
assert.ok(Object.isFrozen(reference.diagnostics.assumptions));
assert.match(reference.diagnostics.assumptions.join(' '), /Goodman/);
assert.match(reference.diagnostics.assumptions.join(' '), /Basquin/);
console.log('PASS: Basquin life, Goodman correction, safety factor, endurance limits, strict validation and numerical diagnostics');
