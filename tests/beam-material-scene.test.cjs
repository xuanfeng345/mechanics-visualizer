'use strict';
const assert=require('node:assert/strict');
const scene=require('../beam-material-scene');
const engine=require('../engine/materials-beam');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-11*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const host={ownerDocument:{createElementNS(){return {style:{},setAttribute(){},innerHTML:''};}},appendChild(){},replaceChildren(svg){this.svg=svg;}};
for(const position of [.5,1,2,3.5]){
 const p={span:4,load:20000,position,youngsModulus:200e9,inertia:8e-6,sectionDistance:.05};
 const r=scene.render(host,p),e=engine.simplySupportedPointLoad(p);
 close(r.RA,e.RA);close(r.RB,e.RB);close(r.Mmax,e.moment(position));
 close(r.maxStress,engine.bendingStress({moment:r.Mmax,secondMoment:p.inertia,distance:p.sectionDistance}).stress);
 close(r.maxDeflection,e.maxDeflection);
 for(let i=0;i<=20;i++){const x=p.span*i/20;close(r.moment(x),e.moment(x));close(r.deflection(x),e.deflection(x));}
 assert.ok(host.svg.innerHTML.includes('N · m · Pa'));
 assert.ok(!host.svg.innerHTML.includes('MPa'));assert.ok(!host.svg.innerHTML.includes('NaN'));
}
const r=scene.calculate({span:4,load:20000,position:2,youngsModulus:200e9,inertia:8e-6,sectionDistance:.05});
close(r.maxDeflection,20000*4**3/(48*200e9*8e-6));close(r.Mmax,20000);
assert.throws(()=>scene.calculate({span:1,position:2}));
console.log('PASS: beam SI labels, render contract, reactions, stress and deflection against kernel');
