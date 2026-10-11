'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),sandbox={window:{},document:{querySelector:()=>({}),querySelectorAll:()=>[]}};
vm.createContext(sandbox);
for(const f of fs.readdirSync(root).filter(f=>f.endsWith('curriculum.js')))vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),sandbox);
const source=fs.readFileSync(path.join(root,'playground.js'),'utf8');
const prefix=source.split('  let restored=false;')[0];
const helpers=source.slice(source.indexOf('  function backupPayload()'),source.indexOf('  const fmt='));
vm.runInContext(prefix+helpers+`let saved='',renders=0;function save(){saved=JSON.stringify(state)}function render(){renders++}window.api={base,importBackupText,backupPayload,set:s=>{state=s},get:()=>state,saved:()=>saved,renders:()=>renders};})();`,sandbox);
const api=sandbox.window.api;
const s=api.base();s.mode='free';s.curriculum='statics';s.scene='torsion';s.x=1.37;s.F=37;s.theta=42;s.torsion.torque=-125;s.slots={object:true};s.completed['statics-u0-l1']={independent:true,assisted:false,hintLevel:0};
api.set(s);const exported=api.backupPayload();api.set(api.base());api.importBackupText(exported);
assert.equal(JSON.stringify(api.get()),JSON.stringify(s),'restore exact saved parameters and free scene');
assert.equal(api.saved(),JSON.stringify(s));assert.equal(api.renders(),1);
const before=JSON.stringify(api.get());
for(const text of ['not-json','{}',JSON.stringify({...s,curriculum:'invalid'})])assert.throws(()=>api.importBackupText(text));
assert.equal(JSON.stringify(api.get()),before,'invalid imports cannot overwrite state');
const legacy={schema:3,mode:'free',level:0,unit:0,scene:'friction',x:1.2,F:33,theta:60,support:false,slots:{object:true},completed:s.completed};
api.importBackupText(JSON.stringify(legacy));assert.equal(api.get().scene,'friction');assert.equal(api.get().F,33);assert.equal(api.get().schema,4);assert.equal(api.get().completed['statics-u0-l1'].independent,true);
api.importBackupText(JSON.stringify({...legacy,mode:'teach',level:20,unit:4}));
assert.equal(api.get().level,20,'schema3 completed chapter sentinel must survive');
const snapshot=JSON.stringify(api.get()),persisted=api.saved(),renderCount=api.renders();
for(const envelope of [{format:'other',version:1,state:s},{format:'mechanics-playground-backup',version:2,state:s},{format:'mechanics-playground-backup',state:s}]){
 assert.throws(()=>api.importBackupText(JSON.stringify(envelope)),/格式或版本/);
 assert.equal(JSON.stringify(api.get()),snapshot);assert.equal(api.saved(),persisted);assert.equal(api.renders(),renderCount);
}
for(const key of ['completed','slots'])for(const bad of [null,[],false,'corrupt']){
 assert.throws(()=>api.importBackupText(JSON.stringify({...legacy,[key]:bad})),/校验失败/);
 assert.equal(JSON.stringify(api.get()),snapshot);assert.equal(api.saved(),persisted);assert.equal(api.renders(),renderCount);
}
const missing={...legacy};delete missing.completed;delete missing.slots;api.importBackupText(JSON.stringify(missing));
assert.equal(Object.keys(api.get().completed).length,0);assert.equal(Object.keys(api.get().slots).length,0);
console.log('PASS: executable backup round-trip preserves parameters, free scene, progress and schema3 data; invalid imports leave state intact');
