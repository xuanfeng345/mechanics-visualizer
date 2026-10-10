'use strict';

/**
 * Plane-stress transformation and yield check. All stress values are MPa;
 * angle is in radians and follows the positive counter-clockwise convention.
 */
function planeStress(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('planeStress options must be an object');
  }
  const {
    sigmaX,
    sigmaY,
    tauXY,
    angle = 0,
    yieldStress,
    safetyFactor = 1
  } = options;
  finite('sigmaX', sigmaX);
  finite('sigmaY', sigmaY);
  finite('tauXY', tauXY);
  finite('angle', angle);
  positive('yieldStress', yieldStress);
  finite('safetyFactor', safetyFactor);
  if (safetyFactor < 1) throw new RangeError('safetyFactor must be at least 1');

  const averageStress = (sigmaX + sigmaY) / 2;
  const halfDifference = (sigmaX - sigmaY) / 2;
  const radius = Math.hypot(halfDifference, tauXY);
  const sigma1 = averageStress + radius;
  const sigma2 = averageStress - radius;
  const maxShearStress = radius;
  const c = Math.cos(2 * angle);
  const s = Math.sin(2 * angle);
  const rotatedSigmaX = averageStress + halfDifference * c + tauXY * s;
  const rotatedSigmaY = averageStress - halfDifference * c - tauXY * s;
  const rotatedTauXY = -halfDifference * s + tauXY * c;
  const vonMises = Math.sqrt(sigmaX * sigmaX - sigmaX * sigmaY + sigmaY * sigmaY + 3 * tauXY * tauXY);
  const allowableStress = yieldStress / safetyFactor;
  const utilization = vonMises / allowableStress;
  for (const [name, value] of Object.entries({ averageStress, sigma1, sigma2, maxShearStress,
    rotatedSigmaX, rotatedSigmaY, rotatedTauXY, vonMises, allowableStress, utilization })) {
    representable(name, value);
  }

  const rotatedStress = Object.freeze({ sigmaX: rotatedSigmaX, sigmaY: rotatedSigmaY, tauXY: rotatedTauXY });
  return Object.freeze({
    sigma1,
    sigma2,
    maxShearStress,
    averageStress,
    rotatedStress,
    // Explicit names are retained alongside the grouped form for convenient consumers.
    rotatedSigmaX,
    rotatedSigmaY,
    rotatedTauXY,
    sigmaXPrime: rotatedSigmaX,
    sigmaYPrime: rotatedSigmaY,
    tauXPrimeYPrime: rotatedTauXY,
    vonMises,
    allowableStress,
    utilization,
    safe: utilization <= 1,
    diagnostics: Object.freeze({
      method: 'analytic-plane-stress-transformation',
      units: Object.freeze({ stress: 'MPa', angle: 'rad', utilization: '1' }),
      angleConvention: 'positive-counter-clockwise',
      assumptions: Object.freeze(['plane_stress', 'linear_elastic_yield_check']),
      warnings: Object.freeze(vonMises > yieldStress
        ? ['Elastic stress state exceeds yield stress; post-yield behavior is not modeled.'] : [])
    })
  });
}

function finite(name, value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}
function positive(name, value) {
  finite(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than zero`);
}
function representable(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} is outside the representable numeric range`);
}

module.exports = { planeStress };
