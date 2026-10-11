'use strict';
const assert=require('node:assert/strict'),scene=require('../js/axial-scene');
const host={ownerDocument:{createElementNS(){return {setAttribute(){},style:{},innerHTML:''}}},appendChild(){},replaceChildren(svg){this.svg=svg}};
function point(force){scene.render(host,{force});const m=host.svg.innerHTML.match(/data-role="constitutive-point" cx="([^"]+)" cy="([^"]+)"/);assert.ok(m);return m.slice(1).map(Number);}
assert.deepEqual(point(0),[209,415]);const tension=point(30000),compression=point(-30000);assert.ok(tension[0]>209&&tension[1]<415);assert.ok(compression[0]<209&&compression[1]>415);assert.deepEqual(point(100000),[342,367]);assert.ok(host.svg.innerHTML.includes('不绘制塑性曲线'));assert.ok(host.svg.innerHTML.includes('非等比例'));
console.log('PASS: axial plot preserves signed response, zero origin and explicit out-of-domain boundary');
