/* KinematicsScene — dependency-free SVG kinematics visualizer. */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function finite(v, fallback, name) { if (v === undefined) return fallback; if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError((name || 'value') + ' must be finite'); return v; }
  function paramsOf(p) {
    p = p || {};
    var mode = p.mode === undefined ? 'projectile' : p.mode;
    if (!['projectile','circular','relative'].includes(mode)) throw new RangeError('mode must be projectile, circular or relative');
    var q = { mode: mode, vx: finite(p.vx, 12, 'vx'), vy: finite(p.vy, 18, 'vy'), g: finite(p.g, 9.81, 'g'), t: finite(p.t, 1.5, 't'), radius: finite(p.radius, 45, 'radius'), omega: finite(p.omega, 0.8, 'omega') };
    if (q.g < 0 || q.t < 0 || q.radius <= 0) throw new RangeError('g and t must be nonnegative; radius must be positive');
    return q;
  }
  function projectile(q, time) { return { x: q.vx * time, y: q.vy * time - .5 * q.g * time * time }; }
  function circular(q, time) { var a = q.omega * time; return { x: q.radius * Math.cos(a), y: q.radius * Math.sin(a) }; }
  function calculate(input) {
    var q = paramsOf(input), t = q.t, pos, vel, acc, base, frame;
    if (q.mode === 'circular') {
      var a = q.omega * t; pos = circular(q, t);
      vel = { x: -q.radius * q.omega * Math.sin(a), y: q.radius * q.omega * Math.cos(a) };
      acc = { x: -q.radius * q.omega * q.omega * Math.cos(a), y: -q.radius * q.omega * q.omega * Math.sin(a) };
    } else if (q.mode === 'relative') {
      base = projectile(q, t); frame = circular(q, t);
      pos = { x: base.x - frame.x, y: base.y - frame.y };
      vel = { x: q.vx - (-q.radius*q.omega*Math.sin(q.omega*t)), y: q.vy-q.g*t - q.radius*q.omega*Math.cos(q.omega*t) };
      acc = { x: q.radius*q.omega*q.omega*Math.cos(q.omega*t), y: -q.g + q.radius*q.omega*q.omega*Math.sin(q.omega*t) };
    } else {
      pos = projectile(q, t); vel = { x: q.vx, y: q.vy - q.g*t }; acc = { x: 0, y: -q.g };
    }
    var trajectory = [], steps = 36, i, u;
    for (i=0;i<=steps;i++) { u=t*i/steps; if(q.mode==='circular') trajectory.push(circular(q,u)); else if(q.mode==='relative') { base=projectile(q,u); frame=circular(q,u); trajectory.push({x:base.x-frame.x,y:base.y-frame.y}); } else trajectory.push(projectile(q,u)); }
    function finitePoint(v) { return Number.isFinite(v.x)&&Number.isFinite(v.y); }
    if (!finitePoint(pos)) pos={x:0,y:0}; if (!finitePoint(vel)) vel={x:0,y:0}; if (!finitePoint(acc)) acc={x:0,y:0};
    return { mode:q.mode, t:t, position:pos, velocity:vel, acceleration:acc,
      speed:Math.hypot(vel.x,vel.y), accelerationMagnitude:Math.hypot(acc.x,acc.y), trajectory:trajectory };
  }
  function esc(s) { return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function fmt(n) { n=finite(n,0); return Math.abs(n)>=1000|| (Math.abs(n)>0&&Math.abs(n)<.01) ? n.toExponential(2) : n.toFixed(2); }
  function render(host, input) {
    if (typeof host === 'string' && root.document) host=root.document.querySelector(host);
    if (!host) return null;
    var q=paramsOf(input), r=calculate(q), pts=r.trajectory.concat([r.position]);
    var minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    pts.forEach(function(p){if(Number.isFinite(p.x)){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}});
    if(!Number.isFinite(minX)) minX=-1,maxX=1,minY=-1,maxY=1;
    var pad=.18*Math.max(1,maxX-minX,maxY-minY), x0=38,y0=48,w=478,h=220;
    minX-=pad;maxX+=pad;minY-=pad;maxY+=pad;
    function X(x){return x0+(x-minX)/(maxX-minX)*w;} function Y(y){return y0+h-(y-minY)/(maxY-minY)*h;}
    var path=pts.map(function(p,i){return (i?'L':'M')+X(p.x).toFixed(1)+' '+Y(p.y).toFixed(1);}).join(' '), px=X(r.position.x),py=Y(r.position.y);
    var title=q.mode==='projectile'?'抛体运动 / PROJECTILE':q.mode==='circular'?'匀速圆周运动 / CIRCULAR':'相对运动 / RELATIVE';
    var svg='<svg xmlns="'+NS+'" viewBox="0 0 760 330" role="img" aria-label="'+esc(title)+'" style="display:block;width:100%;height:auto;font-family:Arial,sans-serif">'+
      '<defs><marker id="ks-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L8 5L1 9" fill="none" stroke="currentColor" stroke-width="1.3"/></marker></defs><style>text{fill:#263238} .muted{fill:#65747b}.axis{stroke:#a9b6b9;stroke-width:1}.traj{fill:none;stroke:#247b78;stroke-width:2}.vec{fill:none;stroke-width:1.7;marker-end:url(#ks-arr)}</style>'+
      '<rect x=".5" y=".5" width="759" height="329" rx="16" fill="#f7faf9" stroke="#dce6e3"/><text x="26" y="30" font-size="18" font-weight="700">'+esc(title)+'</text><text x="734" y="30" text-anchor="end" font-size="12" class="muted">t = '+fmt(r.t)+' s</text>'+ 
      '<line x1="'+x0+'" y1="'+Y(0)+'" x2="'+(x0+w)+'" y2="'+Y(0)+'" class="axis"/><line x1="'+X(0)+'" y1="'+y0+'" x2="'+X(0)+'" y2="'+(y0+h)+'" class="axis"/><path d="'+path+'" class="traj"/><circle cx="'+px+'" cy="'+py+'" r="6" fill="#d97735" stroke="#fff" stroke-width="2"/>'+
      '<line x1="'+px+'" y1="'+py+'" x2="'+(px+r.velocity.x*3)+'" y2="'+(py-r.velocity.y*3)+'" class="vec" stroke="#2463a6"/><line x1="'+px+'" y1="'+py+'" x2="'+(px+r.acceleration.x*3)+'" y2="'+(py-r.acceleration.y*3)+'" class="vec" stroke="#b44b48"/>'+
      '<text x="545" y="78" font-size="13" font-weight="700">读数 / READOUT</text><text x="545" y="105" font-size="12">位置 r = ('+fmt(r.position.x)+', '+fmt(r.position.y)+')</text><text x="545" y="130" font-size="12" fill="#2463a6">速度 v = ('+fmt(r.velocity.x)+', '+fmt(r.velocity.y)+') · |v| '+fmt(r.speed)+'</text><text x="545" y="155" font-size="12" fill="#b44b48">加速度 a = ('+fmt(r.acceleration.x)+', '+fmt(r.acceleration.y)+')</text><text x="545" y="180" font-size="12">|a| = '+fmt(r.accelerationMagnitude)+'</text><text x="545" y="215" font-size="11" class="muted">蓝：速度矢量　红：加速度矢量</text><text x="545" y="238" font-size="11" class="muted">轨迹按参数时间采样</text></svg>';
    host.innerHTML=svg; return r;
  }
  var api={render:render,calculate:calculate}; root.KinematicsScene=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:this));
