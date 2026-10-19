'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),motion=require('../engine/motion'),engine=require('../engine');
test('static friction holds a resting body and cannot propel it uphill',()=>{
  const m=motion.incline({alpha:10,muS:.6,muK:.5});assert.equal(m.acceleration,0);assert.equal(m.isStatic,true);assert.ok(Math.abs(m.friction-m.driving)<1e-12);
  const s=motion.step({time:0,position:0,velocity:0},m,2);assert.equal(s.position,0);assert.equal(s.velocity,0);
});
test('kinetic friction reverses with velocity and stops without a spurious reversal',()=>{
  const up=motion.incline({alpha:10,muS:.6,muK:.5,velocity:-1}),down=motion.incline({alpha:10,muS:.6,muK:.5,velocity:1});assert.ok(up.acceleration>0);assert.ok(down.acceleration<0);assert.ok(up.friction<0&&down.friction>0);
  for(const velocity of [-1,1]){const m=motion.incline({alpha:10,muS:.6,muK:.5,velocity}),s=motion.step({time:0,position:0,velocity},m,2);assert.equal(s.velocity,0);assert.equal(s.acceleration,0);assert.equal(Math.sign(s.position),Math.sign(velocity));}
});
test('constant sliding acceleration follows the analytic trajectory independent of timestep',()=>{
  const m=motion.incline({alpha:30,muS:.4,muK:.3}),a=9.81*(.5-.3*Math.cos(Math.PI/6));
  let s={time:0,position:0,velocity:0};for(let i=0;i<100;i++)s=motion.step(s,m,.01);assert.ok(Math.abs(s.velocity-a)<1e-11);assert.ok(Math.abs(s.position-.5*a)<1e-11);
  assert.throws(()=>motion.incline({muS:.2,muK:.3}));
});
test('Node rodSim recomputes changing gravitational torque and preserves bounded energy error',()=>{
  const model=engine.dynamics.rodRelease({length:2,mass:3,phi:0}),s=engine.release.rodSim({model,dt:.0005,steps:2000}).at(-1);
  const energy=engine.dynamics.rodEnergy({length:2,mass:3,phi:s.phi,omega:s.omega});assert.ok(Math.abs(energy)<.06);assert.ok(s.phi>-Math.PI,'rod cannot rotate past the zero-energy opposite horizontal orientation');
});
