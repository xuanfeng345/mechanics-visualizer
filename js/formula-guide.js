(() => {
  const $=s=>document.querySelector(s);
  const panel=$('#formulaDetails');
  const guide=document.createElement('section');guide.id='formulaGuide';
  panel.insertBefore(guide,$('#explain'));
  panel.parentElement.prepend(panel);
  panel.querySelector('summary').innerHTML='<span>图解公式</span><span class="formula-chip">点击步骤，对照画面</span>';
  const button=document.createElement('button');button.id='openFormulaGuide';button.type='button';button.className='text-btn';button.textContent='图解公式 ↗';
  $('.apparatus .panel-head').append(button);
  button.onclick=()=>{$('[data-pane="notes"]').click();panel.open=true;panel.scrollIntoView({block:'nearest'});};
  const packs={
    lever:[
      ['分解施力',String.raw`F_y=F\sin\theta`,'只有竖直分量对水平杆的铰点产生力矩。角度从杆的正向计。','#appliedForce'],
      ['找到力臂',String.raw`M_{A,F}=xF_y=xF\sin\theta`,'x 是铰点到作用点沿杆的距离；斜向力的垂直力臂是 x sinθ，不是直接把 x 当作垂直力臂。','#beam,#xLabel,#pointHandle'],
      ['建立平衡',String.raw`\sum M_A=xF\sin\theta-W\frac{L}{2}=0`,'逆时针为正。重力作用在杆中点，力矩为负；只有平衡时才令合矩等于零。','#weightForce,#appliedForce'],
      ['求支反力',String.raw`\begin{aligned}R_x&=-F\cos\theta\\R_y&=W-F\sin\theta\end{aligned}`,'先满足力矩平衡，再由两方向合力为零求静力反力。负号表示实际方向与假定方向相反。','#reaction']
    ],
    beam:[
      ['对左端取矩',String.raw`R_B L-Pa=0`,'对左支座取矩，左支反力的力臂为零，方程中只剩右反力和集中荷载。','#alternateScene .force'],
      ['反力与位置',String.raw`R_B=\frac{Pa}{L},\qquad R_A=\frac{P(L-a)}{L}`,'荷载靠近哪一端，哪端的竖直反力更大。当前梁长为4 m，荷载单位为kN。','#alternateScene .force'],
      ['检查弯矩',String.raw`M_{\max}=R_Aa=\frac{Pa(L-a)}{L}`,'单个向下集中荷载下，最大正弯矩位于荷载处，单位kN·m。','#alternateScene .line']
    ],
    friction:[
      ['分解重力',String.raw`N=W\cos\alpha,\qquad f_{\mathrm{req}}=W\sin\alpha`,'法向无其他载荷且无离面加速度。沿坡重力分量是阻止下滑所需的摩擦，不一定真的能提供。','#alternateScene .force'],
      ['比较需求与上限',String.raw`f_{\mathrm{req}}\leq f_{s,\max}=\mu_sN`,'满足不等式才可能保持静止。实际静摩擦按需求取值，并非总等于 μₛN。虚线箭头表示上限。','#alternateScene .dashed'],
      ['寻找临界角',String.raw`\tan\alpha_c=\mu_s,\qquad\alpha_c=\arctan\mu_s`,'临界时取等号。超过临界角无法靠静摩擦保持静止；运动求解还需要动摩擦等条件。','#alternateScene .surface']
    ],
    material:[
      ['弹性段',String.raw`\sigma=E\varepsilon`,'应力—应变曲线初始斜率是弹性模量 E。','#alternateScene .stress-line'],
      ['屈服边界',String.raw`\varepsilon_y=\frac{\sigma_y}{E}`,'达到屈服应变后，线性弹性假设不再适用。','#alternateScene .yield-line'],
      ['强化段',String.raw`\sigma=\sigma_y+H(\varepsilon-\varepsilon_y)`,'当前示意采用单轴、单调加载的双线性强化模型。','#alternateScene .stress-line']
    ],
    support:[
      ['固定铰',String.raw`\mathbf R_A=R_{Ax}\mathbf e_x+R_{Ay}\mathbf e_y`,'限制两个方向的平移，允许转动。因此有两个未知力分量，没有独立约束力矩。','#alternateScene .force'],
      ['滚动支座',String.raw`\mathbf R=R_n\mathbf n`,'理想无摩擦滚动支座只提供法向反力；画面支承面水平，法向就是竖直方向。','#alternateScene .force'],
      ['固定端',String.raw`R_x,\quad R_y,\quad M_A`,'限制平面内两个平移和一个转动自由度，因此有两个反力分量与一个反力矩。','#alternateScene .force']
    ]
  };
  let scene='',signature='',step=0,ready=false,lastLive='';
  function clearHighlight(){document.querySelectorAll('.formula-highlight').forEach(e=>e.classList.remove('formula-highlight'));}
  function draw(){
    const pack=packs[scene];
    if(!pack){clearHighlight();guide.textContent='未能读取本场景公式，请刷新页面后重试。';return;}
    const entry=pack[step];
    clearHighlight();
    guide.innerHTML='<div class="formula-steps">'+pack.map((p,i)=>`<button type="button" data-formula-step="${i}" aria-pressed="${i===step}">${i+1} · ${p[0]}</button>`).join('')+'</div><div id="equationDisplay" class="equation-display"></div><p class="formula-caption"></p><div class="formula-live"></div>';
    const out=$('#equationDisplay');
    out.dataset.formulaTex=entry[1];
    if(ready){try{out.append(MathJax.tex2svg(entry[1],{display:true}));out.setAttribute('aria-label',entry[0]);}catch{out.textContent='公式暂不可用，请参考下方文字解释。';}}
    else out.textContent='数学排版加载中…';
    $('.formula-caption').textContent=entry[2];
    document.querySelectorAll('[data-formula-step]').forEach(b=>b.onclick=()=>{step=Number(b.dataset.formulaStep);draw();highlight();});
    lastLive='';live();highlight();
  }
  function highlight(){clearHighlight();if(!packs[scene]||$('.workspace-notes').hidden)return;document.querySelectorAll(packs[scene][step][3]).forEach(e=>e.classList.add('formula-highlight'));}
  function mathNumber(n){if(!Number.isFinite(n))return n===Infinity?String.raw`\infty`:String.raw`\text{不适用}`;if(n===0)return '0';const a=Math.abs(n);return a<.001||a>=1e5?n.toExponential(3).replace(/e([+-]?\d+)/,(_,e)=>String.raw`\times10^{${Number(e)}}`):Number(n.toPrecision(5)).toString();}
  function readout(){
    const exp=window.MechanicsApp?.experiment();if(!exp||exp.scene!==scene)return null;
    const modules={'axial-bar':'AxialScene',kinematics:'KinematicsScene','particle-dynamics':'ParticleDynamicsScene','rigid-body':'RigidBodyScene',vibration:'VibrationScene',lagrangian:'LagrangianScene',torsion:'TorsionScene','stress-transform':'StressTransformScene','beam-material':'BeamMaterialScene',buckling:'BucklingScene',fatigue:'FatigueScene'};
    if(scene==='materials-lab')return String.raw`\begin{aligned}`+window.MaterialsLab.readings(window.MaterialsLab.calculate(exp.params)).map(([label,value,unit])=>String.raw`\text{${label}}&=${mathNumber(value)}`+(unit?String.raw`\;\mathrm{${unit}}`:'')).join(String.raw`\\`)+String.raw`\end{aligned}`;
    if(!modules[scene])return null;
    const r=window[modules[scene]].calculate(exp.params);
    const fields={
      'axial-bar':[['\\sigma','stress','MPa'],['\\varepsilon','strain',''],['\\Delta L','elongation','mm'],['\\eta','utilization','']],
      kinematics:[['x','position.x','m'],['y','position.y','m'],['|v|','speed','m/s']],
      'particle-dynamics':[['a_x','acceleration.x','m/s^2'],['a_y','acceleration.y','m/s^2'],['T','kineticEnergy','J'],['W','work','J']],
      'rigid-body':[['a_C','acceleration','m/s^2'],['\\alpha','angularAcceleration','rad/s^2'],['\\omega','angularVelocity','rad/s'],['T','kineticEnergy','J']],
      vibration:[['\\omega_n','naturalAngularFrequency','rad/s'],['f_n','naturalFrequency','Hz'],['T_n','naturalPeriod','s'],['\\zeta','dampingRatio',''],['x','displacement','m'],['E','energy','J']],
      lagrangian:[['q','coordinate','m'],['\\dot q','velocity','m/s'],['\\mathcal L','lagrangian','J'],['E','energy','J']],
      torsion:[['J','polarInertia','m^4'],['|\\tau|_{\\max}','maxShearStress','Pa'],['\\varphi','twist','rad']],
      'stress-transform':[['\\sigma_1','sigma1','MPa'],['\\sigma_2','sigma2','MPa'],['\\sigma_{\\mathrm{vM}}','vonMises','MPa']],
      'beam-material':[['R_A','RA','N'],['R_B','RB','N'],['|M|_{\\max}','maxMoment','N\\,m'],['v_{\\max}','maxDeflection','m']],
      buckling:[['P_{\\mathrm{cr}}','criticalLoad','N'],['L_e','effectiveLength','m'],['\\lambda','slenderness',''],['\\eta','utilization','']],
      fatigue:[['\\sigma_{a,\\mathrm{eq}}','effectiveAmplitude','MPa'],['N','cycles','\\text{cycles}']]
    };
    return String.raw`\begin{aligned}`+fields[scene].map(([label,key,unit])=>{const value=key.split('.').reduce((o,k)=>o?.[k],r);return label+'&='+mathNumber(value)+(unit?String.raw`\;\mathrm{${unit}}`:'');}).join(String.raw`\\`)+String.raw`\end{aligned}`;
  }
  function live(){
    const host=$('.formula-live');if(!host)return;
    let tex=null;try{tex=readout();}catch{/* Retain the scene's own parameter error text. */}
    if(ready&&tex){if(tex===lastLive)return;lastLive=tex;try{host.replaceChildren(MathJax.tex2svg(tex,{display:true}));host.setAttribute('aria-label','当前参数计算结果');return;}catch{/* Fall back to readable text. */}}
    const text='当前画面：'+(scene==='lever'?`合矩 ${$('#moment').textContent}；${$('#equilibrium').textContent}。`:$('#reactionBox').textContent);if(text!==host.textContent)host.textContent=text;
  }
  function sync(){
    const next=$('#scenePicker').value,exp=window.MechanicsApp?.experiment(),p=exp?.scene===next?exp.params:{};
    const regime=next==='vibration'?window.VibrationScene.calculate(p).regime:'';
    const nextSignature=next+'|'+(next==='kinematics'?p.mode:'')+'|'+regime+'|'+(next==='materials-lab'?p.mode+':'+p.shape:'')+'|'+(next==='beam-material'?(p.support||'simple')+':'+(p.loadType||'point'):'');
    if(nextSignature!==signature){const extra=window.MechanicsFormulaPacks?.create(next,p);if(extra)packs[next]=extra;const changed=scene!==next;scene=next;signature=nextSignature;step=changed?0:Math.min(step,(packs[scene]?.length||1)-1);draw();}
    else {live();highlight();}
  }
  new MutationObserver(sync).observe($('#reactionBox'),{childList:true,subtree:true,characterData:true});
  new MutationObserver(highlight).observe($('.workspace-notes'),{attributes:true,attributeFilter:['hidden']});
  sync();
  if(window.MathJax?.startup?.promise)MathJax.startup.promise.then(()=>{ready=true;draw();}).catch(()=>{$('#equationDisplay').textContent='排版加载失败；文字解释仍可用。';});
})();
