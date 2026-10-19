'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),packs=require('../js/formula-packs'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('every expanded scene has its own multi-step formula pack',()=>{
  assert.equal(packs.scenes.length,11);
  for(const scene of packs.scenes){const pack=packs.create(scene);assert.ok(pack.length>=3,scene);for(const [title,tex,caption,selector] of pack){assert.ok(title&&tex&&caption&&selector);assert.ok(!/[\x00-\x08\ufffd]/.test(tex),scene);assert.match(selector,/#alternateScene/);}}
  assert.equal(packs.create('unknown'),null);
});
test('vibration response switches with damping and separates Hz from radians per second',()=>{
  const make=damping=>packs.create('vibration',{mass:1,stiffness:100,damping});
  assert.match(make(0)[3][1],/x_0\\cos/);assert.match(make(2)[3][1],/omega_d/);assert.match(make(20)[3][1],/v_0\+\\omega_nx_0/);assert.match(make(30)[3][1],/r_\{1,2\}/);
  assert.match(make(0)[1][1],/\\mathrm\{Hz\}/);assert.match(make(0)[1][1],/2\\pi/);
  const source=fs.readFileSync(path.join(__dirname,'../js/playground.js'),'utf8');let rendered;
  const r=require('../js/vibration-scene').calculate({mass:1,stiffness:100,damping:0});
  const nodes=new Map(),$=s=>{if(!nodes.has(s))nodes.set(s,{});return nodes.get(s);};const c={state:{vibration:{mass:1,stiffness:100,damping:0}},window:{VibrationScene:{render:()=>r}},$};vm.createContext(c);
  vm.runInContext(source.slice(source.indexOf('  function renderVibration(){'),source.indexOf('  function renderRigidBody(){')),c);c.renderVibration();rendered=$('#reactionBox').textContent;
  assert.match(rendered,/ωₙ=10\.00 rad\/s/);assert.match(rendered,/fₙ=1\.59 Hz/);
});
test('kinematics steps describe the selected reference frame and trajectory',()=>{
  assert.match(packs.create('kinematics',{mode:'projectile'})[0][1],/-g/);
  assert.match(packs.create('kinematics',{mode:'circular'})[2][1],/omega\^2/);
  const relative=packs.create('kinematics',{mode:'relative'});assert.match(relative[2][1],/a_O/);assert.match(relative[0][2],/坐标轴方向保持不变/);
});
