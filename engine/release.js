'use strict';
const {vec,add,scale}=require('./vectors');
function rodStep(s,model,dt){const a=model.angularAcceleration;const omega=s.omega+a*dt;return Object.freeze({time:s.time+dt,phi:s.phi+omega*dt,omega,angularAcceleration:a});}
function rodSim({model,phi=0,omega=0,time=0,dt=.001,steps=1000}={}){if(!model||!Number.isFinite(dt)||dt<=0)throw new RangeError('invalid release');let s={time,phi,omega};const out=[s];for(let i=0;i<steps;i++){s=rodStep(s,model.parameters?require('./dynamics').rodRelease({...model.parameters,phi:s.phi,omega:s.omega}):model,dt);out.push(s)}return out}
function inclineStep(s,model,dt){return Object.freeze(require('./motion').step(s,model,dt));}
function inclineSim({model,velocity=0,position=0,time=0,dt=.001,steps=1000}={}){if(!model||!Number.isFinite(dt)||dt<=0)throw new RangeError('invalid release');let s={time,position,velocity};const out=[s];for(let i=0;i<steps;i++){s=inclineStep(s,model,dt);out.push(s)}return out}
module.exports={rodStep,rodSim,inclineStep,inclineSim};
