/* Symmetric cross-sections, elementary combined loading and axial compatibility. SI units. */
(function(root){
  'use strict';
  const defaults={mode:'section',shape:'rectangle',width:.1,height:.2,radius:.05,innerRadius:.03,flange:.02,web:.01,moment:10000,shear:10000,eta:0,force:10000,axial:20000,torque:1000,length:2,youngsModulus:200e9,yieldStress:250e6,safetyFactor:1.5,area:400e-6,alpha:12e-6,temperature:40,endDisplacement:0,length1:1,length2:1,area1:400e-6,area2:800e-6};
  const limits={width:[.001,2],height:[.001,2],radius:[.001,1],innerRadius:[0,.999],flange:[.0001,.999],web:[.0001,1],moment:[-1e8,1e8],shear:[-1e8,1e8],eta:[-1,1],force:[-1e8,1e8],axial:[-1e8,1e8],torque:[-1e8,1e8],length:[.01,100],youngsModulus:[1e6,1e12],yieldStress:[1e5,1e10],safetyFactor:[1,10],area:[1e-8,1],alpha:[0,.001],temperature:[-500,500],endDisplacement:[-.1,.1],length1:[.01,100],length2:[.01,100],area1:[1e-8,1],area2:[1e-8,1]};
  const modes={section:'截面与弯曲应力',shear:'弯曲剪应力',axialBending:'拉压与弯曲',bendingTorsion:'圆轴弯扭组合',thermal:'约束温度变形',compatibility:'两端固定分段杆'};
  const shapes={rectangle:'矩形',circle:'实心圆',tube:'圆环',i:'对称工字形'};
  function params(input={}){
    if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('参数必须是对象');
    const p={...defaults,...input};
    if(!Object.hasOwn(modes,p.mode)||!Object.hasOwn(shapes,p.shape))throw new RangeError('未知实验类型或截面');
    for(const [key,[min,max]] of Object.entries(limits))if(typeof p[key]!=='number'||!Number.isFinite(p[key])||p[key]<min||p[key]>max)throw new RangeError(key+' 超出范围');
    if(['section','shear'].includes(p.mode)&&p.shape==='tube'&&p.innerRadius>=p.radius)throw new RangeError('内半径必须小于外半径');
    if(['section','shear'].includes(p.mode)&&p.shape==='i'&&(p.web>=p.width||2*p.flange>=p.height))throw new RangeError('工字形要求腹板薄于翼缘宽，且两翼缘总厚度小于截面高度');
    return p;
  }
  function geometry(input){
    const p=params(input),shape=p.shape,b=p.width,h=p.height,R=p.radius,r=p.innerRadius;
    let area,I,c,width,Q;
    if(shape==='rectangle'){
      area=b*h;I=b*h**3/12;c=h/2;width=()=>b;Q=y=>b*(c*c-y*y)/2;
    }else if(shape==='circle'||shape==='tube'){
      const inner=shape==='tube'?r:0;area=Math.PI*(R*R-inner*inner);I=Math.PI*(R**4-inner**4)/4;c=R;
      width=y=>2*(Math.sqrt(Math.max(0,R*R-y*y))-Math.sqrt(Math.max(0,inner*inner-y*y)));
      Q=y=>2/3*(Math.max(0,R*R-y*y)**1.5-Math.max(0,inner*inner-y*y)**1.5);
    }else{
      const a=h/2-p.flange;area=2*b*p.flange+p.web*(h-2*p.flange);I=(b*h**3-(b-p.web)*(h-2*p.flange)**3)/12;c=h/2;
      width=y=>Math.abs(y)<a?p.web:b;
      Q=y=>Math.abs(y)>=a?b*(c*c-y*y)/2:b*(c*c-a*a)/2+p.web*(a*a-y*y)/2;
    }
    return {shape,area,I,c,width,Q};
  }
  function calculate(input){
    const p=params(input),result={mode:p.mode};
    if(p.mode==='thermal'){
      const free=p.alpha*p.temperature*p.length,elastic=p.endDisplacement-free,stress=p.youngsModulus*elastic/p.length,N=stress*p.area;
      return {...result,freeExpansion:free,elasticDeformation:elastic,totalDeformation:p.endDisplacement,stress,force:N,RA:-N,RB:N,utilization:Math.abs(stress)*p.safetyFactor/p.yieldStress};
    }
    if(p.mode==='compatibility'){
      const C1=p.length1/(p.youngsModulus*p.area1),C2=p.length2/(p.youngsModulus*p.area2),N1=p.force*C2/(C1+C2),N2=N1-p.force;
      return {...result,N1,N2,RA:-N1,RB:N2,displacement:N1*C1,deformation1:N1*C1,deformation2:N2*C2,stress1:N1/p.area1,stress2:N2/p.area2};
    }
    if(p.mode==='axialBending'||p.mode==='bendingTorsion'){
      const round=p.mode==='bendingTorsion',g=geometry({...p,mode:'section',shape:round?'circle':'rectangle'}),M=p.force*p.length;
      const normal=round?0:p.axial/g.area,bending=M*g.c/g.I,lower=normal+bending,upper=normal-bending;
      let stress=Math.abs(lower)>=Math.abs(upper)?lower:upper,tau=round?p.torque*p.radius/(2*g.I):0,dangerY=stress===lower?-g.c:g.c;
      if(!round){
        let best=-1;
        for(let i=0;i<=1000;i++){const eta=-1+2*i/1000,s=normal-bending*eta,t=1.5*p.force/g.area*(1-eta*eta),vm2=s*s+3*t*t;if(vm2>best){best=vm2;stress=s;tau=t;dangerY=eta*g.c;}}
      }
      const R=Math.hypot(stress/2,tau);
      const sigma1=stress/2+R,sigma2=stress/2-R,vm=Math.hypot(stress,Math.sqrt(3)*tau);
      return {...result,area:g.area,I:g.I,J:round?2*g.I:undefined,moment:M,axialStress:normal,bendingStress:bending,lowerStress:lower,upperStress:upper,stress,tau,sigma1,sigma2,vonMises:vm,utilization:vm*p.safetyFactor/p.yieldStress,dangerY,danger:'固定端'+(round?'弯曲外缘':'y='+number(dangerY)+' m')};
    }
    const g=geometry(p),y=p.eta*g.c;
    function profile(y){
      if(!Number.isFinite(y)||Math.abs(y)>g.c+1e-12)throw new RangeError('观测点超出截面');
      const b=g.width(y),tau=Math.abs(y)>=g.c?0:p.shear*g.Q(y)/(g.I*b);
      return {y,width:b,Q:g.Q(y),sigma:-p.moment*y/g.I,tau};
    }
    return {...result,...g,...profile(y),maxStress:Math.abs(p.moment)*g.c/g.I,maxShear:Math.abs(p.shear*g.Q(0)/(g.I*g.width(0))),profile};
  }
  const fields={width:['宽 b',.001,.5,.001,'m'],height:['高 h',.005,.8,.001,'m'],radius:['外半径 R',.005,.2,.001,'m'],innerRadius:['内半径 r',0,.19,.001,'m'],flange:['翼缘厚 tf',.001,.1,.001,'m'],web:['腹板厚 tw',.001,.1,.001,'m'],moment:['弯矩 M',-50000,50000,100,'N·m'],shear:['剪力 V',-50000,50000,100,'N'],eta:['观测位置 y/c',-1,1,.01,''],force:['端部力 / 结点力 P',-50000,50000,100,'N'],axial:['轴力 N（拉为正）',-100000,100000,100,'N'],torque:['扭矩 T',-10000,10000,10,'N·m'],length:['杆 / 梁长 L',.1,5,.01,'m'],youngsModulus:['弹性模量 E',1e9,3e11,1e9,'Pa'],yieldStress:['屈服强度 σy',1e6,1e9,1e6,'Pa'],safetyFactor:['安全系数 n',1,5,.1,''],area:['截面积 A',1e-5,.01,1e-5,'m²'],alpha:['热膨胀系数 α',0,.00005,.000001,'1/K'],temperature:['温差 ΔT',-200,200,1,'K'],endDisplacement:['两端相对位移 Δ',-.01,.01,.0001,'m'],length1:['左段长 L1',.1,5,.01,'m'],length2:['右段长 L2',.1,5,.01,'m'],area1:['左段面积 A1',1e-5,.01,1e-5,'m²'],area2:['右段面积 A2',1e-5,.01,1e-5,'m²']};
  function activeFields(p){
    if(p.mode==='thermal')return ['length','area','youngsModulus','alpha','temperature','endDisplacement'];
    if(p.mode==='compatibility')return ['length1','length2','area1','area2','youngsModulus','force'];
    if(p.mode==='axialBending')return ['width','height','length','force','axial','yieldStress','safetyFactor'];
    if(p.mode==='bendingTorsion')return ['radius','length','force','torque','yieldStress','safetyFactor'];
    const dims={rectangle:['width','height'],circle:['radius'],tube:['radius','innerRadius'],i:['width','height','flange','web']}[p.shape];
    return [...dims,p.mode==='shear'?'shear':'moment','eta'];
  }
  const number=n=>!Number.isFinite(n)?'—':n===0?'0':Math.abs(n)<.001||Math.abs(n)>=1e5?n.toExponential(2):Number(n.toPrecision(5)).toString();
  function controls(host,input,onChange){
    const p=params(input),doc=host.ownerDocument;host._labParams=p;host.replaceChildren();
    const exact=n=>Math.abs(n)>=1e6||(n!==0&&Math.abs(n)<.001)?n.toExponential().replace('+',''):String(n);
    const bar=doc.createElement('div');bar.className='materials-lab-switch';
    function choose(key,label,options){const l=doc.createElement('label');l.textContent=label;const select=doc.createElement('select');select.id=key==='mode'?'materialsLabMode':'materialsLabShape';for(const [value,name]of Object.entries(options))select.add(new doc.defaultView.Option(name,value));select.value=p[key];select.onchange=()=>apply(key,select.value);l.append(select);bar.append(l);}
    choose('mode','实验主题',modes);if(['section','shear'].includes(p.mode))choose('shape','截面形状',shapes);host.append(bar);
    const feedback=doc.createElement('p');feedback.className='materials-lab-error';feedback.setAttribute('role','status');host.append(feedback);
    function apply(key,value){
      const next={...p,[key]:value};
      try{params(next);onChange(next,key);Object.assign(p,next);feedback.textContent='';for(const el of host.querySelectorAll('[data-lab-number="'+key+'"],[data-lab-param="'+key+'"]'))el.value=exact(p[key]);const out=host.querySelector('[data-lab-output="'+key+'"]');if(out)out.textContent=number(p[key])+' '+fields[key][4];}catch(e){feedback.textContent=e.message;for(const el of host.querySelectorAll('[data-lab-number="'+key+'"],[data-lab-param="'+key+'"]'))el.value=exact(p[key]);}
    }
    for(const key of activeFields(p)){
      const [originalName,min,max,step,unit]=fields[key],name=key==='force'?(p.mode==='compatibility'?'结点力 P':'向上端力 F'):originalName,label=doc.createElement('label');label.textContent=name;
      const out=doc.createElement('output');out.dataset.labOutput=key;out.textContent=number(p[key])+' '+unit;
      const range=doc.createElement('input');range.type='range';range.min=min;range.max=max;range.step=step;range.value=p[key];range.dataset.labParam=key;range.setAttribute('aria-label',name);
      const input=doc.createElement('input');input.type='number';input.min=limits[key][0];input.max=limits[key][1];input.step='any';input.value=exact(p[key]);input.dataset.labNumber=key;input.setAttribute('aria-label','精确输入'+name+'，单位'+unit);
      range.oninput=()=>apply(key,Number(range.value));input.onchange=()=>{if(input.value.trim()===''){feedback.textContent='请输入有限数值';return;}apply(key,Number(input.value));};
      label.append(out,range,input);host.append(label);
    }
  }
  function readings(r){
    const fields=r.mode==='thermal'?[['自由热变形','freeExpansion','m'],['弹性变形','elasticDeformation','m'],['总变形','totalDeformation','m'],['应力','stress','Pa'],['轴力','force','N']]:r.mode==='compatibility'?[['左段内力','N1','N'],['右段内力','N2','N'],['左反力','RA','N'],['右反力','RB','N'],['结点位移','displacement','m']]:['axialBending','bendingTorsion'].includes(r.mode)?[['危险点正应力','stress','Pa'],[r.mode==='bendingTorsion'?'扭转剪应力':'横向剪应力','tau','Pa'],['面内主值正支','sigma1','Pa'],['面内主值负支','sigma2','Pa'],['等效应力','vonMises','Pa'],['利用率','utilization','']]:r.mode==='shear'?[['面积','area','m^2'],['惯性矩','I','m^4'],['最大剪应力','maxShear','Pa'],['当前剪应力','tau','Pa']]:[['面积','area','m^2'],['惯性矩','I','m^4'],['最大正应力','maxStress','Pa'],['当前正应力','sigma','Pa']];
    return fields.map(([label,key,unit])=>[label,r[key],unit]);
  }
  function steps(input={}){
    const p=params(input),target='#alternateScene path,#alternateScene rect:not([data-lab-probe]),#alternateScene circle';
    const make=items=>items.map(([title,tex,caption])=>[title,tex,caption,target]);
    if(p.mode==='thermal')return make([
      ['自由热变形',String.raw`\Delta_T=\alpha\Delta T L`,'温差用 K 或摄氏温差，数值相同；自由热变形本身不要求有应力。'],
      ['变形协调',String.raw`\Delta=\Delta_e+\Delta_T`,'Δ 是两端相对位移；完全固定时 Δ=0，不能把自由热变形当作实际伸长。'],
      ['本构求应力',String.raw`\sigma=E\frac{\Delta_e}{L}=E\left(\frac{\Delta}{L}-\alpha\Delta T\right)`,'拉应力为正；完全约束时升温受压、降温受拉。'],
      ['反力与适用范围',String.raw`N=\sigma A,\quad R_A=-N,\quad R_B=N`,'反力向右为正。线弹性、均匀温差；不考虑屈服、屈曲或支座柔度。']
    ]);
    if(p.mode==='compatibility')return make([
      ['整体与结点平衡',String.raw`R_A+P+R_B=0,\quad N_1-N_2=P`,'结点力 P 向右为正；N1、N2 以拉为正。仅有平衡方程不能唯一确定支反力。'],
      ['分段柔度',String.raw`C_1=\frac{L_1}{EA_1},\quad C_2=\frac{L_2}{EA_2}`,'两段当前使用相同 E，可以有不同长度和面积。'],
      ['加上变形协调',String.raw`N_1C_1+N_2C_2=0`,'两端固定，左段伸长与右段缩短相抵；没有温差或初始间隙。'],
      ['求内力和位移',String.raw`N_1=\frac{PC_2}{C_1+C_2},\quad N_2=N_1-P,\quad u=N_1C_1`,'结点两侧等效刚度相加，位移向右为正；内力可一拉一压。']
    ]);
    if(p.mode==='axialBending'||p.mode==='bendingTorsion')return make([
      ['由载荷找危险截面',String.raw`M(x)=F(L-x),\quad |M|_{\max}=|F|L`,'左端固定、自由端竖向力 F 向上为正；危险截面在固定端。'],
      ['同一点叠加应力',p.mode==='axialBending'?String.raw`\sigma_{\rm lower}=\frac{N}{A}+\frac{FLc}{I},\quad\sigma_{\rm upper}=\frac{N}{A}-\frac{FLc}{I}`:String.raw`\sigma_b=\frac{MR}{I},\quad \tau=\frac{TR}{J},\quad J=2I=\frac{\pi R^4}{2}`,'拉弯使用矩形截面；弯扭使用实心圆轴。不能将不同点的应力分量随意组合。'],
      ['危险点主应力',String.raw`\sigma_{1,2}=\frac{\sigma}{2}\pm\sqrt{\left(\frac{\sigma}{2}\right)^2+\tau^2},\quad\sigma_3=0`,'这里报告面内两个主值；第三主值为零。拉弯按高度搜索并计入矩形横向剪应力；弯扭只校核外缘候选点，未含横向剪切。'],
      ['静载屈服校核',String.raw`\sigma_{\rm vM}=\sqrt{\sigma^2+3\tau^2},\quad\eta=\frac{n\sigma_{\rm vM}}{\sigma_y}\leq1`,'只比较延性材料静载屈服，不代表疲劳、屈曲及全部失效模式均满足。']
    ]);
    const I={rectangle:String.raw`I=\frac{bh^3}{12}`,circle:String.raw`I=\frac{\pi R^4}{4}`,tube:String.raw`I=\frac{\pi(R^4-r^4)}{4}`,i:String.raw`I=\frac{bh^3-(b-t_w)(h-2t_f)^3}{12}`}[p.shape];
    return make([
      ['确定中性轴',String.raw`\bar y=0,\quad I=\int_A y^2\,\mathrm dA`,'当前四种截面均双对称；坐标原点取形心，中性轴为水平轴。'],
      ['截面几何',I,'I 是关于水平轴的截面二次矩，不是圆轴扭转使用的极惯性矩。面积和 I 随形状、尺寸变化。'],
      ['弯曲正应力',String.raw`\sigma(y)=-\frac{My}{I}`,'y 向上为正，正弯矩使下缘受拉；中性轴应力为零。'],
      ['横向剪应力',String.raw`\tau(y)=\frac{VQ(y)}{I b(y)},\quad Q(y)=\int_{A_{\rm above}} y\,\mathrm dA`,'这是截面宽度平均的工程梁剪应力。矩形最大值 3V/(2A)、实心圆 4V/(3A)，工字形需使用腹板或翼缘的局部宽度；不等于扭转剪应力。']
    ]);
  }
  const api={defaults,params,geometry,calculate,controls,activeFields,modes,shapes,number,readings,steps};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.MaterialsLab=api;
})(typeof window!=='undefined'?window:globalThis);
