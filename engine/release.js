'use strict';
const {vec,add,scale}=require('./vectors');
function rodStep(s,model,dt){const a=model.angularAcceleration;const omega=s.omega+a*dt;return Object.freeze({time:s.time+dt,phi:s.phi+omega*dt,omega,angularAcceleration:a});}
function rodSim({model,phi=0,omega=0,time=0,dt=.001,steps=1000}={}){if(!model||!Number.isFinite(dt)||dt<=0)throw new RangeError('invalid release');let s={time,phi,omega};const out=[s];for(let i=0;i<steps;i++){s=rodStep(s,model,dt);out.push(s)}return out}
function inclineStep(s,model,dt){const velocity=s.velocity+model.acceleration*dt;return Object.freeze({time:s.time+dt,position:s.position+velocity*dt,velocity,acceleration:model.acceleration});}
function inclineSim({model,velocity=0,position=0,time=0,dt=.001,steps=1000}={}){if(!model||!Number.isFinite(dt)||dt<=0)throw new RangeError('invalid release');let s={time,position,velocity};const out=[s];for(let i=0;i<steps;i++){s=inclineStep(s,model,dt);out.push(s)}return out}
module.exports={rodStep,rodSim,inclineStep,inclineSim};
