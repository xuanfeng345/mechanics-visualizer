(function(root){
  'use strict';
  const section={mode:'section',shape:'rectangle',width:.1,height:.2,moment:10000},shear={...section,mode:'shear',shear:10000};
  const thermal={mode:'thermal',length:2,area:.0004,youngsModulus:200e9,alpha:12e-6,temperature:40,endDisplacement:0};
  const compatibility={mode:'compatibility',length1:1,length2:1,area1:.0004,area2:.0008,youngsModulus:200e9,force:30000};
  const combined={mode:'axialBending',width:.1,height:.2,length:2,force:10000,axial:20000};
  const shaft={mode:'bendingTorsion',radius:.05,length:2,force:10000,torque:1000};
  const Irect=.1*.2**3/12,Icircle=Math.PI*.05**4/4,Ibeam=(.1*.2**3-.09*.16**3)/12;
  // Each answer below is independently expressed from the stated data, not queried from the scene.
  const specs={
    'beam-material':[
      ['geometry-rect','截面几何与应力分布','矩形截面惯性矩','矩形截面宽 b=0.1 m、高 h=0.2 m，求关于水平中性轴的 I（m⁴）。',Irect,'m⁴',String.raw`I=\frac{bh^3}{12}`,section,'I=0.1×0.2³/12=6.66667×10⁻⁵ m⁴。','geometry'],
      ['geometry-circle','截面几何与应力分布','实心圆惯性矩','实心圆半径 R=0.05 m，求直径轴的截面惯性矩 I（m⁴），不是极惯性矩。',Icircle,'m⁴',String.raw`I=\frac{\pi R^4}{4}`,{...section,shape:'circle',radius:.05},'I=πR⁴/4；极惯性矩 J=2I，不能混用。','geometry'],
      ['geometry-tube','截面几何与应力分布','圆环面积与空心化','圆环外半径 R=0.05 m、内半径 r=0.03 m，求截面积 A（m²）。',Math.PI*(.05**2-.03**2),'m²',String.raw`A=\pi(R^2-r^2)`,{...section,shape:'tube',radius:.05,innerRadius:.03},'从外圆面积减去内孔面积，A≈0.00502655 m²。','geometry'],
      ['geometry-i','截面几何与应力分布','工字形的材料效率','对称工字形 b=0.1 m、h=0.2 m、tf=0.02 m、tw=0.01 m，求水平轴 I/A（m²）。',Ibeam/.0056,'m²',String.raw`I=\frac{bh^3-(b-t_w)(h-2t_f)^3}{12}`,{...section,shape:'i',flange:.02,web:.01},'A=2btf+tw(h−2tf)=0.0056 m²；I≈3.59467×10⁻⁵ m⁴，I/A≈0.00641905 m²。','geometry'],
      ['shear-rect','弯曲剪应力','矩形最大剪应力','矩形 b=0.1 m、h=0.2 m，剪力 V=10000 N，求最大弯曲剪应力（MPa）。',.75,'MPa',String.raw`\tau_{\max}=\frac{3V}{2A}`,shear,'A=0.02 m²；τmax=1.5×10000/0.02=750000 Pa=0.75 MPa，在中性轴。','shear'],
      ['shear-circle','弯曲剪应力','圆截面横向剪切','实心圆 R=0.05 m，横向剪力 V=10000 N，按 VQ/(Ib) 求最大宽度平均剪应力（MPa）。',4*10000/(3*Math.PI*.05**2)/1e6,'MPa',String.raw`\tau_{\max}=\frac{4V}{3A}`,{...shear,shape:'circle',radius:.05},'这里是横向剪力，不是扭矩；τmax=4V/(3πR²)≈1.69765 MPa。','shear'],
      ['shear-web','弯曲剪应力','工字梁腹板剪应力','工字形 b=0.1 m、h=0.2 m、tf=0.02 m、tw=0.01 m，V=10000 N，求中性轴处 τ（MPa）。',10000*.000212/(Ibeam*.01)/1e6,'MPa',String.raw`\tau=\frac{VQ}{Ib}`,{...shear,shape:'i',flange:.02,web:.01},'中性轴处 b=tw=0.01 m，Q=0.000212 m³。代入 I≈3.59467×10⁻⁵ m⁴，τ≈5.89763 MPa。','shear'],
      ['cantilever-point','梁型与载荷迁移','悬臂端力挠度','左端固定梁 L=2 m，自由端向下力 P=12000 N，E=200 GPa、I=8×10⁻⁶ m⁴，求自由端向下挠度（mm）。',20,'mm',String.raw`v(L)=\frac{PL^3}{3EI}`,{support:'cantilever',loadType:'point',span:2,load:12000,position:2,youngsModulus:200e9,inertia:8e-6,sectionDistance:.05},'v=12000×2³/(3×200×10⁹×8×10⁻⁶)=0.02 m=20 mm。','beam'],
      ['cantilever-uniform','梁型与载荷迁移','悬臂均布载荷','悬臂梁 L=2 m、q=5000 N/m，求固定端内弯矩 M(0)（N·m，正弯矩为下缘受拉）。',-10000,'N·m',String.raw`M(0)=-\frac{qL^2}{2}`,{support:'cantilever',loadType:'uniform',span:2,distributedLoad:5000,position:1},'外部固定端反力矩为 +10000 N·m；梁内弯矩为 −qL²/2=−10000 N·m。','beam'],
      ['simple-uniform','梁型与载荷迁移','简支均布挠度','简支梁 L=4 m，q=5000 N/m，E=200 GPa、I=8×10⁻⁶ m⁴，求最大向下挠度（mm）。',5*5000*4**4/(384*200e9*8e-6)*1000,'mm',String.raw`v_{\max}=\frac{5qL^4}{384EI}`,{support:'simple',loadType:'uniform',span:4,distributedLoad:5000,position:1},'最大挠度在跨中；代入得 0.0104167 m，即 10.4167 mm。','beam']
    ],
    axial:[
      ['thermal-free','温度变形与约束','自由热伸长','杆 L=2 m，α=12×10⁻⁶/K，升温 40 K。若允许自由伸长，伸长多少 mm？',.96,'mm',String.raw`\Delta L_T=\alpha\Delta T L`,thermal,'自由热伸长=12×10⁻⁶×40×2=0.00096 m=0.96 mm。比较实验中的约束弹性变形。','thermal'],
      ['thermal-fixed','温度变形与约束','两端固定热应力','同一杆两端完全固定，E=200 GPa、α=12×10⁻⁶/K、升温 40 K，求应力（MPa，拉正压负）。',-96,'MPa',String.raw`\sigma=-E\alpha\Delta T`,thermal,'总伸长为零，弹性应变=−αΔT；σ=−96 MPa，是压应力。','thermal'],
      ['thermal-prescribed','温度变形与约束','部分释放温度变形','L=2 m、E=200 GPa、α=12×10⁻⁶/K，升温40 K；两端允许相对伸长0.48 mm。求应力（MPa）。',-48,'MPa',String.raw`\sigma=E\left(\frac{\Delta}{L}-\alpha\Delta T\right)`,{...thermal,endDisplacement:.00048},'自由伸长0.96 mm，弹性变形=0.48−0.96=−0.48 mm；σ=−48 MPa。','thermal'],
      ['compat-left','超静定与变形协调','分段杆左段内力','杆两端固定，L1=L2=1 m，A1=400 mm²、A2=800 mm²，E相同，结点受向右力P=30000 N。求左段轴力N1（拉正）。',10000,'N',String.raw`N_1=\frac{PC_2}{C_1+C_2},\quad C_i=\frac{L_i}{EA_i}`,compatibility,'N2=N1−P；协调 N1C1+N2C2=0。C1=2C2，所以 N1=P/3=10000 N。','compatibility'],
      ['compat-right','超静定与变形协调','分段杆右段内力','两端固定杆L1=L2=1 m，A1=400 mm²、A2=800 mm²、E相同，结点向右P=30000 N。求右段轴力N2（N，拉正压负）。',-20000,'N',String.raw`N_2=N_1-P`,compatibility,'左段拉伸10000 N，右段受压；N2=10000−30000=−20000 N。','compatibility'],
      ['compat-displacement','超静定与变形协调','结点位移与刚度','两端固定杆L1=L2=1 m，A1=400 mm²、A2=800 mm²、E=200 GPa，结点向右力30000 N。求结点向右位移（mm）。',.125,'mm',String.raw`u=\frac{P}{EA_1/L_1+EA_2/L_2}`,compatibility,'结点两侧等效刚度相加，u=30000/(80×10⁶+160×10⁶)=0.000125 m=0.125 mm。','compatibility']
    ],
    'stress-transform':[
      ['combined-lower','由载荷到组合应力','拉弯下缘应力','矩形悬臂b=0.1 m、h=0.2 m、L=2 m，自由端向上F=10000 N，轴向拉力N=20000 N。固定端下缘应力（MPa）？',31,'MPa',String.raw`\sigma_{\mathrm{lower}}=\frac{N}{A}+\frac{FLc}{I}`,combined,'A=0.02 m²、I=6.66667×10⁻⁵ m⁴；轴应力1 MPa，弯曲下缘30 MPa，共31 MPa。','combined'],
      ['combined-upper','由载荷到组合应力','拉弯上缘应力','同样的矩形悬臂b=0.1 m、h=0.2 m、L=2 m，自由端向上F=10000 N，轴向拉力N=20000 N。固定端上缘应力（MPa）？',-29,'MPa',String.raw`\sigma_{\mathrm{upper}}=\frac{N}{A}-\frac{FLc}{I}`,combined,'上缘弯曲应力为−30 MPa，与+1 MPa轴应力相加，得−29 MPa（受压）。','combined'],
      ['combined-torsion','由载荷到组合应力','弯扭外缘剪应力','实心圆轴R=0.05 m，固定端同时有弯矩与扭矩T=1000 N·m。求外缘扭转剪应力（MPa）。',1000*.05/(2*Icircle)/1e6,'MPa',String.raw`\tau=\frac{TR}{J},\quad J=\frac{\pi R^4}{2}`,shaft,'扭转剪应力使用极惯性矩J=2I，得τ≈5.09296 MPa；弯曲正应力另行计算。','torsion'],
      ['combined-mises','由载荷到组合应力','弯扭强度校核','实心圆悬臂R=0.05 m、L=2 m，端力F=10000 N、扭矩T=1000 N·m。求危险外缘的von Mises应力（MPa）。',Math.hypot(20000*.05/Icircle,Math.sqrt(3)*1000*.05/(2*Icircle))/1e6,'MPa',String.raw`\sigma_{\mathrm{vM}}=\sqrt{\sigma_b^2+3\tau^2}`,shaft,'固定端弯矩FL=20000 N·m，σb=MR/I，τ=TR/J，再作平方和。不能把两种应力直接相加。','torsion']
    ]
  };
  const laws={geometry:'先确定中性轴和截面几何，再计算面积与惯性矩',shear:'区分横向剪力与扭矩，用 Q 和局部截面宽度建立剪应力',beam:'先由支座和载荷确定内力，再用对应边界条件求挠度',thermal:'总变形等于弹性变形与自由热变形之和',compatibility:'整体平衡与两段变形协调必须同时满足',combined:'先从载荷求危险截面内力，再在同一点叠加正应力',torsion:'在危险截面的同一点组合弯曲正应力与扭转剪应力'};
  const predictions={
    geometry:['矩形宽度不变，高度变为2倍，水平轴惯性矩怎样变化？',['变为8倍','变为2倍','变为4倍'],'I=bh³/12，高度影响是三次方。'],
    shear:['矩形横向剪力不变，截面积变为2倍，最大剪应力怎样变化？',['变为原来一半','保持不变','变为2倍'],'矩形 τmax=3V/(2A)，与面积成反比。'],
    beam:['简支梁换成悬臂梁，求挠度时能否继续使用相同的端部条件？',['不能，固定端位移和转角都受约束','可以，只要E和I相同','可以，只要载荷合力相同'],'边界条件改变，挠曲线与反力形式也会改变。'],
    thermal:['均匀杆两端完全固定并升温，线弹性范围内会怎样？',['总伸长为零，产生压应力','自由伸长，没有应力','总伸长为零，产生拉应力'],'热伸长被约束，弹性压缩抵消自由热伸长。'],
    compatibility:['两端固定分段杆的结点受力，仅列整体平衡能唯一求出反力吗？',['不能，还需要变形协调','能，两个反力一定相等','能，面积较大的一段没有内力'],'支反力是超静定的；两段变形之和为零提供额外条件。'],
    combined:['构件整体受轴向拉力，同时弯曲，上缘一定受拉吗？',['不一定，弯曲压应力可能超过轴向拉应力','一定受拉，因为外部轴力是拉力','一定无应力，因为拉压抵消'],'必须在同一点按符号叠加 N/A 与弯曲正应力。'],
    torsion:['同一点只有扭转剪应力τ，没有正应力，其von Mises应力是多少？',['√3倍的|τ|','等于|τ|','等于3倍的|τ|'],'平面应力下 σvM=√(σ²+3τ²)，纯剪切时σ=0。']
  };
  function create(course,startUnit=2){
    const definitions=specs[course]||[],units=[...new Set(definitions.map(x=>x[1]))];
    const levels=definitions.map(([slug,unit,title,question,answer,unitLabel,formula,setup,solution,kind])=>({id:course+'-extra-'+slug,unit:startUnit+units.indexOf(unit),title,scene:kind==='beam'?'beam-material':'materials-lab',intro:laws[kind]+'。',question,answer,unitLabel,formula,formulaLatex:formula,setup,operation:null,tolerance:.01,solution,concept:slug,conceptId:slug,conceptIds:[slug],law:laws[kind],prediction:{question:predictions[kind][0],choices:predictions[kind][1],correct:0,explanation:predictions[kind][2]},hints:['先核对研究对象、正方向与题目单位。',laws[kind]+'；使用本题给出的公式。','代入前，把 GPa、MPa、mm 与 SI 单位统一。',solution]}));
    return {units,levels};
  }
  function exercise(id,seed=0){
    let spec;for(const [course,definitions]of Object.entries(specs))spec??=definitions.find(x=>id===course+'-extra-'+x[0]);if(!spec)return null;
    const n=2+Math.abs(seed)%7,kind=spec.at(-1);let question,answer,unit,explanation;
    if(kind==='geometry'){question=`矩形截面 b=${n*10} mm、h=100 mm，求水平中性轴惯性矩 I（mm⁴）。`;answer=n*10*100**3/12;unit='mm⁴';explanation='I=bh³/12，高度需取三次方。';}
    else if(kind==='shear'){question=`矩形面积 A=0.02 m²，横向剪力 V=${n*1000} N，最大剪应力多少 MPa？`;answer=.075*n;unit='MPa';explanation='τmax=1.5V/A，再由 Pa 换为 MPa。';}
    else if(kind==='thermal'){question=`两端固定杆 E=200 GPa、α=12×10⁻⁶/K，升温 ${n*10} K，求应力（MPa，拉正）。`;answer=-24*n;unit='MPa';explanation='总伸长为零，σ=−EαΔT，升温受压。';}
    else if(kind==='compatibility'){question=`两段等长、同E，两端固定，右段面积为左段2倍，结点向右力${n*3000} N，求左段轴力N1（N，拉正）。`;answer=n*1000;unit='N';explanation='C1=2C2；N1=P C2/(C1+C2)=P/3。';}
    else if(kind==='combined'){question=`矩形悬臂A=0.02 m²、I=6.666666667×10⁻⁵ m⁴、c=0.1 m，下缘受拉的弯矩M=${n*1000} N·m，轴向拉力N=20000 N，求下缘应力MPa。`;answer=1+1.5*n;unit='MPa';explanation='同一点叠加 σ=N/A+Mc/I。';}
    else if(kind==='torsion'){question=`同一点弯曲正应力 σ=${n*10} MPa、扭转剪应力 τ=10 MPa，求von Mises应力MPa。`;answer=Math.sqrt((n*10)**2+300);unit='MPa';explanation='σvM=√(σ²+3τ²)。';}
    else{question=`悬臂梁L=2 m、E=200 GPa、I=8×10⁻⁶ m⁴，自由端向下力${n*1000} N，端挠度多少mm？`;answer=n*1000*8/(3*200e9*8e-6)*1000;unit='mm';explanation='v(L)=PL³/(3EI)，悬臂边界不同于简支梁。';}
    return {question,answer,unit,explanation,absoluteTolerance:Math.max(Math.abs(answer)*.001,1e-7),seed};
  }
  const api={create,exercise};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.MaterialsLessons=api;
})(typeof window!=='undefined'?window:globalThis);
