'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { particleStep, workConstantForce, kineticEnergy, impulseMomentum } = require('../engine/particle-dynamics');
const vec = (x, y) => ({ x, y });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const nearVector = (actual, expected) => { near(actual.x, expected.x); near(actual.y, expected.y); };

test('Newton second law: exact constant-force velocity and displacement in two dimensions', () => {
  const r = particleStep({ mass: 2, force: vec(6, -8), velocity: vec(1, 2), dt: 0.5 });
  nearVector(r.acceleration, vec(3, -4));
  nearVector(r.velocity, vec(2.5, 0));
  nearVector(r.displacement, vec(0.875, 0.5));
  nearVector(r.diagnostics.residualForce, vec(0, 0));
  assert.equal(r.diagnostics.ok, true);
});

test('work-energy theorem covers accelerating, braking, and oblique forces', () => {
  for (const force of [vec(6, -8), vec(-4, 0), vec(0, 7), vec(0, 0)]) {
    const r = particleStep({ mass: 2, force, velocity: vec(3, -2), dt: 0.75 });
    const w = workConstantForce({ force, displacement: r.displacement });
    const before = kineticEnergy({ mass: 2, velocity: r.velocityInitial });
    const after = kineticEnergy({ mass: 2, velocity: r.velocity });
    near(w.work, after.kineticEnergy - before.kineticEnergy);
    near(r.diagnostics.workEnergyResidual, 0);
    assert.equal(r.diagnostics.ok, true);
  }
  near(workConstantForce({ force: vec(2, 0), displacement: vec(-3, 4) }).work, -6);
  near(workConstantForce({ force: vec(2, 0), displacement: vec(0, 4) }).work, 0);
  near(kineticEnergy({ mass: 2, velocity: vec(3, 4) }).kineticEnergy, 25);
});

test('impulse-momentum theorem agrees with a constant force time step', () => {
  const args = { mass: 3, force: vec(-6, 9), velocity: vec(2, -4), dt: 1.25 };
  const step = particleStep(args);
  const r = impulseMomentum({ mass: args.mass, velocity: args.velocity, impulse: step.impulse });
  nearVector(r.velocity, step.velocity);
  nearVector(r.momentumChange, step.impulse);
  nearVector(r.diagnostics.residualMomentum, vec(0, 0));
  assert.equal(r.diagnostics.ok, true);
  const reverse = impulseMomentum({ mass: 2, velocity: vec(3, 4), impulse: vec(-12, -16) });
  nearVector(reverse.velocity, vec(-3, -4));
  near(reverse.kineticEnergyInitial, reverse.kineticEnergyFinal);
});

test('zero force, zero impulse and zero time have their physical identity behavior', () => {
  const drift = particleStep({ mass: 5, force: vec(0, 0), velocity: vec(2, -3), dt: 2 });
  nearVector(drift.velocity, vec(2, -3));
  nearVector(drift.displacement, vec(4, -6));
  near(drift.work, 0);
  const paused = particleStep({ mass: 5, force: vec(9, -2), velocity: vec(2, -3), dt: 0 });
  nearVector(paused.velocity, vec(2, -3));
  nearVector(paused.displacement, vec(0, 0));
  nearVector(impulseMomentum({ mass: 5, velocity: vec(2, -3), impulse: vec(0, 0) }).velocity, vec(2, -3));
});

test('strict finite scalar and vector validation never coerces values', () => {
  const cases = [
    [particleStep, { mass: 2, force: vec(1, 2), velocity: vec(3, 4), dt: 1 }, ['mass', 'dt'], ['force', 'velocity']],
    [workConstantForce, { force: vec(1, 2), displacement: vec(3, 4) }, [], ['force', 'displacement']],
    [kineticEnergy, { mass: 2, velocity: vec(3, 4) }, ['mass'], ['velocity']],
    [impulseMomentum, { mass: 2, velocity: vec(3, 4), impulse: vec(1, 2) }, ['mass'], ['velocity', 'impulse']]
  ];
  const badNumbers = [NaN, Infinity, -Infinity, '2', null, undefined, true, 2n];
  for (const [fn, valid, scalars, vectors] of cases) {
    for (const input of [undefined, null, [], 3, 'state']) assert.throws(() => fn(input), TypeError);
    for (const key of scalars) for (const value of badNumbers) {
      assert.throws(() => fn({ ...valid, [key]: value }), TypeError);
    }
    for (const key of vectors) {
      for (const value of [undefined, null, [1, 2], 3, {}, { x: 1 }]) {
        assert.throws(() => fn({ ...valid, [key]: value }), TypeError);
      }
      for (const axis of ['x', 'y']) for (const value of badNumbers) {
        assert.throws(() => fn({ ...valid, [key]: { x: 1, y: 2, [axis]: value } }), TypeError);
      }
    }
    if ('mass' in valid) for (const mass of [0, -1]) assert.throws(() => fn({ ...valid, mass }), RangeError);
  }
  assert.throws(() => particleStep({ mass: 1, force: vec(0, 0), velocity: vec(0, 0), dt: -1 }), RangeError);
});

test('overflow is rejected rather than leaking infinite results', () => {
  assert.throws(() => kineticEnergy({ mass: 2, velocity: vec(1e308, 0) }), RangeError);
  assert.throws(() => workConstantForce({ force: vec(1e308, 0), displacement: vec(2, 0) }), RangeError);
  assert.throws(() => impulseMomentum({ mass: 1e-308, velocity: vec(0, 0), impulse: vec(1e308, 0) }), RangeError);
  assert.throws(() => particleStep({ mass: 1e-308, force: vec(1e308, 0), velocity: vec(0, 0), dt: 1 }), RangeError);
});

test('structured results and diagnostics are immutable without freezing caller data', () => {
  const velocity = vec(1, 2), force = vec(3, 4);
  const r = particleStep({ mass: 2, force, velocity, dt: 1 });
  assert.ok(Object.isFrozen(r));
  assert.ok(Object.isFrozen(r.velocity));
  assert.ok(Object.isFrozen(r.diagnostics));
  assert.ok(Object.isFrozen(r.diagnostics.residualMomentum));
  assert.equal(Object.isFrozen(velocity), false);
  assert.equal(Object.isFrozen(force), false);
  velocity.x = 100;
  force.y = 100;
  assert.equal(r.velocityInitial.x, 1);
  assert.equal(r.force.y, 4);
  for (const result of [kineticEnergy({ mass: 1, velocity }), workConstantForce({ force, displacement: velocity }), impulseMomentum({ mass: 1, velocity, impulse: force })]) {
    assert.equal(result.diagnostics.ok, true);
    assert.equal(result.diagnostics.finite, true);
    assert.ok(Object.isFrozen(result.diagnostics));
  }
});
