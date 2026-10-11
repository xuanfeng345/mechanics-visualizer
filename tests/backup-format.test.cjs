'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../playground.html'),'utf8');const js=fs.readFileSync(require('node:path').join(__dirname,'../playground.js'),'utf8');
for(const id of ['backupExportBtn','backupImportBtn','backupFileInput'])assert.ok(html.includes(`id="${id}"`));
for(const token of ['mechanics-playground-backup','backupPayload','exportBackup','importBackupText','migrateLegacyState','mergeSaved(candidate)','备份校验失败'])assert.ok(js.includes(token),`missing ${token}`);assert.ok(js.includes('[3,4].includes(candidate.schema)'));
assert.ok(html.includes('accept="application/json,.json"'));
console.log('PASS: JSON backup export/import controls and validated restore path present');
