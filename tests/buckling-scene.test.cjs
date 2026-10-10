'use strict';
const assert=require('node:assert/strict');
const scene=require('../buckling-scene');
const {eulerBuckling}=require('../engine/buckling');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(b)),`${a} != ${b}`);
for(const K of [.5,.7,1,2,1.3])for(const load of [0,10000,1e7]){
 const p={youngsModulus:200e9,inertia:1e-6,length:3,area:.001,effectiveLengthFactor:K,load};
 const expected=eulerBuckling(p),host={innerHTML:''},actual=scene.render(host,p);
 for(const key of ['criticalLoad','effectiveLength','slenderness','utilization'])close(actual[key],expected[key]);
 assert.equal(actual.safe,expected.safe);assert.equal(actual.stable,expected.safe);
 assert.ok(host.innerHTML.includes('<svg'));assert.ok(!host.innerHTML.includes('NaN'));
 if(K===.7)assert.ok(actual.endCondition.includes('固接—铰接'));
 if(K===1.3)assert.ok(actual.endCondition.includes('自定义'));
 const critical=scene.calculate({...p,load:actual.criticalLoad});assert.equal(critical.safe,false);
}
for(const load of [-1,NaN,Infinity,'100',null])assert.throws(()=>scene.calculate({load}));
for(const inertia of [0,-1,NaN,Infinity,'1'])assert.throws(()=>scene.calculate({inertia}));
console.log('PASS: buckling scene/kernel agreement, critical boundary, custom K and render contract');
