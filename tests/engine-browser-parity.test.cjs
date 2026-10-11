'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),node=require('../engine/dynamics');
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../engine-browser.js'),'utf8'),sandbox);const b=sandbox.window.MechanicsEngine;
const near=(a,c)=>assert.ok(Math.abs(a-c)<1e-12*Math.max(1,Math.abs(c)),`${a} != ${c}`);
for(const p of [{length:2,mass:20/9.81,gravity:9.81,phi:0,force:{x:0,y:0},forceAt:2},{length:3,mass:4,gravity:9.8,phi:.3,force:{x:5,y:-2},forceAt:1.2}]){const a=b.dynamics.rodRelease(p),c=node.rodRelease(p);for(const k of ['torque','inertia','angularAcceleration'])near(a[k],c[k]);}
for(const p of [{mass:10,alpha:30,muK:.3,gravity:9.81},{mass:2,alpha:10,muK:0,gravity:9.8}]){const a=b.dynamics.inclineRelease(p),c=node.inclineRelease(p);for(const k of ['normal','driving','kineticFriction','acceleration'])near(a[k],c[k]);}
console.log('PASS: browser release dynamics parity with Node analytic kernel');
