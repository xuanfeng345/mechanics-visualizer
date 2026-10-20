/* Euler–Bernoulli beam lab: simple/cantilever, point/uniform loads. SI: N, m, Pa. */
(function (root) {
  'use strict';
  var serial = 0;
  var DEFAULTS = { span: 4, load: 20000, position: 1, youngsModulus: 200e9, inertia: 8e-6, sectionDistance: .05 };

  function finite(p, name, fallback) {
    var v = p[name];
    if (v === undefined) v = fallback;
    if (v === null || v === '' || typeof v === 'boolean') throw new RangeError(name + ' 必须为有效数值');
    v = Number(v);
    if (!Number.isFinite(v)) throw new RangeError(name + ' 必须为有限数值');
    return v;
  }
  function positive(v, name) { if (!(v > 0)) throw new RangeError(name + ' 必须大于 0'); return v; }
  function calculate(params) {
    var p = params || {};
    var L = positive(finite(p, 'span', DEFAULTS.span), 'span');
    var P = positive(finite(p, 'load', DEFAULTS.load), 'load');
    var a = finite(p, 'position', DEFAULTS.position);
    var E = positive(finite(p, 'youngsModulus', DEFAULTS.youngsModulus), 'youngsModulus');
    var I = positive(finite(p, 'inertia', DEFAULTS.inertia), 'inertia');
    var c = positive(finite(p, 'sectionDistance', DEFAULTS.sectionDistance), 'sectionDistance');
    if (!(a > 0 && (a < L || (p.support==='cantilever'&&a===L)))) throw new RangeError('position 必须位于 0 与 span 之间');
    var support=p.support===undefined?'simple':p.support,loadType=p.loadType===undefined?'point':p.loadType;
    if(!['simple','cantilever'].includes(support)||!['point','uniform'].includes(loadType))throw new RangeError('未知梁型或载荷类型');
    var q=positive(finite(p,'distributedLoad',5000),'distributedLoad'),section=finite(p,'section',L/2);
    if(section<0||section>L)throw new RangeError('section 必须位于梁长范围内');
    var b=L-a,uniform=loadType==='uniform',cantilever=support==='cantilever',totalLoad=uniform?q*L:P;
    var RA=cantilever?totalLoad:uniform?totalLoad/2:P*b/L,RB=cantilever?0:totalLoad-RA;
    var reactionMoment=cantilever?(uniform?q*L*L/2:P*a):0;
    function domain(x){if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>L)throw new RangeError('截面坐标超出梁长');}
    function shear(x,side){domain(x);if(uniform)return RA-q*x;return RA-((x>a||(x===a&&side==='right'))?P:0);}
    function moment(x){domain(x);return RA*x-reactionMoment-(uniform?q*x*x/2:P*Math.max(0,x-a));}
    function deflection(x){
      domain(x);
      if(cantilever){if(uniform)return q*x*x*(6*L*L-4*L*x+x*x)/(24*E*I);return x<=a?P*x*x*(3*a-x)/(6*E*I):P*a*a*(3*x-a)/(6*E*I);}
      if(uniform)return q*x*(L*L*L-2*L*x*x+x*x*x)/(24*E*I);
      if(x<=a)return P*b*x*(L*L-b*b-x*x)/(6*L*E*I);
      var z=L-x;return P*a*z*(L*L-a*a-z*z)/(6*L*E*I);
    }
    var maxDeflection=0,maxDeflectionAt=0;
    for(var i=0;i<=1000;i++){var x=L*i/1000,d=Math.abs(deflection(x));if(d>maxDeflection){maxDeflection=d;maxDeflectionAt=x;}}
    var maxMomentAt=cantilever?0:uniform?L/2:a,signedMaxMoment=moment(maxMomentAt),maxMoment=Math.abs(signedMaxMoment),maxStress=maxMoment*c/I;
    var values=[RA,RB,reactionMoment,maxMoment,maxStress,maxDeflection];if(!values.every(Number.isFinite))throw new RangeError('参数超出可计算范围');
    return Object.freeze({model:(cantilever?'cantilever':'simply_supported')+'_'+(uniform?'uniform_load':'point_load'),support:support,loadType:loadType,distributedLoad:q,totalLoad:totalLoad,section:section,span:L,load:P,position:a,youngsModulus:E,inertia:I,sectionDistance:c,RA:RA,RB:RB,reactionMoment:reactionMoment,maxMoment:maxMoment,Mmax:maxMoment,signedMaxMoment:signedMaxMoment,maxMomentAt:maxMomentAt,maxStress:maxStress,stress:maxStress,maxDeflection:maxDeflection,maxDeflectionAt:maxDeflectionAt,sectionShear:shear(section),sectionShearRight:shear(section,'right'),sectionMoment:moment(section),sectionDeflection:deflection(section),sectionStress:moment(section)*c/I,shear:shear,moment:moment,deflection:deflection,assumptions:['Euler_Bernoulli','small_deflection','constant_EI',loadType+'_load']});
  }

  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]; }); }
  function fmt(v) { if (!Number.isFinite(v)) return '—'; if (v === 0) return '0'; if (Math.abs(v) >= 1e6 || Math.abs(v) < 0.001) return v.toExponential(2); return Number(v.toFixed(3)).toLocaleString('en-US', { maximumFractionDigits: 6 }); }
  function render(host, params) {
    var doc = root && root.document;
    if (typeof host === 'string') host = doc && doc.querySelector(host);
    if (!host || !host.ownerDocument || typeof host.appendChild !== 'function') throw new TypeError('BeamMaterialScene.render 需要有效的 DOM 容器');
    doc = host.ownerDocument;
    var id = 'beam-material-' + (++serial), svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'), r;
    svg.setAttribute('viewBox', '0 0 760 330'); svg.setAttribute('width', '100%'); svg.setAttribute('role', 'img'); svg.style.cssText = 'display:block;width:100%;height:auto;font-family:Inter,Segoe UI,Arial,sans-serif';
    try { r = calculate(params); } catch (e) { svg.innerHTML = '<title>简支梁参数错误</title><rect width="760" height="330" rx="16" fill="#fff7ed"/><text x="28" y="120" font-size="19" fill="#9a3412">无法计算简支梁</text><text x="28" y="150" font-size="14" fill="#9a3412">' + esc(e.message) + '</text>'; host.replaceChildren(svg); return null; }
    var short=!!root.matchMedia&&root.matchMedia('(min-width:1101px) and (max-height:800px)').matches;
    var W=short?900:host.clientWidth&&host.clientWidth<600?560:760,H=short?320:480,x0=65,x1=W-24,pixels=x1-x0,cut=x0+pixels*r.section/r.span,uniform=r.loadType==='uniform',cantilever=r.support==='cantilever';
    svg.setAttribute('viewBox','0 0 '+W+' '+H);
    var parts=['<title>梁的载荷、内力与变形联动分析</title><desc>向下加载，正弯矩为下缘受拉，挠度向下为正。拖动或用方向键移动截面，集中力处分别显示左右剪力。</desc>'];
    function t(x,y,s,size,color,extra){parts.push('<text x="'+x+'" y="'+y+'" font-size="'+(size||13)+'" fill="'+(color||'#202521')+'" '+(extra||'')+'>'+esc(s)+'</text>');}
    function line(x,y,X,Y,color,dash){parts.push('<line x1="'+x+'" y1="'+y+'" x2="'+X+'" y2="'+Y+'" stroke="'+(color||'#d1d6ce')+'"'+(dash?' stroke-dasharray="4 4"':'')+'/>');}
    t(18,23,(cantilever?'悬臂梁':'简支梁')+' · '+(uniform?'全跨均布载荷':'单个集中载荷'),16,'#202521','font-weight="700"');
    t(W-20,23,'N · m · Pa',11,'#626a64','text-anchor="end"');
    parts.push('<path data-guide="beam" d="M'+x0+' 90H'+x1+'" stroke="#343d30" stroke-width="5"/>');
    if(cantilever){parts.push('<path d="M'+x0+' 72V110" stroke="#343d30" stroke-width="4"/>');for(var k=0;k<6;k++)line(x0-12,75+k*6,x0,69+k*6,'#626a64');}
    else parts.push('<path d="M'+(x0-10)+' 108L'+x0+' 91L'+(x0+10)+' 108ZM'+(x1-10)+' 108L'+x1+' 91L'+(x1+10)+' 108Z" fill="none" stroke="#343d30"/>');
    function arrow(x){parts.push('<path d="M'+x+' 48V82m-5-8l5 8 5-8" fill="none" stroke="#65733e" stroke-width="2"/>');}
    if(uniform){for(k=0;k<=10;k++)arrow(x0+pixels*k/10);line(x0,48,x1,48,'#65733e');t(x0,42,'q = '+fmt(r.distributedLoad)+' N/m',12);}
    else {var loadX=x0+pixels*r.position/r.span;arrow(loadX);t(loadX,42,'P = '+fmt(r.load)+' N',12,'#202521','text-anchor="middle"');}
    t(x0,127,'RA '+fmt(r.RA)+' N',12);t(x1,127,cantilever?'MA '+fmt(r.reactionMoment)+' N·m':'RB '+fmt(r.RB)+' N',12,'#202521','text-anchor="end"');
    var rows=[['V / N',r.shear,170,false],['M / N·m',r.moment,250,false],['v / m',r.deflection,330,true]];
    rows.forEach(function(row,index){
      var fn=row[1],y=short?190:row[2],start=short?index*W/3+48:x0,end=short?(index+1)*W/3-18:x1,plotWidth=end-start,cursor=start+plotWidth*r.section/r.span,amplitude=short?22:25,max=0,samples=[];
      for(var j=0;j<=160;j++)samples.push(r.span*j/160);
      if(!uniform)samples.push(r.position,r.position);samples.sort(function(a,b){return a-b;});
      samples.forEach(function(x){max=Math.max(max,Math.abs(fn(x)),index===0?Math.abs(r.shear(x,'right')):0);});max=max||1;
      var path='',seen=false;
      samples.forEach(function(x,j){var value=index===0&&x===r.position&&seen?r.shear(x,'right'):fn(x);if(x===r.position)seen=true;path+=(j?'L':'M')+(start+plotWidth*x/r.span).toFixed(2)+','+(y+(row[3]?1:-1)*value/max*amplitude).toFixed(2);});
      line(start,y,end,y);t(short?start:8,y-25,row[0],short?15:12);t(start,y+39,'0',short?13:11,'#626a64');t(end,y+39,fmt(r.span)+' m',11,'#626a64','text-anchor="end"');
      parts.push('<path data-guide="'+['shear','moment','deflection'][index]+'" d="'+path+'" fill="none" stroke="#65733e" stroke-width="2"/>');
      line(cursor,y-30,cursor,y+30,'#65733e',true);
      var value=fn(r.section),py=y+(row[3]?1:-1)*value/max*amplitude;parts.push('<circle cx="'+cursor+'" cy="'+py+'" r="4" fill="#65733e"/>');
      t(end,y-31,fmt(value)+(index===0&&!uniform&&Math.abs(r.section-r.position)<1e-9?' / '+fmt(r.sectionShearRight)+'（左右）':''),12,'#202521','text-anchor="end"');
    });
    line(cut,49,cut,111,'#65733e',true);
    t(18,short?254:402,'截面 x = '+fmt(r.section)+' m · σ = '+fmt(r.sectionStress)+' Pa',13);
    t(18,short?274:425,'|M|max '+fmt(r.maxMoment)+' N·m · vmax '+fmt(r.maxDeflection)+' m',12);
    t(18,short?294:447,'各曲线独立缩放；v 向下为正。拖动图表或用 ← → 选截面。',12,'#626a64');
    t(18,short?314:468,r.maxDeflection/r.span>.05?'挠度较大：小挠度模型可能不再适用。':'线弹性、等 EI、小挠度；不含剪切变形及屈服。',12,r.maxDeflection/r.span>.05?'#a33e32':'#626a64');
    parts.push('<rect data-beam-section="" x="'+x0+'" y="48" width="'+pixels+'" height="'+(short?185:322)+'" fill="transparent" tabindex="0" role="slider" aria-label="选择梁截面" aria-valuemin="0" aria-valuemax="'+r.span+'" aria-valuenow="'+r.section+'" style="cursor:ew-resize;touch-action:pan-y"/>');
    svg.innerHTML = parts.join(''); host.replaceChildren(svg);
    if(svg.querySelector){
      var handle=svg.querySelector('[data-beam-section]'),pointer=null;
      function select(x){host.dispatchEvent(new doc.defaultView.CustomEvent('beam-section-change',{detail:{section:Math.max(0,Math.min(r.span,x))},bubbles:true}));}
      function at(e){var matrix=svg.getScreenCTM();if(!matrix)return;var point=new doc.defaultView.DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());if(short&&point.y>140){var column=Math.max(0,Math.min(2,Math.floor(point.x/(W/3))));select((point.x-(column*W/3+48))/(W/3-66)*r.span);}else select((point.x-x0)/pixels*r.span);}
      handle.addEventListener('pointerdown',function(e){e.preventDefault();host._beamPointer=e.pointerId;host.setPointerCapture(e.pointerId);at(e);});
      host.onpointermove=function(e){if(host._beamPointer===e.pointerId)at(e);};host.onpointerup=host.onpointercancel=function(){host._beamPointer=null;};
      handle.addEventListener('keydown',function(e){if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();select(e.key==='Home'?0:e.key==='End'?r.span:r.section+(e.key==='ArrowRight'?1:-1)*r.span/100);host.querySelector('[data-beam-section]')?.focus({preventScroll:true});});
    }
    return r;
  }
  var api = Object.freeze({ render: render, calculate: calculate });
  if (root) root.BeamMaterialScene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
