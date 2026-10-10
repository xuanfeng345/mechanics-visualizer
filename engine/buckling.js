'use strict';

const BOUNDARIES = Object.freeze({
  0.5: Object.freeze({ condition: 'fixed-fixed', description: '两端固支' }),
  0.7: Object.freeze({ condition: 'fixed-pinned', description: '一端固支、一端铰支' }),
  1: Object.freeze({ condition: 'pinned-pinned', description: '两端铰支' }),
  2: Object.freeze({ condition: 'fixed-free', description: '一端固支、一端自由' })
});

function finitePositive(name, value) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite positive number`);
  }
  return value;
}

function eulerBuckling({
  youngsModulus,
  inertia,
  length,
  effectiveLengthFactor = 1,
  area,
  load = 0
} = {}) {
  finitePositive('youngsModulus', youngsModulus);
  finitePositive('inertia', inertia);
  finitePositive('length', length);
  finitePositive('effectiveLengthFactor', effectiveLengthFactor);
  finitePositive('area', area);
  if (!Number.isFinite(load) || load < 0) {
    throw new RangeError('load must be a finite non-negative number');
  }

  const effectiveLength = effectiveLengthFactor * length;
  const criticalLoad = Math.PI ** 2 * youngsModulus * inertia / (effectiveLength ** 2);
  const slenderness = effectiveLength * Math.sqrt(area / inertia);
  const utilization = load / criticalLoad;
  const boundary = BOUNDARIES[effectiveLengthFactor] || null;
  const boundaryDiagnostic = boundary
    ? { recognized: true, ...boundary }
    : {
        recognized: false,
        condition: 'custom',
        description: '自定义有效长度系数；常用边界值为 K=0.5、0.7、1、2'
      };

  return Object.freeze({
    model: 'euler_buckling',
    youngsModulus,
    inertia,
    length,
    area,
    effectiveLengthFactor,
    load,
    effectiveLength,
    criticalLoad,
    // Pcr is the conventional Euler notation and is retained for callers.
    Pcr: criticalLoad,
    slenderness,
    utilization,
    safe: utilization < 1,
    boundary: boundaryDiagnostic,
    boundaryDiagnostic,
    assumptions: ['Euler_column', 'linear_elastic', 'straight_prismatic_member']
  });
}

module.exports = { eulerBuckling };
