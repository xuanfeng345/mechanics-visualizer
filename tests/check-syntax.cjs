'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');let checked=0;
for(const dir of ['js','engine'])for(const file of fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.js'))){const result=spawnSync(process.execPath,['--check',path.join(root,dir,file)],{encoding:'utf8'});if(result.status!==0){process.stderr.write(result.stderr||'Syntax check failed: '+file);process.exit(1);}checked++;}
console.log('PASS: syntax checked all '+checked+' application and engine modules');
