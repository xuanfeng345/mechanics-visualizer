'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const root=path.join(__dirname,'../js'),source=fs.readFileSync(path.join(root,'playground.js'),'utf8');
const notice={textContent:''};let stored=null,fail=true;const c={window:{},document:{querySelector:()=>notice,querySelectorAll:()=>[]},localStorage:{setItem(k,v){if(fail)throw Error('quota');stored=v}}};vm.createContext(c);for(const f of fs.readdirSync(root).filter(f=>f.endsWith('curriculum.js')))vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const prefix=source.split('  let restored=false;')[0],helpers=source.slice(source.indexOf('  function save()'),source.indexOf('  const fmt='));vm.runInContext(prefix+helpers+'function render(){}window.api={base,importBackupText,get:()=>state};})();',c);
const saved=c.window.api.base();saved.F=43;const text=JSON.stringify(saved);c.window.api.importBackupText(text);assert.equal(c.window.api.get().F,43);assert.equal(stored,null);assert.ok(notice.textContent.includes('仅在当前页面'));assert.ok(notice.textContent.includes('未能写入'));
fail=false;c.window.api.importBackupText(text);assert.equal(JSON.parse(stored).F,43);assert.ok(notice.textContent.includes('导入并保存'));
console.log('PASS: failed localStorage writes are distinguished from persisted imports without losing in-memory restoration');
