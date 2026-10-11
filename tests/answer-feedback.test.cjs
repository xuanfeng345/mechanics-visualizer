'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(path.join(__dirname,'../playground.js'),'utf8'),a=s.indexOf('  function numeric('),b=s.indexOf('  function render(){',a);
const nodes={'#answer':{value:''},'#answerMsg':{style:{},after(){}},'#nextLesson':{remove(){}}};let saved=0,completed=0;
const c={state:{wrong:0},$:key=>nodes[key],current:()=>({answer:2000,solution:'正确解析'}),save:()=>saved++,markComplete:()=>completed++,advance(){},document:{createElement:()=>({})}};vm.createContext(c);vm.runInContext(s.slice(a,b),c);
for(const value of ['','2 N','1/0','2+3','NaN']){nodes['#answer'].value=value;c.submit();assert.equal(c.state.wrong,0);assert.equal(saved,0);assert.equal(completed,0);}
assert.ok(nodes['#answerMsg'].textContent.includes('不计为答错'));
nodes['#answer'].value='1999';c.submit();assert.equal(c.state.wrong,1);assert.equal(saved,1);assert.equal(completed,0);
nodes['#answer'].value='2e3';c.submit();assert.equal(completed,1);assert.equal(c.state.phase,'passed');assert.ok(nodes['#answerMsg'].textContent.includes('✓'));
console.log('PASS: invalid syntax has specific feedback without wrong-count inflation; valid wrong/correct answers retain grading');
