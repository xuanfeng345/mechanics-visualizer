(function (root) {
  'use strict';

  // Free response of m*x'' + c*x' + k*x = 0 (SI units).
  // Non-finite inputs use defaults; finite inputs are bounded for safe SVG math.
  function number(value, fallback, min, max) {
    var n;
    try { n = value == null || value === '' ? fallback : Number(value); }
    catch (_) { n = fallback; }
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }

  function calculate(params) {
    var p = params || {};
    var m = number(p.mass, 1, 1e-6, 1e6);
    var k = number(p.stiffness, 20, 0, 1e6);
    var c = number(p.damping, 0.5, 0, 1e6);
    var x0 = number(p.initialDisplacement, 0.15, -1e6, 1e6);
    var v0 = number(p.initialVelocity, 0, -1e6, 1e6);
    var t = number(p.time, 0, 0, 1e6);
    var omega = Math.sqrt(k / m), alpha = c / (2 * m);
    var zeta = omega > 0 ? alpha / omega : null;
    var wd = 0, x, v, regime;
    if (k === 0) {
      regime = 'free';
      var rate = c / m;
      if (rate === 0) { x = x0 + v0 * t; v = v0; }
      else {
        var decay = Math.exp(-rate * t);
        x = x0 + v0 * (-Math.expm1(-rate * t)) / rate;
        v = v0 * decay;
      }
    } else if (Math.abs(alpha - omega) <= 1e-8 * omega) {
      regime = 'critical';
      var b = v0 + alpha * x0, e = Math.exp(-alpha * t);
      x = (x0 + b * t) * e;
      v = (v0 - alpha * b * t) * e;
    } else if (alpha < omega) {
      regime = c === 0 ? 'undamped' : 'underdamped';
      wd = Math.sqrt((omega - alpha) * (omega + alpha));
      var s = Math.sin(wd * t) / wd, co = Math.cos(wd * t);
      var envelope = Math.exp(-alpha * t);
      x = envelope * (x0 * co + (v0 + alpha * x0) * s);
      v = envelope * (v0 * co - (alpha * v0 + omega * omega * x0) * s);
    } else {
      regime = 'overdamped';
      var q = Math.sqrt((alpha - omega) * (alpha + omega));
      // Stable slow root avoids subtracting two nearly equal large numbers.
      var slow = -(omega * omega) / (alpha + q), fast = -alpha - q;
      var a = (v0 - fast * x0) / (slow - fast), b2 = x0 - a;
      var es = Math.exp(slow * t), ef = Math.exp(fast * t);
      x = a * es + b2 * ef;
      v = slow * a * es + fast * b2 * ef;
    }
    if (t === 0) { x = x0; v = v0; }
    var kinetic = 0.5 * m * v * v, potential = 0.5 * k * x * x;
    return {
      mass: m, stiffness: k, damping: c, initialDisplacement: x0,
      initialVelocity: v0, time: t, displacement: x, velocity: v,
      acceleration: -(c / m) * v - (k / m) * x,
      naturalAngularFrequency: omega, angularFrequency: omega,
      naturalFrequency: omega / (2 * Math.PI), frequency: omega / (2 * Math.PI),
      naturalPeriod: omega > 0 ? 2 * Math.PI / omega : null,
      period: omega > 0 ? 2 * Math.PI / omega : null,
      dampedAngularFrequency: wd, dampedFrequency: wd / (2 * Math.PI),
      dampedPeriod: wd > 0 ? 2 * Math.PI / wd : null,
      dampingRatio: zeta, regime: regime,
      kineticEnergy: kinetic, potentialEnergy: potential,
      totalEnergy: kinetic + potential, energy: kinetic + potential,
      initialEnergy: 0.5 * m * v0 * v0 + 0.5 * k * x0 * x0
    };
  }

  function fmt(value) {
    if (value === null || !Number.isFinite(value)) return '—';
    if (value !== 0 && (Math.abs(value) >= 1e5 || Math.abs(value) < 0.001)) return value.toExponential(2);
    return value.toFixed(3);
  }

  // render(host, params) updates one host only and returns the calculated state.
  function render(host, params) {
    if (!host || typeof host !== 'object' || !('innerHTML' in host)) {
      throw new TypeError('VibrationScene.render requires a DOM host element');
    }
    var r = calculate(params);
    var duration = Math.min(1e6, Math.max(4, Math.min(30, (r.dampedPeriod || r.period || 2) * 3), r.time));
    var samples = [], amplitude = Math.max(Math.abs(r.initialDisplacement), Math.abs(r.displacement), 0.01);
    for (var i = 0; i <= 240; i++) {
      var state = calculate({ mass: r.mass, stiffness: r.stiffness, damping: r.damping,
        initialDisplacement: r.initialDisplacement, initialVelocity: r.initialVelocity, time: duration * i / 240 });
      samples.push(state.displacement);
      amplitude = Math.max(amplitude, Math.abs(state.displacement));
    }
    amplitude *= 1.15;
    var bx = 198 + 75 * r.displacement / amplitude;
    var springEnd = bx - 27, spring = '50,151 65,151';
    for (var j = 0; j <= 12; j++) {
      spring += ' ' + (65 + (springEnd - 77) * j / 12).toFixed(2) + ',' + (j % 2 ? 140 : 162);
    }
    spring += ' ' + (springEnd - 5).toFixed(2) + ',151 ' + springEnd.toFixed(2) + ',151';
    var path = samples.map(function (y, index) {
      return (index ? 'L' : 'M') + (375 + index / 240 * 352).toFixed(2) + ',' + (152 - y / amplitude * 69).toFixed(2);
    }).join(' ');
    var labels = { free: '无刚度自由运动', critical: '临界阻尼', undamped: '无阻尼', underdamped: '欠阻尼', overdamped: '过阻尼' };
    host.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 330" role="img" aria-label="弹簧质块自由振动、位移时间波形及能量读数" class="vibration-scene">' +
      '<rect width="760" height="330" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>' +
      '<g font-family="system-ui,sans-serif" fill="#0f172a"><text x="24" y="30" font-size="18" font-weight="600">弹簧质块 · 自由振动</text>' +
      '<text x="24" y="53" font-size="12">' + labels[r.regime] + ' · m=' + fmt(r.mass) + ' kg · k=' + fmt(r.stiffness) + ' N/m · c=' + fmt(r.damping) + ' N·s/m</text>' +
      '<path d="M50 106V192M36 115L50 106M36 134L50 125M36 153L50 144M36 172L50 163M36 191L50 182M50 190H312" stroke="#64748b" fill="none"/>' +
      '<line x1="198" y1="94" x2="198" y2="203" stroke="#94a3b8" stroke-dasharray="4 4"/>' +
      '<polyline points="' + spring + '" fill="none" stroke="#2f7772" stroke-width="3"/>' +
      '<rect x="' + springEnd.toFixed(2) + '" y="124" width="54" height="54" rx="6" fill="#2f7772"/>' +
      '<text x="' + bx.toFixed(2) + '" y="156" text-anchor="middle" fill="white" font-size="16">m</text>' +
      '<text x="73" y="218" font-size="12">平衡位置 x=0（虚线）</text>' +
      '<text x="73" y="238" font-size="12">x=' + fmt(r.displacement) + ' m · v=' + fmt(r.velocity) + ' m/s</text>' +
      '<text x="375" y="76" font-size="12">位移 x(t) / m · ±' + fmt(amplitude) + '</text>' +
      '<path d="M375 83V222H727M375 152H727" fill="none" stroke="#cbd5e1"/>' +
      '<path d="' + path + '" stroke="#2563eb" stroke-width="2" fill="none"/>' +
      '<circle cx="' + (375 + r.time / duration * 352).toFixed(2) + '" cy="' + (152 - r.displacement / amplitude * 69).toFixed(2) + '" r="4" fill="#db6b32"/>' +
      '<text x="375" y="239" font-size="11">0</text><text x="727" y="239" text-anchor="end" font-size="11">' + fmt(duration) + ' s</text>' +
      '<text x="24" y="271" font-size="13">固有频率 fₙ=' + fmt(r.frequency) + ' Hz · 固有周期 Tₙ=' + fmt(r.period) + ' s · 阻尼比 ζ=' + fmt(r.dampingRatio) + '</text>' +
      '<text x="24" y="294" font-size="13">动能=' + fmt(r.kineticEnergy) + ' J · 弹性势能=' + fmt(r.potentialEnergy) + ' J · 总能量=' + fmt(r.totalEnergy) + ' J</text>' +
      '<text x="24" y="316" font-size="11" fill="#64748b">t=' + fmt(r.time) + ' s · 阻尼振动频率=' + (r.dampedPeriod ? fmt(r.dampedFrequency) + ' Hz' : '—（无周期振荡）') + ' · 波形为有限采样；极高频可能欠采样</text></g></svg>';
    return r;
  }

  var api = { calculate: calculate, render: render };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.VibrationScene = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
