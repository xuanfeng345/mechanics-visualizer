(async()=>{
 const checks=[]; const check=(name,ok)=>{checks.push({name,ok});if(!ok)throw new Error(JSON.stringify(checks));};
 const $=s=>document.querySelector(s);
 const input=(id,value)=>{const el=$('#'+id);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));};
 const support=value=>{const el=$('#supportToggle');el.checked=value;el.dispatchEvent(new Event('change',{bubbles:true}));};
 const cards=()=>['object','condition','balance','moment','check'].forEach(id=>$('[data-card="'+id+'"]').click());
 const answer=value=>{$('#answer').value=value;$('#submit').click();if($('#nextLesson')){check('correct answer remains visible',$('#answerMsg').textContent.includes('✓'));$('#nextLesson').click();}};
 // Fresh isolated sample state only; no user profile is used by this CDP browser.
 $('#resetBtn').click();document.querySelector('#resetDialog button[value="reset"]').click();await new Promise(r=>setTimeout(r,50));
 check('initial state unbalanced',$('#equilibrium').textContent.includes('未'));
 check('teaching tools initially locked',$('#supportToggle').disabled&&$('#thetaRange').disabled);
 cards();$('#opDone').click();check('cannot skip unsolved apparatus',!$('#answer'));
 input('xRange',1);input('fRange',20);input('thetaRange',90);$('#opDone').click();check('first operation opens question',!!$('#answer'));
 answer('13junk');check('invalid numeric suffix rejected',$('#progressText').textContent.startsWith('0'));
 answer('13.333');check('first lesson completed',$('#progressText').textContent.startsWith('1'));
 support(false);input('xRange',2);input('fRange',10);input('thetaRange',90);check('zero moment not full equilibrium',$('#equilibrium').textContent.includes('未'));
 cards();$('#opDone').click();check('second operation opens question',!!$('#answer'));answer('能');check('wrong concept rejected',$('#progressText').textContent.startsWith('1'));answer('不能');
 check('second lesson completed',$('#progressText').textContent.startsWith('2'));
 support(true);input('xRange',1);input('fRange',40);input('thetaRange',30);check('hinge supports horizontal resultant',!$('#equilibrium').textContent.includes('未'));
 cards();$('#opDone').click();check('third operation opens question',!!$('#answer'));answer('60');check('all lessons complete',$('#progressText').textContent.startsWith('3')&&!$('#submit'));
 $('[data-mode="free"]').click();check('free mode usable',$('#challengeBody').textContent.includes('自由'));
 check('no horizontal overflow',document.documentElement.scrollWidth<=innerWidth);
 return JSON.stringify({passed:checks.length,checks});
})()
