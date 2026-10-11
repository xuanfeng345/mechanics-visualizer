// Native CDP harness: no npm dependency; requires Edge --remote-debugging-port=19391.
const fs = require('node:fs');
(async () => {
 const pages = await (await fetch('http://127.0.0.1:19391/json')).json();
 const ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
 await new Promise(r => ws.addEventListener('open',r,{once:true}));
 let seq=0; const pending=new Map(), errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data); if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 await send('Runtime.enable'); await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:Number(process.env.VIEWPORT_WIDTH || 1440),height:Number(process.env.VIEWPORT_HEIGHT || 1000),deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:process.env.TEST_URL || 'file:///A:/dsh工作区/力学/index.html'});
 await new Promise(r=>setTimeout(r,3500));
 const expression=(process.argv[2]?.endsWith('.js') ? fs.readFileSync(process.argv[2],'utf8') : process.argv[2]) || `JSON.stringify({title:document.title,scenes:document.querySelectorAll('.scene-2d').length,active:document.querySelector('.scene-2d-active')?.dataset.sceneId,overflow:document.documentElement.scrollWidth>innerWidth})`;
 const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 console.log(JSON.stringify({result,errors},null,2));
 if(result.exceptionDetails || errors.length) process.exitCode=1;
 if(process.argv[3]) {const image=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(process.argv[3],Buffer.from(image.data,'base64'));}
 ws.close();
})().catch(e=>{console.error(e);process.exitCode=1});
