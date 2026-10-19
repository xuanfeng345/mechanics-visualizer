'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');const root=path.resolve(__dirname,'..');
for(const file of ['index.html','playground.html']){const current=fs.readFileSync(path.join(root,file),'utf8');assert.match(current,/<meta[^>]+charset=["']utf-8["']/i,'UTF-8 declaration '+file);assert.ok(!current.includes('\uFFFD'),'No replacement characters '+file);assert.match(current,/力学/,'Chinese entry text '+file);for(const [,url]of current.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)){if(/^(https?:|#|data:)/.test(url))continue;assert.ok(fs.existsSync(path.join(root,url)),'Missing asset '+url);}}
for(const f of fs.readdirSync(__dirname).filter(f=>f.endsWith('.cjs'))){assert.ok(fs.readFileSync(path.join(__dirname,f),'utf8').trim().length>80,'Unexpected empty test '+f);}
console.log('PASS: UTF-8 HTML entries intact; local assets exist; test files are not empty');
