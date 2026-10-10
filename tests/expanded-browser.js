(async()=>{
 const $=s=>document.querySelector(s),checks=[];
 const check=(n,v)=>{checks.push({name:n,ok:!!v});if(!v)throw Error(JSON.stringify(checks));};
 const set=(id,v)=>{const e=$('#'+id);e.value=v;e.dispatchEvent(new Event('input'));};
 $('#resetBtn').click();$('#resetDialog button[value="reset"]').click();await new Promise(r=>setTimeout(r,40));
 const levels=STATICS_CURRICULUM.levels;
 for(let i=0;i<levels.length;i++){
  const l=levels[i];$('#unitSelect').value=l.unit;$('#unitSelect').dispatchEvent(new Event('change'));$('[data-level="'+i+'"]').click();
  check(l.id+' correct scene',l.scene==='lever'?!$('#scene').hidden:!$('#alternateScene').hidden);
  if(l.operation){
   const k=l.operation.kind;
   if(k==='balance'){set('xRange',1);set('fRange',20);set('thetaRange',90);}
   if(k==='frictionStatic'){const e=$('[data-alt-param="alpha"]');e.value=10;e.dispatchEvent(new Event('input'));}
  }
  $('#opDone').click();check(l.id+' question accessible',!!$('#answer'));
  $('#answer').value=typeof l.answer==='number'?'99999':'__wrong__';$('#submit').click();check(l.id+' rejects wrong',$('#answerMsg').textContent.includes('✗'));
  $('#answer').value=String(l.answer);$('#submit').click();check(l.id+' accepts baseline',$('#answerMsg').textContent.includes('✓'));
  $('#nextLesson').click();
 }
 check('all20independent',$('#progressText').textContent.includes('20/20')&&$('#progressText').textContent.includes('独立 20'));
 $('#unitSelect').value=0;$('#unitSelect').dispatchEvent(new Event('change'));$('[data-level="0"]').click();
 for(let i=0;i<4;i++)$('#hintButton').click();check('four hints available during operation',$('#hintContent').querySelectorAll('p').length===4&&!!$('#assistedContinue'));
 $('#assistedContinue').click();check('assisted does not erase independent',JSON.parse(localStorage.getItem('mechanics-playground-v3')).completed[levels[0].id].independent);
 $('[data-mode="free"]').click();for(const s of ['support','beam','friction','lever']){$('#scenePicker').value=s;$('#scenePicker').dispatchEvent(new Event('change'));check('free scene '+s,s==='lever'?!$('#scene').hidden:!!$('#alternateScene svg'));}
 check('no overflow',document.documentElement.scrollWidth<=innerWidth);
 return JSON.stringify({passed:checks.length,checks});
})()
