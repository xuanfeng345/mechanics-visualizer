(function (root) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var teal = '#2f7778', ink = '#252a2d', gray = '#667176', light = '#e8eded', red = '#a45e57';

  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function esc(v) { return String(v).replace(/[&<>\"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'})[c]; }); }
  function svgText(x, y, text, cls, anchor) { return '<text x="' + x + '" y="' + y + '" class="' + (cls || '') + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(text) + '</text>'; }
  function defs() {
    return '<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="#465b58" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker><marker id="arrGray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="' + gray + '" stroke-width="1.2"/></marker></defs>';
  }
  function shell(body, desc) {
    return '<svg class="statics-svg" xmlns="' + NS + '" viewBox="0 0 760 330" role="img" aria-label="' + esc(desc) + '">' + defs() + '<style>' +
      '.statics-svg text{font-family:Arial,sans-serif;fill:' + ink + ';font-size:14px}.statics-svg .title{font-size:18px;font-weight:700}.statics-svg .small{font-size:14px}.statics-svg .muted{fill:' + gray + '}.statics-svg .teal{fill:' + teal + '}.statics-svg .line{stroke:' + ink + ';stroke-width:3;fill:none}.statics-svg .thin{stroke:' + gray + ';stroke-width:2;fill:none}.statics-svg .force{stroke:#465b58;stroke-width:1.8;stroke-linecap:round;fill:none;marker-end:url(#arr)}.statics-svg .dashed{stroke-dasharray:7 6}.statics-svg .surface{stroke:' + ink + ';stroke-width:3}.statics-svg .box{fill:#dfe6e6;stroke:' + ink + ';stroke-width:2}.statics-svg .dim{stroke:' + gray + ';stroke-width:1.5;fill:none;marker-start:url(#arrGray);marker-end:url(#arrGray)}' +
      '</style>' + body + '</svg>';
  }
  function line(x1,y1,x2,y2,cls) { return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+(cls||'line')+'"/>'; }
  function supportScene() {
    var s = '';
    for(var i=0;i<3;i++)s+='<rect x="'+(12+i*250)+'" y="30" width="236" height="270" rx="16" fill="'+(i===1?'#eef5f2':'#f5f4ef')+'" stroke="#dce4de"/>';
    s += svgText(30,57,'01 / PIN','muted')+svgText(280,57,'02 / ROLLER','muted')+svgText(530,57,'03 / FIXED','muted');
    // one pin, one roller, one fixed end
    var x=125;
    s += line(x,108,x,170,'line')+'<path d="M100 170L150 170L125 115Z" fill="#dfe6e6" stroke="'+ink+'" stroke-width="2"/>';
    s += line(x,115,x,75,'force')+svgText(x+10,105,'Rᵧ','teal'); s += line(x,115,x+48,115,'force')+svgText(x+30,105,'Rₓ','teal'); svgText;
    s += svgText(x,205,'固定铰（Rₓ、Rᵧ）','small','middle');
    x=350; s += line(x,108,x,145,'line')+'<path d="M325 145L375 145L350 100Z" fill="#dfe6e6" stroke="'+ink+'" stroke-width="2"/><circle cx="339" cy="157" r="8" fill="#dfe6e6" stroke="'+ink+'"/><circle cx="361" cy="157" r="8" fill="#dfe6e6" stroke="'+ink+'"/>'+line(320,174,380,174,'surface');
    s += line(x,100,x,70,'force')+svgText(x+10,100,'Rᵧ','teal')+svgText(x,205,'水平滚动支座（Rᵧ）','small','middle');
    x=575; s += '<path d="M575 110L575 170" stroke="'+ink+'" stroke-width="7"/>'+line(575,140,650,140,'line');
    s += line(575,140,575,90,'force')+svgText(585,100,'Rᵧ','teal')+line(575,140,625,140,'force')+svgText(595,130,'Rₓ','teal')+'<path d="M644 126 A43 43 0 0 0 610 89" class="force"/>'+svgText(610,108,'M₀','teal');
    s += svgText(600,205,'固定端（Rₓ、Rᵧ、M₀）','small','middle');
    s += svgText(125,239,'约束两向平移 · 允许转动','muted','middle')+svgText(375,239,'约束法向平移 · 沿面可动','muted','middle')+svgText(625,239,'约束两向平移与转动','muted','middle');
    s += svgText(125,272,'2 个反力分量','teal','middle')+svgText(375,272,'1 个反力分量','teal','middle')+svgText(625,272,'2 个力 + 1 个力矩','teal','middle');
    s += svgText(380,323,'箭头为假定正方向；负值表示反向。理想约束，无摩擦。','small','middle');
    return shell(s, '固定铰、水平滚动支座、固定端三种平面约束');
  }
  function beamCalc(p) {
    var a = clamp(num(p && p.a, 1), .2, 3.8), P = clamp(num(p && p.P, 20), 0, 60), L=4;
    var RB=P*a/L, RA=P-RB, Mmax=RA*a; return {RA:RA,RB:RB,Mmax:Mmax};
  }
  function beamScene(p) {
    var c=beamCalc(p), a=clamp(num(p&&p.a,1),.2,3.8), P=clamp(num(p&&p.P,20),0,60), x0=100,x1=660, y=136, scale=(x1-x0)/4, xp=x0+a*scale;
    var s=svgText(28,30,'简支梁：集中力与内力', 'title');
    s+=line(x0,y,x1,y,'line')+'<path d="M'+(x0-24)+' 174L'+(x0+24)+' 174L'+x0+' '+(y+3)+'Z" fill="#dfe6e6" stroke="'+ink+'" stroke-width="2"/><path d="M'+(x1-24)+' 174L'+(x1+24)+' 174L'+x1+' '+(y+3)+'Z" fill="#dfe6e6" stroke="'+ink+'" stroke-width="2"/><circle cx="'+(x1-10)+'" cy="181" r="7" fill="#dfe6e6" stroke="'+ink+'"/><circle cx="'+(x1+10)+'" cy="181" r="7" fill="#dfe6e6" stroke="'+ink+'"/><path d="M'+(x1-30)+' 192H'+(x1+30)+'" class="surface"/>';
    s+=line(xp,70,xp,y-3,'force')+svgText(xp+8,78,'P = '+P.toFixed(1)+' kN','teal');
    s+=line(x0,214,x0,y+2,'force')+svgText(x0+8,205,'Rₐ = '+c.RA.toFixed(1)+' kN','teal');
    s+=line(x1,214,x1,y+2,'force')+svgText(x1-10,205,'Rᵦ = '+c.RB.toFixed(1)+' kN','teal','end');
    s+=line(x0,230,x1,230,'dim')+svgText((x0+x1)/2,250,'L = 4 m','small','middle')+line(x0,230,x0,185,'thin')+line(x1,230,x1,185,'thin');
    s+=line(x0,270,xp,270,'dim')+svgText((x0+xp)/2,291,'a = '+a.toFixed(2)+' m','small','middle');
    s+=svgText(28,315,'剪力 V：'+c.RA.toFixed(1)+' kN (左段)，'+(c.RA-P).toFixed(1)+' kN (右段)；Mmax = '+c.Mmax.toFixed(1)+' kN·m（荷载处）','small');
    return shell(s,'4 m简支梁，集中力及准确支反力、剪力与弯矩');
  }
  function frictionCalc(p) {
    var W=100, alpha=clamp(num(p&&p.alpha,30),0,60), mu=clamp(num(p&&p.mu,.4),0,1), r=alpha*Math.PI/180, N=W*Math.cos(r), driving=W*Math.sin(r), maxF=mu*N, stat=driving<=maxF+1e-12;
    return {N:N,driving:driving,maxF:maxF,static:stat,f:stat?driving:undefined};
  }
  function frictionScene(p) {
    var c=frictionCalc(p), W=100, alpha=clamp(num(p&&p.alpha,30),0,60), mu=clamp(num(p&&p.mu,.4),0,1), r=alpha*Math.PI/180;
    var bx=360, by=194, bw=110,bh=58, sx=180, sy=270, ex=sx+230*Math.cos(r), ey=sy-230*Math.sin(r), ux=Math.cos(r), uy=-Math.sin(r), nx=Math.sin(r), ny=Math.cos(r), s=svgText(28,30,'斜面上的块体：静摩擦判定','title');
    s+=line(sx,sy,ex,ey,'surface')+'<path d="M'+sx+' '+sy+' L'+ex+' '+sy+'" class="thin"/>';
    // block sits on plane: center offset normal
    bx=sx+125*ux-nx*bh/2; by=sy+125*uy-ny*bh/2;
    var pts=[[-bw/2,bh/2],[bw/2,bh/2],[bw/2,-bh/2],[-bw/2,-bh/2]].map(function(q){return (bx+q[0]*ux-q[1]*nx)+','+(by+q[0]*uy-q[1]*ny);}).join(' ');
    s+='<polygon points="'+pts+'" class="box"/>';
    var sc=0.55, L=66, force=function(x,y,dx,dy,label,dashed){s+=line(x,y,x+dx*sc,y+dy*sc,'force'+(dashed?' dashed':''))+svgText(x+dx*sc*.5+8,y+dy*sc*.5,label,dashed?'muted':'teal');};
    force(bx,by,0,W,'W = 100 N');
    force(bx,by,-c.N*nx,-c.N*ny,'N = '+c.N.toFixed(1)+' N');
    if (c.static) force(bx,by,c.driving*ux,c.driving*uy,'f = '+c.f.toFixed(1)+' N');
    force(bx,by,c.maxF*ux,c.maxF*uy,'fₘₐₓ = '+c.maxF.toFixed(1)+' N',true);
    s+=svgText(28,300,'α = '+alpha.toFixed(1)+'°，μ = '+mu.toFixed(2)+'；'+(c.static?'静止：驱动力 ≤ 静摩擦上限':'滑动趋势：驱动力 > 静摩擦上限（未假设动摩擦）'),'small');
    return shell(s,'重量100 N块体在右上升斜面上的法向力与摩擦判定');
  }
  function calculate(scene, params) { if (scene==='beam') return beamCalc(params||{}); if (scene==='friction') return frictionCalc(params||{}); return {}; }
  function render(scene, host, params) { if (!host) return; var out=scene==='beam'?beamScene(params||{}):scene==='friction'?frictionScene(params||{}):supportScene(); host.innerHTML=out; }
  var api={render:render,calculate:calculate,descriptions:{support:'固定铰、水平滚动支座、固定端；箭头为假定正方向。',beam:'L=4 m简支梁，集中力P作用于距左支座a处；力kN、弯矩kN·m。',friction:'W=100 N，斜面右上升；α为倾角、μ为静摩擦系数，力单位N。'}};
  root.StaticsScenes=api;
  if (typeof module!=='undefined' && module.exports) module.exports={calculate:calculate,render:render,descriptions:api.descriptions};
})(typeof window!=='undefined'?window:globalThis);
