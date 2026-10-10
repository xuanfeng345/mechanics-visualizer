const assert=require('node:assert/strict');const e=require('../engine');const {vec}=e.vectors;
const m=e.dynamics.rodRelease({length:2,mass:3,phi:Math.PI/2,force:vec(0,0)});assert.ok(Math.abs(m.angularAcceleration+9.81/3)<1e-10);assert.equal(m.inertia,4);
const sim=e.release.rodSim({model:m,dt:1e-4,steps:100});assert.ok(sim.at(-1).omega<0);assert.ok(sim.at(-1).phi<Math.PI/2);
const i=e.dynamics.inclineRelease({mass:10,alpha:30,muK:.3});assert.ok(i.acceleration>0);const is=e.release.inclineSim({model:i,dt:.001,steps:1000});assert.ok(is.at(-1).position>0&&is.at(-1).velocity>0);
const e0=e.dynamics.rodEnergy({length:2,mass:3,phi:0,omega:2});const e1=e.dynamics.rodEnergy({length:2,mass:3,phi:.2,omega:1.5});assert.ok(Number.isFinite(e0)&&Number.isFinite(e1));
console.log('PASS: hinged rod release, incline kinetic release, time stepping, energy API');
