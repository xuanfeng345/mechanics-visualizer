(() => {
  const $=s=>document.querySelector(s);let timer=null,frame=0,state=null;
  const engine=window.MechanicsEngine;
  if(!engine)return;
  function lever(){const p=engine.dynamics.rodRelease({length:2,mass:20/9.81,phi:0,force:engine.vectors.vec(0,0)});return {type:'rod',model:p};}
  function incline(){const p=engine.dynamics.inclineRelease({mass:10,alpha:30,muK:.3});return {type:'incline',model:p};}
  function render(s){if(!s)return;$('#statusTag').textContent=s.type==='rod'?`释放观察 · ω=${s.omega.toFixed(2)} rad/s`:`释放观察 · v=${s.velocity.toFixed(2)} m/s`;$('[data-motion-readout]')?.remove();const e=document.createElement('span');e.dataset.motionReadout='';e.className='motion-readout';e.textContent=s.type==='rod'?` t=${s.time.toFixed(2)} s · α=${s.acceleration.toFixed(2)} rad/s²`:` t=${s.time.toFixed(2)} s · a=${s.acceleration.toFixed(2)} m/s²`;$('.controls .panel-head').append(e);}
  function stop(){if(timer){cancelAnimationFrame(timer);timer=null;}$('#pauseBtn').disabled=true;$('#resetMotionBtn').disabled=!state;}
  function tick(){if(!state)return;const dt=.016;if(state.type==='rod'){const s=engine.release.rodStep(state,{angularAcceleration:state.acceleration},dt);state={...state,...s,acceleration:state.acceleration};}else{const s=engine.release.inclineStep(state,state.model,dt);state={...state,...s,acceleration:state.acceleration};}render(state);timer=requestAnimationFrame(tick);}
  function reset(){if(!state)return;const type=state.type;state=type==='rod'?{type,time:0,phi:0,omega:0,acceleration:state.acceleration}:{type,time:0,position:0,velocity:0,acceleration:state.acceleration,model:state.model};render(state);}
  $('#releaseBtn').onclick=()=>{stop();const raw=$('#scenePicker').value;state=raw==='friction'?(()=>{const x=incline();return {type:'incline',time:0,position:0,velocity:0,acceleration:x.model.acceleration,model:x.model}}) :(()=>{const x=lever();return {type:'rod',time:0,phi:0,omega:0,acceleration:x.model.angularAcceleration,model:x.model}})();$('#pauseBtn').disabled=false;render(state);timer=requestAnimationFrame(tick);};
  $('#pauseBtn').onclick=()=>{if(timer){cancelAnimationFrame(timer);timer=null;$('#pauseBtn').textContent='继续';}else{$('#pauseBtn').textContent='暂停';timer=requestAnimationFrame(tick);}};
  $('#resetMotionBtn').onclick=()=>{reset();$('#pauseBtn').textContent='暂停';};
})();
