'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../js');let count=0;
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('curriculum.js'))){const pack=require(path.join(dir,file));for(const lesson of pack.levels||[]){for(const value of [lesson.formulaLatex,...lesson.hints,lesson.solution].filter(v=>typeof v==='string'))assert.ok(!/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffd]/.test(value),`${file}:${lesson.id} contains corrupt text`);count++;}}
const dynamics=require('../js/particle-dynamics-curriculum').levels,rigid=require('../js/rigid-body-curriculum').levels;
assert.equal(dynamics[3].formulaLatex,String.raw`T=\frac12mv^2`);
assert.equal(dynamics[6].formulaLatex,String.raw`\Delta p=m\Delta v`);
assert.equal(rigid[3].formulaLatex,String.raw`\alpha=M/I`);
assert.equal(rigid[4].formulaLatex,String.raw`T=\frac12I\omega^2`);
assert.equal(rigid[7].formulaLatex,String.raw`\omega=Mt/I`);
console.log(`PASS: ${count} lessons checked for corrupt characters; TeX commands survive JavaScript loading`);
