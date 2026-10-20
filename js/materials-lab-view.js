(function(root){
  'use strict';
  const lab=root.MaterialsLab,ns='http://www.w3.org/2000/svg',f=lab.number;
  function render(host,input){
    const p=lab.params(input),r=lab.calculate(p),doc=host.ownerDocument,svg=doc.createElementNS(ns,'svg');
    const compact=root.matchMedia('(min-width:1101px) and (max-height:800px)').matches&&['section','shear'].includes(p.mode),amp=compact?55:85;
    svg.setAttribute('viewBox','0 0 760 '+(compact?265:360));svg.setAttribute('role','img');svg.setAttribute('aria-label',lab.modes[p.mode]);
    const parts=['<title>'+lab.modes[p.mode]+'</title>'];
    const text=(x,y,s,size=14,color='#202521',extra='')=>parts.push('<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+s+'</text>');
    const line=(x,y,X,Y,color='#626a64',dash=false)=>parts.push('<path d="M'+x+' '+y+'L'+X+' '+Y+'" stroke="'+color+'" fill="none"'+(dash?' stroke-dasharray="4 4"':'')+'/>');
    const rect=(x,y,w,h,color='#e0e4d8')=>parts.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+color+'" stroke="#343d30"/>');
    text(20,27,lab.modes[p.mode],18,'#202521','font-weight="700"');
    function fixed(x,y){line(x,y-25,x,y+25,'#202521');for(let i=0;i<8;i++)line(x-10,y-20+i*6,x,y-26+i*6);}
    if(['section','shear'].includes(p.mode)){
      const g=lab.geometry(p),scale=Math.min((compact?110:170)/(2*g.c),230/(p.shape==='circle'||p.shape==='tube'?2*p.radius:p.width)),cx=235,cy=compact?105:145;
      if(p.shape==='rectangle')rect(cx-p.width*scale/2,cy-g.c*scale,p.width*scale,2*g.c*scale);
      else if(p.shape==='circle'||p.shape==='tube'){
        parts.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+p.radius*scale+'" fill="#e0e4d8" stroke="#343d30"/>');
        if(p.shape==='tube')parts.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+p.innerRadius*scale+'" fill="#f0f1ed" stroke="#343d30"/>');
      }else{
        rect(cx-p.width*scale/2,cy-g.c*scale,p.width*scale,p.flange*scale);rect(cx-p.web*scale/2,cy-(g.c-p.flange)*scale,p.web*scale,(p.height-2*p.flange)*scale);rect(cx-p.width*scale/2,cy+(g.c-p.flange)*scale,p.width*scale,p.flange*scale);
      }
      line(85,cy,375,cy,'#65733e',true);text(90,cy-7,'中性轴 y=0',12,'#626a64');
      line(450,cy-amp,450,cy+amp);line(450,cy,700,cy);
      let max=0;const samples=[];for(let i=0;i<=120;i++){const y=g.c*(1-i/60),v=r.profile(y);const value=p.mode==='shear'?v.tau:v.sigma;max=Math.max(max,Math.abs(value));samples.push([y,value]);}
      // Insert flange/web interfaces to retain the jump in the width-averaged shear stress.
      if(p.shape==='i'&&p.mode==='shear')for(const sign of [-1,1])for(const eps of [-1e-9,1e-9]){const y=sign*(g.c-p.flange)+eps*g.c;samples.push([y,r.profile(y).tau]);}
      samples.sort((a,b)=>b[0]-a[0]);max=max||1;
      parts.push('<path data-lab-profile="" d="'+samples.map(([y,v],i)=>(i?'L':'M')+(550+v/max*125).toFixed(2)+','+(cy-y/g.c*amp).toFixed(2)).join(' ')+'" fill="none" stroke="#65733e" stroke-width="2"/>');
      line(550,cy-amp,550,cy+amp,'#626a64',true);
      const y=cy-p.eta*amp;line(90,y,710,y,'#65733e',true);
      text(450,48,p.mode==='shear'?'截面宽度平均 τ(y)':'弯曲正应力 σ(y)',14);text(455,compact?179:247,'y/c='+f(p.eta)+' · '+(p.mode==='shear'?'τ='+f(r.tau):'σ='+f(r.sigma))+' Pa',13);
      text(20,compact?202:279,'A = '+f(r.area)+' m²     I = '+f(r.I)+' m⁴',15);
      text(20,compact?224:303,p.mode==='shear'?'|τ|max = '+f(r.maxShear)+' Pa · 由 VQ/(Ib) 计算':'|σ|max = '+f(r.maxStress)+' Pa · 上下缘符号相反',15);
      if(!compact)text(20,352,'I/A = '+f(r.I/r.area)+' m² · 比同外框实心截面材料效率需在相同约束下比较',11,'#626a64');
      text(20,compact?247:330,p.mode==='shear'?'V 是横向剪力；此分布不同于扭转剪应力。':'y 向上，σ=−My/I；截面均关于中性轴对称。',13,'#626a64');
      parts.push('<rect data-lab-probe="" x="85" y="'+(cy-amp)+'" width="625" height="'+(2*amp)+'" fill="transparent" tabindex="0" role="slider" aria-label="观测截面高度 y/c" aria-valuemin="-1" aria-valuemax="1" aria-valuenow="'+p.eta+'" style="cursor:ns-resize;touch-action:pan-x"/>');
    }else if(p.mode==='thermal'||p.mode==='compatibility'){
      const junction=p.mode==='compatibility',join=junction?80+600*p.length1/(p.length1+p.length2):380;
      fixed(80,120);fixed(680,120);
      if(junction){
        const shift=30*Math.tanh(r.displacement/.001),moved=join+Math.max(-(join-80)/2,Math.min((680-join)/2,shift));rect(80,105,moved-80,30,r.N1>=0?'#dfe8c8':'#e6ded2');rect(moved,105,680-moved,30,r.N2>=0?'#dfe8c8':'#e6ded2');
        line(join,98,join,145,'#626a64',true);line(moved,98,moved,145,'#65733e');text(moved,80,'P='+f(p.force)+' N '+(p.force>=0?'→':'←'),15,'#65733e','text-anchor="middle"');text(100,166,'L1='+f(p.length1)+' m · A1='+f(p.area1)+' m²',13);text(410,166,'L2='+f(p.length2)+' m · A2='+f(p.area2)+' m²',13);
        text(380,53,'结点位移放大示意 · 虚线为初始位置',12,'#626a64','text-anchor="middle"');
      }
      else{
        rect(80,105,600,30,r.stress>=0?'#dfe8c8':'#e6ded2');const freeEnd=680+40*Math.tanh(r.freeExpansion/(p.length*.001));line(80,145,freeEnd,145,'#65733e',true);line(freeEnd,139,freeEnd,151,'#65733e');
        text(380,80,'ΔT='+f(p.temperature)+' K · 两端相对位移 Δ='+f(p.endDisplacement)+' m',14,'#65733e','text-anchor="middle"');text(100,167,'L='+f(p.length)+' m · A='+f(p.area)+' m² · E='+f(p.youngsModulus)+' Pa',14);text(380,53,'虚线为自由热变形的放大示意，非实际伸长',12,'#626a64','text-anchor="middle"');
      }
      text(80,205,'RA='+f(r.RA)+' N',16);text(440,205,'RB='+f(r.RB)+' N',16);
      if(junction){text(20,249,'N1='+f(r.N1)+' N · N2='+f(r.N2)+' N（拉为正）',16);text(20,276,'结点位移 u='+f(r.displacement)+' m（向右为正）',16);text(20,303,'ΔL1='+f(r.deformation1)+' m · ΔL2='+f(r.deformation2)+' m',15);}
      else{text(20,249,'自由热变形 '+f(r.freeExpansion)+' m · 约束弹性变形 '+f(r.elasticDeformation)+' m',16);text(20,278,'σ='+f(r.stress)+' Pa · N='+f(r.force)+' N（正拉 / 负压）',16);text(20,304,'总变形 '+f(r.totalDeformation)+' m = 自由热变形 + 弹性变形',15);}
      text(20,335,junction?'整体平衡 + 两段变形和为零，才能确定反力。':'Δ=0 为两端完全固定；升温产生压应力，降温产生拉应力。',13,'#626a64');
    }else{
      fixed(75,110);rect(75,102,370,16);
      parts.push('<path d="'+(p.force>=0?'M445 100V68m-5 7l5-7 5 7':'M445 68V100m-5-7l5 7 5-7')+'" fill="none" stroke="#65733e"/>');text(450,65,'F='+f(p.force)+' N',14);
      text(80,148,'危险截面：固定端 · |M|=|F L|='+f(Math.abs(r.moment))+' N·m',14);line(80,178,445,178);
      const round=p.mode==='bendingTorsion';text(80,200,round?'T='+f(p.torque)+' N·m':'N='+f(p.axial)+' N（拉为正）',15);
      if(round)parts.push('<circle cx="610" cy="125" r="55" fill="#e0e4d8" stroke="#343d30"/>');else rect(560,65,100,120);
      line(550,125,670,125,'#626a64',true);parts.push('<circle cx="610" cy="'+(125-r.dangerY/(round?p.radius:p.height/2)*(round?55:60))+'" r="5" fill="#65733e"/>');
      text(610,215,'校核点：'+r.danger,14,'#65733e','text-anchor="middle"');
      text(20,246,'σ上='+f(r.upperStress)+' Pa · σ下='+f(r.lowerStress)+' Pa',15);
      text(20,271,'面内 σ+='+f(r.sigma1)+' Pa · σ−='+f(r.sigma2)+' Pa · 另有主值0',15);
      text(20,296,'σvM='+f(r.vonMises)+' Pa · η='+f(r.utilization)+' '+(r.utilization<=1?'≤ 1':'＞ 1'),16,r.utilization<=1?'#65733e':'#a33e32');
      text(20,323,round?'仅外缘弯扭屈服校核；未计横向剪切，短粗轴不宜据此判断整体强度。':'叠加轴向、弯曲及矩形横向剪应力；高度1000分段搜索，未做稳定性校核。',13,'#626a64');
      text(20,346,(round?'τ扭转=':'τ横向=')+f(r.tau)+' Pa · 校核阈值 σy/n='+f(p.yieldStress/p.safetyFactor)+' Pa',13,'#626a64');
    }
    svg.innerHTML=parts.join('');host.replaceChildren(svg);
    const probe=svg.querySelector('[data-lab-probe]');
    if(probe){
      const select=eta=>host.dispatchEvent(new doc.defaultView.CustomEvent('materials-lab-probe',{bubbles:true,detail:{eta:Math.max(-1,Math.min(1,eta))}}));
      const at=e=>{const matrix=svg.getScreenCTM();if(!matrix)return;const point=new doc.defaultView.DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());select(((compact?105:145)-point.y)/amp);};
      probe.onpointerdown=e=>{e.preventDefault();host._labPointer=e.pointerId;host.setPointerCapture(e.pointerId);at(e);};host.onpointermove=e=>{if(host._labPointer===e.pointerId)at(e);};host.onpointerup=host.onpointercancel=()=>host._labPointer=null;
      probe.onkeydown=e=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();select(e.key==='Home'?1:e.key==='End'?-1:p.eta+(e.key==='ArrowUp'?.02:-.02));host.querySelector('[data-lab-probe]')?.focus({preventScroll:true});};
    }else{host.onpointermove=null;host._labPointer=null;}
    if(host.clientWidth<600){
      const list=doc.createElement('dl');list.className='materials-mobile-readings';list.setAttribute('aria-label','当前实验读数');
      for(const [name,value,unit]of lab.readings(r)){const row=doc.createElement('div'),term=doc.createElement('dt'),reading=doc.createElement('dd');term.textContent=name;reading.textContent=f(value)+' '+unit;row.append(term,reading);list.append(row);}host.append(list);
    }
    return r;
  }
  lab.render=render;
})(window);
