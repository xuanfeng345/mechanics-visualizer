'use strict';
const assert=require('node:assert/strict');const scene=require('../js/statics-scenes');const k=require('../engine/statics');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12*Math.max(1,Math.abs(b)),`${a} != ${b}`);
for(const p of [{a:.2,P:0},{a:1,P:20},{a:3.8,P:60}]){const a=scene.calculate('beam',p),b=k.simplySupportedBeam({span:4,load:p.P,position:p.a});close(a.RA,b.RA);close(a.RB,b.RB);close(a.Mmax,b.Mmax)}
for(const p of [{alpha:0,mu:0},{alpha:30,mu:.4},{alpha:60,mu:0},{alpha:60,mu:1}]){const a=scene.calculate('friction',p),b=k.incline({weight:100,alpha:p.alpha,muS:p.mu});close(a.N,b.normal);close(a.driving,b.driving);close(a.maxF,b.staticLimit);assert.equal(a.static,b.staticPossible);if(b.actualStaticF===null)assert.equal(a.f,undefined);else close(a.f,b.actualStaticF)}
assert.equal(scene.calculate('friction',{alpha:30,mu:0}).f,undefined);assert.equal(scene.calculate('beam',{a:1,P:0}).Mmax,0);
console.log('PASS: statics beam/friction scenes match analytic kernel including zero-load and static-friction boundary');
