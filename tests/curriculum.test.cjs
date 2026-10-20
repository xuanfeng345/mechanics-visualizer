const assert=require('node:assert/strict');
const fs=require('node:fs');
const c=require('../js/curriculum.js');
assert.equal(c.units.length,5);assert.equal(c.levels.length,20);
assert.equal(new Set(c.levels.map(l=>l.id)).size,20);
const html=fs.readFileSync(require('node:path').join(__dirname,'../knowledge.html'),'utf8');
for(const l of c.levels){assert.equal(l.hints.length,4,l.id);assert.ok(l.hints.every(h=>typeof h==='string'&&h.length>5));assert.ok(l.solution);assert.ok(['lever','support','beam','friction'].includes(l.scene));assert.ok(html.includes(`data-concept-id="${l.concept}"`),`Missing concept ${l.concept} in ${l.id}`);if(typeof l.answer==='number')assert.ok(Number.isFinite(l.answer));}
const expected=[40/3,40,1,'是',2,'1、2、3',-20*Math.sqrt(3),'铰',0,'15、5',10,'能',50,'不能',Math.atan(.4)*180/Math.PI,'向上',-20,'不能',60,'能'];
c.levels.forEach((l,i)=>{if(typeof expected[i]==='number')assert.ok(Math.abs(l.answer-expected[i])<1e-8,l.id);else assert.equal(l.answer,expected[i],l.id);});
console.log('PASS: 20 answer baselines, 80 hints, five units, all concept links');
