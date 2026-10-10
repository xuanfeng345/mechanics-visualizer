'use strict';
const assert = require('node:assert/strict');
const { basquinLife } = require('../engine/fatigue');
const scene = require('../fatigue-scene');

function close(actual, expected, rel = 1e-12) {
  if (actual === expected) return;
  assert.ok(Number.isFinite(actual) && Number.isFinite(expected));
  assert.ok(Math.abs(actual - expected) <= Math.max(1, Math.abs(expected)) * rel,
    `${actual} != ${expected}`);
}

const cases = [
  { stressAmplitude: 100, referenceStress: 200, referenceCycles: 1e5, exponent: .2,
    enduranceLimit: 0, meanStress: 0, ultimateStrength: 600, safetyFactor: 1 },
  { stressAmplitude: 120, referenceStress: 300, referenceCycles: 2e5, exponent: .12,
    enduranceLimit: 80, meanStress: 60, ultimateStrength: 600, safetyFactor: 1.5 },
  { stressAmplitude: 20, referenceStress: 200, referenceCycles: 1e6, exponent: .1,
    enduranceLimit: 40, meanStress: -20, ultimateStrength: 500, safetyFactor: 1.2 }
];

for (const input of cases) {
  const actual = scene.calculate(input);
  const expected = basquinLife(input);
  close(actual.effectiveAmplitude, expected.diagnostics.effectiveStress);
  assert.equal(actual.cycles, expected.cycles === Infinity ? Infinity : actual.cycles);
  if (expected.cycles !== Infinity) close(actual.cycles, expected.cycles);
  assert.equal(actual.exponent > 0, true);
}

const noLimit = scene.calculate({ ...cases[0], enduranceLimit: 0 });
assert.equal(noLimit.enduranceLimit, 0);
assert.equal(noLimit.effectiveAmplitude, 100);
close(noLimit.cycles, 1e5 * Math.pow(2, 5));

const infinite = scene.calculate({ ...cases[1], stressAmplitude: 10, enduranceLimit: 80 });
assert.equal(infinite.cycles, Infinity);
assert.equal(infinite.effectiveAmplitude <= infinite.enduranceLimit, true);

const host = { innerHTML: '' };
for (const input of [...cases, { ...cases[0], enduranceLimit: 0 }]) {
  assert.doesNotThrow(() => scene.render(host, input));
  assert.match(host.innerHTML, /^<svg/);
}
assert.doesNotThrow(() => scene.render({ innerHTML: '' }, {
  stressAmplitude: 0, referenceStress: 300, referenceCycles: 1e5,
  exponent: .12, enduranceLimit: 0, meanStress: 0, ultimateStrength: Infinity, safetyFactor: 1
}));
console.log('PASS: fatigue scene matches engine and renders fake hosts');
