'use strict';
const {vec,add,scale}=require('./vectors');
function semiImplicitEuler(state,derivative,dt){if(!Number.isFinite(dt)||dt<=0)throw new RangeError('dt must be positive');const a=derivative(state);const v=add(state.velocity,scale(a,dt));const p=add(state.position,scale(v,dt));return Object.freeze({position:p,velocity:v,acceleration:a,time:state.time+dt})}
function simulate(initial,derivative,{dt=.001,steps=1000,observe=()=>{}}={}){let s=Object.freeze({...initial});const out=[s];for(let i=0;i<steps;i++){s=semiImplicitEuler(s,derivative,dt);out.push(s);observe(s,i+1)}return out}
module.exports={semiImplicitEuler,simulate};
