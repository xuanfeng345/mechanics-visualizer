'use strict';
const assert=require('node:assert/strict');const scene=require('../js/vibration-scene');const k=require('../engine/vibration');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);const host={innerHTML:''};
for(const p of [{mass:1,stiffness:100,damping:0,initialDisplacement:.1,initialVelocity:0,time:0},{mass:2,stiffness:50,damping:0,initialDisplacement:.2,initialVelocity:.3,time:.4},{mass:1,stiffness:100,damping:2,initialDisplacement:.1,initialVelocity:0,time:.3},{mass:1,stiffness:100,damping:30,initialDisplacement:.1,initialVelocity:0,time:.3}]){const r=scene.render(host,p),e=k.singleDOF(p);for(const key of ['displacement','velocity','acceleration'])close(r[key],e[key]);close(r.totalEnergy,e.energy.total);assert.ok(host.innerHTML.includes('<svg'));assert.ok(!host.innerHTML.includes('NaN'))}
for(const p of [{mass:0},{stiffness:0},{damping:-1},{time:-1},{initialVelocity:NaN},{time:Infinity}])assert.throws(()=>scene.calculate(p));
assert.equal(scene.calculate({initialDisplacement:0,initialVelocity:0,time:0}).displacement,0);
console.log('PASS: vibration scene strict validation, zero state and analytic/RK4 kernel agreement');
