/* LagrangianScene — dependency-free harmonic oscillator SVG visualizer. */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function finite(value, fallback, name) {
    if (value === undefined) return fallback;
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError((name || 'value') + ' must be finite');
    return value;
  }
  function parameters(input) {
    var p = input || {};
    var q = { mass: finite(p.mass, 1, 'mass'), stiffness: finite(p.stiffness, 20, 'stiffness'), initialCoordinate: finite(p.initialCoordinate, 0.15, 'initialCoordinate'), initialVelocity: finite(p.initialVelocity, 0, 'initialVelocity'), time: finite(p.time, 0, 'time') };
    if (q.mass <= 0 || q.stiffness <= 0 || q.time < 0) throw new RangeError('mass and stiffness must be positive; time must be non-negative');
    return q;
  }
  function calculate(input) {
    var p = parameters(input), q, velocity, omega = Math.sqrt(p.stiffness / p.mass);
    if (omega > 0) {
      var wt = omega * p.time, c = Math.cos(wt), s = Math.sin(wt);
      q = p.initialCoordinate * c + (p.initialVelocity / omega) * s;
      velocity = p.initialVelocity * c - omega * p.initialCoordinate * s;
    } else {
      q = p.initialCoordinate + p.initialVelocity * p.time;
      velocity = p.initialVelocity;
    }
    if (p.time === 0) { q = p.initialCoordinate; velocity = p.initialVelocity; }
    var kinetic = 0.5 * p.mass * velocity * velocity;
    var potential = 0.5 * p.stiffness * q * q;
    var acceleration = -(p.stiffness / p.mass) * q;
    return {
      mass: p.mass, stiffness: p.stiffness, initialCoordinate: p.initialCoordinate,
      initialVelocity: p.initialVelocity, time: p.time, coordinate: q, q: q,
      velocity: velocity, acceleration: acceleration, angularFrequency: omega,
      kineticEnergy: kinetic, T: kinetic, potentialEnergy: potential, V: potential,
      lagrangian: kinetic - potential, L: kinetic - potential,
      totalEnergy: kinetic + potential, energy: kinetic + potential, E: kinetic + potential
    };
  }
  function fmt(value) {
    if (!Number.isFinite(value)) return '—';
    if (value !== 0 && (Math.abs(value) >= 1e4 || Math.abs(value) < 1e-3)) return value.toExponential(2);
    return value.toFixed(3);
  }
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function render(host, input) {
    if (typeof host === 'string' && root.document) host = root.document.querySelector(host);
    if (!host || typeof host !== 'object' || !('innerHTML' in host)) {
      throw new TypeError('LagrangianScene.render requires a DOM host element');
    }
    var r = calculate(input), left = 36, right = 484, axisY = 142;
    var span = Math.max(Math.abs(r.initialCoordinate), Math.abs(r.coordinate), 0.2) * 1.35;
    var xOf = function (q) { return left + (q + span) / (2 * span) * (right - left); };
    var particleX = xOf(r.coordinate), zeroX = xOf(0);
    var arrowScale = 22 / Math.max(Math.abs(r.velocity), 0.25);
    var arrowEnd = Math.max(left + 8, Math.min(right - 8, particleX + r.velocity * arrowScale));
    var potentialScale = 82 / Math.max(0.5 * r.stiffness * span * span, 0.1), curve = '';
    for (var i = 0; i <= 100; i++) {
      var qx = -span + 2 * span * i / 100, py = 226 - 0.5 * r.stiffness * qx * qx * potentialScale;
      py = Math.max(58, Math.min(226, py));
      curve += (i ? 'L' : 'M') + xOf(qx).toFixed(1) + ',' + py.toFixed(1) + ' ';
    }
    var svg = '<svg xmlns="' + NS + '" viewBox="0 0 760 330" role="img" aria-label="拉格朗日力学：广义坐标、势能曲线、速度与能量" style="display:block;width:100%;height:auto;font-family:system-ui,sans-serif">' +
      '<defs><marker id="lag-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L8 5L1 9" fill="none" stroke="currentColor" stroke-width="1.5"/></marker></defs>' +
      '<rect x=".5" y=".5" width="759" height="329" rx="16" fill="#f8fafc" stroke="#dbe5e7"/>' +
      '<text x="24" y="30" font-size="18" font-weight="700" fill="#17324d">拉格朗日力学 / LAGRANGIAN SCENE</text>' +
      '<text x="24" y="51" font-size="12" fill="#64748b">一维简谐系统　m=' + esc(fmt(r.mass)) + ' kg　k=' + esc(fmt(r.stiffness)) + ' N/m　t=' + esc(fmt(r.time)) + ' s</text>' +
      '<path d="M' + left + ' ' + axisY + 'H' + right + '" stroke="#9aaeb5"/><path d="M' + zeroX.toFixed(1) + ' 62V235" stroke="#b7c7cb" stroke-dasharray="4 4"/>' +
      '<path d="' + curve + '" fill="none" stroke="#bb684f" stroke-width="2.5"/>' +
      '<text x="42" y="72" font-size="12" fill="#a34f3c">V(q) = ½kq²</text><text x="' + (zeroX + 5).toFixed(1) + '" y="248" font-size="11" fill="#64748b">q=0</text>' +
      '<line x1="' + particleX.toFixed(1) + '" y1="' + (axisY - 25) + '" x2="' + particleX.toFixed(1) + '" y2="' + (axisY + 25) + '" stroke="#2f7772" stroke-width="3"/>' +
      '<circle cx="' + particleX.toFixed(1) + '" cy="' + axisY + '" r="12" fill="#2f7772" stroke="#fff" stroke-width="3"/><text x="' + particleX.toFixed(1) + '" y="' + (axisY + 5) + '" text-anchor="middle" font-size="12" fill="white">m</text>' +
      '<line x1="' + particleX.toFixed(1) + '" y1="' + (axisY - 30) + '" x2="' + arrowEnd.toFixed(1) + '" y2="' + (axisY - 30) + '" stroke="#2563a6" stroke-width="2.5" marker-end="url(#lag-arrow)"/><text x="' + ((particleX + arrowEnd) / 2).toFixed(1) + '" y="' + (axisY - 36) + '" text-anchor="middle" font-size="11" fill="#2563a6">v</text>' +
      '<text x="' + left + '" y="268" font-size="12" fill="#17324d">q = ' + esc(fmt(r.coordinate)) + ' m　　v = ' + esc(fmt(r.velocity)) + ' m/s</text>' +
      '<line x1="520" y1="64" x2="520" y2="294" stroke="#d8e2e4"/><text x="545" y="78" font-size="13" font-weight="700" fill="#17324d">读数 / READOUT</text>' +
      '<text x="545" y="105" font-size="13" fill="#2563a6">T 动能 = ' + esc(fmt(r.T)) + ' J</text><text x="545" y="130" font-size="13" fill="#a34f3c">V 势能 = ' + esc(fmt(r.V)) + ' J</text>' +
      '<text x="545" y="155" font-size="13" fill="#2f7772">L = T − V = ' + esc(fmt(r.L)) + ' J</text><text x="545" y="180" font-size="13" fill="#17324d">E = T + V = ' + esc(fmt(r.E)) + ' J</text>' +
      '<text x="545" y="215" font-size="12" fill="#64748b">a = ' + esc(fmt(r.acceleration)) + ' m/s²</text><text x="545" y="238" font-size="12" fill="#64748b">ω = ' + esc(fmt(r.angularFrequency)) + ' rad/s</text>' +
      '<text x="545" y="274" font-size="11" fill="#64748b">初始：q₀=' + esc(fmt(r.initialCoordinate)) + ' m，v₀=' + esc(fmt(r.initialVelocity)) + ' m/s</text>' +
      '<text x="24" y="307" font-size="11" fill="#64748b">广义坐标 q 沿水平轴；红线为势能 V(q)，蓝箭头表示速度方向</text></svg>';
    host.innerHTML = svg;
    return r;
  }
  var api = { render: render, calculate: calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.LagrangianScene = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
