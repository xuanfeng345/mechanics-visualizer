'use strict';

/**
 * Evaluate a linear single-degree-of-freedom oscillator at one time.
 * Equation: m*x'' + c*x' + k*x = F0 sin(omega_f t).
 * The undamped, unforced case uses its closed-form solution; all other
 * cases use a deterministic RK4 integration and identify that approximation
 * in diagnostics.
 */
function singleDOF(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('singleDOF options must be an object');
  }
  const {
    mass, stiffness, damping, initialDisplacement, initialVelocity, time,
    forceAmplitude = 0, forceFrequency = 0
  } = options;
  finite('mass', mass); finite('stiffness', stiffness); finite('damping', damping);
  finite('initialDisplacement', initialDisplacement); finite('initialVelocity', initialVelocity);
  finite('time', time); finite('forceAmplitude', forceAmplitude); finite('forceFrequency', forceFrequency);
  if (mass <= 0) throw new RangeError('mass must be greater than zero');
  if (stiffness <= 0) throw new RangeError('stiffness must be greater than zero');
  if (damping < 0) throw new RangeError('damping must be non-negative');
  if (time < 0) throw new RangeError('time must be non-negative');
  if (forceFrequency < 0) throw new RangeError('forceFrequency must be non-negative');

  const wn = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  let x, v, a, mode;
  const free = damping === 0 && forceAmplitude === 0;
  if (free) {
    const wt = wn * time;
    x = initialDisplacement * Math.cos(wt) + (initialVelocity / wn) * Math.sin(wt);
    v = -initialDisplacement * wn * Math.sin(wt) + initialVelocity * Math.cos(wt);
    a = (-wn * wn * x) || 0;
    x = x || 0;
    v = v || 0;
    mode = 'analytic-undamped-free';
  } else {
    ({ x, v } = integrate({ mass, stiffness, damping, initialDisplacement,
      initialVelocity, time, forceAmplitude, forceFrequency }));
    a = (forceAmplitude * Math.sin(forceFrequency * time) - damping * v - stiffness * x) / mass;
    mode = 'rk4-approximation';
  }
  const energy = {
    kinetic: 0.5 * mass * v * v,
    potential: 0.5 * stiffness * x * x,
    total: 0.5 * mass * v * v + 0.5 * stiffness * x * x
  };
  return Object.freeze({
    naturalFrequency: wn,
    dampingRatio: zeta,
    displacement: x,
    velocity: v,
    acceleration: a,
    energy,
    diagnostics: Object.freeze({
      method: mode,
      exact: free,
      equation: 'm*x\'\' + c*x\' + k*x = F0*sin(forceFrequency*t)',
      time,
      steps: free ? 0 : integrationSteps(time)
    })
  });
}

function finite(name, value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}
function integrationSteps(time) { return time === 0 ? 0 : Math.max(1, Math.ceil(time / 0.002)); }
function integrate(p) {
  const n = integrationSteps(p.time);
  if (n === 0) return { x: p.initialDisplacement, v: p.initialVelocity };
  const h = p.time / n;
  let x = p.initialDisplacement, v = p.initialVelocity, t = 0;
  const accel = (xx, vv, tt) => (p.forceAmplitude * Math.sin(p.forceFrequency * tt) - p.damping * vv - p.stiffness * xx) / p.mass;
  for (let i = 0; i < n; i++) {
    const k1x = v, k1v = accel(x, v, t);
    const k2x = v + h * k1v / 2, k2v = accel(x + h * k1x / 2, v + h * k1v / 2, t + h / 2);
    const k3x = v + h * k2v / 2, k3v = accel(x + h * k2x / 2, v + h * k2v / 2, t + h / 2);
    const k4x = v + h * k3v, k4v = accel(x + h * k3x, v + h * k3v, t + h);
    x += h * (k1x + 2 * k2x + 2 * k3x + k4x) / 6;
    v += h * (k1v + 2 * k2v + 2 * k3v + k4v) / 6;
    t += h;
  }
  return { x, v };
}

module.exports = { singleDOF };
