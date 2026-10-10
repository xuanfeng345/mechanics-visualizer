const assert=require('node:assert/strict');const e=require('../engine');const {vec}=e.vectors;
assert.deepEqual(e.vectors.add(vec(1,2),vec(3,4)),{x:4,y:6});assert.equal(e.vectors.cross(vec(2,0),vec(0,3)),6);
assert.equal(e.units.convert(e.units.quantity(1,'kN'),'N').value,1000);assert.throws(()=>e.units.convert(e.units.quantity(1,'N'),'m'));
let l=e.statics.lever({x:1.5,F:40/3,theta:90});assert.ok(l.balanced);assert.ok(Math.abs(l.reactions.x)<1e-12&&Math.abs(l.reactions.y-20+40/3)<1e-12);
let bad=e.statics.lever({x:.8,F:20,theta:90});assert.equal(bad.external.state,'unbalanced');assert.equal(bad.reactions,null);
let i=e.statics.incline({alpha:30,muS:.4});assert.equal(i.staticPossible,false);assert.equal(i.state,'sliding_after_release');
let b=e.statics.simplySupportedBeam({span:4,load:20,position:1});assert.equal(b.RA,15);assert.equal(b.RB,5);
const traj=e.integrators.simulate({position:vec(0,0),velocity:vec(0,0),time:0},()=>vec(0,-9.81),{dt:.01,steps:100});assert.ok(traj.at(-1).velocity.y< -9.8);assert.ok(Math.abs(traj.at(-1).position.y+4.95495)<.02);
console.log('PASS: units, vectors, statics residuals, incline state, beam baseline, integrator');
