/* Shared learning rules: no DOM, clock or storage dependencies. */
(function(root){
  'use strict';
  const DAY=86400000;
  const names={statics:'静力学',kinematics:'运动学','particle-dynamics':'质点动力学','rigid-body':'刚体动力学',vibration:'振动',lagrangian:'分析力学',axial:'轴向杆',torsion:'圆轴扭转','beam-material':'梁弯曲','stress-transform':'组合应力',buckling:'屈曲稳定',fatigue:'疲劳'};
  function tolerance(lesson){
    const a=Math.abs(lesson.answer);
    if(Number.isFinite(lesson.absoluteTolerance))return lesson.absoluteTolerance;
    return Math.min(lesson.tolerance??.01,.01,a>0?a*.005:.001);
  }
  function grade(lesson,value){return Number.isFinite(value)&&Math.abs(value-lesson.answer)<=tolerance(lesson)+Number.EPSILON*Math.max(1,Math.abs(lesson.answer))*4;}
  function diagnose(expected,actual){
    if(actual===0&&expected!==0)return {tag:'quantity',text:'结果不应为零。先判断是否存在载荷、变形或运动，再检查数量级。'};
    if(expected!==0&&Math.abs(actual+expected)<=Math.max(Math.abs(expected)*.01,1e-8))return {tag:'sign',text:'大小接近，但方向相反。检查正方向、受力方向及力矩的旋转方向。'};
    if(expected!==0&&actual!==0){const ratio=Math.abs(actual/expected);if([.001,.01,.1,10,100,1000,1e6,1e-6,1e9,1e-9].some(x=>Math.abs(ratio/x-1)<.02))return {tag:'units',text:'结果可能存在单位或数量级偏差。检查 mm 与 m、MPa 与 Pa，以及平方、四次方的换算。'};}
    return {tag:'model',text:'先写研究对象和适用规律，再代数值。检查是否把质量当成重量、把半径当成直径，或漏掉初始条件。'};
  }
  const frameworks={
    statics:['平衡物体的合矩为零，是否就一定平衡？',['不一定，还需要合力为零','一定，转动抵消就够了','还必须所有力相等'],0,'对同一研究对象同时检查 ΣF=0 与 ΣM=0。'],
    kinematics:['同一地点经过两次，速度是否一定相同？',['不一定，还要看方向与运动时刻','一定，位置决定速度','速度一定为零'],0,'位置、速度、加速度是不同的状态量；速度是位置对时间的导数。'],
    'particle-dynamics':['合外力突然变为零，已有速度的质点会怎样？',['保持原速度做匀速直线运动','立即停止','保持原加速度'],0,'ΣF=ma。合力为零表示加速度为零，不表示速度为零。'],
    'rigid-body':['求刚体角加速度，力矩和转动惯量应如何选取？',['使用同一适用轴，并检查该轴是否满足方程条件','力矩取任意点，惯量取质心即可','只要知道质量就够了'],0,'固定轴转动用该固定轴的 M=Iα；一般平面运动可绕质心列转动方程。'],
    vibration:['无阻尼自由振动经过平衡位置时，哪一项最大？',['速度的大小','弹簧势能','位移的大小'],0,'总机械能守恒，平衡位置弹簧势能最小，动能最大。'],
    lagrangian:['理想单摆的摆长固定，描述平面构型需要几个独立坐标？',['1 个摆角','2 个独立笛卡尔坐标','3 个独立坐标'],0,'几何约束减少独立坐标数。用摆角即可描述构型。'],
    axial:['杆的应力超过许用应力，就一定已经屈服吗？',['不一定，许用应力还包含安全系数','一定，许用应力等于屈服强度','一定已经断裂'],0,'区分实际应力、许用应力和屈服强度；工程安全界限不等于材料屈服界限。'],
    torsion:['实心圆轴直径加倍，扭矩不变时最大剪应力变为多少？',['原来的 1/8','原来的 1/2','原来的 1/16'],0,'J 随直径四次方变化，外缘半径随直径变化，所以 τmax 随直径三次方的倒数变化。'],
    'beam-material':['简支梁载荷保持不变，仅增大 EI，会怎样？',['挠度减小，支反力不变','支反力和挠度都增大','弯矩一定变为零'],0,'此静定结构的反力由平衡决定；EI 决定线弹性弯曲变形。'],
    'stress-transform':['只旋转坐标轴，不改变实际载荷，哪一项保持不变？',['主应力与 von Mises 等效应力','所有坐标应力分量','剪应力一定为零'],0,'旋转改变应力分量的表达，不改变同一点的应力状态及其不变量。'],
    buckling:['理想细长柱长度加倍，其 Euler 临界力变为多少？',['原来的 1/4','原来的 1/2','原来的 2 倍'],0,'Pcr=π²EI/(KL)²。这里假设材料、截面和端部约束不变。'],
    fatigue:['应力幅相同，平均拉应力增大，Goodman 模型预测怎样？',['疲劳安全裕量减小','寿命一定不变','寿命一定无限'],0,'平均拉应力会提高 Goodman 修正后的等效应力幅；仍需检查模型适用范围。']
  };
  function framework(course,seed=0){const f=frameworks[course]||frameworks.statics,shift=Math.abs(seed)%3;return {question:f[0],choices:f[1].map((_,i)=>f[1][(i+shift)%3]),correct:(3-shift)%3,explanation:f[3]};}
  function exercise(course,seed=0){
    const n=2+Math.abs(seed)%7;
    let question,answer,unit,explanation;
    switch(course){
      case 'statics': question=`水平铰杆长 2 m，重力 ${n*10} N 作用于中点，杆端竖直向上施力。平衡所需端力是多少？`;answer=n*5;unit='N';explanation='关于铰点取矩：2F=W×1，所以 F=W/2。';break;
      case 'kinematics': question=`质点初速度 ${n} m/s，沿正向恒加速度 2 m/s²，持续 3 s。末速度是多少？`;answer=n+6;unit='m/s';explanation='v=v₀+at，注意保留初始速度。';break;
      case 'particle-dynamics':question=`质量 ${n} kg 的质点，受到正向合力 ${n*3} N，从静止开始运动 2 s。末动量是多少？`;answer=n*6;unit='kg·m/s';explanation='冲量等于动量变化：p=Ft；或由 a=F/m 求 v 再算 mv。';break;
      case 'rigid-body':question=`刚体绕固定轴转动，I=${n} kg·m²，恒定合力矩 ${n*(n+1)} N·m，初始角速度 1 rad/s，经过 2 s 的角速度是多少？`;answer=2*n+3;unit='rad/s';explanation='先用 α=M/I，再用 ω=ω₀+αt，保留初始角速度。';break;
      case 'vibration':question=`无阻尼弹簧质量系统 m=${n} kg，k=${25*n*n*n} N/m。固有角频率是多少？`;answer=5*n;unit='rad/s';explanation='ωₙ=√(k/m)，不能把频率 Hz 与角频率混用。';break;
      case 'lagrangian':question=`谐振子质量 ${n} kg，刚度 ${n*20} N/m，某时刻 q=0.1 m、q̇=0。拉格朗日量 L=T−V 是多少？`;answer=-n*.1;unit='J';explanation='T=0，V=kq²/2，因此 L=−V。';break;
      case 'axial':question=`均匀直杆受轴向拉力 ${n*10} kN，截面积 200 mm²。平均正应力是多少？`;answer=n*50;unit='MPa';explanation='先把 kN 换成 N，σ=N/A；N/mm² 就是 MPa。';break;
      case 'torsion':question=`均匀圆轴 T=${n*100} N·m，L=1 m，G=80 GPa，J=1×10⁻⁶ m⁴。扭转角是多少？`;answer=n*.00125;unit='rad';explanation='θ=TL/(GJ)，先将 G 换为 80×10⁹ Pa。';break;
      case 'beam-material':question=`跨度 4 m 的简支梁，${n*10} kN 集中力在距左支座 1 m 处。右支反力是多少？`;answer=n*2.5;unit='kN';explanation='对左支座取矩：4RB=P×1，因此 RB=P/4。';break;
      case 'stress-transform':question=`平面纯剪切应力状态 τxy=${n*10} MPa，σx=σy=0。最大主应力是多少？`;answer=n*10;unit='MPa';explanation='纯剪切的主应力为 +|τ| 与 −|τ|。';break;
      case 'buckling':question=`某理想细长柱原 Euler 临界力 ${n*40} kN。保持 EI 和 K 不变，长度加倍，新临界力是多少？`;answer=n*10;unit='kN';explanation='Pcr 与长度平方成反比，长度加倍后临界力为原来的四分之一。';break;
      case 'fatigue':question=`Goodman 修正：应力幅 ${n*10} MPa，平均拉应力 100 MPa，抗拉强度 500 MPa。等效应力幅 σa/(1−σm/σu) 是多少？`;answer=n*12.5;unit='MPa';explanation='分母为 1−100/500=0.8，因此等效应力幅为原应力幅的 1.25 倍。';break;
      default:throw new RangeError('unknown course');
    }
    return {question,answer,unit,explanation,absoluteTolerance:Math.max(Math.abs(answer)*.001,1e-6),seed};
  }
  function summary(events,now=Date.now()){
    const byId={};
    for(const e of events){const key=e.course+'/'+e.id;const s=byId[key]||(byId[key]={id:e.id,course:e.course,wrong:0,needsPractice:false,independent:false,transfer:false,reviews:0,dueAt:0,lastAt:0,lastSuccessAt:0});s.lastAt=Math.max(s.lastAt,e.at);
      if(['answer','transfer','review'].includes(e.kind)){
        if(!e.correct){s.wrong++;s.needsPractice=true;s.dueAt=e.at;}
        else if(e.kind==='answer'&&!e.assisted){s.independent=true;s.dueAt=e.at+DAY;}
        else if(e.kind==='transfer'&&!e.assisted){s.transfer=true;s.dueAt=e.at+3*DAY;}
        else if(e.kind==='review'&&!e.assisted&&s.lastSuccessAt>0&&e.at-s.lastSuccessAt>=DAY){s.reviews++;s.dueAt=e.at+[7,14,30][Math.min(s.reviews-1,2)]*DAY;}
        else s.dueAt=e.at+DAY;
        if(e.correct&&!e.assisted){s.needsPractice=false;s.lastSuccessAt=e.at;}
      }
    }
    return Object.values(byId).map(s=>({...s,due:s.dueAt>0&&s.dueAt<=now,label:s.reviews?'延迟复习通过':s.transfer?'变式独立完成':s.independent?'原题独立完成':'需要再练'}));
  }
  function valid(log){return !!log&&log.version===1&&Array.isArray(log.events)&&log.events.length<=1500&&log.events.every(e=>e&&Object.hasOwn(names,e.course)&&typeof e.id==='string'&&e.id.length<=100&&['answer','transfer','review','prediction','reason','hint'].includes(e.kind)&&typeof e.correct==='boolean'&&typeof e.assisted==='boolean'&&Number.isFinite(e.at)&&e.at>=0&&typeof e.input==='string'&&e.input.length<=200&&typeof e.tag==='string'&&e.tag.length<=40);}
  const api={DAY,names,tolerance,grade,diagnose,framework,exercise,summary,valid};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MechanicsLearning=api;
})(typeof window!=='undefined'?window:null);
