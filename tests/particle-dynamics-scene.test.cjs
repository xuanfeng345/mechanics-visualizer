'use strict';
const assert=require('node:assert/strict');const scene=require('../particle-dynamics-scene');const kernel=require('../engine/particle-dynamics');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12*Math.max(1,Math.abs(b)),`${a} != ${b}`);const host={innerHTML:''};
for(const p of [{mass:2,force:{x:0,y:0},velocity:{x:0,y:0},dt:0},{mass:2,force:{x:6,y:-8},velocity:{x:1,y:2},dt:.5},{mass:5,force:{x:-15,y:4},velocity:{x:-2,y:1},dt:3}]){const r=scene.render(host,p),e=kernel.particleStep(p);for(const k of ['velocity','acceleration','displacement']){close(r[k].x,e[k].x);close(r[k].y,e[k].y)}close(r.kineticEnergy,e.kineticEnergyFinal);close(r.work,e.work);assert.ok(host.innerHTML.includes('<svg'));assert.ok(!host.innerHTML.includes('NaN'))}
assert.equal(scene.calculate({mass:2,force:{x:0,y:0},velocity:{x:0,y:0},dt:0}).kineticEnergy,0);
for(const p of [{mass:0},{mass:-1},{dt:-1},{force:{x:NaN,y:0}},{velocity:{x:0,y:Infinity}},{dt:NaN}])assert.throws(()=>scene.calculate(p));
console.log('PASS: particle scene preserves zero inputs, rejects coercion and matches kernel');
