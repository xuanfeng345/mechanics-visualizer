'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/engine-browser.js'),'utf8'),c);const e=c.window.MechanicsEngine;
for(const [method,state,model,fields,acc] of [['rodStep',{time:0,phi:0,omega:2},{angularAcceleration:3},['time','phi','omega'],'angularAcceleration'],['inclineStep',{time:0,position:0,velocity:2},{acceleration:3},['time','position','velocity'],'acceleration']]){
 for(const key of fields)for(const bad of [undefined,null,'0',NaN,Infinity])assert.throws(()=>e.release[method]({...state,[key]:bad},model,.1));
 for(const bad of [undefined,null,'0',NaN,Infinity])assert.throws(()=>e.release[method](state,{[acc]:bad},.1));
 const zero=e.release[method](state,model,0);for(const key of fields)assert.equal(zero[key],state[key]);
 assert.throws(()=>e.release[method](state,{[acc]:Number.MAX_VALUE},2));
}
assert.throws(()=>e.dynamics.rodRelease({length:Number.MAX_VALUE}));
assert.throws(()=>e.dynamics.inclineRelease({mass:Number.MAX_VALUE}));
for(const force of [{},{x:0},{y:0},null,[],{x:'0',y:0},{x:0,y:NaN}])assert.throws(()=>e.dynamics.rodRelease({force}));
assert.equal(e.dynamics.rodRelease().torque,e.dynamics.rodRelease({force:{x:0,y:0}}).torque,'omitted force and explicit complete zero force agree');
assert.equal(e.dynamics.rodRelease({force:{x:0,y:10},forceAt:2}).torque,0,'balancing applied force is preserved');
console.log('PASS: release rejects invalid states and overflowing results; zero timestep preserves physical state');
