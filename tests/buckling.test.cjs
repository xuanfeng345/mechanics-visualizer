'use strict';
const assert = require('node:assert/strict');
const { eulerBuckling } = require('../engine/buckling');

const input = { youngsModulus: 200e9, inertia: 8e-6, length: 3, area: 0.01, effectiveLengthFactor: 1, load: 1e6 };
const result = eulerBuckling(input);
const expectedPcr = Math.PI ** 2 * input.youngsModulus * input.inertia / input.length ** 2;
assert.ok(Math.abs(result.effectiveLength - 3) < 1e-12);
assert.ok(Math.abs(result.criticalLoad - expectedPcr) / expectedPcr < 1e-12);
assert.equal(result.Pcr, result.criticalLoad);
assert.ok(Math.abs(result.slenderness - 3 * Math.sqrt(input.area / input.inertia)) < 1e-12);
assert.equal(result.safe, result.utilization < 1);
assert.equal(result.boundary.recognized, true);

for (const [k, condition] of [[0.5, 'fixed-fixed'], [0.7, 'fixed-pinned'], [1, 'pinned-pinned'], [2, 'fixed-free']]) {
  assert.equal(eulerBuckling({ ...input, effectiveLengthFactor: k }).boundary.condition, condition);
}
assert.equal(eulerBuckling({ ...input, effectiveLengthFactor: 0.6 }).boundary.recognized, false);
for (const key of ['youngsModulus', 'inertia', 'length', 'area', 'effectiveLengthFactor']) {
  assert.throws(() => eulerBuckling({ ...input, [key]: 0 }), /finite positive/);
  assert.throws(() => eulerBuckling({ ...input, [key]: Infinity }), /finite positive/);
}
assert.throws(() => eulerBuckling({ ...input, load: -1 }), /non-negative/);
assert.throws(() => eulerBuckling({ ...input, load: NaN }), /non-negative/);
assert.equal(eulerBuckling({ ...input, load: 0 }).safe, true);
console.log('PASS: Euler buckling capacity, slenderness, utilization, safety, and boundary diagnostics');
