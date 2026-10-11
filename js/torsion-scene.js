/* TorsionScene — dependency-free solid circular shaft torsion visualisation.
 * Units: torque N·m, radius/length m, shearModulus Pa (N/m²).
 */
(function (root) {
  'use strict';
  var serial = 0;
  var DEFAULTS = { torque: 100, radius: .02, length: 1, shearModulus: 80e9 };

  function number(p, name, fallback) {
    var value = p[name] === undefined ? fallback : p[name];
    if (value === null || value === '' || typeof value === 'boolean') {
      throw new RangeError(name + ' 必须为有效数值');
    }
    value = Number(value);
    if (!Number.isFinite(value)) throw new RangeError(name + ' 必须为有限数值');
    return value;
  }

  function calculate(params) {
    var p = params || {};
    var torque = number(p, 'torque', DEFAULTS.torque);
    var radius = number(p, 'radius', DEFAULTS.radius);
    var length = number(p, 'length', DEFAULTS.length);
    var shearModulus = number(p, 'shearModulus', DEFAULTS.shearModulus);
    if (!(radius > 0) || !(length > 0) || !(shearModulus > 0)) {
      throw new RangeError('radius、length 及 shearModulus 必须大于 0');
    }
    var J = Math.PI * Math.pow(radius, 4) / 2;
    var tau = torque * radius / J;
    var angle = torque * length / (J * shearModulus);
    if (![J, tau, angle].every(Number.isFinite)) throw new RangeError('参数超出可计算范围');
    return Object.freeze({ model: 'solid_circular_torsion', torque: torque, radius: radius,
      length: length, shearModulus: shearModulus, J: J, polarMoment: J,
      tau: tau, shearStress: tau, maxShearStress: Math.abs(tau), polarInertia: J, twist: angle, angle: angle, twistAngle: angle,
      angleDeg: angle * 180 / Math.PI, assumptions: Object.freeze(['solid_circular_shaft', 'linear_elastic', 'small_twist']) });
  }

  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]; }); }
  function fmt(v, digits) {
    if (!Number.isFinite(v)) return '—';
    if (v !== 0 && (Math.abs(v) >= 1e6 || Math.abs(v) < 0.001)) return v.toExponential(2);
    return Number(v.toFixed(digits === undefined ? 3 : digits)).toLocaleString('en-US', { maximumFractionDigits: 6 });
  }
  function render(host, params) {
    var doc = root && root.document;
    if (typeof host === 'string') host = doc && doc.querySelector(host);
    if (!host || !host.ownerDocument || typeof host.appendChild !== 'function') throw new TypeError('TorsionScene.render 需要有效的 DOM 容器');
    doc = host.ownerDocument;
    var id = 'torsion-scene-' + (++serial), svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'), r;
    svg.setAttribute('viewBox', '0 0 760 330'); svg.setAttribute('width', '100%'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-labelledby', id + '-title ' + id + '-desc');
    svg.style.cssText = 'display:block;width:100%;height:auto;font-family:Inter,Segoe UI,Arial,sans-serif';
    try { r = calculate(params); } catch (e) {
      svg.innerHTML = '<title id="' + id + '-title">扭转参数错误</title><desc id="' + id + '-desc">' + esc(e.message) + '</desc><rect width="760" height="330" rx="16" fill="#fff7ed"/><text x="28" y="140" fill="#9a3412" font-size="19">无法计算扭转</text><text x="28" y="172" fill="#9a3412" font-size="14">' + esc(e.message) + '</text>';
      host.replaceChildren(svg); return null;
    }
    var parts = [], sign = r.torque < 0 ? -1 : 1, tint = '#2563eb';
    function text(x,y,s,size,fill,extra) { parts.push('<text x="' + x + '" y="' + y + '" font-size="' + (size || 12) + '" fill="' + (fill || '#475569') + '" ' + (extra || '') + '>' + esc(s) + '</text>'); }
    function line(x1,y1,x2,y2,stroke,extra) { parts.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (stroke || '#64748b') + '" stroke-width="1.5" ' + (extra || '') + '/>'); }
    parts.push('<title id="' + id + '-title">圆轴扭转 · 剪应力分布</title><desc id="' + id + '-desc">扭矩 ' + fmt(r.torque) + ' N·m，最大剪应力 ' + fmt(r.maxShearStress) + ' Pa，扭转角 ' + fmt(r.angle) + ' rad。</desc>');
    parts.push('<defs><marker id="' + id + '-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L8 5L1 9" fill="none" stroke="#db6b32" stroke-width="1.5"/></marker><linearGradient id="' + id + '-stress" x1="0" x2="1"><stop stop-color="#2563eb"/><stop offset=".55" stop-color="#f59e0b"/><stop offset="1" stop-color="#dc2626"/></linearGradient></defs>');
    parts.push('<rect width="760" height="330" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>');
    text(24,31,'圆轴扭转 / TORSION',18,'#0f172a','font-weight="700"'); text(24,52,'实心圆截面 · 线弹性 · Saint-Venant 扭转',11); text(736,31,r.torque === 0 ? '无扭矩' : (r.torque > 0 ? '正向扭转' : '反向扭转'),13,tint,'text-anchor="end" font-weight="600"');
    // Shaft and torque arrows
    parts.push('<rect x="65" y="112" width="405" height="72" rx="36" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/><ellipse cx="65" cy="148" rx="18" ry="36" fill="#94a3b8" stroke="#64748b"/><ellipse cx="470" cy="148" rx="18" ry="36" fill="#e2e8f0" stroke="#64748b"/>');
    for (var i=0;i<5;i++) line(100+i*75,116,100+i*75,180,'#94a3b8','stroke-dasharray="4 4"');
    if (r.torque !== 0) { var d = sign > 0 ? 'M65 91 C30 66 30 39 65 28' : 'M65 28 C100 39 100 66 65 91'; parts.push('<path d="' + d + '" fill="none" stroke="#db6b32" stroke-width="2.5" marker-end="url(#' + id + '-arrow)"/><path d="' + d.replace(/(28|91)/g, function(q){ return q === '28' ? '205' : '268'; }) + '" fill="none" stroke="#db6b32" stroke-width="2.5" marker-end="url(#' + id + '-arrow)"/>'); }
    text(267,153,'圆轴  r = ' + fmt(r.radius) + ' m',13,'#0f172a','text-anchor="middle" font-weight="600"'); text(267,213,'L = ' + fmt(r.length) + ' m',12,'#475569','text-anchor="middle"'); line(65,194,65,222,'#cbd5e1'); line(470,194,470,222,'#cbd5e1'); line(66,210,469,210,'#64748b','marker-start="url(#' + id + '-arrow)" marker-end="url(#' + id + '-arrow)"');
    // stress distribution panel
    text(500,86,'剪应力分布 τ(r)',12,'#64748b'); parts.push('<rect x="500" y="105" width="220" height="16" rx="8" fill="url(#' + id + '-stress)"/>');
    for (var j=0;j<7;j++) { var rr=12+j*13, yy=153-j*7; line(550,yy,550+rr*2,yy,'#2563eb','stroke-width="3"'); }
    parts.push('<circle cx="550" cy="153" r="34" fill="none" stroke="#94a3b8" stroke-width="1.2"/><line x1="550" y1="153" x2="600" y2="153" stroke="#dc2626" stroke-width="3" marker-end="url(#' + id + '-arrow)"/>'); text(500,244,'中心 τ = 0',11); text(720,244,'表面 τmax = ' + fmt(r.maxShearStress) + ' Pa',11,'#b91c1c','text-anchor="end" font-weight="600"'); text(500,269,'T = ' + fmt(r.torque) + ' N·m',13,'#0f172a','font-weight="600"');
    text(500,292,'J = ' + fmt(r.J) + ' m⁴',12); text(500,312,'G = ' + fmt(r.shearModulus) + ' Pa',12);
    text(24,259,'扭转角  θ = ' + fmt(r.angle) + ' rad  (' + fmt(r.angleDeg) + '°)',16,'#0f172a','font-weight="700"'); text(24,286,'τmax = |T|r/J    θ = TL/(JG)',13,'#475569'); text(24,310,'剪应力随半径线性增加；图形为示意',10,'#64748b');
    svg.innerHTML = parts.join(''); host.replaceChildren(svg); return r;
  }
  var api = Object.freeze({ render: render, calculate: calculate });
  if (root) root.TorsionScene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
