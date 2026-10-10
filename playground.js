(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const {levels,units}=window.STATICS_CURRICULUM;
  const KEY='mechanics-playground-v3';
  const scenes=['lever','support','beam','friction'];
  const base=()=>({schema:3,mode:'teach',level:0,unit:0,phase:'op',scene:'lever',x:.8,F:20,theta:90,support:true,beam:{a:1,P:20},friction:{alpha:30,mu:.4},material:{E:200000,yield:250,maxStrain:.002,H:1000},completed:{},hints:0,wrong:0,slots:{}});
  let state=base();
  const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
  const notice=t=>$('#interactionNotice').textContent=t;
  function applySetup() {
    const l=levels[state.level];if(!l)return;
    state.scene=l.scene;state.x=.8;state.F=20;state.theta=90;state.support=true;
    state.beam={a:1,P:20};state.friction={alpha:30,mu:.4};
    const p=l.setup||{};
    if(p.material)state.material={...state.material,...p.material};
    for(const k of ['x','F','theta','support']) if(p[k]!==undefined) state[k]=p[k];
    for(const k of ['a','P']) if(p[k]!==undefined) state.beam[k]=p[k];
    for(const k of ['alpha','mu']) if(p[k]!==undefined) state.friction[k]=p[k];
  }
  function valid(s) {
    return s&&s.schema===3&&['teach','free'].includes(s.mode)&&scenes.includes(s.scene)
      &&Number.isInteger(s.level)&&finite(s.level,0,levels.length)&&Number.isInteger(s.unit)&&finite(s.unit,0,units.length-1)
      &&['op','answer','passed'].includes(s.phase)&&finite(s.x,.2,2)&&finite(s.F,0,80)&&finite(s.theta,0,180)&&typeof s.support==='boolean'
      &&s.beam&&finite(s.beam.a,.2,3.8)&&finite(s.beam.P,0,60)&&s.friction&&finite(s.friction.alpha,0,60)&&finite(s.friction.mu,0,1)&&s.material&&finite(s.material.E,1,1000000)&&finite(s.material.yield,0.001,100000)&&finite(s.material.maxStrain,0.000001,1)&&finite(s.material.H,0,1000000)
      &&Number.isInteger(s.hints)&&finite(s.hints,0,4)&&Number.isInteger(s.wrong)&&finite(s.wrong,0,100000)
      &&s.completed&&typeof s.completed==='object'&&!Array.isArray(s.completed)
      &&Object.entries(s.completed).every(([id,v])=>levels.some(l=>l.id===id)&&v&&typeof v.independent==='boolean'&&typeof v.assisted==='boolean'&&finite(v.hintLevel,0,4))
      &&s.slots&&typeof s.slots==='object'&&!Array.isArray(s.slots);
  }
  let restored=false;
  try {
    const saved=JSON.parse(localStorage.getItem(KEY));
    if(valid(saved)){state=saved;restored=true;}
    else {
      const old=JSON.parse(localStorage.getItem('mechanics-playground-v2'));
      if(old&&Array.isArray(old.done)) notice(`旧样板完成 ${old.done.length}/3 关，原记录保留。扩展课程从第一关开始，不将旧进度算成新关掌握。`);
    }
  } catch {notice('未能读取本地进度，已安全启动新学习。');}
  if(!restored)applySetup();
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{notice('当前浏览器不允许保存进度；仍可使用，关闭页面后可能无法恢复。');}}
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
    const p=state.scene==='beam'?state.beam:state.friction;
    window.StaticsScenes.render(state.scene,$('#alternateScene'),p);
    const c=window.StaticsScenes.calculate(state.scene,p);
    $('#statusTag').textContent={beam:'简支梁 · kN / m',friction:c.static?'静力快照 · 静摩擦可阻止下滑':'静力快照 · 无法静止，未模拟下滑',support:'平面约束 · 方向示意'}[state.scene];
    $('#explain').textContent=window.StaticsScenes.descriptions[state.scene]||'理想平面约束示意。';
    $('#reactionBox').textContent=state.scene==='beam'?`RA=${fmt(c.RA)} kN，RB=${fmt(c.RB)} kN，Mmax=${fmt(c.Mmax)} kN·m。`:
      state.scene==='friction'?`N=${fmt(c.N)} N；所需静摩擦=${fmt(c.driving)} N；上限=${fmt(c.maxF)} N。${c.static?'可以静止，实际摩擦按需求取值。':'不能保持静止；未指定动摩擦系数，不计算滑动摩擦或运动。'}`:'固定铰：两个力分量；水平滚动支座：竖直反力；固定端：两个力分量与一个约束力矩。';
  }
  function renderMaterial(){const p=state.material,host=$('#alternateScene');const n=41,max=Math.max(p.maxStrain,p.yield/p.E*1.5),pts=[];for(let i=0;i<n;i++){const e=-max+2*max*i/(n-1),s=Math.abs(e)<=p.yield/p.E?p.E*e:Math.sign(e)*(p.yield+p.H*(Math.abs(e)-p.yield/p.E));pts.push([e,s]);}const W=720,H=280,px=e=>60+(e+max)/(2*max)*600,py=s=>245-s/(p.yield+p.H*max)*170;host.innerHTML=`<svg class="material-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="双线性应力应变曲线"><line x1="60" y1="245" x2="680" y2="245" class="chart-axis"/><line x1="60" y1="30" x2="60" y2="245" class="chart-axis"/><polyline points="${pts.map(q=>px(q[0])+','+py(q[1])).join(' ')}" class="stress-line"/><line x1="${px(-p.yield/p.E)}" y1="30" x2="${px(-p.yield/p.E)}" y2="245" class="yield-line"/><line x1="${px(p.yield/p.E)}" y1="30" x2="${px(p.yield/p.E)}" y2="245" class="yield-line"/><text x="70" y="24">σ—ε · E=${p.E} MPa · σᵧ=${p.yield} MPa</text><text x="665" y="266">ε</text><text x="36" y="38">σ</text></svg>`;$('#statusTag').textContent='材料试验 · 双线性本构';$('#explain').textContent='弹性区斜率为 E；超过屈服应变后进入线性强化区。当前模型用于教学，不代表完整循环塑性。';$('#reactionBox').textContent=`屈服应变 εᵧ=${(p.yield/p.E).toExponential(3)}；强化模量 H=${p.H} MPa。`}
  function renderScene(){
    const lever=state.scene==='lever';$('#scene').toggleAttribute('hidden',!lever);$('#alternateScene').hidden=lever;$('#alternateControls').hidden=lever;
    $$('.readouts,.control-grid').forEach(el=>el.hidden=!lever);
    $('.controls .hint').textContent=lever?'拖动圆点改变作用点，或用滑块与精确输入框。角度从杆的正向逆时针计。':'图中是当前参数；迁移题明确给定的条件可以不同。';
    $('#scenePicker').value=state.scene;$('#scenePicker').disabled=state.mode==='teach';
    $('#lockHint').textContent=state.mode==='teach'?'本关所需器件可直接使用；自由模式可预览全部器件。':'自由实验开放全部器件，不影响教学记录。';
    $('#openAll').classList.toggle('hidden',state.mode==='free');
    if(lever){for(const[id,key]of[['xRange','x'],['fRange','F'],['thetaRange','theta']]){$('#'+id).value=state[key];$('#'+id).disabled=false;}$('#supportToggle').checked=state.support;$('#supportToggle').disabled=false;calcLever();return;}
    const config=state.scene==='beam'?[['a','距左支座 a',.2,3.8,.01,'m'],['P','集中荷载 P',0,60,.1,'kN']]:state.scene==='friction'?[['alpha','斜面角 α',0,60,.1,'°'],['mu','静摩擦系数 μ',0,1,.01,'']]:state.scene==='material'?[['E','弹性模量 E',1000,400000,1000,'MPa'],['yield','屈服应力 σᵧ',10,1000,10,'MPa'],['maxStrain','最大应变',.0005,.02,.0005,''],['H','强化模量 H',0,50000,1000,'MPa']]:[];
    const p=state.scene==='beam'?state.beam:state.scene==='friction'?state.friction:state.material;
    $('#alternateControls').innerHTML=config.length?config.map(([k,n,min,max,step,u])=>`<label>${n}<output id="alt-${k}">${fmt(p[k])} ${u}</output><input type="range" data-alt-param="${k}" min="${min}" max="${max}" step="${step}" value="${p[k]}" aria-label="${n}"></label>`).join(''):'<p>比较三种约束的反力与自由度；此图为概念示意，无参数需要调整。</p>';
    $$('[data-alt-param]').forEach(el=>el.oninput=()=>{const k=el.dataset.altParam;p[k]=Number(el.value);const u=config.find(c=>c[0]===k)[5];$('#alt-'+k).textContent=fmt(p[k])+' '+u;altDraw();save();});
    altDraw();
  }
  const current=()=>levels[state.level];
  function enter(n){state.level=n;state.unit=levels[n].unit;state.mode='teach';state.phase='op';state.hints=0;state.wrong=0;state.slots={};applySetup();$('#cardFeedback').textContent='';render();save();}
  function advance(){const n=state.level+1;if(n<levels.length)enter(n);else{state.level=levels.length;state.phase='op';render();save();}}
  function renderLevels(){
    $('#unitSelect').innerHTML=units.map((n,i)=>`<option value="${i}">${i+1} · ${n}</option>`).join('');$('#unitSelect').value=state.unit;
    $('#levelList').innerHTML=levels.map((l,i)=>({l,i})).filter(({l})=>l.unit===state.unit).map(({l,i})=>{
      const c=state.completed[l.id];return `<button class="progress-item ${i===state.level?'current':''} ${c?'done':''}" data-level="${i}"><span class="num">${c?'✓':i+1}</span><span>${l.title}</span><small>${c?(c.independent?'独立完成 · 可复习':'辅助完成 · 待独立复习'):'可挑战'}</small></button>`;
    }).join('');
    $$('[data-level]').forEach(b=>b.onclick=()=>{enter(Number(b.dataset.level));notice('已进入关卡。可自由选择单元，推荐按顺序学习；新尝试从零级提示开始。');});
    const total=Object.keys(state.completed).length,independent=Object.values(state.completed).filter(c=>c.independent).length;
    $('#progressText').textContent=`${total}/20 · 独立 ${independent}`;
  }
  function renderCards(){
    const entries=[['object','研究对象',state.scene==='friction'?'研究斜面上的块体。重力、法向反力与摩擦均为外力。':state.scene==='beam'?'研究整根简支梁。不要将支座反力与外加集中载荷混淆。':'先隔离研究对象，再将约束替换为正确的反力。'],['condition','适用条件',$('#explain').textContent],['balance','平衡关系',state.scene==='friction'?'静摩擦大小按需要取值；只有达到临界时才等于 μN。':'平面刚体静止：ΣFx=0，ΣFy=0，ΣM=0。'],['moment','方法选择',state.scene==='friction'?'沿斜面和法向分解，先求 N，再比较下滑分量与 μN。':'优先选能消去未知力的点取矩，但所有平衡条件仍需满足。'],['check','结果检查','检查单位、正负方向、适用条件。提示不扣分；完整讲解后建议再做独立复习。']];
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
    const l=current(),old=state.completed[l.id],assisted=forceAssisted||state.hints>0;
    state.completed[l.id]={assisted:!!(old?.assisted||assisted),hintLevel:Math.max(old?.hintLevel||0,state.hints),independent:!!(old?.independent||!assisted)};
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
    if(!l){$('#phaseText').textContent='章节完成';body.innerHTML='<h3>静力学入门篇已走完</h3><p>辅助完成的关卡值得再做一次无提示复习。选择任一单元即可重练。</p>';renderHints();return;}
    $('#phaseText').textContent=state.phase==='op'?(l.operation?'操作 → 迁移':'观察 → 辨析'):state.phase==='passed'?'本题通过':'独立作答';
    const link=`<a href="index.html?concept=${encodeURIComponent(l.concept)}" target="_blank" rel="noopener">关联知识卡 ↗</a>`;
    if(state.phase==='op')body.innerHTML=`<h3>${l.title}</h3><p>${l.intro}</p><p class="small">${l.operation?'先完成画面对应的实验，再进入计算或辨析题。':'本关为观察与独立计算，无需反复调整控件。'}</p><button id="opDone" class="solid-btn">${l.operation?'检查实验 →':'进入答题 →'}</button><p id="taskFeedback" role="status"></p>${link}`;
    else if(state.phase==='passed')body.innerHTML=`<h3>✓ 本题通过</h3><p id="answerMsg">${l.solution}</p><button id="nextLesson" class="solid-btn">继续下一关 →</button><p>${link}</p>`;
    else body.innerHTML=`<h3>${l.title}</h3><p>${l.question}</p><p class="small">${typeof l.answer==='number'?'可填小数或简单分数，保留两位小数；误差允许 ±0.01。':'按题目给定的词或顺序作答。'}</p><form id="answerForm" class="answer-row"><input id="answer" aria-label="题目答案" placeholder="${typeof l.answer==='number'?'数值 / 分数':'文字 / 数值序列'}"><button id="submit" type="button" class="solid-btn">验证答案</button></form><p id="answerMsg" role="status"></p><button id="backToOperation" class="text-btn">返回实验</button><p>${link}</p>`;
    $('#opDone')?.addEventListener('click',()=>{if(!operationOK(l)){$('#taskFeedback').textContent='尚未满足实验条件。可点下方提示获取方向，不扣分。';return;}state.phase='answer';renderChallenge();save();});
    $('#submit')?.addEventListener('click',submit);
    $('#answerForm')?.addEventListener('submit',e=>{e.preventDefault();submit();});
    $('#answer')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit();}});
    $('#nextLesson')?.addEventListener('click',advance);
    $('#backToOperation')?.addEventListener('click',()=>{state.phase='op';renderChallenge();save();});
    renderHints();
  }
  function numeric(raw){const p=raw.split('/').map(x=>x.trim());if(p.length>2||p.some(x=>!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(x)))return NaN;const n=p.length===1?Number(p[0]):Number(p[0])/Number(p[1]);return Number.isFinite(n)?n:NaN;}
  const norm=s=>s.replace(/[，,；;]/g,'、').replace(/\s/g,'').toLowerCase();
  function submit(){
    const l=current(),raw=$('#answer').value.trim(),msg=$('#answerMsg');$('#nextLesson')?.remove();
    if(!raw){msg.textContent='请填写答案后验证。';return;}
    const ok=typeof l.answer==='number'?Math.abs(numeric(raw)-l.answer)<=Math.min(l.tolerance||.01,.01):norm(raw)===norm(String(l.answer));
    if(!ok){state.wrong++;msg.textContent='✗ 暂不正确。请再检查单位、条件和列式。'+(state.wrong>=2?' 已尝试两次，需要一点提示吗？点击下方按钮即可。':'');msg.style.color='#a33e32';save();return;}
    markComplete();msg.textContent='✓ 回答正确！ '+l.solution;msg.style.color='#28645a';
    const next=document.createElement('button');next.id='nextLesson';next.className='solid-btn';next.textContent='继续下一关 →';msg.after(next);next.onclick=advance;
    state.phase='passed';save();
  }
  function render(){
    $$('.mode').forEach(b=>{b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode));});
    renderScene();renderLevels();renderCards();renderChallenge();
  }
  $('#unitSelect').onchange=e=>{state.unit=Number(e.target.value);renderLevels();save();};
  $('#scenePicker').onchange=e=>{if(state.mode!=='free')return;state.scene=e.target.value;render();save();};
  for(const [id,k]of[['xRange','x'],['fRange','F'],['thetaRange','theta']])$('#'+id).oninput=e=>{state[k]=Number(e.target.value);calcLever();save();};
  $('#fNumber').onchange=e=>{const n=Number(e.target.value);if(e.target.value.trim()===''||!finite(n,0,80)){notice('请输入0～80 N，可带小数。');e.target.value=state.F;return;}state.F=n;$('#fRange').value=n;calcLever();save();};
  $('#supportToggle').onchange=e=>{state.support=e.target.checked;calcLever();save();};
  $$('.mode').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;if(state.mode==='teach')applySetup();render();save();});
  $('#openAll').onclick=()=>{state.mode='free';render();save();};
  $('#clearCards').onclick=()=>{state.slots={};$('#cardFeedback').textContent='阅读标记已清空。';renderCards();save();};
  $('#resetBtn').onclick=()=>$('#resetDialog').showModal();
  $('#resetDialog').addEventListener('close',()=>{if($('#resetDialog').returnValue==='reset'){state=base();applySetup();render();save();notice('扩展课程进度已重置；原三关样板记录未删除。');}});
  const handle=$('#pointHandle');let pointer=null;
  handle.addEventListener('pointerdown',e=>{pointer=e.pointerId;handle.setPointerCapture(pointer);});
  handle.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;const m=$('#scene').getScreenCTM();if(!m)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());state.x=Math.max(.2,Math.min(2,(p.x-100)/290));$('#xRange').value=state.x;calcLever();save();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(event,()=>pointer=null);
  handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();state.x=Math.max(.2,Math.min(2,state.x+(e.key==='ArrowRight'?.01:-.01)));$('#xRange').value=state.x;calcLever();save();});
  render();
})();
