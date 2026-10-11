/* BeamMaterialScene — simply supported beam with a point load. Units: SI — N, m, Pa. */
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
    if (!(a > 0 && a < L)) throw new RangeError('position 必须位于 0 与 span 之间');
    var b = L - a, RA = P * b / L, RB = P * a / L;
    function shear(x) { return x < a ? RA : (x > a ? -RB : RA); }
    function moment(x) { return x <= a ? RA * x : RA * x - P * (x - a); }
    function deflection(x) {
      if (x <= a) return P * b * x * (L * L - b * b - x * x) / (6 * L * E * I);
      var z = L - x;
      return P * a * z * (L * L - a * a - z * z) / (6 * L * E * I);
    }
    var maxDeflection = 0, maxDeflectionAt = 0;
    for (var i = 0; i <= 1000; i++) { var x = L * i / 1000, d = Math.abs(deflection(x)); if (d > maxDeflection) { maxDeflection = d; maxDeflectionAt = x; } }
    var maxMoment = RA * a, maxStress = maxMoment * c / I;
    return Object.freeze({ model: 'simply_supported_point_load', span: L, load: P, position: a, youngsModulus: E, inertia: I, sectionDistance: c, RA: RA, RB: RB, maxMoment: maxMoment, Mmax: maxMoment, maxMomentAt: a, maxStress: maxStress, stress: maxStress, maxDeflection: maxDeflection, maxDeflectionAt: maxDeflectionAt, shear: shear, moment: moment, deflection: deflection, assumptions: ['Euler_Bernoulli', 'small_deflection', 'constant_EI', 'point_load'] });
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
    var parts = ['<title id="' + id + '-title">简支梁点载荷解析结果</title><desc id="' + id + '-desc">支反力、剪力、弯矩、挠度及最大弯曲应力。</desc>'];
    function t(x,y,s,size,color,extra) { parts.push('<text x="' + x + '" y="' + y + '" font-size="' + (size||12) + '" fill="' + (color||'#475569') + '" ' + (extra||'') + '>' + esc(s) + '</text>'); }
    function line(x1,y1,x2,y2,stroke,w,dash) { parts.push('<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+(stroke||'#94a3b8')+'" stroke-width="'+(w||1.2)+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>'); }
    function plot(fn, x0,y0,w,h, positiveOnly) { var vals=[], max=0; for(var j=0;j<=120;j++){var xx=r.span*j/120,v=fn(xx);vals.push(v);max=Math.max(max,Math.abs(v));} max=max||1; var d=''; vals.forEach(function(v,j){var px=x0+w*j/120, py=y0+h/2-(positiveOnly?v/max*h*0.82:v/max*h*0.4); d+=(j?'L':'M')+px.toFixed(1)+','+py.toFixed(1)+' ';}); parts.push('<path d="'+d+'" fill="none" stroke="#2563eb" stroke-width="2"/>'); return max; }
    t(24,29,'简支梁 · 点载荷解析',18,'#0f172a','font-weight="700"'); t(736,29,'N · m · Pa',11,'#64748b','text-anchor="end"');
    var bx=55, ex=335, by=68, loadX=bx+(ex-bx)*r.position/r.span; line(bx,by,ex,by,'#334155',4); parts.push('<path d="M'+(bx-8)+' 88 L'+(bx+8)+' 88 L'+bx+' 68 ZM'+(ex-8)+' 88 L'+(ex+8)+' 88 L'+ex+' 68 Z" fill="#94a3b8"/>'); line(loadX,42,loadX,64,'#dc2626',2); parts.push('<path d="M'+(loadX-6)+' 51 L'+loadX+' 64 L'+(loadX+6)+' 51" fill="none" stroke="#dc2626" stroke-width="2"/>'); t(bx,107,'RA = '+fmt(r.RA)+' N',12,'#0f172a'); t(ex,107,'RB = '+fmt(r.RB)+' N',12,'#0f172a','text-anchor="end"'); t(195,91,'L = '+fmt(r.span)+' m',11,'#64748b','text-anchor="middle"'); t(loadX,38,'P = '+fmt(r.load)+' N',11,'#b91c1c','text-anchor="middle"');
    t(24,137,'剪力 V(x) / N',12,'#0f172a','font-weight="600"'); line(24,184,350,184,'#cbd5e1'); plot(function(x){return r.shear(x);},24,142,326,42,true); t(24,211,'弯矩 M(x) / N·m',12,'#0f172a','font-weight="600"'); line(24,260,350,260,'#cbd5e1'); plot(function(x){return r.moment(x);},24,218,326,42,true); t(24,284,'Mmax = '+fmt(r.maxMoment)+' N·m @ '+fmt(r.maxMomentAt)+' m',11,'#475569');
    t(385,137,'挠度曲线 v(x) / m',12,'#0f172a','font-weight="600"'); line(385,184,736,184,'#cbd5e1'); plot(function(x){return r.deflection(x);},385,142,351,42,false); t(385,211,'最大挠度 = '+fmt(r.maxDeflection)+' m @ '+fmt(r.maxDeflectionAt)+' m',11,'#475569');
    t(385,252,'支反力',12,'#64748b'); t(385,272,'RA '+fmt(r.RA)+' N   ·   RB '+fmt(r.RB)+' N',14,'#0f172a','font-weight="600"'); t(385,295,'最大弯曲应力 σmax = Mmax·c/I = '+fmt(r.maxStress)+' Pa',13,'#b45309','font-weight="600"'); t(385,314,'E='+fmt(r.youngsModulus)+' Pa · I='+fmt(r.inertia)+' m⁴ · c='+fmt(r.sectionDistance)+' m',10,'#64748b');
    svg.innerHTML = parts.join(''); host.replaceChildren(svg); return r;
  }
  var api = Object.freeze({ render: render, calculate: calculate });
  if (root) root.BeamMaterialScene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
