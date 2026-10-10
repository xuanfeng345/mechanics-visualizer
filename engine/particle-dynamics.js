'use strict';

// SI units: kg, N, m, s. Vectors are finite { x, y } objects.
// A step assumes constant resultant force and returns displacement, not position.
function scalar(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}
function positiveMass(value) {
  scalar(value, 'mass');
  if (value <= 0) throw new RangeError('mass must be positive');
  return value;
}
function vector(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${name} must be a two-dimensional {x, y} vector`);
  }
  return Object.freeze({ x: scalar(value.x, `${name}.x`), y: scalar(value.y, `${name}.y`) });
}
function parameters(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('parameters must be an object');
  }
  return value;
}
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (a, k) => ({ x: a.x * k, y: a.y * k });
const dot = (a, b) => a.x * b.x + a.y * b.y;
const energy = (mass, velocity) => 0.5 * mass * dot(velocity, velocity);
const tolerance = (...values) => 1e-10 * Math.max(1, ...values.map(Math.abs));
function nearVector(residual, ...references) {
  return ['x', 'y'].every(axis => Math.abs(residual[axis]) <= tolerance(...references.map(v => v[axis])));
}
// Reject arithmetic overflow as well as nonfinite input; all returned data are immutable.
function result(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new RangeError('calculation exceeds the finite numeric range');
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach(result);
    Object.freeze(value);
  }
  return value;
}

function kineticEnergy(input) {
  const { mass: m, velocity: v } = parameters(input);
  const mass = positiveMass(m), velocity = vector(v, 'velocity');
  return result({
    model: 'particle_kinetic_energy', mass, velocity,
    kineticEnergy: energy(mass, velocity),
    diagnostics: { ok: true, finite: true }
  });
}

function workConstantForce(input) {
  const { force: f, displacement: s } = parameters(input);
  const force = vector(f, 'force'), displacement = vector(s, 'displacement');
  return result({
    model: 'constant_force_work', force, displacement,
    work: dot(force, displacement),
    diagnostics: { ok: true, finite: true }
  });
}

function impulseMomentum(input) {
  const { mass: m, velocity: v, impulse: j } = parameters(input);
  const mass = positiveMass(m), velocityInitial = vector(v, 'velocity');
  const impulse = vector(j, 'impulse');
  const momentumInitial = scale(velocityInitial, mass);
  const deltaVelocity = { x: impulse.x / mass, y: impulse.y / mass };
  const velocity = add(velocityInitial, deltaVelocity);
  const momentumFinal = scale(velocity, mass);
  const momentumChange = subtract(momentumFinal, momentumInitial);
  const residualMomentum = subtract(momentumChange, impulse);
  return result({
    model: 'particle_impulse_momentum', mass, impulse, velocityInitial, velocity,
    deltaVelocity, momentumInitial, momentumFinal, momentumChange,
    kineticEnergyInitial: energy(mass, velocityInitial),
    kineticEnergyFinal: energy(mass, velocity),
    diagnostics: {
      ok: nearVector(residualMomentum, momentumInitial, momentumFinal, impulse),
      finite: true, residualMomentum
    }
  });
}

function particleStep(input) {
  const { mass: m, force: f, velocity: v, dt: step } = parameters(input);
  const mass = positiveMass(m), force = vector(f, 'force');
  const velocityInitial = vector(v, 'velocity'), dt = scalar(step, 'dt');
  if (dt < 0) throw new RangeError('dt must be nonnegative');
  const acceleration = { x: force.x / mass, y: force.y / mass };
  const deltaVelocity = scale(acceleration, dt);
  const velocity = add(velocityInitial, deltaVelocity);
  const displacement = scale(add(velocityInitial, scale(deltaVelocity, 0.5)), dt);
  const impulse = scale(force, dt);
  const momentumInitial = scale(velocityInitial, mass), momentumFinal = scale(velocity, mass);
  const work = dot(force, displacement);
  const kineticEnergyInitial = energy(mass, velocityInitial);
  const kineticEnergyFinal = energy(mass, velocity);
  const kineticEnergyChange = kineticEnergyFinal - kineticEnergyInitial;
  const residualForce = subtract(scale(acceleration, mass), force);
  const residualMomentum = subtract(subtract(momentumFinal, momentumInitial), impulse);
  const workEnergyResidual = kineticEnergyChange - work;
  return result({
    model: 'particle_constant_force', mass, force, dt, acceleration,
    velocityInitial, velocity, deltaVelocity, displacement, impulse,
    momentumInitial, momentumFinal, work,
    kineticEnergyInitial, kineticEnergyFinal, kineticEnergyChange,
    diagnostics: {
      ok: nearVector(residualForce, force) &&
        nearVector(residualMomentum, momentumInitial, momentumFinal, impulse) &&
        Math.abs(workEnergyResidual) <= tolerance(kineticEnergyInitial, kineticEnergyFinal, work),
      finite: true, step: dt, residualForce, residualMomentum, workEnergyResidual
    }
  });
}

module.exports = { particleStep, workConstantForce, kineticEnergy, impulseMomentum };
