'use strict';
function maxAbsError(a,b,key=x=>x){if(a.length!==b.length)throw new RangeError('trajectory lengths differ');return Math.max(...a.map((x,i)=>Math.abs(key(x)-key(b[i]))));}
function sampleAt(ref,t){if(t<=ref[0].t)return ref[0];for(let i=1;i<ref.length;i++){if(ref[i].t>=t){const a=ref[i-1],b=ref[i],q=(t-a.t)/(b.t-a.t);return {...a,v:a.v+(b.v-a.v)*q}}}return ref.at(-1)}
function errorAgainstReference(values,ref,key=x=>x){return Math.max(...values.map(x=>Math.abs(key(x)-key(sampleAt(ref,x.t)))))}
function convergenceOrder(coarse,fine,ref,dtCoarse,dtFine){const ec=errorAgainstReference(coarse,ref),ef=errorAgainstReference(fine,ref);return {coarseError:ec,fineError:ef,order:Math.log(ec/ef)/Math.log(dtCoarse/dtFine)}}
module.exports={maxAbsError,errorAgainstReference,convergenceOrder};
