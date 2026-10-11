/* FatigueScene — dependency-free cyclic-load and S-N diagram (MPa, cycles). */
(function (root) {
  'use strict';
  var DEFAULTS = {
    stressAmplitude: 180, referenceStress: 300, referenceCycles: 1e5,
    exponent: 0.12, enduranceLimit: 120, meanStress: 30,
    ultimateStrength: 600, safetyFactor: 1.5
  };
  function finite(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function calculate(params) {
    var p = params || {}, d = DEFAULTS;
    var a = finite(p.stressAmplitude, d.stressAmplitude);
    var sr = finite(p.referenceStress, d.referenceStress);
    var nr = finite(p.referenceCycles, d.referenceCycles);
    var b = finite(p.exponent, d.exponent);
    var se = finite(p.enduranceLimit, d.enduranceLimit);
    var sm = finite(p.meanStress, d.meanStress);
    var su = p.ultimateStrength === Infinity ? Infinity : finite(p.ultimateStrength, d.ultimateStrength);
    var n = finite(p.safetyFactor, d.safetyFactor);
    if (!(a >= 0 && sr > 0 && nr > 0 && b > 0 && se >= 0 && n > 0 &&
          sm === sm && (su > 0 || su === Infinity))) {
      throw new RangeError('应力、参考点、疲劳极限、抗拉强度及安全系数须有效；指数须为正');
    }
    var denominator = 1 - sm / su;
    if (!(Number.isFinite(denominator) && denominator > 0)) throw new RangeError('平均应力必须小于极限强度');
    // Goodman correction and safety factor are applied exactly once.  The
    // engine compares this effective amplitude directly with enduranceLimit.
    var goodmanFactor = 1 / denominator;
    var correctedAmplitude = a * goodmanFactor;
    var effectiveAmplitude = correctedAmplitude * n;
    if (!Number.isFinite(correctedAmplitude) || !Number.isFinite(effectiveAmplitude)) {
      throw new RangeError('有效应力幅超出可表示范围');
    }
    var cycles = a === 0 || (se > 0 && effectiveAmplitude <= se)
      ? Infinity
      : nr * Math.pow(sr / effectiveAmplitude, 1 / b);
    var allowableAmplitude = se > 0 ? se * denominator / n : Infinity;
    var utilization = se > 0 ? effectiveAmplitude / se : (effectiveAmplitude === 0 ? 0 : Infinity);
    var finiteLife = Number.isFinite(cycles) ? Math.max(1, cycles) : Infinity;
    return Object.freeze({
      stressAmplitude: a, referenceStress: sr, referenceCycles: nr, exponent: b,
      enduranceLimit: se, meanStress: sm, ultimateStrength: su, safetyFactor: n,
      goodmanFactor: goodmanFactor, correctedAmplitude: correctedAmplitude,
      correctedStressAmplitude: correctedAmplitude, effectiveAmplitude: effectiveAmplitude,
      correctedEnduranceLimit: se, allowableAmplitude: allowableAmplitude,
      cycles: finiteLife, fatigueLife: finiteLife, life: finiteLife,
      rawLife: a > 0 ? nr * Math.pow(sr / a, 1 / b) : Infinity,
      utilization: utilization, belowEnduranceLimit: se > 0 && effectiveAmplitude <= se,
      safe: se > 0 ? utilization <= 1 : effectiveAmplitude === 0
    });
  }
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]; }); }
  function fmt(v, digits) {
    if (v === Infinity) return '∞';
    if (!Number.isFinite(v)) return '—';
    if (v !== 0 && (Math.abs(v) >= 1e6 || Math.abs(v) < 0.01)) return v.toExponential(2);
    return Number(v.toFixed(digits == null ? 2 : digits)).toLocaleString('en-US');
  }
  function render(host, params) {
    if (typeof host === 'string' && root && root.document) host = root.document.querySelector(host);
    if (!host || typeof host !== 'object' || !('innerHTML' in host)) throw new TypeError('FatigueScene.render requires a DOM host element');
    var r;
    try { r = calculate(params); } catch (e) {
      host.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 330" role="img"><rect width="760" height="330" rx="16" fill="#fff7ed" stroke="#fed7aa"/><text x="28" y="140" font-family="system-ui,sans-serif" font-size="19" fill="#9a3412">无法计算疲劳寿命</text><text x="28" y="174" font-family="system-ui,sans-serif" font-size="13" fill="#c2410c">' + esc(e.message) + '</text></svg>';
      return null;
    }
    var x0 = 375, y0 = 238, w = 345, h = 145, minN = 1e2;
    var maxN = Math.max(r.referenceCycles * 1e3, Number.isFinite(r.cycles) ? r.cycles * 2 : r.referenceCycles * 1e4);
    maxN = Math.min(Math.max(maxN, r.referenceCycles * 10), 1e12);
    var minS = Math.max(1, Math.min(r.enduranceLimit * .55, r.effectiveAmplitude * .45));
    var maxS = Math.max(r.referenceStress * 1.25, r.stressAmplitude * 1.3, r.enduranceLimit * 1.25, r.effectiveAmplitude * 1.1);
    function xp(N) { return x0 + Math.log10(Math.max(minN, N) / minN) / Math.log10(maxN / minN) * w; }
    function yp(S) { return y0 - Math.max(0, Math.min(maxS, S) - minS) / (maxS - minS) * h; }
    var curve = '', i;
    for (i = 0; i <= 100; i++) { var nn = Math.pow(10, Math.log10(minN) + i / 100 * (Math.log10(maxN) - Math.log10(minN))); var ss = Math.max(minS, Math.min(maxS, r.referenceStress * Math.pow(nn / r.referenceCycles, -r.exponent))); curve += (i ? 'L' : 'M') + xp(nn).toFixed(1) + ',' + yp(ss).toFixed(1) + ' '; }
    var load = '', cx = 103, cy = 142, rx = 70, ry = 44;
    for (i = 0; i <= 80; i++) { var ang = Math.PI * 2 * i / 80; load += (i ? 'L' : 'M') + (cx + rx * Math.cos(ang)).toFixed(1) + ',' + (cy - ry * Math.sin(ang)).toFixed(1) + ' '; }
    var currentX = xp(Number.isFinite(r.cycles) ? r.cycles : maxN), currentY = yp(r.effectiveAmplitude);
    var status = r.safe ? '安全系数范围内' : '超过许用幅值', statusColor = r.safe ? '#047857' : '#dc2626';
    host.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 330" role="img" aria-label="循环载荷与 S-N 疲劳曲线" style="display:block;width:100%;height:auto;font-family:system-ui,sans-serif"><text x="24" y="30" font-size="18" font-weight="700" fill="#0f172a">疲劳分析 · 循环载荷与 S-N 曲线</text><text x="735" y="30" text-anchor="end" font-size="13" font-weight="600" fill="' + statusColor + '">' + status + '</text>' +
      '<text x="35" y="80" font-size="12" fill="#64748b">循环载荷（示意）</text><line x1="35" y1="142" x2="270" y2="142" stroke="#cbd5e1"/><path d="' + load + '" fill="none" stroke="#2563eb" stroke-width="3"/><line x1="103" y1="83" x2="103" y2="201" stroke="#94a3b8" stroke-dasharray="4 4"/><text x="103" y="220" text-anchor="middle" font-size="11" fill="#475569">σₘ = ' + fmt(r.meanStress) + ' MPa</text><text x="35" y="239" font-size="12" fill="#334155">σₐ = ' + fmt(r.stressAmplitude) + ' MPa</text>' +
      '<path d="M' + x0 + ' ' + (y0-h) + 'V' + y0 + 'H' + (x0+w) + '" fill="none" stroke="#94a3b8"/><path d="' + curve + '" fill="none" stroke="#0f766e" stroke-width="2.5"/><line x1="' + x0 + '" y1="' + yp(r.enduranceLimit).toFixed(1) + '" x2="' + (x0+w) + '" y2="' + yp(r.enduranceLimit).toFixed(1) + '" stroke="#f59e0b" stroke-dasharray="5 4"/><circle cx="' + currentX.toFixed(1) + '" cy="' + currentY.toFixed(1) + '" r="5" fill="#dc2626"/><text x="' + (x0+w) + '" y="' + (yp(r.enduranceLimit)-5).toFixed(1) + '" text-anchor="end" font-size="10" fill="#b45309">疲劳极限</text><text x="' + x0 + '" y="258" font-size="10" fill="#64748b">10²</text><text x="' + (x0+w) + '" y="258" text-anchor="end" font-size="10" fill="#64748b">N（对数）</text><text x="' + (x0-8) + '" y="' + (y0-h-5) + '" text-anchor="end" font-size="10" fill="#64748b">应力幅 / MPa</text>' +
      '<line x1="24" y1="274" x2="736" y2="274" stroke="#e2e8f0"/><text x="28" y="297" font-size="13" fill="#0f172a">当前应力幅 <tspan font-weight="700">' + fmt(r.stressAmplitude) + ' MPa</tspan> · Goodman 修正 <tspan font-weight="700">' + fmt(r.correctedAmplitude) + ' MPa</tspan></text><text x="28" y="318" font-size="13" fill="#334155">预计寿命 <tspan font-weight="700">' + fmt(r.cycles, 2) + ' 次</tspan> · 疲劳极限 ' + fmt(r.enduranceLimit) + ' MPa · 有效幅值 ' + fmt(r.effectiveAmplitude) + ' MPa · n=' + fmt(r.safetyFactor, 2) + '</text></svg>';
    return r;
  }
  var api = Object.freeze({ calculate: calculate, render: render });
  if (root) root.FatigueScene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
