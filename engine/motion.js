/* Shared browser/Node Coulomb friction model. Positive direction is DOWN the slope. */
(function(root){
  'use strict';
  function num(v,d,name){v=v===undefined?d:v;if(typeof v!=='number'||!Number.isFinite(v))throw new TypeError(name+' must be finite');return v;}
  function incline(o={}){
    const mass=num(o.mass,10,'mass'),gravity=num(o.gravity,9.81,'gravity'),alpha=num(o.alpha,30,'alpha'),muK=num(o.muK,.3,'muK'),muS=num(o.muS,muK,'muS'),velocity=num(o.velocity,0,'velocity'),position=num(o.position,0,'position');
    if(mass<=0||gravity<=0||alpha<0||alpha>=90||muK<0||muS<muK)throw new RangeError('invalid incline parameters; require muS >= muK >= 0');
    const normal=mass*gravity*Math.cos(alpha*Math.PI/180),driving=mass*gravity*Math.sin(alpha*Math.PI/180);
    const resting=Math.abs(velocity)<1e-10,stuck=resting&&driving<=muS*normal+1e-10;
    const friction=stuck?driving:Math.sign(velocity||driving||1)*muK*normal,acceleration=stuck?0:(driving-friction)/mass;
    if(![normal,driving,friction,acceleration].every(Number.isFinite))throw new RangeError('incline result outside finite range');
    return Object.freeze({model:'incline_block',normal,driving,kineticFriction:Math.abs(friction),friction,acceleration,velocity,position,mass,gravity,alpha,muK,muS,isStatic:stuck,state:stuck?'static':velocity<0?'sliding_up_slope':'sliding_down_slope'});
  }
  function step(s,m,dt){
    dt=num(dt,0,'dt');if(dt<0)throw new RangeError('dt must be nonnegative');
    const v=num(s.velocity,0,'velocity'),x=num(s.position,0,'position'),time=num(s.time,0,'time');
    // Accept legacy constant-acceleration models as well as full friction parameters.
    if(m.mass===undefined){const a=num(m.acceleration,0,'acceleration'),result={time:time+dt,position:x+v*dt+.5*a*dt*dt,velocity:v+a*dt,acceleration:a};if(!Object.values(result).every(Number.isFinite))throw new RangeError('step outside finite range');return result;}
    let model=incline({...m,velocity:v,position:x}),a=model.acceleration;
    const stopTime=v*a<0?-v/a:Infinity;
    let position,velocity;
    if(stopTime<=dt){position=x+v*stopTime+.5*a*stopTime*stopTime;model=incline({...m,velocity:0,position});const rest=dt-stopTime;a=model.acceleration;position+=.5*a*rest*rest;velocity=a*rest;}
    else{position=x+v*dt+.5*a*dt*dt;velocity=v+a*dt;}
    if(![position,velocity,time+dt].every(Number.isFinite))throw new RangeError('step outside finite range');
    return {time:time+dt,position,velocity,acceleration:a};
  }
  const api={incline,step};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.MechanicsMotionModel=api;
})(typeof window!=='undefined'?window:null);
