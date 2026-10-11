/* Plane stress transformation. Angles are degrees, positive counterclockwise.
 * Positive tauXY acts in +y on the +x face; stresses share the caller's units.
 * render(parameters) -> SVG string; render(element, parameters) also mounts it.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.StressTransformScene = api;
}(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';
  function number(value, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function calculate(parameters) {
    var p = parameters || {};
    var sx = number(p.sigmaX, 80), sy = number(p.sigmaY, 20);
    var t = number(p.tauXY, 30), angle = number(p.angle, 25);
    var a = (angle % 360) * Math.PI / 180;
    var mean = sx / 2 + sy / 2, halfDifference = sx / 2 - sy / 2;
    var radius = Math.hypot(halfDifference, t);
    var c = Math.cos(2 * a), s = Math.sin(2 * a);
    var sn = mean + halfDifference * c + t * s;
    var st = mean - halfDifference * c - t * s;
    var tn = -halfDifference * s + t * c;
    var s1 = mean + radius, s2 = mean - radius;
    var principalAngle = radius === 0 ? 0 : Math.atan2(t, halfDifference) * 90 / Math.PI;
    // Plane stress includes sigma3=0 when computing the absolute 3D maximum shear.
    var absoluteMaxShear = (Math.max(s1, s2, 0) - Math.min(s1, s2, 0)) / 2;
    var vonMises = Math.hypot(sx - sy / 2, Math.sqrt(3) * sy / 2, Math.sqrt(3) * t);
    return {
      sigmaX: sx, sigmaY: sy, tauXY: t, angle: angle,
      sigmaXPrime: sn, sigmaYPrime: st, tauXYPrime: tn,
      sigmaNormal: sn, tauNormal: tn,
      meanStress: mean, center: mean, radius: radius,
      sigma1: s1, sigma2: s2, sigma3: 0,
      principalAngle: principalAngle,
      maxShear: radius, maxShearInPlane: radius, absoluteMaxShear: absoluteMaxShear,
      maxShearAngle: principalAngle + 45,
      vonMises: vonMises
    };
  }
  function fmt(n) {
    if (!Number.isFinite(n)) return '—';
    if (Math.abs(n) < 0.00005) return '0';
    if (Math.abs(n) >= 100000 || Math.abs(n) < 0.001) return n.toExponential(2);
    return String(Number(n.toFixed(2)));
  }
  function render(target, parameters) {
    var mount = target && typeof target === 'object' && 'innerHTML' in target;
    var v = calculate(mount ? parameters : (parameters || target));
    var out = [];
    var ink = '#17324d', muted = '#64748b', blue = '#2563a6', cyan = '#0f766e', amber = '#b45309';
    function text(x, y, value, fill, size, anchor) {
      out.push('<text x="' + x + '" y="' + y + '" fill="' + (fill || ink) + '" font-size="' + (size || 11) + '" text-anchor="' + (anchor || 'start') + '">' + value + '</text>');
    }
    function line(x1, y1, x2, y2, color, width, dash) {
      out.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + (width || 1.5) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>');
    }
    function arrow(x1, y1, x2, y2, color) {
      line(x1, y1, x2, y2, color, 2);
      var a = Math.atan2(y2 - y1, x2 - x1), r = 6;
      line(x2, y2, x2 - r * Math.cos(a - 0.45), y2 - r * Math.sin(a - 0.45), color, 2);
      line(x2, y2, x2 - r * Math.cos(a + 0.45), y2 - r * Math.sin(a + 0.45), color, 2);
    }
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 330" width="100%" role="img" aria-label="平面应力变换：应力元、旋转面、Mohr圆与应力读数" style="display:block;font-family:system-ui,-apple-system,Segoe UI,sans-serif">');
    out.push('<title>平面应力变换 / Plane stress transformation</title><desc>角度为逆时针法线转角。Mohr圆剪应力向上为正；空间转角θ对应圆上顺时针2θ。最大剪应力读数为面内值，另列含零面外主应力的绝对最大值。</desc>');

    text(20, 27, '平面应力变换', ink, 16);
    text(740, 26, 'θ = ' + fmt(v.angle) + '° · 拉应力为正 · 单位同输入', muted, 11, 'end');
    [12, 254, 496].forEach(function (x) {

    });
    text(25, 63, '01  原始应力元', blue, 12);
    var cx = 130, cy = 143, h = 30;
    out.push('<rect x="100" y="113" width="60" height="60" rx="2" fill="#e8f1fb" stroke="' + blue + '" stroke-width="2"/>');
    var scale = Math.max(Math.abs(v.sigmaX), Math.abs(v.sigmaY), Math.abs(v.tauXY), 1);
    function normal(faceX, faceY, dx, dy, stress) {
      if (stress === 0) return;
      var length = 12 + 23 * Math.abs(stress) / scale;
      var ax = faceX + dx * 4, ay = faceY + dy * 4;
      var bx = faceX + dx * length, by = faceY + dy * length;
      if (stress > 0) arrow(ax, ay, bx, by, blue); else arrow(bx, by, ax, ay, blue);
    }
    normal(cx + h, cy, 1, 0, v.sigmaX); normal(cx - h, cy, -1, 0, v.sigmaX);
    normal(cx, cy - h, 0, -1, v.sigmaY); normal(cx, cy + h, 0, 1, v.sigmaY);
    if (v.tauXY !== 0) {
      var sign = v.tauXY > 0 ? 1 : -1, len = 9 + 9 * Math.abs(v.tauXY) / scale;
      arrow(168, cy + sign * len, 168, cy - sign * len, amber);
      arrow(92, cy - sign * len, 92, cy + sign * len, amber);
      arrow(cx - sign * len, 105, cx + sign * len, 105, amber);
      arrow(cx + sign * len, 181, cx - sign * len, 181, amber);
    }
    text(130, 146, 'σ', ink, 17, 'middle');
    text(25, 207, 'σx = ' + fmt(v.sigmaX) + '   σy = ' + fmt(v.sigmaY), blue, 11);
    text(25, 228, 'τxy = ' + fmt(v.tauXY), amber, 11);
    arrow(205, 185, 227, 185, muted); arrow(205, 185, 205, 164, muted);
    text(231, 189, 'x', muted, 10); text(202, 158, 'y', muted, 10);
    text(267, 63, '02  旋转面与牵引分量', cyan, 12);
    var rx = 372, ry = 139, a = (v.angle % 360) * Math.PI / 180;
    var nx = Math.cos(a), ny = -Math.sin(a), tx = -Math.sin(a), ty = -Math.cos(a);
    out.push('<circle cx="372" cy="139" r="47" fill="none" stroke="#cbd5e1" stroke-dasharray="3 4"/>');
    line(rx - 57, ry, rx + 65, ry, '#94a3b8', 1, '3 3');
    line(rx - 40 * tx, ry - 40 * ty, rx + 40 * tx, ry + 40 * ty, cyan, 4);
    arrow(rx, ry, rx + 55 * nx, ry + 55 * ny, cyan);
    text(rx + 65 * nx, ry + 65 * ny + 4, 'n', cyan, 12, 'middle');
    // A translucent rotated element emphasizes the plane orientation without hiding the normal.
    out.push('<rect x="350" y="117" width="44" height="44" fill="' + cyan + '" fill-opacity="0.07" stroke="' + cyan + '" stroke-opacity="0.35" transform="rotate(' + (-v.angle % 360) + ' 372 139)"/>');
    var tractionScale = Math.max(Math.abs(v.sigmaNormal), Math.abs(v.tauNormal), 1);
    if (v.sigmaNormal !== 0) arrow(rx, ry, rx + nx * 33 * v.sigmaNormal / tractionScale, ry + ny * 33 * v.sigmaNormal / tractionScale, blue);
    if (v.tauNormal !== 0) arrow(rx, ry, rx + tx * 33 * v.tauNormal / tractionScale, ry + ty * 33 * v.tauNormal / tractionScale, amber);
    text(267, 207, 'σn = ' + fmt(v.sigmaNormal) + '   τnt = ' + fmt(v.tauNormal), cyan, 11);
    text(267, 228, 'σt = ' + fmt(v.sigmaYPrime) + '   法线 θ = ' + fmt(v.angle) + '°', muted, 11);
    text(509, 63, '03  Mohr 应力圆', amber, 12);
    var ccx = 615, ccy = 141, cr = 57;
    var span = Math.max(Math.abs(v.meanStress) + v.radius, 1);
    var k = 85 / span;
    // One common scale for both axes preserves the circular locus, even for hydrostatic stress.
    k = Math.min(k, v.radius > 0 ? cr / v.radius : k);
    var origin = ccx - v.meanStress * k;
    line(507, ccy, 733, ccy, '#94a3b8', 1);
    line(origin, 78, origin, 202, '#94a3b8', 1);
    text(735, 137, 'σ', muted, 11); text(origin + 4, 83, 'τ', muted, 11);
    out.push('<circle cx="' + ccx + '" cy="' + ccy + '" r="' + (v.radius * k) + '" fill="#ffca70" fill-opacity="0.04" stroke="' + amber + '" stroke-width="2"/>');
    function dot(x, y, color, r) { out.push('<circle cx="' + x + '" cy="' + y + '" r="' + (r || 3.5) + '" fill="' + color + '"/>'); }
    var px = ccx + (v.sigmaXPrime - v.meanStress) * k, py = ccy - v.tauXYPrime * k;
    var ox = ccx + (v.sigmaX - v.meanStress) * k, oy = ccy - v.tauXY * k;
    line(ccx, ccy, ox, oy, blue, 1, '3 3');
    line(2 * ccx - px, 2 * ccy - py, px, py, cyan, 1.5);
    dot(ccx, ccy, muted, 2.5); dot(ox, oy, blue); dot(px, py, cyan, 4);
    text(509, 218, 'C = ' + fmt(v.meanStress) + '   R = ' + fmt(v.radius), amber, 11);
    text(509, 235, '蓝：原始面  绿：旋转面 · 圆上 −2θ', muted, 10);

    var readings = [
      ['主应力 σ1 / σ2（面内）', fmt(v.sigma1) + ' / ' + fmt(v.sigma2), blue],
      ['最大剪应力 τmax（面内）', fmt(v.maxShear), amber],
      ['von Mises（平面应力）', fmt(v.vonMises), cyan],
      ['主方向 θp / 绝对 τmax', fmt(v.principalAngle) + '° / ' + fmt(v.absoluteMaxShear), ink]
    ];
    readings.forEach(function (entry, i) {
      var x = 25 + i * 184;
      if (i) line(x - 12, 266, x - 12, 306, '#cbd5e1', 1);
      text(x, 275, entry[0], muted, 10);
      text(x, 299, entry[1], entry[2], 16);
    });
    out.push('</svg>');
    var svg = out.join('');
    if (mount) target.innerHTML = svg;
    return svg;
  }
  return { calculate: calculate, render: render };
}));
