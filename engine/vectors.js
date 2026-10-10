'use strict';
function finite(n){return typeof n==='number'&&Number.isFinite(n)}
function vec(x=0,y=0){if(!finite(x)||!finite(y))throw new TypeError('Vector components must be finite');return Object.freeze({x,y})}
const add=(a,b)=>vec(a.x+b.x,a.y+b.y), sub=(a,b)=>vec(a.x-b.x,a.y-b.y), scale=(a,k)=>vec(a.x*k,a.y*k), dot=(a,b)=>a.x*b.x+a.y*b.y, cross=(a,b)=>a.x*b.y-a.y*b.x, norm=a=>Math.hypot(a.x,a.y), unit=a=>{const n=norm(a);if(n===0)throw new RangeError('Cannot normalize zero vector');return scale(a,1/n)};
module.exports={vec,add,sub,scale,dot,cross,norm,unit};
