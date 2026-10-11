'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const nodes=new Map();function node(s){if(!nodes.has(s))nodes.set(s,{value:s==='#scenePicker'?'lever':'',disabled:true,dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=v},append(e){this.child=e},remove(){}});return nodes.get(s)}
let id=0;const pending=new Map();const c={window:{},document:{querySelector:node,createElement:()=>({dataset:{}})},requestAnimationFrame:f=>{pending.set(++id,f);return id},cancelAnimationFrame:i=>pending.delete(i)};vm.createContext(c);
for(const f of ['engine-browser.js','release-view.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../'+f),'utf8'),c);
node('#releaseBtn').onclick();assert.equal(node('#resetMotionBtn').disabled,false);
for(let i=0;i<20;i++){const [key,fn]=pending.entries().next().value;pending.delete(key);fn()}
node('#resetMotionBtn').onclick();assert.equal(pending.size,0,'reset cancels animation');assert.equal(node('#beam').attrs.transform,'rotate(0 100 214)');assert.equal(node('#pauseBtn').textContent,'继续');assert.equal(node('#pauseBtn').disabled,false);
assert.ok(node('.controls .panel-head').child.textContent.includes('α=-7.36'),'reset recalculates initial angular acceleration');
node('#pauseBtn').onclick();assert.equal(pending.size,1);assert.equal(node('#pauseBtn').textContent,'暂停');
node('#releaseBtn').onclick();assert.equal(pending.size,1,'restart leaves only one animation loop');
console.log('PASS: first release enables reset; reset stops and restores initial acceleration; resume/restart use one loop');
