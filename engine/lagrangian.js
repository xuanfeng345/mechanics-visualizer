'use strict';

/**
 * Closed-form Lagrangian solution for an undamped, unforced harmonic oscillator.
 * The equation of motion is m q'' + k q = 0 and L = T - V.
 */
function harmonicLagrange(options) {
  const p = object(options, 'options');
  const mass = finite(p.mass, 'mass');
  const stiffness = finite(p.stiffness, 'stiffness');
  const initialCoordinate = finite(p.initialCoordinate, 'initialCoordinate');
  const initialVelocity = finite(p.initialVelocity, 'initialVelocity');
  const time = finite(p.time, 'time');
  if (mass <= 0) throw new RangeError('mass must be greater than zero');
  if (stiffness <= 0) throw new RangeError('stiffness must be greater than zero');
  if (time < 0) throw new RangeError('time must be non-negative');

  const omega = Math.sqrt(stiffness / mass);
  const phase = omega * time;
  const q = initialCoordinate * Math.cos(phase) + (initialVelocity / omega) * Math.sin(phase);
  const qdot = -initialCoordinate * omega * Math.sin(phase) + initialVelocity * Math.cos(phase);
  const qddot = -omega * omega * q;
  const kinetic = 0.5 * mass * qdot * qdot;
  const potential = 0.5 * stiffness * q * q;
  const L = kinetic - potential;
  const energy = kinetic + potential;
  ensureFinite({ q, qdot, qddot, L, energy }, 'calculation');
  return Object.freeze({
    L, q, qdot, qddot, energy,
    diagnostics: Object.freeze({
      method: 'analytic-undamped-harmonic', exact: true,
      equation: "m q'' + k q = 0", naturalFrequency: omega,
      kinetic, potential, time,
      residual: mass * qddot + stiffness * q
    })
  });
}

/** Check the Euler-Lagrange residual m qddot + k q for a supplied state. */
function lagrangeResidual(options) {
  const p = object(options, 'options');
  const mass = finite(p.mass, 'mass');
  const stiffness = finite(p.stiffness, 'stiffness');
  const q = finite(p.q, 'q');
  const qdot = finite(p.qdot, 'qdot');
  const qddot = finite(p.qddot, 'qddot');
  if (mass <= 0) throw new RangeError('mass must be greater than zero');
  if (stiffness <= 0) throw new RangeError('stiffness must be greater than zero');
  const residual = mass * qddot + stiffness * q;
  ensureFinite(residual, 'residual');
  const scale = Math.max(1, Math.abs(mass * qddot), Math.abs(stiffness * q));
  const tolerance = 1e-12 * scale;
  return Object.freeze({
    residual,
    ok: Math.abs(residual) <= tolerance,
    satisfied: Math.abs(residual) <= tolerance,
    tolerance,
    diagnostics: Object.freeze({ equation: "m q'' + k q = 0", mass, stiffness, q, qdot, qddot })
  });
}

function object(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
  return value;
}
function finite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}
function ensureFinite(value, name) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new RangeError(`${name} is not finite`);
    return;
  }
  Object.keys(value).forEach(key => ensureFinite(value[key], `${name}.${key}`));
}

module.exports = { harmonicLagrange, lagrangeResidual };
