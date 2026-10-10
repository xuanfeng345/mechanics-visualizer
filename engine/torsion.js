'use strict';

/**
 * Linear-elastic torsion of a uniform, solid circular shaft (SI units).
 * torque: N*m (signed), radius/length: m, shearModulus/yieldShear: Pa.
 * maxShearStress is a magnitude; twist is signed and measured in radians.
 * safe is only a shear-strength check, not a stiffness or stability check.
 */
function circularShaft(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('circularShaft options must be an object');
  }
  const { torque, radius, length, shearModulus, yieldShear, safetyFactor = 1 } = options;
  finite('torque', torque);
  positive('radius', radius);
  positive('length', length);
  positive('shearModulus', shearModulus);
  positive('yieldShear', yieldShear);
  finite('safetyFactor', safetyFactor);
  if (safetyFactor < 1) throw new RangeError('safetyFactor must be at least 1');

  const polarInertia = Math.PI * radius ** 4 / 2;
  representable('polarInertia', polarInertia, true);
  const maxShearStress = Math.abs(torque) / polarInertia * radius;
  const twist = torque === 0 ? 0 : torque / polarInertia / shearModulus * length;
  const allowableShear = yieldShear / safetyFactor;
  representable('allowableShear', allowableShear, true);
  const utilization = maxShearStress / allowableShear;
  representable('maxShearStress', maxShearStress, torque !== 0);
  representable('twist', Math.abs(twist), torque !== 0);
  representable('utilization', utilization, torque !== 0);

  return Object.freeze({
    polarInertia,
    maxShearStress,
    twist,
    allowableShear,
    utilization,
    safe: maxShearStress <= allowableShear,
    diagnostics: Object.freeze({
      method: 'analytic-solid-circular-shaft',
      stressConvention: 'maximum-magnitude',
      twistConvention: 'signed-with-torque',
      units: Object.freeze({ polarInertia: 'm^4', maxShearStress: 'Pa', twist: 'rad', allowableShear: 'Pa', utilization: '1' }),
      assumptions: Object.freeze(['solid_circular_section', 'uniform_shaft', 'constant_torque', 'linear_elastic', 'small_deformation']),
      warnings: Object.freeze(maxShearStress > yieldShear
        ? ['Elastic prediction exceeds yield shear; post-yield behavior is not modeled.'] : [])
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

function representable(name, value, strictlyPositive) {
  if (!Number.isFinite(value) || (strictlyPositive && value <= 0)) {
    throw new RangeError(`${name} is outside the representable numeric range`);
  }
}

module.exports = { circularShaft };
