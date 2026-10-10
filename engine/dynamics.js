'use strict';
const {vec,cross,scale}=require('./vectors');
/** Fixed-hinge slender rod in a plane. Angles are radians, CCW from +x. */
function rodRelease({length=2,mass=20/9.81,phi=0,omega=0,gravity=9.81,force=vec(0,0),forceAt=length,hinge=vec(0,0)}={}){
  const direction=vec(Math.cos(phi),Math.sin(phi));
  const r=scale(direction,length/2);
  const rf=scale(direction,forceAt);
  const torqueGravity=cross(r,vec(0,-mass*gravity));
  const torqueApplied=cross(rf,force);
  const inertia=mass*length*length/3;
  const torque=torqueGravity+torqueApplied;
  return Object.freeze({model:'hinged_rod',torque,inertia,angularAcceleration:torque/inertia,phi,omega,energy:{kinetic:.5*inertia*omega*omega,potential:mass*gravity*r.y},assumptions:['slender_rigid_rod','fixed_hinge','planar','point_force']});
}
/** Sliding block after static friction has failed; kinetic friction is explicit. */
function inclineRelease({mass=10,alpha=30,muK=.3,gravity=9.81,velocity=0,position=0}={}){
  const a=alpha*Math.PI/180,normal=mass*gravity*Math.cos(a),drive=mass*gravity*Math.sin(a),friction=muK*normal,acceleration=(drive-friction)/mass;
  return Object.freeze({model:'incline_block',normal,driving:drive,kineticFriction:friction,acceleration,velocity,position,state:acceleration>0?'sliding_down_slope':acceleration<0?'sliding_up_slope':'constant_velocity',assumptions:['point_mass','straight_incline','kinetic_friction','no_air_resistance']});
}
function rodEnergy({length=2,mass=20/9.81,gravity=9.81,phi=0,omega=0}={}){const I=mass*length*length/3;return .5*I*omega*omega+mass*gravity*(length/2)*Math.sin(phi)}
function rodReleaseBenchmark({length=2,mass=20/9.81,gravity=9.81,phi0=.2,omega0=0,dt=.0005,steps=2000}={}){const I=mass*length*length/3;const energy0=rodEnergy({length,mass,gravity,phi:phi0,omega:omega0});let phi=phi0,omega=omega0;let maxErr=0;for(let i=0;i<steps;i++){const torque=-(mass*gravity*length/2)*Math.cos(phi);const alpha=torque/I;omega+=alpha*dt;phi+=omega*dt;const energy=rodEnergy({length,mass,gravity,phi,omega});maxErr=Math.max(maxErr,Math.abs(energy-energy0));}return {energyInitial:energy0,energyFinal:rodEnergy({length,mass,gravity,phi,omega}),energyError:rodEnergy({length,mass,gravity,phi,omega})-energy0,maxEnergyError:maxErr,phi,omega,dt,steps};}
function inclineReleaseBenchmark({mass=10,alpha=30,muK=.3,gravity=9.81,dt=.001,steps=1000}={}){const model=inclineRelease({mass,alpha,muK,gravity});const t=dt*steps;return {analyticAcceleration:model.acceleration,time:t,analyticVelocity:model.acceleration*t,analyticPosition:.5*model.acceleration*t*t};}
module.exports={rodRelease,inclineRelease,rodEnergy,rodReleaseBenchmark,inclineReleaseBenchmark};
