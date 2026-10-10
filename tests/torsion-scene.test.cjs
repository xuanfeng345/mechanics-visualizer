'use strict';
const assert=require('node:assert/strict');
const scene=require('../torsion-scene');
const {circularShaft}=require('../engine/torsion');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-12*Math.max(Math.abs(b),1e-20),`${a} != ${b}`);
const host={ownerDocument:{createElementNS(){return {style:{},setAttribute(){},innerHTML:''};}},appendChild(){},replaceChildren(svg){this.svg=svg;}};
for(const torque of [-100,0,100])for(const radius of [.01,.02,.04]){
 const p={torque,radius,length:1,shearModulus:80e9,yieldShear:150e6,safetyFactor:1.5};
 const r=scene.render(host,p),e=circularShaft(p);
 for(const key of ['polarInertia','maxShearStress','twist'])close(r[key],e[key]);
 assert.ok(r.maxShearStress>=0);assert.equal(Math.sign(r.twist),Math.sign(torque));
 assert.ok(host.svg.innerHTML.includes('N·m'));assert.ok(host.svg.innerHTML.includes(' Pa'));
 assert.ok(!host.svg.innerHTML.includes('MPa'));assert.ok(!host.svg.innerHTML.includes('mm'));assert.ok(!host.svg.innerHTML.includes('NaN'));
}
const r=scene.calculate();close(r.maxShearStress,2*100/(Math.PI*.02**3));
assert.throws(()=>scene.calculate({radius:0}));
console.log('PASS: torsion SI labels, signed twist, stress magnitude and nine kernel comparisons');
