'use strict';
const assert = require('node:assert/strict');
const { harmonicLagrange, lagrangeResidual } = require('../engine/lagrangian');

const mass = 2, stiffness = 8, q0 = 0.3, v0 = -0.2;
const initial = harmonicLagrange({ mass, stiffness, initialCoordinate: q0, initialVelocity: v0, time: 0 });
assert.equal(initial.q, q0);
assert.equal(initial.qdot, v0);
assert.equal(initial.qddot, -stiffness * q0 / mass);
assert.equal(initial.L, initial.diagnostics.kinetic - initial.diagnostics.potential);
assert.equal(initial.energy, initial.diagnostics.kinetic + initial.diagnostics.potential);
assert.equal(initial.diagnostics.exact, true);

const period = 2 * Math.PI / initial.diagnostics.naturalFrequency;
const atPeriod = harmonicLagrange({ mass, stiffness, initialCoordinate: q0, initialVelocity: v0, time: period });
assert.ok(Math.abs(atPeriod.q - q0) < 1e-12);
assert.ok(Math.abs(atPeriod.qdot - v0) < 1e-12);
assert.ok(Math.abs(atPeriod.energy - initial.energy) < 1e-12);
assert.equal(lagrangeResidual({ mass, stiffness, q: atPeriod.q, qdot: atPeriod.qdot, qddot: atPeriod.qddot }).ok, true);
assert.equal(lagrangeResidual({ mass, stiffness, q: 1, qdot: 0, qddot: 0 }).ok, false);

for (const bad of [null, [], { mass: 0, stiffness: 1, initialCoordinate: 0, initialVelocity: 0, time: 0 },
  { mass: 1, stiffness: -1, initialCoordinate: 0, initialVelocity: 0, time: 0 },
  { mass: 1, stiffness: 1, initialCoordinate: 0, initialVelocity: 0, time: -1 },
  { mass: 1, stiffness: 1, initialCoordinate: NaN, initialVelocity: 0, time: 0 }]) {
  assert.throws(() => harmonicLagrange(bad));
}
assert.throws(() => lagrangeResidual({ mass: 1, stiffness: 1, q: 0, qdot: 0, qddot: Infinity }));
console.log('PASS: harmonic Lagrangian analytic solution and residual validation');
