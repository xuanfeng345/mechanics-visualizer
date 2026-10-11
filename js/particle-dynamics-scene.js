/* ParticleDynamicsScene — dependency-free particle force/energy SVG visualizer. */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function finite(v, fallback, name) { if (v === undefined) return fallback; if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError((name || 'value') + ' must be finite'); return v; }
  function vector(v, fallbackX, fallbackY, name) {
    if (v && typeof v === 'object' && !Array.isArray(v)) return { x: finite(v.x, fallbackX, (name||'vector')+'.x'), y: finite(v.y, fallbackY, (name||'vector')+'.y') };
    if (v === undefined) return { x: fallbackX, y: fallbackY };
    throw new TypeError((name || 'vector') + ' must be an object');
  }
  function paramsOf(p) {
    p = p || {};
    var force = vector(p.force, 10, 0, 'force');
    var velocity = vector(p.velocity, 0, 0, 'velocity');
    var mass = finite(p.mass, 1, 'mass');
    var dt = finite(p.dt, 1, 'dt');
    if (mass <= 0) throw new RangeError('mass must be positive');
    if (dt < 0) throw new RangeError('dt must be nonnegative');
    return { force: force, mass: mass, velocity: velocity, dt: dt };
  }
  function calculate(input) {
    var q = paramsOf(input), a = { x: q.force.x / q.mass, y: q.force.y / q.mass };
    var displacement = { x: q.velocity.x * q.dt + .5 * a.x * q.dt * q.dt, y: q.velocity.y * q.dt + .5 * a.y * q.dt * q.dt };
    var velocity = { x: q.velocity.x + a.x * q.dt, y: q.velocity.y + a.y * q.dt };
    var speed = Math.hypot(velocity.x, velocity.y), initialSpeed = Math.hypot(q.velocity.x, q.velocity.y);
    var kineticEnergy = .5 * q.mass * speed * speed;
    var initialKineticEnergy = .5 * q.mass * initialSpeed * initialSpeed;
    var work = q.force.x * displacement.x + q.force.y * displacement.y;
    function safe(n) { return Number.isFinite(n) ? n : 0; }
    return { force: {x:safe(q.force.x),y:safe(q.force.y)}, mass:q.mass, dt:q.dt,
      initialVelocity:{x:safe(q.velocity.x),y:safe(q.velocity.y)}, velocity:{x:safe(velocity.x),y:safe(velocity.y)},
      acceleration:{x:safe(a.x),y:safe(a.y)}, displacement:{x:safe(displacement.x),y:safe(displacement.y)},
      speed:safe(speed), kineticEnergy:safe(kineticEnergy), initialKineticEnergy:safe(initialKineticEnergy), work:safe(work) };
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function fmt(n) { n=finite(n,0); return Math.abs(n)>=1000 || (Math.abs(n)>0 && Math.abs(n)<.01) ? n.toExponential(2) : n.toFixed(2); }
  function render(host, input) {
    if (typeof host === 'string' && root.document) host = root.document.querySelector(host);
    if (!host) return null;
    var r = calculate(input), px=250, py=170, scale=6;
    var fx=r.force.x*scale, fy=-r.force.y*scale, vx=r.velocity.x*scale, vy=-r.velocity.y*scale, ax=r.acceleration.x*scale, ay=-r.acceleration.y*scale;
    function line(x1,y1,x2,y2,cls) { return '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" class="'+cls+'"/>'; }
    var svg='<svg xmlns="'+NS+'" viewBox="0 0 760 330" role="img" aria-label="粒子动力学：力、速度、加速度、动能与功" style="display:block;width:100%;height:auto;font-family:Arial,sans-serif">'+
      '<defs><marker id="pds-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L8 5L1 9" fill="none" stroke="currentColor" stroke-width="1.5"/></marker></defs><style>text{fill:#263238}.muted{fill:#65747b}.axis{stroke:#b7c2c2;stroke-width:1}.vec{fill:none;stroke-width:2;marker-end:url(#pds-arrow)}.force{stroke:#c05a45}.velocity{stroke:#2463a6}.acceleration{stroke:#7b58a6}</style>'+
      '<text x="26" y="30" font-size="18" font-weight="700">粒子动力学 / PARTICLE DYNAMICS</text><text x="734" y="30" text-anchor="end" font-size="12" class="muted">dt = '+fmt(r.dt)+' s</text>'+
      '<line x1="45" y1="250" x2="500" y2="250" class="axis"/><line x1="250" y1="65" x2="250" y2="275" class="axis"/>'+line(px,py,px+fx,py+fy,'vec force')+line(px,py,px+vx,py+vy,'vec velocity')+line(px,py,px+ax,py+ay,'vec acceleration')+
      '<circle cx="'+px+'" cy="'+py+'" r="13" fill="#d97735" stroke="#fff" stroke-width="3"/><text x="'+(px+18)+'" y="'+(py+5)+'" font-size="12">m = '+fmt(r.mass)+' kg</text>'+ 
      '<text x="'+(px+fx/2+8)+'" y="'+(py+fy/2-6)+'" font-size="12" fill="#c05a45">F</text><text x="'+(px+vx/2+8)+'" y="'+(py+vy/2-6)+'" font-size="12" fill="#2463a6">v</text><text x="'+(px+ax/2+8)+'" y="'+(py+ay/2-6)+'" font-size="12" fill="#7b58a6">a</text>'+ 
      '<text x="545" y="76" font-size="13" font-weight="700">读数 / READOUT</text><text x="545" y="101" font-size="12" fill="#c05a45">力 F = ('+fmt(r.force.x)+', '+fmt(r.force.y)+') N</text><text x="545" y="126" font-size="12" fill="#2463a6">速度 v = ('+fmt(r.velocity.x)+', '+fmt(r.velocity.y)+') m/s</text><text x="545" y="151" font-size="12" fill="#7b58a6">加速度 a = ('+fmt(r.acceleration.x)+', '+fmt(r.acceleration.y)+') m/s²</text><text x="545" y="184" font-size="12">动能 K = '+fmt(r.kineticEnergy)+' J</text><text x="545" y="209" font-size="12">功 W = '+fmt(r.work)+' J</text><text x="545" y="241" font-size="11" class="muted">位移 Δr = ('+fmt(r.displacement.x)+', '+fmt(r.displacement.y)+') m</text><text x="545" y="263" font-size="11" class="muted">红：力　蓝：速度　紫：加速度</text></svg>';
    host.innerHTML=svg; return r;
  }
  var api={render:render,calculate:calculate}; root.ParticleDynamicsScene=api;
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
