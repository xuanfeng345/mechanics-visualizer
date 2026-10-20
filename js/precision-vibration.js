/* Opt-in SVG presentation; the existing analytic vibration kernel remains authoritative. */
(() => {
  'use strict';
  if(document.documentElement.dataset.ui!=='precision')return;
  const api=window.VibrationScene,originalRender=api.render;
  const fmt=(n,d=3)=>Number.isFinite(n)?Math.abs(n)>=1e5?n.toExponential(2):n.toFixed(d):'—';
  const labels={undamped:'无阻尼',underdamped:'欠阻尼',critical:'临界阻尼',overdamped:'过阻尼',free:'自由运动'};

  api.render=function(host,params){
    if(!host||!('innerHTML' in host))return originalRender(host,params);
    const r=api.calculate(params);
    const duration=Math.max(2,Math.min(20,3*(r.dampedPeriod||r.period||1)),Math.min(r.time,20));
    const count=Math.min(3600,Math.max(240,Math.ceil(duration*Math.max(1,r.frequency)*32)));
    const points=[];
    let amplitude=Math.max(.01,Math.abs(r.displacement),Math.abs(r.initialDisplacement));
    for(let i=0;i<=count;i++){
      const t=duration*i/count;
      const x=api.calculate({...params,time:t}).displacement;
      amplitude=Math.max(amplitude,Math.abs(x));points.push(x);
    }
    const halfRange=amplitude*1.2,eq=530,cy=208,bx=eq+110*r.displacement/amplitude;
    const left=bx-43,right=bx+43;
    const spring=[];spring.push('112,208','134,208');
    for(let i=0;i<=22;i++)spring.push((134+(left-154)*i/22).toFixed(2)+','+(i%2?190:226));
    spring.push((left-8).toFixed(2)+',208',left.toFixed(2)+',208');
    const X=t=>72+t/duration*766,Y=x=>550-x/halfRange*72;
    const path=points.map((x,i)=>(i?'L':'M')+X(duration*i/count).toFixed(2)+','+Y(x).toFixed(2)).join(' ');
    const currentX=X(Math.min(r.time,duration)),currentY=Y(r.displacement);
    const text=(x,y,value,size=12,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${value}</text>`;
    const readouts=[['位移 / DISPLACEMENT',fmt(r.displacement)+' m'],['速度 / VELOCITY',fmt(r.velocity)+' m/s'],['时间 / TIME',fmt(r.time,2)+' s'],['总能量 / ENERGY',fmt(r.totalEnergy)+' J']];
    let chartGrid='',ticks='';
    for(let i=0;i<=4;i++){
      const x=X(duration*i/4);chartGrid+=`<line x1="${x}" y1="465" x2="${x}" y2="635"/>`;
      ticks+=text(x,657,fmt(duration*i/4,2),11,'text-anchor="middle"');
    }
    for(const v of [-halfRange,0,halfRange]){
      chartGrid+=`<line x1="72" y1="${Y(v)}" x2="838" y2="${Y(v)}"/>`;
      ticks+=text(60,Y(v)+4,fmt(v),11,'text-anchor="end"');
    }
    host.innerHTML=`<svg class="precision-vibration-scene" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 690" role="img" aria-labelledby="precisionVibTitle precisionVibDesc">
      <title id="precisionVibTitle">弹簧质块自由振动</title>
      <desc id="precisionVibDesc">${labels[r.regime]}，使用当前参数的解析解。上方为变形放大的模型，下方为实际位移时间曲线；点击曲线或使用方向键定位时间。</desc>
      <defs>
        <pattern id="precisionHatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8L8 0" stroke="#b0b8a9" stroke-width="1"/></pattern>
        <marker id="precisionArrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#202521" stroke-width="1.2"/></marker>
      </defs>
      <g fill="#202521" font-family="Arial,Microsoft YaHei,sans-serif">
        <g data-region="model">
        ${text(24,30,'单自由度弹簧振子 / '+labels[r.regime],15)}
        ${text(876,30,'变形放大示意 · 无碰撞',10,'text-anchor="end" fill="#626a64"')}
        <rect x="88" y="129" width="22" height="168" fill="url(#precisionHatch)"/>
        <path d="M112 129V288H850" fill="none" stroke="#202521" stroke-width="2"/>
        <rect x="112" y="289" width="738" height="8" fill="url(#precisionHatch)"/>
        <line x1="${eq}" y1="85" x2="${eq}" y2="286" stroke="#858e7c" stroke-dasharray="5 5"/>
        ${text(eq,66,'平衡位置',12,'text-anchor="middle"')}${text(eq,83,'x = 0',12,'text-anchor="middle" font-family="Georgia,serif" font-style="italic"')}
        <polyline data-guide="spring" points="${spring.join(' ')}" fill="none" stroke="#343d30" stroke-width="2.5"/>
        ${text((112+left)/2,170,'k',23,'text-anchor="middle" font-family="Georgia,serif" font-style="italic"')}
        <rect data-guide="mass" x="${left}" y="165" width="86" height="104" fill="#e0e4d8" stroke="#202521" stroke-width="2"/>
        <circle cx="${left+17}" cy="278" r="9" fill="#d6dccd" stroke="#202521"/><circle cx="${right-17}" cy="278" r="9" fill="#d6dccd" stroke="#202521"/>
        ${text(bx,227,'m',27,'text-anchor="middle" font-family="Georgia,serif" font-style="italic"')}
        <line x1="${right+14}" y1="208" x2="${Math.min(858,right+98)}" y2="208" stroke="#202521" marker-end="url(#precisionArrow)"/>
        ${text(Math.min(850,right+55),193,'x(t)',19,'font-family="Georgia,serif" font-style="italic"')}
        ${text(24,326,'m = '+fmt(r.mass,2)+' kg    k = '+fmt(r.stiffness,2)+' N/m    c = '+fmt(r.damping,2)+' N·s/m',14,'fill="#626a64"')}
        </g><g data-region="readouts">
        <g stroke="#d1d6ce" fill="#f8faf4"><rect x="16" y="350" width="868" height="78" fill-opacity=".85"/>
          <path d="M233 350V428M450 350V428M667 350V428"/></g>
        ${readouts.map(([label,value],i)=>text(32+i*217,374,label,12,'fill="#626a64" letter-spacing=".3"')+text(32+i*217,407,value,26,'font-family="Consolas,monospace"')).join('')}
        </g><g data-region="chart">
        ${text(24,452,'位移—时间响应 / DISPLACEMENT · TIME',14)}
        <g stroke="#d5dacc" stroke-width=".8">${chartGrid}</g>
        <path d="M72 465V635H838M72 550H838" stroke="#87917e" fill="none"/>
        <path data-guide="waveform" d="${path}" fill="none" stroke="#65733e" stroke-width="2"/>
        <line x1="${currentX}" y1="465" x2="${currentX}" y2="635" stroke="#647025" stroke-dasharray="3 4" opacity=".7"/>
        <circle cx="${currentX}" cy="${currentY}" r="4" fill="#65733e" stroke="#f8faf4" stroke-width="2"/>
        ${ticks}${text(40,462,'x / m',10)}${text(870,657,'t / s',11)}
        ${text(72,680,'点击曲线定位时间 · 方向键微调 0.02 s',10,'fill="#626a64"')}
        <rect data-time-scrub="" x="72" y="465" width="766" height="170" fill="transparent" tabindex="0" role="slider" aria-label="位移曲线时间定位" aria-valuemin="0" aria-valuemax="${Math.min(20,duration)}" aria-valuenow="${Math.min(20,r.time)}" aria-valuetext="${fmt(r.time,2)} 秒" style="cursor:crosshair"/>
      </g></g></svg>`;
    const compact=host.clientWidth<600;
    if(compact){
      const svg=host.querySelector('svg'),model=host.querySelector('[data-region="model"]');
      svg.setAttribute('viewBox','0 0 460 660');model.setAttribute('transform','translate(0 20) scale(.5)');
      const captions=[...model.querySelectorAll(':scope>text')];
      captions.forEach(t=>t.setAttribute('font-size','30'));
      for(const index of [0,1,captions.length-1])captions[index].setAttribute('display','none');
      captions[2].setAttribute('y','58');captions[3].setAttribute('y','100');captions[2].setAttribute('font-size','24');captions[3].setAttribute('font-size','24');
      const info=document.createElementNS('http://www.w3.org/2000/svg','g');
      info.innerHTML=text(12,25,'单自由度弹簧振子 / '+labels[r.regime],14)+text(12,195,'m='+fmt(r.mass,1)+' kg  ·  k='+fmt(r.stiffness,1)+' N/m  ·  c='+fmt(r.damping,1)+' N·s/m',12,'fill="#626a64"');
      model.after(info);
      host.querySelector('[data-region="readouts"]').innerHTML=readouts.map(([label,value],i)=>{
        const x=12+(i%2)*218,y=215+Math.floor(i/2)*70;
        return `<rect x="${x}" y="${y}" width="218" height="70" stroke="#d1d6ce" fill="#f8faf4"/>`+text(x+12,y+22,label.split('/')[0],12,'fill="#626a64"')+text(x+12,y+52,value,24,'font-family="Consolas,monospace"');
      }).join('');
      const xc=t=>44+t/duration*394,yc=x=>515-x/halfRange*80;
      let grid='',axisLabels='';
      for(let i=0;i<=4;i++){const x=xc(duration*i/4);grid+=`<line x1="${x}" y1="420" x2="${x}" y2="610"/>`;axisLabels+=text(x,632,fmt(duration*i/4,2),12,'text-anchor="middle"');}
      for(const v of [-halfRange,0,halfRange]){grid+=`<line x1="44" y1="${yc(v)}" x2="438" y2="${yc(v)}"/>`;axisLabels+=text(35,yc(v)+4,fmt(v),12,'text-anchor="end"');}
      const curve=points.map((x,i)=>(i?'L':'M')+xc(duration*i/count).toFixed(2)+','+yc(x).toFixed(2)).join(' ');
      host.querySelector('[data-region="chart"]').innerHTML=`${text(12,391,'位移—时间响应',14)}<g stroke="#d1d6ce" stroke-width=".8">${grid}</g><path d="M44 420V610H438M44 515H438" fill="none" stroke="#87917e"/><path data-guide="waveform" d="${curve}" fill="none" stroke="#65733e" stroke-width="2"/><circle cx="${xc(Math.min(r.time,duration))}" cy="${yc(r.displacement)}" r="4" fill="#65733e"/>${axisLabels}${text(12,415,'x/m',11)}${text(436,652,'t / s',11,'text-anchor="end"')}${text(44,652,'点击曲线定位时间',11,'fill="#626a64"')}<rect data-time-scrub="" x="44" y="420" width="394" height="190" fill="transparent" tabindex="0" role="slider" aria-label="位移曲线时间定位" aria-valuemin="0" aria-valuemax="${Math.min(20,duration)}" aria-valuenow="${Math.min(20,r.time)}" style="cursor:crosshair"/>`;
    }
    if(!compact&&matchMedia('(min-width:1101px)').matches){
      const svg=host.querySelector('svg'),model=host.querySelector('[data-region="model"]');
      svg.setAttribute('viewBox','0 0 900 555');
      // Reposition the model's empty upper margin instead of scaling down all content.
      model.setAttribute('transform','translate(0 -90)');
      const captions=[...model.querySelectorAll(':scope>text')];
      captions[0].setAttribute('y','110');captions[1].setAttribute('y','110');
      captions[2].setAttribute('y','140');captions[3].setAttribute('y','157');
      model.querySelector('line').setAttribute('y1','160');
      host.querySelector('[data-region="readouts"]').innerHTML=readouts.map(([label,value],i)=>{
        const x=16+i*217;
        return `<rect x="${x}" y="245" width="217" height="60" stroke="#d1d6ce" fill="#f8faf4"/>`+text(x+12,265,label,12,'fill="#626a64"')+text(x+12,292,value,24,'font-family="Consolas,monospace"');
      }).join('');
      host.querySelector('[data-region="chart"]').setAttribute('transform','translate(0 -130)');
    }
    const scrub=host.querySelector('[data-time-scrub]');
    const seek=t=>window.PrecisionWorkbench?.seek(Math.max(0,Math.min(20,duration,t)));
    scrub.addEventListener('pointerdown',e=>{
      const ctm=scrub.getScreenCTM();if(!ctm)return;
      const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(ctm.inverse());seek((p.x-(compact?44:72))/(compact?394:766)*duration);
    });
    scrub.addEventListener('keydown',e=>{
      const changes={ArrowRight:.02,ArrowLeft:-.02};
      if(!(e.key in changes)&&!['Home','End'].includes(e.key))return;e.preventDefault();
      seek(e.key==='Home'?0:e.key==='End'?Math.min(20,duration):r.time+changes[e.key]);
      host.querySelector('[data-time-scrub]')?.focus({preventScroll:true});
    });
    return r;
  };
})();
