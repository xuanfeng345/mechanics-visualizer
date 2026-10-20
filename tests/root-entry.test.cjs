 'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal(html,fs.readFileSync(path.join(root,'playground.html'),'utf8'),'home must serve the current learning platform');
assert.match(html,/dataset.ui='precision'/);assert.doesNotMatch(html,/http-equiv=["']refresh|location\.(?:replace|assign)\(/i);
assert.match(html,/href="knowledge\.html\?concept=force-couple"/);
assert.match(fs.readFileSync(path.join(root,'knowledge.html'),'utf8'),/三力学 AI 可视化学习工具/);
console.log('PASS: home loads current workbench directly; legacy knowledge is an explicit separate link');
