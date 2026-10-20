'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const beam=require('../js/beam-material-scene');
const base={span:4,load:12000,position:4,youngsModulus:200e9,inertia:8e-6,sectionDistance:.05};
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
test('cantilever tip load agrees with closed form and fixed-end equilibrium',()=>{
  const r=beam.calculate({...base,support:'cantilever'}),EI=base.youngsModulus*base.inertia;
  close(r.RA,12000);close(r.RB,0);close(r.reactionMoment,48000);close(r.moment(0),-48000);
  close(r.moment(4),0);close(r.deflection(4),12000*4**3/(3*EI));close(r.deflection(0),0);
  close(r.shear(4,'right'),0);close(r.shear(4),12000);
});
test('interior cantilever point load has an unloaded straight free segment',()=>{
  const r=beam.calculate({...base,support:'cantilever',position:2,section:2}),EI=base.youngsModulus*base.inertia;
  close(r.sectionShear,12000);close(r.sectionShearRight,0);close(r.sectionMoment,0);
  close(r.deflection(4),12000*2**2*(3*4-2)/(6*EI));close(r.moment(3),0);
  close(r.deflection(4)-r.deflection(3),r.deflection(3)-r.deflection(2));
});
for(const support of ['simple','cantilever'])test(`${support} uniform load: independent deflection and differential checks`,()=>{
  const q=5000,L=4,EI=base.youngsModulus*base.inertia;
  const r=beam.calculate({...base,position:1,support,loadType:'uniform',distributedLoad:q});
  close(r.RA+r.RB,q*L);close(r.RB*L+r.reactionMoment,q*L*L/2);
  close(r.maxDeflection,support==='simple'?5*q*L**4/(384*EI):q*L**4/(8*EI));
  close(r.maxMoment,support==='simple'?q*L*L/8:q*L*L/2);
  const h=.0001;
  for(const x of [.5,1,2,3]){
    close((r.moment(x+h)-r.moment(x-h))/(2*h),r.shear(x),1e-7);
    close((r.shear(x+h)-r.shear(x-h))/(2*h),-q,1e-7);
    close((r.deflection(x+h)-2*r.deflection(x)+r.deflection(x-h))/h**2,-r.moment(x)/EI,1e-7);
  }
  close(r.deflection(0),0);if(support==='simple')close(r.deflection(L),0);
});
test('section stress keeps bending sign and queries reject out-of-domain coordinates',()=>{
  const r=beam.calculate({...base,support:'cantilever',section:0});assert.ok(r.sectionStress<0);
  close(r.sectionStress,-r.maxStress);
  for(const f of [r.shear,r.moment,r.deflection])for(const x of [-1,5,NaN,Infinity,'1'])assert.throws(()=>f(x));
  assert.throws(()=>beam.calculate({...base,support:'unknown'}));
  assert.throws(()=>beam.calculate({...base,support:'cantilever',section:5}));
});
