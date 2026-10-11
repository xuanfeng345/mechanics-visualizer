'use strict';
const assert=require('node:assert/strict');const scene=require('../lagrangian-scene');const k=require('../engine/lagrangian');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);const host={innerHTML:''};
for(const p of [{mass:1,stiffness:100,initialCoordinate:.1,initialVelocity:0,time:0},{mass:2,stiffness:50,initialCoordinate:.2,initialVelocity:.3,time:.4},{mass:3,stiffness:20,initialCoordinate:-.4,initialVelocity:1.2,time:2}]){const r=scene.render(host,p),e=k.harmonicLagrange(p);for(const [a,b] of [['coordinate','q'],['velocity','qdot'],['acceleration','qddot'],['lagrangian','L'],['totalEnergy','energy']])close(r[a],e[b]);assert.ok(host.innerHTML.includes('<svg'));assert.ok(!host.innerHTML.includes('NaN'))}
for(const p of [{mass:0},{mass:-1},{stiffness:0},{stiffness:-1},{time:-1},{initialVelocity:NaN},{time:Infinity}])assert.throws(()=>scene.calculate(p));
assert.equal(scene.calculate({initialCoordinate:0,initialVelocity:0,time:0}).coordinate,0);
console.log('PASS: lagrangian scene strict validation, zero state and analytic kernel agreement');
