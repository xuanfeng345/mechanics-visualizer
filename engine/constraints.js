'use strict';
const {vec,dot,norm,sub}=require('./vectors');
function distanceConstraint(a,b,length){const delta=sub(b,a),distance=norm(delta),residual=distance-length;return Object.freeze({type:'distance',distance,target:length,residual,unitDirection:distance?vec(delta.x/distance,delta.y/distance):null,valid:Math.abs(residual)<1e-9});}
function groundContact(position,normal=vec(0,1),height=0){const gap=dot(position,normal)-height;return Object.freeze({type:'unilateral_contact',gap,normal,active:gap<=1e-9,valid:gap>=-1e-9});}
function hinge(position,target){const residual=sub(position,target);return Object.freeze({type:'hinge',residual,norm:norm(residual),valid:norm(residual)<1e-9});}
function constraintReport(constraints){const invalid=constraints.filter(c=>!c.valid);return Object.freeze({constraints,valid:invalid.length===0,maxResidual:Math.max(0,...constraints.map(c=>c.type==='distance'||c.type==='hinge'?Math.abs(c.residual??c.norm):Math.abs(c.gap)))})}
module.exports={distanceConstraint,groundContact,hinge,constraintReport};
