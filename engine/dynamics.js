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
  return Object.freeze({model:'hinged_rod',parameters:{length,mass,gravity,force,forceAt},torque,inertia,angularAcceleration:torque/inertia,phi,omega,energy:{kinetic:.5*inertia*omega*omega,potential:mass*gravity*r.y},assumptions:['slender_rigid_rod','fixed_hinge','planar','point_force']});
}
/** Sliding block after static friction has failed; kinetic friction is explicit. */
function inclineRelease(options={}){return require('./motion').incline(options)}
function rodEnergy({length=2,mass=20/9.81,gravity=9.81,phi=0,omega=0}={}){const I=mass*length*length/3;return .5*I*omega*omega+mass*gravity*(length/2)*Math.sin(phi)}
function rodReleaseBenchmark({length=2,mass=20/9.81,gravity=9.81,phi0=.2,omega0=0,dt=.0005,steps=2000}={}){const I=mass*length*length/3;const energy0=rodEnergy({length,mass,gravity,phi:phi0,omega:omega0});let phi=phi0,omega=omega0;let maxErr=0;for(let i=0;i<steps;i++){const torque=-(mass*gravity*length/2)*Math.cos(phi);const alpha=torque/I;omega+=alpha*dt;phi+=omega*dt;const energy=rodEnergy({length,mass,gravity,phi,omega});maxErr=Math.max(maxErr,Math.abs(energy-energy0));}return {energyInitial:energy0,energyFinal:rodEnergy({length,mass,gravity,phi,omega}),energyError:rodEnergy({length,mass,gravity,phi,omega})-energy0,maxEnergyError:maxErr,phi,omega,dt,steps};}
function inclineReleaseBenchmark({mass=10,alpha=30,muK=.3,gravity=9.81,dt=.001,steps=1000}={}){const model=inclineRelease({mass,alpha,muK,gravity});const t=dt*steps;return {analyticAcceleration:model.acceleration,time:t,analyticVelocity:model.acceleration*t,analyticPosition:.5*model.acceleration*t*t};}
module.exports={rodRelease,inclineRelease,rodEnergy,rodReleaseBenchmark,inclineReleaseBenchmark};
