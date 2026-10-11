'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/engine-browser.js'),'utf8'),c);const e=c.window.MechanicsEngine;
// Independent ODE: phi'=omega, omega'=-3g cos(phi)/(2L).
function reference(n){const h=1/n;let p=0,w=0;const a=p=>-3*9.81/4*Math.cos(p);for(let i=0;i<n;i++){const p1=w,w1=a(p),p2=w+h*w1/2,w2=a(p+h*p1/2),p3=w+h*w2/2,w3=a(p+h*p2/2),p4=w+h*w3,w4=a(p+h*p3);p+=h*(p1+2*p2+2*p3+p4)/6;w+=h*(w1+2*w2+2*w3+w4)/6;}return {phi:p,omega:w};}
const ref=reference(10000),ref2=reference(5000);assert.ok(Math.hypot(ref.phi-ref2.phi,ref.omega-ref2.omega)<1e-10,'reference step refinement');
function integrate(n){const dt=1/n;let s={time:0,phi:0,omega:0},maxEnergy=0;for(let i=0;i<n;i++){s=e.release.rodStep(s,e.dynamics.rodRelease({phi:s.phi}),dt);const energy=.5*(20/9.81)*4/3*s.omega**2+20*Math.sin(s.phi);maxEnergy=Math.max(maxEnergy,Math.abs(energy));}return {n,angleError:Math.abs(s.phi-ref.phi),velocityError:Math.abs(s.omega-ref.omega),maxEnergyError:maxEnergy};}
const rows=[125,250,500,1000].map(integrate);
for(let i=1;i<rows.length;i++){for(const key of ['angleError','velocityError','maxEnergyError'])assert.ok(rows[i][key]<rows[i-1][key],`${key} decreases under refinement`);const ratio=rows[i-1].angleError/rows[i].angleError;assert.ok(ratio>1.8&&ratio<2.2,'approximately first order angle convergence');}
console.table(rows);console.log('PASS: browser rod release converges toward independently refined RK4 trajectory; energy error decreases');
