'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),core=require('../js/learning-core'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('small physical quantities cannot be passed with zero or an incorrect sign',()=>{
  const l={answer:.00625,tolerance:.01};assert.equal(core.grade(l,0),false);assert.equal(core.grade(l,-.00625),false);assert.equal(core.grade(l,.00625),true);assert.equal(core.grade(l,.0063),false);
  // Exercise the controller grading path too, rather than only the new pure helper.
  const source=fs.readFileSync(path.join(__dirname,'../js/playground.js'),'utf8'),nodes={'#answer':{value:'0'},'#answerMsg':{style:{},after(){}},'#nextLesson':{remove(){}}};let passed=0;
  const c={state:{wrong:0,hints:0},$:s=>nodes[s],current:()=>({...l,solution:'θ=TL/GJ'}),save(){},markComplete(){passed++},advance(){},document:{createElement:()=>({})}};vm.createContext(c);vm.runInContext(source.slice(source.indexOf('  function numeric('),source.indexOf('  function render(){')),c);c.submit();assert.equal(passed,0);assert.equal(c.state.wrong,1);nodes['#answer'].value='.00625';c.submit();assert.equal(passed,1);
});
test('each course has numerical variants and a valid conceptual assessment',()=>{
  for(const course of Object.keys(core.names))for(let seed=0;seed<7;seed++){
    const q=core.exercise(course,seed),p=core.framework(course,seed);assert.ok(q.question&&q.unit&&q.explanation);assert.ok(Number.isFinite(q.answer));assert.equal(core.grade(q,q.answer),true);assert.equal(core.grade(q,0),false);assert.ok(p.correct>=0&&p.correct<p.choices.length);assert.ok(p.explanation);
  }
  assert.equal(core.exercise('statics',0).answer,10);assert.equal(core.exercise('axial',0).answer,100);assert.equal(core.exercise('torsion',0).answer,.0025);assert.equal(core.exercise('lagrangian',0).answer,-.2);assert.equal(core.exercise('fatigue',0).answer,25);
  assert.equal(core.diagnose(5,-5).tag,'sign');assert.equal(core.diagnose(5,5000).tag,'units');
});
test('assistance and same-day repetitions cannot produce delayed review evidence',()=>{
  const at=100000000,id='statics-u0-l1',event=(kind,correct,assisted,time)=>({course:'statics',id,kind,correct,assisted,at:time,input:'10',tag:''});
  const events=[event('answer',false,false,at),event('answer',true,true,at+1)];let s=core.summary(events,at+2)[0];assert.equal(s.independent,false);assert.equal(s.needsPractice,true);
  events.push(event('answer',true,false,at+2));s=core.summary(events,at+3)[0];assert.equal(s.independent,true);assert.equal(s.needsPractice,false);assert.equal(s.due,false);
  events.push(event('review',true,false,at+100));assert.equal(core.summary(events,at+100)[0].reviews,0);
  events.push(event('review',true,false,at+100+core.DAY));s=core.summary(events,at+100+core.DAY)[0];assert.equal(s.reviews,1);assert.equal(s.dueAt,at+100+8*core.DAY);
});
test('new history survives backup round-trip; malformed or foreign events are rejected atomically',()=>{
  const c={window:{},document:{querySelector:()=>({}),querySelectorAll:()=>[]}};vm.createContext(c);
  for(const f of fs.readdirSync(path.join(__dirname,'../js')).filter(f=>f.endsWith('curriculum.js')))vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',f),'utf8'),c);
  const source=fs.readFileSync(path.join(__dirname,'../js/playground.js'),'utf8');vm.runInContext(source.split('  let restored=false;')[0]+"window.api={base,valid,mergeSaved};})();",c);
  const api=c.window.api,s=api.base();s.learning.events=[{course:'statics',id:'statics-u0-l1',kind:'answer',correct:true,assisted:false,at:123,input:'40/3',tag:''}];assert.equal(api.valid(JSON.parse(JSON.stringify(s))),true);
  const old=api.base();delete old.learning;assert.equal(api.valid(api.mergeSaved(old)),true);assert.equal(api.mergeSaved(old).learning.events.length,0);
  for(const change of [{id:'not-a-lesson'},{at:Infinity},{correct:'true'},{input:'x'.repeat(201)},{course:'__proto__'}]){const broken=JSON.parse(JSON.stringify(s));Object.assign(broken.learning.events[0],change);assert.equal(api.valid(broken),false);}
});
