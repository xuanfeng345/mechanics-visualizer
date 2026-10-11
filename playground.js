(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const {levels:staticsLevels,units:staticsUnits}=window.STATICS_CURRICULUM;
  const axial=window.AXIAL_CURRICULUM||{levels:[],units:[]};
  const kinematics=window.KINEMATICS_CURRICULUM||{levels:[],units:[]};
  const particleDynamics=window.PARTICLE_DYNAMICS_CURRICULUM||{levels:[],units:[]};
  const rigidBody=window.RIGID_BODY_CURRICULUM||{levels:[],units:[]};
  const vibration=window.VIBRATION_CURRICULUM||{levels:[],units:[]};
  const torsion=window.TORSION_CURRICULUM||{levels:[],units:[]};
  const stressTransform=window.STRESS_TRANSFORM_CURRICULUM||{levels:[],units:[]};
  const beamMaterial=window.BEAM_MATERIAL_CURRICULUM||{levels:[],units:[]};
  const buckling=window.BUCKLING_CURRICULUM||{levels:[],units:[]};
  const fatigue=window.FATIGUE_CURRICULUM||{levels:[],units:[]};
  const lagrangian=window.LAGRANGIAN_CURRICULUM||{levels:[],units:[]};
  const KEY='mechanics-playground-v3';
  const scenes=['lever','support','beam','friction','material','axial-bar','kinematics','particle-dynamics','rigid-body','vibration','lagrangian','torsion','stress-transform','beam-material','buckling','fatigue'];
  const base=()=>({schema:4,curriculum:'statics',stressTransform:{sigmaX:80,sigmaY:20,tauXY:30,angle:0,yieldStress:250,safetyFactor:1.5},stressTransformCompleted:{},beamMaterial:{span:4,load:20000,position:1,youngsModulus:200000000000,inertia:0.000008,sectionDistance:0.05},beamMaterialCompleted:{},buckling:{youngsModulus:200000000000,inertia:0.000001,length:3,effectiveLengthFactor:1,area:.001,load:10000},bucklingCompleted:{},fatigue:{stressAmplitude:180,referenceStress:300,referenceCycles:100000,exponent:0.12,enduranceLimit:0,meanStress:0,ultimateStrength:600,safetyFactor:1},fatigueCompleted:{},torsion:{torque:100,radius:.02,length:1,shearModulus:80e9,yieldShear:150e6,safetyFactor:1.5},torsionCompleted:{},vibration:{mass:1,stiffness:100,damping:0,initialDisplacement:.1,initialVelocity:0,time:0},vibrationCompleted:{},lagrangian:{mass:1,stiffness:100,initialCoordinate:.1,initialVelocity:0,time:1},lagrangianCompleted:{},rigidCompleted:{},particleDynamics:{force:{x:10,y:0},mass:2,velocity:{x:0,y:0},dt:2},dynamicsCompleted:{},kinematics:{mode:'projectile',vx:20,vy:20,g:9.81,t:2,radius:2,omega:3},kinematicsCompleted:{},mode:'teach',level:0,unit:0,phase:'op',scene:'lever',x:.8,F:20,theta:90,support:true,beam:{a:1,P:20},friction:{alpha:30,mu:.4},material:{E:200000,yield:250,maxStrain:.002,H:1000},axial:{force:30000,area:200,length:1000,youngsModulus:200000,yieldStress:235,safetyFactor:1.5},completed:{},axialCompleted:{},hints:0,wrong:0,slots:{}});
  const isAxial=()=>state.curriculum==='axial';
  const isKinematics=()=>state.curriculum==='kinematics';
  const isParticleDynamics=()=>state.curriculum==='particle-dynamics';
  const isRigidBody=()=>state.curriculum==='rigid-body';
  const isVibration=()=>state.curriculum==='vibration';
  const isLagrangian=()=>state.curriculum==='lagrangian';
  const isTorsion=()=>state.curriculum==='torsion';
  const isStressTransform=()=>state.curriculum==='stress-transform';
  const isBeamMaterial=()=>state.curriculum==='beam-material';
  const isBuckling=()=>state.curriculum==='buckling';
  const isFatigue=()=>state.curriculum==='fatigue';
  const activeLevels=()=>isAxial()?axial.levels:isKinematics()?kinematics.levels:isParticleDynamics()?particleDynamics.levels:isRigidBody()?rigidBody.levels:isVibration()?vibration.levels:isLagrangian()?lagrangian.levels:isTorsion()?torsion.levels:isStressTransform()?stressTransform.levels:isBeamMaterial()?beamMaterial.levels:isBuckling()?buckling.levels:isFatigue()?fatigue.levels:staticsLevels;
  const activeUnits=()=>isAxial()?axial.units:isKinematics()?kinematics.units:isParticleDynamics()?particleDynamics.units:isRigidBody()?rigidBody.units:isVibration()?vibration.units:isLagrangian()?lagrangian.units:isTorsion()?torsion.units:isStressTransform()?stressTransform.units:isBeamMaterial()?beamMaterial.units:isBuckling()?buckling.units:isFatigue()?fatigue.units:staticsUnits;
  const activeRecord=()=>isAxial()?state.axialCompleted:isKinematics()?state.kinematicsCompleted:isParticleDynamics()?state.dynamicsCompleted:isRigidBody()?state.rigidCompleted:isVibration()?state.vibrationCompleted:isLagrangian()?state.lagrangianCompleted:isTorsion()?state.torsionCompleted:isStressTransform()?state.stressTransformCompleted:isBeamMaterial()?state.beamMaterialCompleted:isBuckling()?state.bucklingCompleted:isFatigue()?state.fatigueCompleted:state.completed;
  let state=base();
  const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
  const notice=t=>$('#interactionNotice').textContent=t;
  function applySetup() {
    const l=activeLevels()[state.level];if(!l)return;
    state.scene=l.scene;state.x=.8;
    if(state.scene==='axial-bar'){state.axial={...base().axial,...(l.setup||{})};return;}
    if(state.scene==='kinematics'){state.kinematics={...base().kinematics,...(l.setup||{})};return;}
    if(state.scene==='particle-dynamics'){state.particleDynamics={...base().particleDynamics,...(l.setup||{})};return;}
    if(state.scene==='vibration'){state.vibration={...base().vibration,...(l.setup||{})};return;}
    if(state.scene==='lagrangian'){state.lagrangian={...base().lagrangian,...(l.setup||{})};return;}
    if(state.scene==='torsion'){state.torsion={...base().torsion,...(l.setup||{})};return;}
    if(state.scene==='stress-transform'){state.stressTransform={...base().stressTransform,...(l.setup||{})};return;}
    if(state.scene==='beam-material'){state.beamMaterial={...base().beamMaterial,...(l.setup||{})};return;}
    if(state.scene==='buckling'){state.buckling={...base().buckling,...(l.setup||{})};return;}
    if(state.scene==='fatigue'){state.fatigue={...base().fatigue,...(l.setup||{})};return;}
    state.F=20;state.theta=90;state.support=true;
    state.beam={a:1,P:20};state.friction={alpha:30,mu:.4};state.material={E:200000,yield:250,maxStrain:.002,H:1000};
    const p=l.setup||{};
    if(p.material)state.material={...state.material,...p.material};
    for(const k of ['x','F','theta','support']) if(p[k]!==undefined) state[k]=p[k];
    for(const k of ['a','P']) if(p[k]!==undefined) state.beam[k]=p[k];
    for(const k of ['alpha','mu']) if(p[k]!==undefined) state.friction[k]=p[k];
  }
  const courseRecords={statics:[{levels:staticsLevels,units:staticsUnits},'completed'],axial:[axial,'axialCompleted'],kinematics:[kinematics,'kinematicsCompleted'],'particle-dynamics':[particleDynamics,'dynamicsCompleted'],'rigid-body':[rigidBody,'rigidCompleted'],vibration:[vibration,'vibrationCompleted'],lagrangian:[lagrangian,'lagrangianCompleted'],torsion:[torsion,'torsionCompleted'],'stress-transform':[stressTransform,'stressTransformCompleted'],'beam-material':[beamMaterial,'beamMaterialCompleted'],buckling:[buckling,'bucklingCompleted'],fatigue:[fatigue,'fatigueCompleted']};
  const recordObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  function mergeSaved(saved){
    const defaults=base(),merged={...defaults,...saved};
    for(const [key,value] of Object.entries(defaults))if(recordObject(value)&&saved[key]===undefined)merged[key]={...value};
    return merged;
  }
  function valid(s) {
    const course=s&&courseRecords[s.curriculum||'statics']?.[0];
    return s&&(s.schema===3||s.schema===4)&&['statics','axial','kinematics','particle-dynamics','rigid-body','vibration','lagrangian','torsion','stress-transform','beam-material','buckling','fatigue'].includes(s.curriculum||'statics')&&['teach','free'].includes(s.mode)&&scenes.includes(s.scene)
      &&Number.isInteger(s.level)&&finite(s.level,0,course.levels.length)&&Number.isInteger(s.unit)&&finite(s.unit,0,course.units.length-1)
      &&['op','answer','passed'].includes(s.phase)&&finite(s.x,.2,2)&&finite(s.F,0,80)&&finite(s.theta,0,180)&&typeof s.support==='boolean'
      &&s.beam&&finite(s.beam.a,.2,3.8)&&finite(s.beam.P,0,60)&&s.friction&&finite(s.friction.alpha,0,60)&&finite(s.friction.mu,0,1)&&s.material&&finite(s.material.E,1,1000000)&&finite(s.material.yield,0.001,100000)&&finite(s.material.maxStrain,0.000001,1)&&finite(s.material.H,0,1000000)&&s.axial&&finite(s.axial.force,-1000000,1000000)&&finite(s.axial.area,0.001,1000000)&&finite(s.axial.length,0.001,1000000)&&finite(s.axial.youngsModulus,1,1000000)&&finite(s.axial.yieldStress,0.001,1000000)&&finite(s.axial.safetyFactor,0.001,100)&&s.kinematics&&['projectile','circular','relative'].includes(s.kinematics.mode)&&finite(s.kinematics.vx,-10000,10000)&&finite(s.kinematics.vy,-10000,10000)&&finite(s.kinematics.g,0,1000)&&finite(s.kinematics.t,0,10000)&&finite(s.kinematics.radius,0.001,100000)&&finite(s.kinematics.omega,-10000,10000)
      &&Number.isInteger(s.hints)&&finite(s.hints,0,4)&&Number.isInteger(s.wrong)&&finite(s.wrong,0,100000)
      &&s.completed&&typeof s.completed==='object'&&!Array.isArray(s.completed)
      &&Object.values(courseRecords).every(([pack,key])=>recordObject(s[key])&&Object.entries(s[key]).every(([id,v])=>pack.levels.some(l=>l.id===id)&&v&&typeof v.independent==='boolean'&&typeof v.assisted==='boolean'&&finite(v.hintLevel,0,4)))
      &&s.slots&&typeof s.slots==='object'&&!Array.isArray(s.slots);
  }
  let restored=false;
  try {
    const saved=JSON.parse(localStorage.getItem(KEY));
    if(saved&&saved.schema===3){const migrated=migrateLegacyState(saved);if(!valid(migrated))throw new Error('旧存档校验失败');state=migrated;restored=true;notice('已迁移静力学进度；材料力学章节保持独立记录。');}
    else if(saved&&saved.schema===4&&valid(mergeSaved(saved))){state=mergeSaved(saved);restored=true;}
    else {
      const old=JSON.parse(localStorage.getItem('mechanics-playground-v2'));
      if(old&&Array.isArray(old.done)) notice(`旧样板完成 ${old.done.length}/3 关，原记录保留。扩展课程从第一关开始，不将旧进度算成新关掌握。`);
    }
  } catch {notice('未能读取本地进度，已安全启动新学习。');}
  if(!restored)applySetup();
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{notice('当前浏览器不允许保存进度；仍可使用，关闭页面后可能无法恢复。');}}
  function backupPayload(){return JSON.stringify({format:'mechanics-playground-backup',version:1,exportedAt:new Date().toISOString(),state},null,2);}
  function exportBackup(){const blob=new Blob([backupPayload()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mechanics-playground-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);notice('备份已导出；请将JSON文件保存到安全位置。');}
  function migrateLegacyState(saved){const migrated=base();migrated.mode=saved.mode||'teach';migrated.level=Math.min(saved.level||0,staticsLevels.length);migrated.unit=Math.min(saved.unit||0,staticsUnits.length-1);migrated.phase=['op','answer','passed'].includes(saved.phase)?saved.phase:'op';migrated.scene=scenes.includes(saved.scene)?saved.scene:'lever';for(const k of ['x','F','theta','support'])if(saved[k]!==undefined)migrated[k]=saved[k];migrated.completed=saved.completed===undefined?{}:saved.completed;migrated.slots=saved.slots===undefined?{}:saved.slots;return migrated;}
  function importBackupText(text){let payload;try{payload=JSON.parse(text);}catch{throw new Error('备份不是有效JSON');}if(payload&&Object.prototype.hasOwnProperty.call(payload,'format')&&(payload.format!=='mechanics-playground-backup'||payload.version!==1))throw new Error('不支持的备份格式或版本，未修改当前进度');const candidate=payload&&payload.format==='mechanics-playground-backup'?payload.state:payload;if(!candidate||![3,4].includes(candidate.schema))throw new Error('仅支持schema 3/4操练场备份');const migrated=candidate.schema===3?migrateLegacyState(candidate):mergeSaved(candidate);if(!valid(migrated))throw new Error('备份校验失败，未修改当前进度');state=migrated;save();render();notice('备份已导入；当前课程进度与卡牌记录已恢复。');}

  const fmt=n=>(Math.abs(n)<.005?0:n).toFixed(2);
  function values(){const a=state.theta*Math.PI/180,fx=state.F*Math.cos(a),fy=state.F*Math.sin(a);return{fx,fy,m:state.x*fy-20,rx:-fx,ry:20-fy};}
  function calcLever(){
    const v=values(),mok=Math.abs(v.m)<.2,ok=mok&&(state.support||Math.hypot(v.fx,v.fy-20)<.2);
    $$('#scene .support,#scene .hinge').forEach(e=>e.style.visibility=state.support?'visible':'hidden');
    $('#sumFx').textContent=fmt(v.fx)+' N';$('#sumFy').textContent=fmt(v.fy-20)+' N';$('#moment').textContent=fmt(v.m)+' N·m';$('#equilibrium').textContent=ok?'平衡':'未平衡';
    $('#equilibrium').dataset.balanced=String(ok);
    $('#statusTag').textContent=ok?'静力快照 · 平衡':state.support?`静力快照 · 释放后${v.m>0?'逆':'顺'}时针加速`:'静力快照 · 不平衡，未模拟运动';
    $('#reaction').style.display=state.support&&mok?'':'none';
    for(const [axis,val]of[['x',v.rx],['y',v.ry]]){
      const line=$('#r'+axis+'Line'),text=$('#r'+axis+'Text');
      const end=axis==='x'?100+Math.max(-55,Math.min(55,val*2)):214-Math.max(-55,Math.min(55,val*2));
      line.setAttribute(axis+'2',end);line.style.display=text.style.display=Math.abs(val)>.1?'':'none';
      text.setAttribute('x',axis==='x'?end:112);text.setAttribute('y',axis==='y'?end:207);
    }
    $('#reactionBox').textContent=state.support?(mok?`静力支反力 Rx=${fmt(v.rx)} N，Ry=${fmt(v.ry)} N。`:'合矩不为零，不将候选反力称作静力解。'):`无支座外力残差：Fx=${fmt(v.fx)} N；Fy=${fmt(v.fy-20)} N。`;
    $('#explain').textContent='杆长2 m，重力20 N在中点。逆时针为正：M_A=xFsinθ−20。箭头长度仅示意；不平衡时不伪造静止求解或动力动画。';
    const px=100+state.x*290,a=state.theta*Math.PI/180,len=Math.min(78,state.F*2),ex=px+Math.cos(a)*len,ey=214-Math.sin(a)*len;
    for(const [id,attrs]of[['pointHandle',{cx:px,cy:214}],['forceLine',{x1:px,y1:214,x2:ex,y2:ey}],['forceLabel',{x:ex+8,y:ey-6}],['xLabel',{x:px}]]) for(const [k,v]of Object.entries(attrs))$('#'+id).setAttribute(k,v);
    $('#forceLine').style.visibility=state.F?'visible':'hidden';
    $('#xOut').textContent=fmt(state.x)+' m';$('#fOut').textContent=fmt(state.F)+' N';$('#thetaOut').textContent=fmt(state.theta)+'°';$('#fNumber').value=state.F;
  }
  function altDraw(){
    if(state.scene==='material'){renderMaterial();return;}
    if(state.scene==='axial-bar'){renderAxial();return;}
    if(state.scene==='kinematics'){renderKinematics();return;}
    if(state.scene==='particle-dynamics'){renderParticleDynamics();return;}
    if(state.scene==='rigid-body'){renderRigidBody();return;}
    if(state.scene==='vibration'){renderVibration();return;}
    if(state.scene==='lagrangian'){renderLagrangian();return;}
    if(state.scene==='torsion'){renderTorsion();return;}
    if(state.scene==='stress-transform'){renderStressTransform();return;}
    if(state.scene==='beam-material'){renderBeamMaterial();return;}
    if(state.scene==='buckling'){renderBuckling();return;}
    if(state.scene==='fatigue'){renderFatigue();return;}
    const p=state.scene==='beam'?state.beam:state.friction;
    window.StaticsScenes.render(state.scene,$('#alternateScene'),p);
    const c=window.StaticsScenes.calculate(state.scene,p);
    $('#statusTag').textContent={beam:'简支梁 · kN / m',friction:c.static?'静力快照 · 静摩擦可阻止下滑':'静力快照 · 无法静止，未模拟下滑',support:'平面约束 · 方向示意'}[state.scene];
    $('#explain').textContent=window.StaticsScenes.descriptions[state.scene]||'理想平面约束示意。';
    $('#reactionBox').textContent=state.scene==='beam'?`RA=${fmt(c.RA)} kN，RB=${fmt(c.RB)} kN，Mmax=${fmt(c.Mmax)} kN·m。`:
      state.scene==='friction'?`N=${fmt(c.N)} N；所需静摩擦=${fmt(c.driving)} N；上限=${fmt(c.maxF)} N。${c.static?'可以静止，实际摩擦按需求取值。':'不能保持静止；未指定动摩擦系数，不计算滑动摩擦或运动。'}`:'固定铰：两个力分量；水平滚动支座：竖直反力；固定端：两个力分量与一个约束力矩。';
  }
  function renderFatigue(){const p=state.fatigue,r=window.FatigueScene.render($('#alternateScene'),p);$('#statusTag').textContent='材料力学 · 疲劳强度';$('#explain').textContent='当前采用Basquin S-N曲线与简单Goodman均值应力修正；实际疲劳寿命还受缺口、表面、载荷谱和环境影响。';$('#reactionBox').textContent=`修正应力幅=${r.effectiveAmplitude.toFixed(2)} MPa；寿命=${Number.isFinite(r.cycles)?r.cycles.toExponential(3):'∞'} cycles。`;}
  function renderBuckling(){const p=state.buckling,r=window.BucklingScene.render($('#alternateScene'),p);$('#statusTag').textContent='材料力学 · 屈曲稳定';$('#explain').textContent='Euler理想长柱模型适用于细长弹性柱；实际缺陷、残余应力和短柱规范需另行处理。';$('#reactionBox').textContent=`Pcr=${r.criticalLoad.toExponential(3)} N；Le=${r.effectiveLength.toFixed(3)} m；λ=${r.slenderness.toFixed(2)}；利用率=${r.utilization.toFixed(3)}。`;}
  function renderBeamMaterial(){const p=state.beamMaterial,r=window.BeamMaterialScene.render($('#alternateScene'),p);$('#statusTag').textContent='材料力学 · 梁弯曲';$('#explain').textContent='简支梁点载荷的反力、剪力、弯矩、弯曲应力和挠度。采用 Euler–Bernoulli、小挠度假设。';$('#reactionBox').textContent=`RA=${r.RA.toFixed(2)} N；RB=${r.RB.toFixed(2)} N；Mmax=${r.Mmax.toFixed(2)} N·m；σmax=${r.maxStress.toFixed(2)} Pa。`;}
  function renderStressTransform(){const p=state.stressTransform,r=window.StressTransformScene.calculate(p);window.StressTransformScene.render($('#alternateScene'),p);$('#statusTag').textContent='材料力学 · 组合应力';$('#explain').textContent='平面应力可通过应力变换求主应力、最大剪应力和 von Mises 等效应力。';$('#reactionBox').textContent=`σ1=${r.sigma1.toFixed(2)} MPa；σ2=${r.sigma2.toFixed(2)} MPa；面内 τmax=${r.maxShearInPlane.toFixed(2)} MPa；三维 τmax=${r.absoluteMaxShear.toFixed(2)} MPa；von Mises=${r.vonMises.toFixed(2)} MPa。`;}
  function renderTorsion(){const p=state.torsion,r=window.TorsionScene.render($('#alternateScene'),p);$('#statusTag').textContent='材料力学 · 圆轴扭转';$('#explain').textContent='实心圆轴：J=πr⁴/2，τ=Tr/J，φ=TL/(GJ)。当前采用线弹性 Saint-Venant 假设。';$('#reactionBox').textContent=`J=${r.polarInertia.toExponential(3)} m⁴；τmax=${r.maxShearStress.toExponential(3)} Pa；φ=${(r.twist??r.angle).toExponential(3)} rad。`;}
  function renderLagrangian(){const p=state.lagrangian,r=window.LagrangianScene.render($('#alternateScene'),p);$('#statusTag').textContent='分析力学 · 拉格朗日方程';$('#explain').textContent='以广义坐标建立动能、势能和拉格朗日量，再由欧拉—拉格朗日方程求运动。';$('#reactionBox').textContent=`q=${r.coordinate.toFixed(3)}；q̇=${r.velocity.toFixed(3)}；L=${r.lagrangian.toFixed(3)}；E=${r.energy.toFixed(3)}。`;}
  function renderVibration(){const p=state.vibration,r=window.VibrationScene.render($('#alternateScene'),p);$('#statusTag').textContent='振动基础 · 单自由度';$('#explain').textContent='当前场景采用线性单自由度自由振动解析解；阻尼和受迫响应需明确模型假设。';$('#reactionBox').textContent=`ωₙ=${r.naturalFrequency.toFixed(2)} rad/s；T=${r.period.toFixed(2)} s；x=${r.displacement.toFixed(3)} m；能量=${r.energy.toFixed(3)} J。`;}
  function renderRigidBody(){const p=state.rigidBody,r=window.RigidBodyScene.render($('#alternateScene'),p);$('#statusTag').textContent='刚体动力学 · 平面运动';$('#explain').textContent='刚体的质心平动与绕质心转动可以分别建立方程。';$('#reactionBox').textContent=`a=${r.acceleration.toFixed(2)} m/s²；α=${r.angularAcceleration.toFixed(2)} rad/s²；v=${r.velocity.toFixed(2)} m/s；ω=${r.angularVelocity.toFixed(2)} rad/s。`;}
  function renderParticleDynamics(){const p=state.particleDynamics,host=$('#alternateScene'),r=window.ParticleDynamicsScene.calculate(p);window.ParticleDynamicsScene.render(host,p);$('#statusTag').textContent='质点动力学 · 恒力步进';$('#explain').textContent='牛顿第二定律、功和能、冲量与动量使用同一恒力步进状态。';$('#reactionBox').textContent=`a=(${r.acceleration.x.toFixed(2)}, ${r.acceleration.y.toFixed(2)}) m/s²；v=(${r.velocity.x.toFixed(2)}, ${r.velocity.y.toFixed(2)}) m/s；动能=${r.kineticEnergy.toFixed(2)} J；功=${r.work.toFixed(2)} J。`;}
  function renderKinematics(){const p=state.kinematics,host=$('#alternateScene'),r=window.KinematicsScene.calculate(p);window.KinematicsScene.render(host,p);$('#statusTag').textContent='运动学 · '+(p.mode==='projectile'?'抛体运动':p.mode==='circular'?'匀速圆周运动':'相对运动');$('#explain').textContent='运动学只描述位置、速度和加速度，不直接讨论力。当前场景采用解析运动学关系。';$('#reactionBox').textContent=`位置 (${r.position.x.toFixed(2)}, ${r.position.y.toFixed(2)})；速度 (${r.velocity.x.toFixed(2)}, ${r.velocity.y.toFixed(2)})；加速度 (${r.acceleration.x.toFixed(2)}, ${r.acceleration.y.toFixed(2)})。`;}
  function renderAxial(){const p=state.axial,host=$('#alternateScene'),r=window.AxialScene.calculate(p);window.AxialScene.render(host,p);$('#statusTag').textContent=r.elastic?'轴向杆 · 弹性范围':'轴向杆 · 超过许用范围';$('#explain').textContent='平均正应力 σ=N/A；应变 ε=σ/E；伸长 δ=εL。单位采用 N、mm²、mm、MPa。';$('#reactionBox').textContent=`σ=${r.stress.toFixed(2)} MPa；ε=${r.strain.toExponential(3)}；δ=${r.elongation.toFixed(3)} mm；利用率=${r.utilization.toFixed(3)}。`;}
  function renderMaterial(){const p=state.material,host=$('#alternateScene');const n=41,max=Math.max(p.maxStrain,p.yield/p.E*1.5),pts=[];for(let i=0;i<n;i++){const e=-max+2*max*i/(n-1),s=Math.abs(e)<=p.yield/p.E?p.E*e:Math.sign(e)*(p.yield+p.H*(Math.abs(e)-p.yield/p.E));pts.push([e,s]);}const W=720,H=280,px=e=>60+(e+max)/(2*max)*600,py=s=>245-s/(p.yield+p.H*max)*170;host.innerHTML=`<svg class="material-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="双线性应力应变曲线"><line x1="60" y1="245" x2="680" y2="245" class="chart-axis"/><line x1="60" y1="30" x2="60" y2="245" class="chart-axis"/><polyline points="${pts.map(q=>px(q[0])+','+py(q[1])).join(' ')}" class="stress-line"/><line x1="${px(-p.yield/p.E)}" y1="30" x2="${px(-p.yield/p.E)}" y2="245" class="yield-line"/><line x1="${px(p.yield/p.E)}" y1="30" x2="${px(p.yield/p.E)}" y2="245" class="yield-line"/><text x="70" y="24">σ—ε · E=${p.E} MPa · σᵧ=${p.yield} MPa</text><text x="665" y="266">ε</text><text x="36" y="38">σ</text></svg>`;$('#statusTag').textContent='材料试验 · 双线性本构';$('#explain').textContent='弹性区斜率为 E；超过屈服应变后进入线性强化区。当前模型用于教学，不代表完整循环塑性。';$('#reactionBox').textContent=`屈服应变 εᵧ=${(p.yield/p.E).toExponential(3)}；强化模量 H=${p.H} MPa。`}
  function renderScene(){
    const lever=state.scene==='lever';$('#scene').toggleAttribute('hidden',!lever);$('#alternateScene').hidden=lever;$('#alternateControls').hidden=lever;
    $$('.readouts,.control-grid').forEach(el=>el.hidden=!lever);
    $('.controls .hint').textContent=lever?'拖动圆点改变作用点，或用滑块与精确输入框。角度从杆的正向逆时针计。':'图中是当前参数；迁移题明确给定的条件可以不同。';
    $('#scenePicker').value=state.scene;$('#scenePicker').disabled=state.mode==='teach';
    $('#lockHint').textContent=state.mode==='teach'?'本关所需器件可直接使用；自由模式可预览全部器件。':'自由实验开放全部器件，不影响教学记录。';
    $('#openAll').classList.toggle('hidden',state.mode==='free');
    if(lever){for(const[id,key]of[['xRange','x'],['fRange','F'],['thetaRange','theta']]){$('#'+id).value=state[key];$('#'+id).disabled=false;}$('#supportToggle').checked=state.support;$('#supportToggle').disabled=false;calcLever();return;}
    const config=state.scene==='beam'?[['a','距左支座 a',.2,3.8,.01,'m'],['P','集中荷载 P',0,60,.1,'kN']]:state.scene==='friction'?[['alpha','斜面角 α',0,60,.1,'°'],['mu','静摩擦系数 μ',0,1,.01,'']]:state.scene==='material'?[['E','弹性模量 E',1000,400000,1000,'MPa'],['yield','屈服应力 σᵧ',10,1000,10,'MPa'],['maxStrain','最大应变',.0005,.02,.0005,''],['H','强化模量 H',0,50000,1000,'MPa']]:state.scene==='kinematics'?[['vx','水平初速度 vx',-100,100,1,'m/s'],['vy','竖直初速度 vy',-100,100,1,'m/s'],['g','重力加速度 g',0,20,.1,'m/s²'],['t','时间 t',0,20,.1,'s'],['radius','半径 r',.1,20,.1,'m'],['omega','角速度 ω',-20,20,.1,'rad/s']]:state.scene==='particle-dynamics'?[['force','合力 Fx',-100,100,1,'N'],['mass','质量 m',.1,20,.1,'kg'],['dt','时间步长 Δt',0,10,.1,'s'],['velocityX','初速度 vx',-50,50,1,'m/s']]:state.scene==='beam-material'?[['span','梁长 L',1,10,.1,'m'],['load','集中载荷 P',1,100000,.1,'N'],['position','载荷位置 a',.1,9.9,.1,'m'],['youngsModulus','弹性模量 E',1e9,3e11,1e9,'Pa'],['inertia','截面惯性矩 I',1e-8,.001,1e-8,'m⁴'],['sectionDistance','截面距离 c',.001,.5,.001,'m']]:state.scene==='torsion'?[['torque','扭矩 T',-10000,10000,10,'N·m'],['radius','半径 r',.001,.2,.001,'m'],['length','轴长 L',.1,10,.1,'m'],['shearModulus','剪切模量 G',1e9,1e11,1e9,'Pa']]:state.scene==='buckling'?[['youngsModulus','弹性模量 E',1e9,3e11,1e9,'Pa'],['inertia','惯性矩 I',1e-8,.001,1e-8,'m⁴'],['length','柱长 L',.5,10,.1,'m'],['effectiveLengthFactor','有效长度系数 K',.5,2,.1,''],['area','截面积 A',1e-5,.1,1e-5,'m²'],['load','工作压力 P',0,1e6,1000,'N']]:state.scene==='stress-transform'?[['sigmaX','σx',-500,500,1,'MPa'],['sigmaY','σy',-500,500,1,'MPa'],['tauXY','τxy',-500,500,1,'MPa'],['angle','旋转角 θ',-90,90,1,'°']]:state.scene==='fatigue'?[['stressAmplitude','应力幅',0,500,1,'MPa'],['meanStress','平均应力',-200,500,1,'MPa'],['exponent','正指数 β（教材 b=-β）',.02,.5,.01,''],['enduranceLimit','疲劳极限（0关闭）',0,300,1,'MPa'],['safetyFactor','安全系数',1,3,.1,'']]:state.scene==='axial-bar'?[['force','轴力 N',-100000,100000,100,'N'],['area','截面积 A',1,1000,1,'mm²'],['length','长度 L',100,3000,10,'mm'],['youngsModulus','弹性模量 E',1000,400000,1000,'MPa'],['yieldStress','屈服应力 σᵧ',10,1000,10,'MPa'],['safetyFactor','安全系数 n',1,5,.1,'']]:[];
    const p=state.scene==='beam'?state.beam:state.scene==='friction'?state.friction:state.scene==='material'?state.material:state.scene==='kinematics'?state.kinematics:state.scene==='particle-dynamics'?state.particleDynamics:state.scene==='rigid-body'?state.rigidBody:state.scene==='vibration'?state.vibration:state.scene==='lagrangian'?state.lagrangian:state.scene==='torsion'?state.torsion:state.scene==='stress-transform'?state.stressTransform:state.scene==='beam-material'?state.beamMaterial:state.scene==='buckling'?state.buckling:state.scene==='fatigue'?state.fatigue:state.axial;
    $('#alternateControls').innerHTML=config.length?config.map(([k,n,min,max,step,u])=>`<label>${n}<output id="alt-${k}">${fmt(p[k])} ${u}</output><input type="range" data-alt-param="${k}" min="${min}" max="${max}" step="${step}" value="${p[k]}" aria-label="${n}"></label>`).join(''):'<p>比较三种约束的反力与自由度；此图为概念示意，无参数需要调整。</p>';
    $$('[data-alt-param]').forEach(el=>el.oninput=()=>{const k=el.dataset.altParam;p[k]=Number(el.value);const u=config.find(c=>c[0]===k)[5];$('#alt-'+k).textContent=fmt(p[k])+' '+u;altDraw();save();});
    altDraw();
  }
  const current=()=>activeLevels()[state.level];
  function enter(n){state.level=n;state.unit=activeLevels()[n].unit;state.mode='teach';state.phase='op';state.hints=0;state.wrong=0;state.slots={};applySetup();$('#cardFeedback').textContent='';render();save();}
  function advance(){const n=state.level+1;if(n<activeLevels().length)enter(n);else{state.level=activeLevels().length;state.phase='op';render();save();}}
  function renderLevels(){
    const units=activeUnits();
    $('#unitSelect').innerHTML=units.map((n,i)=>`<option value="${i}">${i+1} · ${n}</option>`).join('');$('#unitSelect').value=state.unit;
    $('#levelList').innerHTML=activeLevels().map((l,i)=>({l,i})).filter(({l})=>l.unit===state.unit).map(({l,i})=>{
      const c=activeRecord()[l.id];return `<button class="progress-item ${i===state.level?'current':''} ${c?'done':''}" data-level="${i}"><span class="num">${c?'✓':i+1}</span><span>${l.title}</span><small>${c?(c.independent?'独立完成 · 可复习':'辅助完成 · 待独立复习'):'可挑战'}</small></button>`;
    }).join('');
    $$('[data-level]').forEach(b=>b.onclick=()=>{enter(Number(b.dataset.level));notice('已进入关卡。可自由选择单元，推荐按顺序学习；新尝试从零级提示开始。');});
    const record=activeRecord(),total=Object.keys(record).length,independent=Object.values(record).filter(c=>c.independent).length;
    $('#progressText').textContent=`${total}/${activeLevels().length} · 独立 ${independent}`;
  }
  function renderCards(){
    const entries=[['object','研究对象',state.scene==='friction'?'研究斜面上的块体。重力、法向反力与摩擦均为外力。':state.scene==='beam'?'研究整根简支梁。不要将支座反力与外加集中载荷混淆。':'先隔离研究对象，再将约束替换为正确的反力。'],['condition','适用条件',$('#explain').textContent],['balance','平衡关系',state.scene==='friction'?'静摩擦大小按需要取值；只有达到临界时才等于 μN。':'平面刚体静止：ΣFx=0，ΣFy=0，ΣM=0。'],['moment','方法选择',state.scene==='friction'?'沿斜面和法向分解，先求 N，再比较下滑分量与 μN。':'优先选能消去未知力的点取矩，但所有平衡条件仍需满足。'],['check','结果检查','检查单位、正负方向、适用条件。提示不扣分；完整讲解后建议再做独立复习。']];
    const methods={
      kinematics:['质点轨迹与参考系','运动学描述位置、速度和加速度，不需要先假设合力为零。','先选参考系，再对位置求时间导数或按给定运动规律计算。'],
      'particle-dynamics':['受合外力的质点','合外力等于质量乘加速度；加速运动不能套用静力平衡。','按所求量选择牛顿第二定律、功—能定理或冲量—动量定理。'],
      'rigid-body':['质心平动与绕轴转动','质心满足合力等于质量乘加速度；固定轴转动满足合力矩等于转动惯量乘角加速度。','转动惯量和力矩必须关于同一轴；先明确轴是否固定。'],
      vibration:['质量—弹簧—阻尼单自由度系统','惯性、阻尼、弹性恢复力与外激励共同决定运动，不能令合外力恒为零。','写运动方程并给定初始条件；区分自由/受迫、无阻尼/有阻尼。'],
      lagrangian:['广义坐标描述的系统','由动能减势能构造拉格朗日量，保守系统使用欧拉—拉格朗日方程。','先数自由度和约束，再写动能与势能；检查小角近似等适用条件。'],
      'axial-bar':['轴向受力杆的截面','轴力由平衡求得，应力与伸长还需截面关系及材料本构。','在线弹性均匀杆假设下，分别检查强度与变形；统一N、mm、MPa。'],
      torsion:['实心圆轴及受扭截面','剪应力与扭转角依赖扭矩、极惯性矩及剪切模量。','检查线弹性圆轴假设；最大剪应力取大小，扭转角保留方向。'],
      'beam-material':['梁整体与截面','支反力、内弯矩、弯曲正应力及挠度是不同层次的量。','先整体平衡，再截面内力，再用线弹性小挠度梁模型。'],
      'stress-transform':['平面应力微元','旋转截面改变应力分量，不改变主应力等不变量。','统一剪应力与角度正号；区分面内最大剪应力与三维最大剪应力。'],
      buckling:['理想细长受压直杆','Euler临界力反映整体稳定性，不等于材料屈服强度。','先定边界有效长度，再检查细长、轴心受压与线弹性假设。'],
      fatigue:['承受循环应力的构件','应力幅、平均应力与循环寿命不同于静载强度。','本模型仅用Basquin及简单Goodman修正；不能代替材料试验与设计规范。']
    };
    const method=methods[state.scene];if(method){entries[0][2]=method[0];entries[2][1]='建模关系';entries[2][2]=method[1];entries[3][2]=method[2];}
    $('#cardTray').innerHTML=entries.map(([k,n])=>`<button class="card ${state.slots[k]?'visited':''}" data-card="${k}">${n}</button>`).join('');
    $$('[data-card]').forEach(b=>b.onclick=()=>{state.slots[b.dataset.card]=true;$('#cardFeedback').textContent=entries.find(c=>c[0]===b.dataset.card)[2];$('#reasoningDetails').open=true;save();});
  }
  function operationOK(l){
    if(!l.operation)return true;const v=values(),op=l.operation;
    if(op.kind==='balance')return state.scene==='lever'&&state.support&&Math.abs(v.m)<.2;
    if(op.kind==='noSupportCounterexample')return !state.support&&Math.abs(v.m)<.2&&Math.hypot(v.fx,v.fy-20)>.2;
    if(op.kind==='tension')return state.support&&Math.abs(v.m)<.2&&(!Number.isFinite(op.verticalComponent)||Math.abs(v.fy-op.verticalComponent)<.2);
    if(op.kind==='frictionStatic')return state.scene==='friction'&&StaticsScenes.calculate('friction',state.friction).static;
    return false;
  }
  function markComplete(forceAssisted=false){
    const l=current(),record=activeRecord(),old=record[l.id],assisted=forceAssisted||state.hints>0;
    record[l.id]={assisted:!!(old?.assisted||assisted),hintLevel:Math.max(old?.hintLevel||0,state.hints),independent:!!(old?.independent||!assisted)};
    renderLevels();save();
  }
  function renderHints(){
    const l=current(),active=state.mode==='teach'&&!!l;
    $('#hintButton').disabled=!active;
    if(!active){$('#hintStatus').textContent='选择教学关卡后可使用逐级提示';$('#hintContent').innerHTML='';return;}
    $('#hintButton').textContent=state.hints<4?`需要提示？ ${state.hints}/4`:'已展开全部提示';
    $('#hintStatus').textContent=state.hints?'本次已使用辅助 · 不扣分':'方向 → 方法 → 步骤 → 讲解 · 不扣分';
    $('#hintContent').innerHTML=l.hints.slice(0,state.hints).map((h,i)=>`<p><strong>${['方向提示','方法提示','关键步骤','完整讲解'][i]}</strong><br>${h}</p>`).join('');
    if(state.hints===4){const b=document.createElement('button');b.className='outline-btn';b.id='assistedContinue';b.textContent='记录为辅助完成并继续 →';$('#hintContent').append(b);b.onclick=()=>{markComplete(true);advance();notice('已记录辅助完成，未标记独立掌握。之后可重练这关。');};}
  }
  $('#hintButton').onclick=()=>{if(!current()||state.mode!=='teach')return;state.hints=Math.min(4,state.hints+1);renderHints();save();};
  function renderChallenge(){
    const body=$('#challengeBody'),l=current();
    if(state.mode==='free'){$('#phaseText').textContent='自由探索';body.innerHTML='<h3>自由实验台</h3><p>可切换杆件、支座、梁和斜面。教学进度不会受影响。</p><button id="returnLearning" class="solid-btn">返回教学</button>';$('#returnLearning').onclick=()=>{state.mode='teach';if(!current())state.level=0;applySetup();render();save();};renderHints();return;}
    if(!l){$('#phaseText').textContent='章节完成';body.innerHTML='<h3>当前章节练习已走完</h3><p>完成练习不等于已掌握整章，建议再做无提示变式与延迟复习。</p><p>辅助完成的关卡值得再做一次无提示复习。选择任一单元即可重练。</p>';renderHints();return;}
    $('#phaseText').textContent=state.phase==='op'?(l.operation?'操作 → 迁移':'观察 → 辨析'):state.phase==='passed'?'本题通过':'独立作答';
    const formula=l.formulaLatex||l.formula||'';const link=`<a href="index.html?concept=${encodeURIComponent(l.concept)}" target="_blank" rel="noopener">关联知识卡 ↗</a>`;
    if(state.phase==='op')body.innerHTML=`<h3>${l.title}</h3><p>${l.intro}</p><p class="small">${l.operation?'先完成画面对应的实验，再进入计算或辨析题。':'本关为观察与独立计算，无需反复调整控件。'}</p><button id="opDone" class="solid-btn">${l.operation?'检查实验 →':'进入答题 →'}</button><p id="taskFeedback" role="status"></p>${link}`;
    else if(state.phase==='passed')body.innerHTML=`<h3>✓ 本题通过</h3><p id="answerMsg">${l.solution}</p><button id="nextLesson" class="solid-btn">继续下一关 →</button><p>${link}</p>`;
    else body.innerHTML=`<h3>${l.title}</h3><p>${l.question}</p><p class="small">${typeof l.answer==='number'?'按题目单位填写；支持小数、简单分数和科学计数法（如2e3）。按题目要求保留精度，误差允许 ±0.01。':'按题目给定的词或顺序作答。'}</p><form id="answerForm" class="answer-row"><input id="answer" aria-label="题目答案" placeholder="${typeof l.answer==='number'?'数值 / 分数':'文字 / 数值序列'}"><button id="submit" type="button" class="solid-btn">验证答案</button></form><p class="formula-display" aria-label="本关公式">公式：${formula||'见题目解析'}</p><p id="answerMsg" role="status"></p><button id="backToOperation" class="text-btn">返回实验</button><p>${link}</p>`;
    $('#opDone')?.addEventListener('click',()=>{if(!operationOK(l)){$('#taskFeedback').textContent='尚未满足实验条件。可点下方提示获取方向，不扣分。';return;}state.phase='answer';renderChallenge();save();});
    $('#submit')?.addEventListener('click',submit);
    $('#answerForm')?.addEventListener('submit',e=>{e.preventDefault();submit();});
    $('#answer')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit();}});
    $('#nextLesson')?.addEventListener('click',advance);
    $('#backToOperation')?.addEventListener('click',()=>{state.phase='op';renderChallenge();save();});
    renderHints();
  }
  function numeric(raw){if(typeof raw!=='string')return NaN;const p=raw.split('/').map(x=>x.trim());if(p.length>2||p.some(x=>!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(x)))return NaN;const values=p.map(Number);if(values.some(x=>!Number.isFinite(x))||(p.length===2&&values[1]===0))return NaN;const n=p.length===1?values[0]:values[0]/values[1];return Number.isFinite(n)?n:NaN;}
  const norm=s=>s.replace(/[，,；;]/g,'、').replace(/\s/g,'').toLowerCase();
  function submit(){
    const l=current(),raw=$('#answer').value.trim(),msg=$('#answerMsg');$('#nextLesson')?.remove();
    if(!raw){msg.textContent='请填写答案后验证。';return;}
    const parsed=typeof l.answer==='number'?numeric(raw):null;
    if(typeof l.answer==='number'&&!Number.isFinite(parsed)){msg.textContent='输入格式未识别：请按题目单位只填数值、小数、简单分数（如40/3）或科学计数法（如2e3）；不要附加单位或算式，分母不能为零。本次不计为答错。';msg.style.color='#a33e32';return;}
    const ok=typeof l.answer==='number'?Math.abs(parsed-l.answer)<=Math.min(l.tolerance||.01,.01):norm(raw)===norm(String(l.answer));
    if(!ok){state.wrong++;msg.textContent='✗ 暂不正确。请再检查单位、条件和列式。'+(state.wrong>=2?' 已尝试两次，需要一点提示吗？点击下方按钮即可。':'');msg.style.color='#a33e32';save();return;}
    markComplete();msg.textContent='✓ 回答正确！ '+l.solution;msg.style.color='#28645a';
    const next=document.createElement('button');next.id='nextLesson';next.className='solid-btn';next.textContent='继续下一关 →';msg.after(next);next.onclick=advance;
    state.phase='passed';save();
  }
  function render(){
    if(mappedCurriculum!==state.curriculum){setCourseMap(courseMapFor(state.curriculum));mappedCurriculum=state.curriculum;}
    $$('.mode').forEach(b=>{b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode));});
    renderScene();renderLevels();renderCards();renderChallenge();
  }
  $('#unitSelect').onchange=e=>{state.unit=Number(e.target.value);renderLevels();save();};
  const courseMapFor=course=>['axial','torsion','stress-transform','beam-material','buckling','fatigue'].includes(course)?'materials':'theory';
  let mappedCurriculum=null;
  const mapCourseIds={theory:['staticsCourseBtn','kinematicsCourseBtn','dynamicsCourseBtn','rigidCourseBtn','vibrationCourseBtn','lagrangianCourseBtn'],materials:['axialCourseBtn','torsionCourseBtn','beamMaterialCourseBtn','stressTransformCourseBtn','bucklingCourseBtn','fatigueCourseBtn']};
  function setCourseMap(map){
    for(const [name,ids] of Object.entries(mapCourseIds))for(const id of ids){const b=$('#'+id);if(b)b.hidden=name!==map;}
    for(const name of ['theory','materials']){const b=$('#'+(name==='theory'?'theory':'materials')+'MapBtn');b.classList.toggle('active',map===name);b.setAttribute('aria-selected',String(map===name));b.setAttribute('role','tab');}
    let guide=$('#courseMapGuide');if(!guide){guide=document.createElement('p');guide.id='courseMapGuide';guide.className='small';guide.setAttribute('role','status');$('.course-switch').before(guide);}
    guide.textContent=map==='theory'?'理论力学建议路线：静力学 → 运动学 → 质点动力学 → 刚体动力学 → 振动 → 分析力学。先修：向量、三角函数；后两章还需微积分与常微分方程。':'材料力学建议路线：轴向杆 → 圆轴扭转 → 梁弯曲 → 组合应力 → 屈曲 → 疲劳。先修：受力图、平衡方程、截面几何性质。路线不锁关；通过本题不等于已掌握整章。';
    for(const id of mapCourseIds[map])$('.course-switch').append($('#'+id));
  }
  $('#theoryMapBtn').onclick=()=>setCourseMap('theory');$('#materialsMapBtn').onclick=()=>setCourseMap('materials');setCourseMap(courseMapFor(state.curriculum));mappedCurriculum=state.curriculum;
  $('#staticsCourseBtn').onclick=()=>{state.curriculum='statics';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到理论力学静力学，原材料章节进度保留。');};
  $('#axialCourseBtn').onclick=()=>{state.curriculum='axial';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到材料力学轴向杆，静力学进度保留。');};
  $('#kinematicsCourseBtn').onclick=()=>{state.curriculum='kinematics';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到理论力学运动学，静力学与材料力学进度保留。');};
  $('#fatigueCourseBtn').onclick=()=>{state.curriculum='fatigue';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到材料力学疲劳强度。');};
  $('#bucklingCourseBtn').onclick=()=>{state.curriculum='buckling';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到材料力学屈曲稳定。');};
  $('#beamMaterialCourseBtn').onclick=()=>{state.curriculum='beam-material';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到材料力学梁弯曲。');};
  $('#stressTransformCourseBtn').onclick=()=>{state.curriculum='stress-transform';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到材料力学组合应力。');};
  $('#torsionCourseBtn').onclick=()=>{state.curriculum='torsion';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到材料力学圆轴扭转。');};
  $('#lagrangianCourseBtn').onclick=()=>{state.curriculum='lagrangian';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到理论力学分析力学。');};
  $('#vibrationCourseBtn').onclick=()=>{state.curriculum='vibration';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到理论力学振动基础。');};
  $('#rigidCourseBtn').onclick=()=>{state.curriculum='rigid-body';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到理论力学刚体动力学。');};
  $('#dynamicsCourseBtn').onclick=()=>{state.curriculum='particle-dynamics';state.level=0;state.unit=0;state.phase='op';state.mode='teach';state.hints=0;state.wrong=0;state.slots={};$('#cardFeedback').textContent='';applySetup();render();save();notice('已切换到理论力学质点动力学，其他课程进度保留。');};
  $('#scenePicker').onchange=e=>{if(state.mode!=='free')return;state.scene=e.target.value;render();save();};
  for(const [id,k]of[['xRange','x'],['fRange','F'],['thetaRange','theta']])$('#'+id).oninput=e=>{state[k]=Number(e.target.value);calcLever();save();};
  $('#fNumber').onchange=e=>{const n=Number(e.target.value);if(e.target.value.trim()===''||!finite(n,0,80)){notice('请输入0～80 N，可带小数。');e.target.value=state.F;return;}state.F=n;$('#fRange').value=n;calcLever();save();};
  $('#supportToggle').onchange=e=>{state.support=e.target.checked;calcLever();save();};
  $$('.mode').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;if(state.mode==='teach')applySetup();render();save();});
  $('#openAll').onclick=()=>{state.mode='free';render();save();};
  $('#clearCards').onclick=()=>{state.slots={};$('#cardFeedback').textContent='阅读标记已清空。';renderCards();save();};
  $('#backupExportBtn').onclick=exportBackup;
  $('#backupImportBtn').onclick=()=>$('#backupFileInput').click();
  $('#backupFileInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{importBackupText(await file.text());}catch(error){notice('导入失败：'+error.message);}e.target.value='';});
  $('#resetBtn').onclick=()=>$('#resetDialog').showModal();
  $('#resetDialog').addEventListener('close',()=>{if($('#resetDialog').returnValue==='reset'){state=base();applySetup();render();save();notice('扩展课程进度已重置；原三关样板记录未删除。');}});
  const handle=$('#pointHandle');let pointer=null;
  handle.addEventListener('pointerdown',e=>{pointer=e.pointerId;handle.setPointerCapture(pointer);});
  handle.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;const m=$('#scene').getScreenCTM();if(!m)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());state.x=Math.max(.2,Math.min(2,(p.x-100)/290));$('#xRange').value=state.x;calcLever();save();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(event,()=>pointer=null);
  handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();state.x=Math.max(.2,Math.min(2,state.x+(e.key==='ArrowRight'?.01:-.01)));$('#xRange').value=state.x;calcLever();save();});
  render();
})();
