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
    await evaluate(`(()=>{const $=s=>document.querySelector(s);$('#beamMaterialCourseBtn').click();$('[data-mode=free]').click();$('[data-pane=notes]').click();})()`);await sleep(150);
    for(const support of ['simple','cantilever'])for(const loadType of ['point','uniform']){
      await evaluate(`(()=>{const $=s=>document.querySelector(s);$('#beamSupport').value='${support}';$('#beamSupport').dispatchEvent(new Event('change'));$('#beamLoadType').value='${loadType}';$('#beamLoadType').dispatchEvent(new Event('change'));})()`);await sleep(100);
      const state=await evaluate(`(()=>{const $=s=>document.querySelector(s),p=MechanicsApp.getState().beamMaterial,r=BeamMaterialScene.calculate(p);if(p.support!=='${support}'||p.loadType!=='${loadType}')throw Error('mode');if(!$('#alternateScene [data-beam-section]'))throw Error('section selector');if(document.documentElement.scrollHeight>innerHeight+1||$('.controls').getBoundingClientRect().bottom>innerHeight)throw Error('layout');return {RA:r.RA,RB:r.RB,MA:r.reactionMoment};})()`);
      for(let step=0;step<4;step++){await evaluate(`document.querySelector('[data-formula-step="${step}"]').click()`);await sleep(30);assert.equal(await evaluate('!!document.querySelector("#equationDisplay [data-mml-node=merror]")'),false);}
      if(support==='cantilever')assert.equal(state.RB,0);
    }
    await evaluate("document.querySelector('[data-formula-step=\"1\"]').click()");await screenshot('beam-analysis-desktop.png');
    const area=await evaluate(`(()=>{const a=document.querySelector('[data-beam-section]').getBoundingClientRect();return {x:a.x,y:a.y,w:a.width,h:a.height};})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:area.x+area.w*.2,y:area.y+area.h*.5,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:area.x+area.w*.8,y:area.y+area.h*.5,button:'left',buttons:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:area.x+area.w*.8,y:area.y+area.h*.5,button:'left',clickCount:1});
    assert.ok(Math.abs(await evaluate('MechanicsApp.getState().beamMaterial.section')-3.2)<.02,'drag persists across SVG updates');
    await evaluate(`document.querySelector('[data-beam-section]').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}))`);assert.equal(await evaluate('MechanicsApp.getState().beamMaterial.section'),0);
    await evaluate(`(()=>{const e=document.querySelector('[data-alt-number=span]');e.value=1;e.dispatchEvent(new Event('change'));})()`);assert.ok(await evaluate('MechanicsApp.getState().beamMaterial.position<=1 && MechanicsApp.getState().beamMaterial.section<=1'));
    await send('Emulation.setDeviceMetricsOverride',{width:1280,height:640,deviceScaleFactor:1,mobile:false});await sleep(100);
    assert.equal(await evaluate('document.documentElement.scrollHeight<=innerHeight+1'),true);await screenshot('beam-analysis-laptop.png');
    await send('Page.navigate',{url:pathToFileURL(path.join(__dirname,'../playground.html')).href});await sleep(500);assert.equal(await evaluate('MechanicsApp.getState().beamMaterial.support'),'cantilever');assert.equal(await evaluate('MechanicsApp.getState().beamMaterial.loadType'),'uniform');
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate('MechanicsApp.refresh()');await sleep(150);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await screenshot('beam-analysis-mobile.png');
    assert.deepEqual(errors,[]);console.log('PASS: four beam combinations, actual cross-section drag, keyboard, changing span, formulas, saved modes and desktop/mobile boundaries');
  }finally{ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
