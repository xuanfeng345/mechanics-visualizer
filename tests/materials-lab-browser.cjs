'use strict';
// Shared workbench: actual course routing, playback, layout and classic fallback.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
  const pages=await(await fetch('http://127.0.0.1:19422/json')).json(),ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let seq=0;const pending=new Map(),errors=[];
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.executionContextsCleared')errors.length=0;if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(m.error):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>reject(new Error('CDP timeout '+method)),15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function screenshot(name){await sleep(150);const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(__dirname,'../artifacts',name),Buffer.from(r.data,'base64'));}
  try{
    await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:pathToFileURL(path.join(__dirname,'../playground.html')).href});
    for(let i=0;i<60;i++){if(await evaluate('!!window.PrecisionWorkbench && !!window.MathJax?.startup?.document'))break;await sleep(100);}
    await evaluate(`(()=>{const $=s=>document.querySelector(s);$('[data-mode=free]').click();$('#scenePicker').value='materials-lab';$('#scenePicker').dispatchEvent(new Event('change'));$('[data-pane=notes]').click();})()`);await sleep(100);
    for(const mode of ['section','shear','axialBending','bendingTorsion','thermal','compatibility']){
      await evaluate(`(()=>{const e=document.querySelector('#materialsLabMode');e.value='${mode}';e.dispatchEvent(new Event('change'));})()`);await sleep(70);
      for(const shape of (['section','shear'].includes(mode)?['rectangle','circle','tube','i']:[null])){
        if(shape)await evaluate(`(()=>{const e=document.querySelector('#materialsLabShape');e.value='${shape}';e.dispatchEvent(new Event('change'));})()`);
        for(let step=0;step<4;step++){await evaluate(`document.querySelector('[data-formula-step="${step}"]').click()`);await sleep(20);assert.equal(await evaluate('!!document.querySelector("#equationDisplay [data-mml-node=merror],.formula-live [data-mml-node=merror]")'),false);}
      }
      if(['section','thermal','compatibility','axialBending','bendingTorsion'].includes(mode))await screenshot('materials-'+mode+'.png');
    }
    await evaluate(`(()=>{const $=s=>document.querySelector(s);$('#materialsLabMode').value='shear';$('#materialsLabMode').dispatchEvent(new Event('change'));$('#materialsLabShape').value='tube';$('#materialsLabShape').dispatchEvent(new Event('change'));const before=MechanicsApp.getState().materialsLab.innerRadius;const input=$('[data-lab-number="innerRadius"]');input.value=.1;input.dispatchEvent(new Event('change'));if(MechanicsApp.getState().materialsLab.innerRadius!==before||!$('.materials-lab-error').textContent)throw Error('invalid geometry accepted');})()`);
    const probe=await evaluate(`(()=>{const r=document.querySelector('[data-lab-probe]').getBoundingClientRect();return {x:r.x+r.width*.6,y:r.y+r.height*.25};})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:probe.x,y:probe.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:probe.x,y:probe.y,button:'left',clickCount:1});
    assert.ok(Math.abs(await evaluate('MechanicsApp.getState().materialsLab.eta')-.5)<.01);
    await evaluate(`(()=>{const e=document.querySelector('[data-lab-number="shear"]');e.value=5000;e.dispatchEvent(new Event('change'));})()`);assert.ok(Math.abs(await evaluate('MechanicsApp.getState().materialsLab.eta')-.5)<.01,'probe position preserved after parameter edit');
    const added=await evaluate(`(()=>{const $=s=>document.querySelector(s);let count=0;for(const course of ['beam-material','axial','stress-transform'])for(const l of MechanicsApp.courses[course][0].levels.filter(l=>l.id.includes('-extra-'))){MechanicsApp.navigate(course,l.id);$('#opDone').click();if(!$('#answer'))throw Error('answer missing '+l.id);$('#answer').value=String(l.answer);$('#submit').click();const key=MechanicsApp.courses[course][1];if(!MechanicsApp.getState()[key][l.id]?.independent)throw Error('new lesson failed grading '+l.id+' '+$('#answerMsg')?.textContent);count++;}return count;})()`);assert.equal(added,20);
    await evaluate(`(()=>{const $=s=>document.querySelector(s);MechanicsApp.navigate('axial','axial-extra-thermal-fixed');$('#opDone').click();$('#answer').value='-96';$('#submit').click();$('#startTransfer').click();if(!$('#reviewInput')||!$('#learningHub').textContent.includes('升温'))throw Error('wrong transfer subject');})()`);
    // Import through the actual file-input path, including rejection and old-save migration.
    await evaluate(`(async()=>{const $=s=>document.querySelector(s),wait=()=>new Promise(r=>setTimeout(r,100)),s=JSON.parse(JSON.stringify(MechanicsApp.getState()));
      async function load(state){const dt=new DataTransfer();dt.items.add(new File([JSON.stringify({format:'mechanics-playground-backup',version:1,state})],'backup.json',{type:'application/json'}));$('#backupFileInput').files=dt.files;$('#backupFileInput').dispatchEvent(new Event('change'));await wait();}
      const bad={...s,materialsLab:{...s.materialsLab,shape:'tube',innerRadius:1,radius:.05}};await load(bad);if(!$('#interactionNotice').textContent.includes('失败'))throw Error('invalid backup accepted');await load(s);if(!MechanicsApp.getState().axialCompleted['axial-extra-thermal-fixed'])throw Error('new progress did not restore');delete s.materialsLab;await load(s);if(MechanicsApp.getState().materialsLab.mode!=='section')throw Error('old save missing defaults');})()`);
    await evaluate(`(async()=>{const s=JSON.parse(JSON.stringify(MechanicsApp.getState()));delete s.materialsLab;delete s.materialsRevision;s.curriculum='axial';s.level=8;s.unit=1;s.mode='teach';s.scene='axial-bar';s.phase='op';s.axialCompleted=Object.fromEntries(Object.entries(s.axialCompleted).filter(([id])=>!id.includes('-extra-')));s.learning.events=s.learning.events.filter(e=>!e.id.includes('-extra-'));const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(s)],'old-end.json'));const input=document.querySelector('#backupFileInput');input.files=dt.files;input.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,100));if(MechanicsApp.getState().level!==7||MechanicsApp.getState().unit!==1)throw Error('old end bookmark interpreted as new lesson');})()`);
    for(const [width,height]of [[1280,640],[390,844]]){
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
      await evaluate(`(()=>{const $=s=>document.querySelector(s);MechanicsApp.navigate('beam-material','beam-material-extra-shear-web');$('[data-pane=notes]').click();})()`);await sleep(130);
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
      if(width>1100)assert.equal(await evaluate('document.documentElement.scrollHeight<=innerHeight+1 && document.querySelector(".controls").getBoundingClientRect().bottom<=innerHeight'),true);
      await screenshot('materials-layout-'+width+'.png');
    }
    assert.deepEqual(errors,[]);console.log('PASS: six modes, four shapes, 48 formula states, real probe interaction, 20 lesson grades, matching transfer, backup validation and desktop/mobile layout');
  }finally{ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
