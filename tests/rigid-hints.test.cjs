'use strict';
const assert=require('node:assert/strict');
const {levels}=require('../js/rigid-body-curriculum');
assert.deepEqual(levels.map(l=>l.id),Array.from({length:8},(_,i)=>`rigid-l${i+1}`));
assert.deepEqual(levels.map(l=>l.answer),[12,17,18,5,48,3,21,6]);
for(const l of levels){
 assert.equal(l.hints.length,4);
 assert.equal(new Set(l.hints).size,4,`${l.id}: four distinct teaching steps`);
 assert.equal(l.hints[3],l.solution);
 assert.ok(l.hints[1].includes('\\(')&&l.hints[1].includes('\\)'),`${l.id}: method math explicitly delimited`);
 for(const hint of l.hints.slice(0,3))assert.ok(!hint.includes(l.solution),`${l.id}: early hints do not repeat the worked solution`);
}
console.log('PASS: eight rigid lessons preserve IDs/answers and provide four distinct hint stages');
