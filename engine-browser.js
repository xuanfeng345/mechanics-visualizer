(() => {
  const v={vec:(x=0,y=0)=>({x,y}),cross:(a,b)=>a.x*b.y-a.y*b.x};
  const dynamics={rodRelease(o={}){const L=o.length??2,m=o.mass??20/9.81,g=o.gravity??9.81,phi=o.phi??0,f=o.force??v.vec(),dir=v.vec(Math.cos(phi),Math.sin(phi)),r=v.vec(dir.x*L/2,dir.y*L/2),rf=v.vec(dir.x*(o.forceAt??L),dir.y*(o.forceAt??L)),torque=v.cross(r,v.vec(0,-m*g))+v.cross(rf,f),I=m*L*L/3;return {angularAcceleration:torque/I};},inclineRelease(o={}){const m=o.mass??10,g=o.gravity??9.81,a=(o.alpha??30)*Math.PI/180,mu=o.muK??.3,N=m*g*Math.cos(a),acc=(m*g*Math.sin(a)-mu*N)/m;return {acceleration:acc};}};
  const release={rodStep:(s,m,dt)=>({time:s.time+dt,phi:s.phi+(s.omega+m.angularAcceleration*dt)*dt,omega:s.omega+m.angularAcceleration*dt}),inclineStep:(s,m,dt)=>{const velocity=s.velocity+m.acceleration*dt;return {time:s.time+dt,position:s.position+velocity*dt,velocity,acceleration:m.acceleration};}};
  window.MechanicsEngine={vectors:v,dynamics,release};
})();
