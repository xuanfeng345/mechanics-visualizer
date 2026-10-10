(async()=>{
 const checks=[],$=s=>document.querySelector(s);
 const check=(n,v)=>{checks.push({name:n,ok:!!v});if(!v)throw new Error(JSON.stringify(checks));};
 $('#resetBtn').click();check('reset dialog opens',$('#resetDialog').open);
 $('#resetDialog button[value="cancel"]').click();await new Promise(r=>setTimeout(r,30));check('reset cancel closes dialog',!$('#resetDialog').open);
 $('[data-level="0"]').click();check('completed lesson can replay',!!$('#opDone'));
 $('[data-card="moment"]').click();check('any card opens explanation',$('#cardFeedback').textContent.includes('xF'));
 $('[data-card="moment"]').click();check('used card remains responsive',$('#cardFeedback').textContent.includes('xF'));
 check('reasoning disclosure opens',$('#reasoningDetails').open);
 $('#clearCards').click();check('clear produces visible feedback',$('#cardFeedback').textContent.includes('清空'));
 $('[data-mode="free"]').click();check('free mode unlocks inputs',!$('#supportToggle').disabled&&!$('#thetaRange').disabled);
 $('#returnLearning').click();check('return to learning button works',!!$('#opDone'));
 const range=$('#xRange'),before=+range.value;
 $('#pointHandle').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));check('keyboard position adjustment',+range.value>before);
 const beforeDone=$('#progressText').textContent;$('#resetBtn').click();$('#resetDialog button[value="cancel"]').click();await new Promise(r=>setTimeout(r,30));check('cancel preserves progress',$('#progressText').textContent===beforeDone);
 $('#resetBtn').click();$('#resetDialog button[value="reset"]').click();await new Promise(r=>setTimeout(r,30));
 $('[data-level="2"]').click();check('locked lesson explains why',$('#interactionNotice').textContent.includes('前一关'));
 $('#openAll').click();check('unlock CTA changes mode',$('.mode.active').dataset.mode==='free'&&!$('#thetaRange').disabled);
 $('[data-mode="teach"]').click();
 check('no page overflow',document.documentElement.scrollWidth<=innerWidth);
 return JSON.stringify({passed:checks.length,checks});
})()
