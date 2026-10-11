const assert=require('node:assert/strict');
const {calculate,render}=require('../js/statics-scenes.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const a of [.2,1,2,3.8]) for(const P of [0,20,60]){const s=calculate('beam',{a,P});close(s.RA+s.RB,P);close(s.RB*4,P*a);close(s.Mmax,s.RA*a);}
for(const alpha of [0,15,30,60])for(const mu of [0,.4,1]){const s=calculate('friction',{alpha,mu});close(s.N,100*Math.cos(alpha*Math.PI/180));assert.equal(s.static,s.driving<=s.maxF+1e-12);if(s.static)close(s.f,s.driving);else assert.equal(s.f,undefined);const host={innerHTML:''};render('friction',host,{alpha,mu});assert.ok(host.innerHTML.includes('<svg'));assert.ok(!/NaN|undefined|Infinity/.test(host.innerHTML));}
for(const scene of ['support','beam']){const host={innerHTML:''};render(scene,host,{});assert.ok(host.innerHTML.includes('<svg'));}
console.log('PASS: beam equilibrium, friction limits and all scene render paths');
