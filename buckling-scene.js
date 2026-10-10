/* BucklingScene — Euler column buckling visualizer; dependency-free SVG. Units: SI (Pa, m^4, m, m^2, N). */
(function (root) {
  'use strict';
  var PI2 = Math.PI * Math.PI;
  var DEFAULTS = { youngsModulus: 200e9, inertia: 8e-6, length: 3, effectiveLengthFactor: 1, area: 0.01, load: 50000 };
  function finite(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function positive(value, name, fallback) {
    var n = value === undefined ? fallback : finite(value, NaN);
    if (!(n > 0)) throw new RangeError(name + ' must be a positive finite number');
    return n;
  }
  function calculate(params) {
    var p = params || {};
    var E = positive(p.youngsModulus, 'youngsModulus', DEFAULTS.youngsModulus);
    var I = positive(p.inertia, 'inertia', DEFAULTS.inertia);
    var L = positive(p.length, 'length', DEFAULTS.length);
    var K = positive(p.effectiveLengthFactor, 'effectiveLengthFactor', DEFAULTS.effectiveLengthFactor);
    var A = positive(p.area, 'area', DEFAULTS.area);
    var load = finite(p.load, DEFAULTS.load);
    if (!Number.isFinite(load)) throw new RangeError('load must be finite');
    var Le = K * L;
    var radiusOfGyration = Math.sqrt(I / A);
    var slendernessRatio = Le / radiusOfGyration;
    var criticalLoad = PI2 * E * I / (Le * Le);
    var safetyFactor = Math.abs(load) > 0 ? criticalLoad / Math.abs(load) : Infinity;
    return Object.freeze({ youngsModulus: E, inertia: I, length: L, effectiveLengthFactor: K,
      area: A, load: load, effectiveLength: Le, radiusOfGyration: radiusOfGyration,
      slendernessRatio: slendernessRatio, criticalLoad: criticalLoad, Pcr: criticalLoad,
      safetyFactor: safetyFactor, stable: Math.abs(load) < criticalLoad,
      endCondition: K <= 0.75 ? '固接—固接 / fixed-fixed' : K <= 1.0 ? '铰接—铰接 / pinned-pinned' : K <= 1.5 ? '固接—铰接 / fixed-pinned' : '固接—自由 / fixed-free' });
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]; }); }
  function fmt(v, digits) {
    if (v === Infinity) return '∞';
    if (!Number.isFinite(v)) return '—';
    var a = Math.abs(v), d = digits === undefined ? 3 : digits;
    if (a !== 0 && (a >= 1e6 || a < 0.001)) return v.toExponential(2);
    return Number(v.toFixed(d)).toLocaleString('en-US', { maximumFractionDigits: d });
  }
  function render(host, params) {
    if (typeof host === 'string' && root && root.document) host = root.document.querySelector(host);
    if (!host || typeof host !== 'object' || !('innerHTML' in host)) throw new TypeError('BucklingScene.render requires a DOM host element');
    var r;
    try { r = calculate(params); } catch (error) {
      host.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 330" role="img" aria-label="屈曲计算错误"><rect width="760" height="330" rx="16" fill="#fff7ed" stroke="#fed7aa"/><text x="28" y="42" font-family="system-ui,sans-serif" font-size="19" font-weight="700" fill="#9a3412">无法计算欧拉屈曲</text><text x="28" y="75" font-family="system-ui,sans-serif" font-size="13" fill="#9a3412">' + esc(error.message) + '</text></svg>';
      return null;
    }
    var xL = 142, xR = 394, mid = 268, base = 204, top = 78, amp = 30;
    var mode = 'M ' + xL + ' ' + top;
    for (var i = 1; i <= 40; i++) { var x = xL + (xR - xL) * i / 40; mode += ' L ' + x.toFixed(1) + ' ' + (top + (base - top) * i / 40 + amp * Math.sin(Math.PI * i / 40)).toFixed(1); }
    var color = r.stable ? '#0f766e' : '#dc2626';
    var status = r.stable ? '低于临界载荷 · 稳定' : '达到/超过临界载荷 · 失稳风险';
    var endText = r.effectiveLengthFactor <= .75 ? '固接' : r.effectiveLengthFactor <= 1 ? '铰接' : r.effectiveLengthFactor <= 1.5 ? '固接/铰接' : '自由端';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 330" role="img" aria-label="欧拉柱屈曲计算与模态示意" style="display:block;width:100%;height:auto;font-family:system-ui,Segoe UI,Arial,sans-serif">' +
      '<rect x=".5" y=".5" width="759" height="329" rx="16" fill="#f8fafc" stroke="#e2e8f0"/><text x="25" y="31" font-size="18" font-weight="700" fill="#0f172a">柱屈曲 / EULER BUCKLING</text><text x="735" y="31" text-anchor="end" font-size="12" fill="' + color + '" font-weight="700">' + esc(status) + '</text>' +
      '<rect x="24" y="57" width="470" height="219" rx="12" fill="white" stroke="#e2e8f0"/>' +
      '<path d="M110 219 H430 M118 219 l-10 16 M135 219 l-10 16 M152 219 l-10 16 M169 219 l-10 16 M186 219 l-10 16 M203 219 l-10 16 M220 219 l-10 16 M237 219 l-10 16 M254 219 l-10 16 M271 219 l-10 16 M288 219 l-10 16 M305 219 l-10 16 M322 219 l-10 16 M339 219 l-10 16 M356 219 l-10 16 M373 219 l-10 16 M390 219 l-10 16 M407 219 l-10 16" stroke="#94a3b8" fill="none"/><path d="M110 67 H430 M118 67 l-10 -16 M135 67 l-10 -16 M152 67 l-10 -16 M169 67 l-10 -16 M186 67 l-10 -16 M203 67 l-10 -16 M220 67 l-10 -16 M237 67 l-10 -16 M254 67 l-10 -16 M271 67 l-10 -16 M288 67 l-10 -16 M305 67 l-10 -16 M322 67 l-10 -16 M339 67 l-10 -16 M356 67 l-10 -16 M373 67 l-10 -16 M390 67 l-10 -16 M407 67 l-10 -16" stroke="#94a3b8" fill="none"/><line x1="' + mid + '" y1="67" x2="' + mid + '" y2="219" stroke="#cbd5e1" stroke-dasharray="4 4"/><path d="' + mode + '" fill="none" stroke="#2563eb" stroke-width="6" stroke-linecap="round"/><text x="38" y="84" font-size="11" fill="#475569">一阶屈曲模态（示意）</text><text x="268" y="258" text-anchor="middle" font-size="12" fill="#475569">L = ' + fmt(r.length) + ' m · Le = KL = ' + fmt(r.effectiveLength) + ' m</text><text x="112" y="45" font-size="11" fill="#64748b">' + endText + '</text><text x="408" y="45" text-anchor="end" font-size="11" fill="#64748b">' + endText + '</text>' +
      '<text x="520" y="72" font-size="12" fill="#64748b" font-weight="700">屈曲读数 / READOUT</text><text x="520" y="99" font-size="17" fill="#0f172a" font-weight="700">Pcr = ' + fmt(r.criticalLoad) + ' N</text><text x="520" y="124" font-size="13" fill="#334155">Le = ' + fmt(r.effectiveLength) + ' m</text><text x="520" y="147" font-size="13" fill="#334155">K = ' + fmt(r.effectiveLengthFactor) + ' · 端条件：' + esc(r.endCondition) + '</text><text x="520" y="170" font-size="13" fill="#334155">长细比 λ = ' + fmt(r.slendernessRatio) + '</text><text x="520" y="193" font-size="13" fill="#334155">载荷 P = ' + fmt(r.load) + ' N</text><text x="520" y="219" font-size="15" fill="' + color + '" font-weight="700">安全系数 n = ' + fmt(r.safetyFactor) + '</text><line x1="520" y1="233" x2="735" y2="233" stroke="#e2e8f0"/><text x="520" y="255" font-size="11" fill="#64748b">E = ' + fmt(r.youngsModulus) + ' Pa · I = ' + fmt(r.inertia) + ' m⁴</text><text x="520" y="273" font-size="11" fill="#64748b">A = ' + fmt(r.area) + ' m² · r = ' + fmt(r.radiusOfGyration) + ' m</text><text x="25" y="306" font-size="11" fill="#64748b">Pcr = π²EI/(KL)² · 理想直柱、轴心压力、两端理想约束</text></svg>';
    host.innerHTML = svg;
    return r;
  }
  var api = { render: render, calculate: calculate };
  if (root) root.BucklingScene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
