'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),lab=require('../js/materials-lab'),lessons=require('../js/materials-lessons');
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1e-14,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
for(const shape of ['rectangle','circle','tube','i'])test(`${shape}: independent area/inertia/stress-resultant integration`,()=>{
  const p={...lab.defaults,shape},r=lab.calculate(p),g=lab.geometry(p),n=20000,dy=2*g.c/n;
  let area=0,I=0,N=0,M=0,V=0;
  for(let i=0;i<n;i++){const y=-g.c+(i+.5)*dy,b=g.width(y),profile=r.profile(y);area+=b*dy;I+=y*y*b*dy;N+=profile.sigma*b*dy;M+=profile.sigma*y*b*dy;V+=profile.tau*b*dy;}
  close(area,g.area,.001);close(I,g.I,.001);assert.ok(Math.abs(N)<1e-7*Math.abs(p.moment));close(M,-p.moment,.001);close(V,p.shear,.001);
  close(r.profile(g.c).tau,0);close(r.profile(-g.c).tau,0);close(r.profile(0).sigma,0);
});
test('rectangular and circular transverse shear maxima match independent shape factors',()=>{
  for(const [shape,factor]of [['rectangle',1.5],['circle',4/3]]){const p={...lab.defaults,mode:'shear',shape},r=lab.calculate(p);close(r.maxShear,factor*Math.abs(p.shear)/r.area);}
  const p={...lab.defaults,mode:'shear',shape:'i'},r=lab.calculate(p),a=p.height/2-p.flange;
  close(r.profile(a-1e-9).tau/r.profile(a+1e-9).tau,p.width/p.web,1e-6);
});
test('thermal constraint satisfies deformation and reaction balance, not a fictitious free expansion',()=>{
  const p={...lab.defaults,mode:'thermal'},r=lab.calculate(p);close(r.stress,-96e6);close(r.freeExpansion,.00096);close(r.freeExpansion+r.elasticDeformation,r.totalDeformation);close(r.RA,-r.RB);
  close(lab.calculate({...p,area:p.area*2}).stress,r.stress);
  close(lab.calculate({...p,temperature:-40}).stress,96e6);
  close(lab.calculate({...p,endDisplacement:r.freeExpansion}).stress,0);
});
test('redundant reactions satisfy equilibrium and compatibility for unequal segments',()=>{
  const p={...lab.defaults,mode:'compatibility',force:30000},r=lab.calculate(p);close(r.N1,10000);close(r.N2,-20000);close(r.displacement,.000125);
  assert.ok(Math.abs(r.deformation1+r.deformation2)<1e-15);assert.ok(Math.abs(r.RA+r.RB+p.force)<1e-10);
  const equal=lab.calculate({...p,area2:p.area1});close(equal.N1,p.force/2);close(equal.N2,-p.force/2);
  close(lab.calculate({...p,force:-p.force}).displacement,-r.displacement);
});
test('combined loading keeps same-point principal invariants and includes rectangular transverse shear',()=>{
  for(const mode of ['axialBending','bendingTorsion']){
    const r=lab.calculate({mode});close(r.sigma1+r.sigma2,r.stress);close(r.sigma1*r.sigma2,-r.tau*r.tau,1e-6);
    close(r.vonMises,Math.sqrt(r.sigma1*r.sigma1-r.sigma1*r.sigma2+r.sigma2*r.sigma2));
  }
  const p={mode:'axialBending',length:.01,force:10000,axial:0},r=lab.calculate(p);
  assert.ok(Math.abs(r.dangerY)<.001,'short beam shear maximum is near the neutral axis');assert.ok(Math.abs(r.tau)>r.bendingStress);
  const round=lab.calculate({mode:'bendingTorsion'});close(round.J,Math.PI*lab.defaults.radius**4/2);close(round.moment,lab.defaults.force*lab.defaults.length);
});
test('all inputs reject coercion, invalid geometry and unknown modes',()=>{
  for(const key of ['width','force','temperature','eta','youngsModulus'])for(const value of [NaN,Infinity,'1',null,true])assert.throws(()=>lab.calculate({[key]:value}));
  for(const p of [{shape:'tube',innerRadius:.06},{shape:'i',flange:.2},{mode:'unknown'},{shape:'__proto__'},{eta:2},{safetyFactor:.5}])assert.throws(()=>lab.calculate(p));
});
test('twenty added lessons have subject-specific transfer variants and intact old identifiers',()=>{
  let total=0;
  for(const course of ['beam-material','axial','stress-transform']){
    const added=lessons.create(course,2);total+=added.levels.length;
    for(const l of added.levels){assert.ok(l.law&&l.prediction&&l.hints.length===4);assert.ok(l.unit>=2);const a=lessons.exercise(l.id,1),b=lessons.exercise(l.id,2);assert.ok(Number.isFinite(a.answer));assert.notEqual(a.answer,b.answer);assert.notEqual(a.question,b.question);}
  }
  assert.equal(total,20);assert.equal(lessons.exercise('old-id',0),null);
  assert.equal(require('../js/materials-curriculum').levels[0].id,'axial-ch1-l1');
});
test('all twenty numeric answers agree with their actual experiment setup and units',()=>{
  const beam=require('../js/beam-material-scene');
  const values={
    'geometry-rect':r=>r.I,'geometry-circle':r=>r.I,'geometry-tube':r=>r.area,'geometry-i':r=>r.I/r.area,
    'shear-rect':r=>r.maxShear/1e6,'shear-circle':r=>r.maxShear/1e6,'shear-web':r=>r.maxShear/1e6,
    'cantilever-point':r=>r.maxDeflection*1000,'cantilever-uniform':r=>r.signedMaxMoment,'simple-uniform':r=>r.maxDeflection*1000,
    'thermal-free':r=>r.freeExpansion*1000,'thermal-fixed':r=>r.stress/1e6,'thermal-prescribed':r=>r.stress/1e6,
    'compat-left':r=>r.N1,'compat-right':r=>r.N2,'compat-displacement':r=>r.displacement*1000,
    'combined-lower':r=>r.lowerStress/1e6,'combined-upper':r=>r.upperStress/1e6,'combined-torsion':r=>r.tau/1e6,'combined-mises':r=>r.vonMises/1e6
  };
  for(const course of ['beam-material','axial','stress-transform'])for(const l of lessons.create(course).levels){
    const r=(l.scene==='beam-material'?beam:lab).calculate(l.setup);close(values[l.concept](r),l.answer,1e-7);
  }
});
