'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../playground.js'),'utf8');
const start=source.indexOf('  const courseMapFor='),end=source.indexOf("  $('#staticsCourseBtn').onclick",start);
const elements=new Map(),order=[];
function element(id){if(!elements.has(id))elements.set(id,{id,hidden:false,attrs:{},classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v},before(e){elements.set(e.id,e)},append(e){const i=order.indexOf(e.id);if(i>=0)order.splice(i,1);order.push(e.id)}});return elements.get(id);}
element('.course-switch');
const context={state:{curriculum:'fatigue'},$:s=>s==='#courseMapGuide'?(elements.get('courseMapGuide')||null):element(s.startsWith('#')?s.slice(1):s),document:{createElement:()=>({setAttribute(){}})}};
vm.createContext(context);vm.runInContext(source.slice(start,end),context);
assert.equal(element('staticsCourseBtn').hidden,true);assert.equal(element('fatigueCourseBtn').hidden,false);
assert.equal(element('materialsMapBtn').attrs['aria-selected'],'true');
assert.ok(elements.get('courseMapGuide').textContent.includes('先修'));
assert.ok(order.indexOf('beamMaterialCourseBtn')<order.indexOf('stressTransformCourseBtn'));
element('theoryMapBtn').onclick();assert.equal(element('staticsCourseBtn').hidden,false);assert.equal(element('fatigueCourseBtn').hidden,true);
assert.equal(context.state.curriculum,'fatigue','browsing another map must not erase or change saved course');
console.log('PASS: restored material map, accessible selection, route order, non-destructive map browsing');
