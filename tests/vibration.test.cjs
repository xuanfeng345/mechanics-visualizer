'use strict';
const assert = require('node:assert/strict');
const { singleDOF } = require('../engine/vibration');

const mass = 2;
const stiffness = 8;
const result = singleDOF({
  mass, stiffness, damping: 0,
  initialDisplacement: 0.3, initialVelocity: -0.2,
  time: 0
});
const period = 2 * Math.PI / result.naturalFrequency;
const atPeriod = singleDOF({
  mass, stiffness, damping: 0,
  initialDisplacement: 0.3, initialVelocity: -0.2,
  time: period
});
assert.ok(Math.abs(atPeriod.displacement - 0.3) < 1e-12);
assert.ok(Math.abs(atPeriod.velocity + 0.2) < 1e-12);
assert.equal(result.diagnostics.exact, true);
const energy0 = result.energy.total;
const atQuarter = singleDOF({
  mass, stiffness, damping: 0,
  initialDisplacement: 0.3, initialVelocity: -0.2,
  time: period / 4
});
assert.ok(Math.abs(atQuarter.energy.total - energy0) < 1e-12);

const zero = singleDOF({
  mass: 1, stiffness: 4, damping: 0,
  initialDisplacement: 0, initialVelocity: 0, time: 10
});
assert.equal(zero.displacement, 0);
assert.equal(zero.velocity, 0);
assert.equal(zero.acceleration, 0);
assert.equal(zero.energy.total, 0);

assert.throws(() => singleDOF({ mass: 0, stiffness: 1, damping: 0, initialDisplacement: 0, initialVelocity: 0, time: 0 }), /mass/);
assert.throws(() => singleDOF({ mass: 1, stiffness: 1, damping: -1, initialDisplacement: 0, initialVelocity: 0, time: 0 }), /damping/);
console.log('PASS: singleDOF undamped period, energy, zero initial state, validation');
