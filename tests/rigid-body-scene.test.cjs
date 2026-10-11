'use strict';
const assert=require('node:assert/strict');const scene=require('../rigid-body-scene');const kernel=require('../engine/rigid-body');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const host={innerHTML:''};
for(const p of [{mass:2,inertia:4,force:0,moment:0,dt:0},{mass:2,inertia:4,force:10,moment:8,dt:2},{mass:5,inertia:3,force:-15,moment:-6,dt:3}]){
 const r=scene.render(host,p),e=kernel.rigidBodyStep({mass:p.mass,inertia:p.inertia,force:{x:p.force,y:0},moment:p.moment,position:{x:0,y:0},velocity:{x:0,y:0},angle:0,angularVelocity:0,dt:p.dt});
 close(r.acceleration,e.acceleration.x);close(r.angularAcceleration,e.angularAcceleration);close(r.velocity,e.velocity.x);close(r.angularVelocity,e.angularVelocity);close(r.angle,e.angle);close(r.kineticEnergy,e.kineticEnergy);assert.ok(host.innerHTML.includes('<svg'));assert.ok(!host.innerHTML.includes('NaN'));
}
assert.equal(scene.calculate({force:0,moment:0,dt:0}).velocity,0);assert.equal(scene.calculate({force:0,moment:0,dt:0}).angularVelocity,0);
for(const p of [{mass:0},{inertia:0},{dt:-1},{force:NaN},{dt:Infinity}])assert.throws(()=>scene.calculate(p));
console.log('PASS: rigid scene preserves zero inputs and matches analytic rigid-body kernel');
