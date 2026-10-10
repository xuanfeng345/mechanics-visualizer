const assert=require('node:assert/strict');const m=require('../engine').materials;
const a=m.axialFromSI({forceN:10000,areaMm2:100,lengthMm:1000,youngsModulusMPa:200000,yieldStressMPa:250,safetyFactor:2});assert.equal(a.stress,100);assert.equal(a.strain,.0005);assert.equal(a.elongation,.5);assert.equal(a.allowableStress,125);assert.equal(a.elastic,true);assert.equal(a.utilization,.8);
assert.throws(()=>m.axial({force:1,area:0,length:1,youngsModulus:1}));assert.throws(()=>m.axial({force:1,area:1,length:1,youngsModulus:1,safetyFactor:0}));
const t=m.torsion({torque:100,radius:.01,polarInertia:1e-8,shearModulus:80e9,length:1});assert.equal(t.shearStress,1e8);assert.equal(t.twist,0.125);console.log('PASS: axial stress strain elongation safety and torsion baseline');
