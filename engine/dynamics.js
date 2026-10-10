'use strict';
const {vec,cross}=require('./vectors');
/** Fixed-hinge slender rod in a plane. Angles are radians, CCW from +x. */
function rodRelease({length=2,mass=20/9.81,phi=0,omega=0,gravity=9.81,force=vec(0,0),forceAt=length,hinge=vec(0,0)}={}){
  const r=(length/2)*vec(Math.cos(phi),Math.sin(phi));
  const rf=forceAt*vec(Math.cos(phi),Math.sin(phi));
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
module.exports={rodRelease,inclineRelease,rodEnergy};
