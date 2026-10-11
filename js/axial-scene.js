/* AxialScene — dependency-free axial bar. Units: N, mm², mm, N/mm² (MPa). */
(function (root) {
  'use strict';
  var serial = 0;
  var DEFAULTS = Object.freeze({ force: 30000, area: 200, length: 1000, youngsModulus: 200000, yieldStress: 235, safetyFactor: 1.5 });

  function pick(p, names, fallback) {
    for (var i = 0; i < names.length; i++) {
      if (p[names[i]] !== undefined) {
        var raw = p[names[i]];
        if (raw === null || typeof raw === 'boolean' || (typeof raw === 'string' && !raw.trim())) {
          throw new RangeError(names[0] + ' 必须为有效数值');
        }
        if (typeof raw !== 'number' || !Number.isFinite(raw)) throw new RangeError(names[0] + ' 必须为有限数值');
        return raw;
      }
    }
    return fallback;
  }

  /** Accepts descriptive engine names, short F/A/L/E/yield/safety, and SI aliases. */
  function calculate(params) {
    var p = params || {};
    var force = pick(p, ['force', 'F', 'forceN'], DEFAULTS.force);
    var area = pick(p, ['area', 'A', 'areaMm2'], DEFAULTS.area);
    var length = pick(p, ['length', 'L', 'lengthMm'], DEFAULTS.length);
    var youngsModulus = pick(p, ['youngsModulus', 'E', 'youngsModulusMPa'], DEFAULTS.youngsModulus);
    var yieldStress = pick(p, ['yieldStress', 'yield', 'yieldStrength', 'yieldStressMPa'], DEFAULTS.yieldStress);
    var safetyFactor = pick(p, ['safetyFactor', 'safety'], DEFAULTS.safetyFactor);
    [area, length, youngsModulus, yieldStress, safetyFactor].forEach(function (v) {
      if (!(v > 0)) throw new RangeError('A、L、E、屈服强度及安全系数必须大于 0');
    });
    var stress = force / area;
    var strain = stress / youngsModulus;
    var elongation = strain * length;
    var allowable = yieldStress / safetyFactor;
    var utilization = Math.abs(stress) / allowable;
    var yieldStrain = yieldStress / youngsModulus;
    if (!(allowable > 0) || !(yieldStrain > 0) || ![stress, strain, elongation, allowable, utilization, yieldStrain].every(Number.isFinite)) {
      throw new RangeError('参数超出可计算范围');
    }
    return Object.freeze({
      model: 'axial_bar', force: force, area: area, length: length,
      youngsModulus: youngsModulus, yieldStress: yieldStress, safetyFactor: safetyFactor,
      stress: stress, strain: strain, elongation: elongation,
      allowable: allowable, allowableStress: allowable, utilization: utilization,
      yieldStrain: yieldStrain, elastic: Math.abs(stress) <= allowable,
      yielded: Math.abs(stress) >= yieldStress,
      assumptions: Object.freeze(['uniaxial', 'linear_elastic', 'small_strain'])
    });
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(value, digits) {
    if (value === 0) return '0';
    var a = Math.abs(value);
    if (a >= 1000000 || a < 0.001) return value.toExponential(2);
    return Number(value.toFixed(digits === undefined ? 3 : digits)).toLocaleString('en-US', { maximumFractionDigits: 6 });
  }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function color(t) {
    var stops = [[37, 99, 235], [14, 165, 164], [245, 158, 11], [239, 68, 68]];
    var pos = clamp(t, 0, 1) * 3;
    var i = Math.min(2, Math.floor(pos));
    var f = pos - i;
    return 'rgb(' + stops[i].map(function (v, j) { return Math.round(v + (stops[i + 1][j] - v) * f); }).join(',') + ')';
  }

  /** Renders into an Element (or selector); returns the computed result, or null on invalid input. */
  function render(host, params) {
    var doc = root && root.document;
    if (typeof host === 'string') host = doc && doc.querySelector(host);
    if (!host || !host.ownerDocument || typeof host.appendChild !== 'function') {
      throw new TypeError('AxialScene.render 需要有效的 DOM 容器');
    }
    doc = host.ownerDocument;
    var r;
    var id = 'axial-scene-' + (++serial);
    var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 760 510');
    svg.setAttribute('width', '100%');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-labelledby', id + '-title ' + id + '-desc');
    svg.style.cssText = 'display:block;width:100%;height:auto;font-family:Inter,Segoe UI,Arial,sans-serif';
    try { r = calculate(params); } catch (error) {
      svg.innerHTML = '<title id="' + id + '-title">轴向杆参数错误</title><desc id="' + id + '-desc">请输入有限且有效的参数。</desc><rect width="760" height="330" rx="18" fill="#fff7ed"/><text x="30" y="135" fill="#9a3412" font-size="19">无法计算轴向杆</text><text x="30" y="170" fill="#9a3412" font-size="14">' + esc(error.message) + '</text><text x="30" y="201" fill="#7c2d12" font-size="12">力可为负值；截面积、长度、弹性模量、屈服强度、安全系数须为正数。</text>';
      host.replaceChildren(svg);
      return null;
    }
    var ratio = Math.abs(r.stress) / r.yieldStress;
    var tint = color(ratio);
    var mode = params && (params.colorMode === 'strain' || params.mode === 'strain') ? 'strain' : 'stress';
    var isStrain = mode === 'strain';
    // Uniform section + axial force => uniform stress, not an artificial spatial gradient.
    var left = 102, originalEnd = 454;
    var shift = r.strain === 0 ? 0 : Math.sign(r.strain) * clamp(Math.abs(r.strain) * 1200, 5, 48);
    var end = originalEnd + shift;
    var status = r.yielded ? '达到屈服阈值' : r.utilization > 1 ? '超过许用应力' : '许用范围内';
    var stateColor = r.yielded ? '#dc2626' : r.utilization > 1 ? '#b45309' : '#047857';
    var parts = [];
    function text(x, y, content, size, fill, extra) {
      parts.push('<text x="' + x + '" y="' + y + '" font-size="' + (size || 12) + '" fill="' + (fill || '#475569') + '" ' + (extra || '') + '>' + esc(content) + '</text>');
    }
    function line(x1, y1, x2, y2, stroke, extra) {
      parts.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (stroke || '#94a3b8') + '" stroke-width="1.2" ' + (extra || '') + '/>');
    }
    parts.push('<title id="' + id + '-title">轴向杆 · ' + esc(status) + '</title><desc id="' + id + '-desc">轴向力 ' + fmt(r.force) + ' N，应力 ' + fmt(r.stress) + ' MPa，应变 ' + fmt(r.strain, 6) + '，伸长 ' + fmt(r.elongation) + ' mm。形变为示意，不按比例。超过屈服后线弹性结果仅作外推。</desc>');
    parts.push('<defs><marker id="' + id + '-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L8 5 L1 9" fill="none" stroke="#475569" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></marker><pattern id="' + id + '-hatch" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M-1 1 L1 -1 M0 7 L7 0 M6 8 L8 6" stroke="#cbd5e1" stroke-width="1"/></pattern><linearGradient id="' + id + '-scale"><stop stop-color="#2563eb"/><stop offset="33%" stop-color="#0ea5a4"/><stop offset="67%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#ef4444"/></linearGradient></defs>');
    parts.push('<rect x="0.5" y="0.5" width="759" height="509" rx="18" fill="#eeece7" stroke="#303536"/><rect x="19" y="67" width="527" height="202" rx="12" fill="white" stroke="#e2e8f0"/>');
    text(25, 31, '轴向杆 / AXIAL BAR', 17, '#0f172a', 'font-weight="700"');
    text(25, 51, '单轴 · 等截面 · 小变形线弹性', 11);
    text(735, 31, status, 13, stateColor, 'text-anchor="end" font-weight="600"');
    text(735, 51, 'N · mm² · mm · MPa', 11, '#64748b', 'text-anchor="end"');
    text(36, 89, r.force > 0 ? '拉伸  F > 0' : r.force < 0 ? '压缩  F < 0' : '无轴向载荷', 11);
    parts.push('<rect x="78" y="109" width="24" height="91" fill="url(#' + id + '-hatch)"/>');
    line(left, 106, left, 204, '#475569');
    line(65, 155, 526, 155, '#cbd5e1', 'stroke-dasharray="4 5"');
    parts.push('<rect x="102" y="132" width="352" height="46" rx="3" fill="none" stroke="#94a3b8" stroke-dasharray="4 4"/><rect x="102" y="136" width="' + (end - left) + '" height="38" rx="3" fill="' + tint + '" fill-opacity="0.18" stroke="' + tint + '" stroke-width="1.6"/>');
    line(110, 140, end - 7, 140, '#ffffff');
    text((left + end) / 2, 160, 'A = ' + fmt(r.area) + ' mm²', 13, '#0f172a', 'text-anchor="middle" font-weight="600"');
    var arrow = 'marker-end="url(#' + id + '-arrow)"';
    if (r.force !== 0) {
      if (r.force > 0) line(end + 4, 155, Math.min(532, end + 48), '#475569', arrow);
      else line(Math.min(532, end + 58), 155, end + 5, '#475569', arrow);
      line(76, 155, r.force > 0 ? 35 : 99, '#475569', arrow);
    }
    text(528, 119, 'F = ' + fmt(r.force) + ' N', 12, '#334155', 'text-anchor="end" font-weight="600"');
    line(left, 187, left, 219, '#cbd5e1');
    line(originalEnd, 183, originalEnd, 219, '#cbd5e1', 'stroke-dasharray="3 3"');
    line(left + 1, 211, originalEnd - 1, 211, '#64748b', 'marker-start="url(#' + id + '-arrow)" ' + arrow);
    text(278, 204, 'L = ' + fmt(r.length) + ' mm', 12, '#475569', 'text-anchor="middle"');
    text(36, 242, 'ΔL = ' + fmt(r.elongation) + ' mm', 13, tint, 'font-weight="700"');
    text(530, 242, '虚线：原长 · 形变示意，非等比例', 10, '#64748b', 'text-anchor="end"');
    text(566, 88, '截面响应', 11, '#64748b');
    text(566, 115, 'σ = ' + fmt(r.stress) + ' MPa', 18, '#0f172a', 'font-weight="700"');
    text(566, 139, 'ε = ' + fmt(r.strain, 6), 14, '#334155');
    text(566, 164, 'E = ' + fmt(r.youngsModulus) + ' MPa', 11);
    line(565, 179, 733, 179, '#e2e8f0');
    text(566, 200, '屈服 σy = ' + fmt(r.yieldStress) + ' MPa', 11);
    text(566, 220, '许用 [σ] = ' + fmt(r.allowable) + ' MPa', 11);
    text(566, 241, '利用率 ' + fmt(r.utilization * 100, 1) + '%', 14, stateColor, 'font-weight="600"');
    text(566, 261, '安全系数 n = ' + fmt(r.safetyFactor), 11);
    text(25, 290, isStrain ? '|ε| 色阶' : '|σ| 色阶', 11);
    parts.push('<rect x="95" y="281" width="280" height="9" rx="4.5" fill="url(#' + id + '-scale)"/>');
    var pointer = 95 + clamp(ratio, 0, 1) * 280;
    parts.push('<path d="M' + (pointer - 4) + ' 275 L' + (pointer + 4) + ' 275 L' + pointer + ' 279 Z" fill="#0f172a"/>');
    line(375, 278, 375, 294, '#b91c1c');
    text(95, 306, '0', 10);
    text(375, 306, (isStrain ? fmt(r.yieldStrain, 6) : fmt(r.yieldStress) + ' MPa') + ' · 屈服', 10, '#b91c1c', 'text-anchor="end"');
    text(735, 290, r.yielded ? '已屈服：数值为线弹性外推，非塑性预测' : 'σ = F/A    ε = σ/E    ΔL = εL', 11, r.yielded ? '#b91c1c' : '#475569', 'text-anchor="end"');
    text(735, 308, '均匀应力/应变；色阶按屈服阈值归一化', 10, '#64748b', 'text-anchor="end"');
    // Signed constitutive plot: fixed symmetric elastic domain, no invented plastic law.
    parts.push('<rect x="19" y="327" width="722" height="163" rx="12" fill="white" stroke="#d4d8d4"/>');
    text(36, 350, '材料响应 · 应力—应变', 14, '#303536', 'font-weight="700"');
    var cx = 209, cy = 415, dx = 133, dy = 48;
    line(55, cy, 373, cy, '#6d7472');
    line(cx, 360, cx, 476, '#6d7472');
    line(cx - dx, cy + dy, cx + dx, cy - dy, '#3f7775', 'stroke-width="2"');
    text(374, cy + 15, 'ε', 12); text(cx + 8, 366, 'σ', 12);
    text(67, 482, '压缩', 11); text(321, 482, '拉伸', 11);
    var signedRatio = r.stress / r.yieldStress;
    var plotRatio = clamp(signedRatio, -1, 1);
    var px = cx + plotRatio * dx, py = cy - plotRatio * dy;
    line(px, cy, px, py, tint, 'stroke-dasharray="3 3"');
    line(cx, py, px, py, tint, 'stroke-dasharray="3 3"');
    parts.push('<circle data-role="constitutive-point" cx="' + px + '" cy="' + py + '" r="5" fill="' + tint + '" stroke="#303536"/>');
    text(403, 374, '改变 F：沿同一条直线移动', 13, '#303536');
    text(403, 398, '改变 A：同一轴力下，应力随之改变', 12);
    text(403, 422, '直线斜率 E；图域为 ±屈服应变 / 应力', 11);
    text(403, 446, Math.abs(signedRatio) > 1 ? '超出图域：点停在边界，不绘制塑性曲线' : '圆点对应当前 σ 和 ε，虚线为坐标投影', 11, stateColor);
    text(403, 470, '杆件形变仅作放大示意；数值以读数为准', 11);
    svg.innerHTML = parts.join('');
    host.replaceChildren(svg);
    return r;
  }

  var api = Object.freeze({ render: render, calculate: calculate });
  if (root) root.AxialScene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
