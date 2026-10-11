'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const scene=require('../js/stress-transform-scene');const {planeStress}=require('../engine/stress-transform');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
for(const [sigmaX,sigmaY,tauXY] of [[80,20,30],[100,100,0],[-50,-100,20],[0,0,60]])for(const angle of [-90,0,25,45,90]){
 const p={sigmaX,sigmaY,tauXY,angle},r=scene.calculate(p),e=planeStress({...p,angle:angle*Math.PI/180,yieldStress:250});
 for(const key of ['sigma1','sigma2','vonMises'])close(r[key],e[key]);
 close(r.maxShearInPlane,e.maxShearStress);close(r.sigmaXPrime,e.rotatedSigmaX);close(r.sigmaYPrime,e.rotatedSigmaY);close(r.tauXYPrime,e.rotatedTauXY);
 const host={innerHTML:''};assert.equal(scene.render(host,p),host.innerHTML);assert.ok(host.innerHTML.includes('<svg'));
}
const hydro=scene.calculate({sigmaX:100,sigmaY:100,tauXY:0});close(hydro.maxShearInPlane,0);close(hydro.absoluteMaxShear,50);
// Execute the actual controller adapter, not a duplicate of its implementation.
const source=fs.readFileSync(path.join(__dirname,'../js/playground.js'),'utf8');
const adapter=source.match(/  function renderStressTransform\(\)\{[^\n]+/)[0];
const elements={};const sandbox={state:{stressTransform:{sigmaX:80,sigmaY:20,tauXY:30,angle:25}},window:{StressTransformScene:scene},$:key=>elements[key]||(elements[key]={innerHTML:'',textContent:''})};
vm.runInNewContext(adapter+'\nrenderStressTransform();',sandbox);
assert.ok(elements['#reactionBox'].textContent.includes('MPa'));assert.ok(elements['#alternateScene'].innerHTML.includes('<svg'));
console.log('PASS: 20 stress angle conversions, plane/3D shear distinction and actual controller adapter');
