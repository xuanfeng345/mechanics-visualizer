'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../playground.js'),'utf8');
const a=source.indexOf("  $('#staticsCourseBtn').onclick"),b=source.indexOf("  $('#scenePicker').onchange",a);
const nodes=new Map(),node=s=>{if(!nodes.has(s))nodes.set(s,{textContent:'old feedback'});return nodes.get(s)};
const c={$:node,state:{},applySetup(){},render(){},save(){},notice(){}};vm.createContext(c);vm.runInContext(source.slice(a,b),c);
assert.equal([...nodes.keys()].filter(k=>k.endsWith('CourseBtn')).length,12);
for(const [id,button] of [...nodes]){if(!id.endsWith('CourseBtn'))continue;const completed={old:{independent:true}},axialCompleted={old:{assisted:true}};c.state={mode:'free',hints:4,wrong:7,slots:{object:true},completed,axialCompleted};button.onclick();assert.equal(c.state.mode,'teach');assert.equal(c.state.hints,0);assert.equal(c.state.wrong,0);assert.equal(Object.keys(c.state.slots).length,0);assert.equal(c.state.level,0);assert.equal(c.state.completed,completed);assert.equal(c.state.axialCompleted,axialCompleted);assert.equal(node('#cardFeedback').textContent,'');}
console.log('PASS: all 12 course switches start clean teaching attempts without touching completion records');
