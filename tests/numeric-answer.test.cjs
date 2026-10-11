'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');const src=fs.readFileSync(path.join(__dirname,'../js/playground.js'),'utf8');const start=src.indexOf('  function numeric('),end=src.indexOf('  const norm=',start);const c={};vm.createContext(c);vm.runInContext(src.slice(start,end),c);
for(const [text,want] of [['2e11',2e11],['-3.2E-4',-.00032],['40/3',40/3],[' 1e3 / 2e2 ',5],['.5',.5],['0',0],['+2.',2]])assert.equal(c.numeric(text),want);
for(const text of ['',null,4,'1/0','0/0','1/1e999','1e999','Infinity','NaN','1/2/3','2+3','Math.sqrt(4)','0x10','1e','2 N'])assert.ok(Number.isNaN(c.numeric(text)),String(text));
console.log('PASS: scientific notation and fractions accepted; nonfinite operands, zero denominator and expressions rejected');
