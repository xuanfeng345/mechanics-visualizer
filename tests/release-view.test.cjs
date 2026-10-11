'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const nodes={};function node(id){return nodes[id]||(nodes[id]={id,disabled:false,textContent:'',value:id==='scenePicker'?'lever':'',dataset:{},setAttribute(){},append(){},remove(){}})}
const document={querySelector(sel){if(sel==='[data-motion-readout]')return null;if(sel==='.controls .panel-head')return {append(x){this.child=x}};return node(sel.slice(1))},createElement(){return {dataset:{},className:'',textContent:'',remove(){}}}};
const engine={vectors:{vec:(x=0,y=0)=>({x,y})},dynamics:{rodRelease:()=>({angularAcceleration:0}),inclineRelease:()=>({acceleration:0})},release:{rodStep:(s,m,dt)=>({time:s.time+dt,phi:s.phi,omega:s.omega,angularAcceleration:m.angularAcceleration}),inclineStep:(s,m,dt)=>({time:s.time+dt,position:s.position,velocity:s.velocity,acceleration:m.acceleration})}};
const sandbox={window:{MechanicsEngine:engine},document,requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/release-view.js'),'utf8'),sandbox);
nodes.releaseBtn=node('releaseBtn');nodes.releaseBtn.onclick();assert.ok(nodes.statusTag.textContent.includes('释放观察'));assert.equal(nodes.pauseBtn.disabled,false);nodes.resetMotionBtn=node('resetMotionBtn');assert.equal(typeof nodes.resetMotionBtn.onclick,'function');nodes.pauseBtn.onclick();assert.equal(nodes.pauseBtn.textContent,'继续');
console.log('PASS: release-view wires rod release, pause and reset controls to browser engine');
