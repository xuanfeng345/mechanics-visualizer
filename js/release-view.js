(() => {
  'use strict';
  const $=s=>document.querySelector(s),engine=window.MechanicsEngine;
  if(!engine)return;
  let timer=null,lastTimestamp=null,accumulator=0,state=null,initial=null,snapshot=null,history=[];
  function resetClock(){lastTimestamp=null;accumulator=0;}
  function stop(){resetClock();if(timer){cancelAnimationFrame(timer);timer=null;}$('#pauseBtn').disabled=true;$('#resetMotionBtn').disabled=!state;}
  function clear(){
    stop();state=null;initial=null;history=[];
    if(snapshot&&window.MechanicsApp){$('#alternateScene').innerHTML=snapshot.alternate;$('#reactionBox').textContent=snapshot.reaction;$('#explain').textContent=snapshot.explain;$('#statusTag').textContent=snapshot.status;$('#scene').setAttribute('viewBox',snapshot.viewBox);$('#interactionNotice').textContent=snapshot.notice;}
    $('#reaction')?.removeAttribute?.('visibility');$('#motionReaction')?.remove();snapshot=null;for(const id of ['#beam','#appliedForce','#weightForce']){$(id)?.setAttribute('transform','');$(id)?.removeAttribute?.('visibility');}
    $('[data-motion-readout]')?.remove();$('#motionChart')?.replaceChildren?.();$('#pauseBtn').textContent='暂停';$('#pauseBtn').disabled=true;$('#resetMotionBtn').disabled=true;
  }
  function staleScene(){if(!state||$('#scenePicker').value===(state.type==='incline'?'friction':'lever'))return false;clear();return true;}
  function makeState(){
    const app=window.MechanicsApp?.getState();
    if($('#scenePicker').value==='friction'){
      const alpha=app?.friction.alpha??30,muS=app?.friction.mu??.4,muK=app?Math.min(Number($('#motionMuK').value),muS):.3;
      if(app&&($('#motionMuK').value.trim()===''||!Number.isFinite(muK)||muK<0))throw new RangeError('动摩擦系数应为非负有限数值。');
      const model=engine.dynamics.inclineRelease({mass:100/9.81,alpha,muS,muK,velocity:0});
      return {type:'incline',time:0,position:0,velocity:0,alpha,model,acceleration:model.acceleration};
    }
    const keep=!!app&&$('#releaseForceMode')?.value==='keep',F=keep?app.F:0,theta=(app?.theta??90)*Math.PI/180,force=engine.vectors.vec(F*Math.cos(theta),F*Math.sin(theta)),forceAt=app?.x??1,length=2,mass=20/9.81;
    const options={length,mass,force,forceAt},model=engine.dynamics.rodRelease({...options,phi:0}),free=app?.support===false;
    return {type:free?'freeRod':'rod',time:0,phi:0,omega:0,dx:0,dy:0,vx:0,vy:0,model,options,keep,acceleration:free?(forceAt-1)*force.y/(mass/3):model.angularAcceleration};
  }
  function advance(dt){
    if(state.type==='rod'){const model=engine.dynamics.rodRelease({...state.options,phi:state.phi});state={...state,...engine.release.rodStep(state,model,dt),acceleration:model.angularAcceleration};}
    else if(state.type==='freeRod'){
      const s=state,m=s.options.mass,f=s.options.force,r=s.options.forceAt-1,alpha=r*(Math.cos(s.phi)*f.y-Math.sin(s.phi)*f.x)/(m/3),ax=f.x/m,ay=f.y/m-9.81;
      state={...s,time:s.time+dt,dx:s.dx+s.vx*dt+.5*ax*dt*dt,dy:s.dy+s.vy*dt+.5*ay*dt*dt,vx:s.vx+ax*dt,vy:s.vy+ay*dt,omega:s.omega+alpha*dt,phi:s.phi+(s.omega+alpha*dt)*dt,acceleration:alpha};
    }else state={...state,...engine.release.inclineStep(state,state.model,dt)};
    if(![state.time,state.acceleration,state.phi??0,state.position??0].every(Number.isFinite)){stop();$('#interactionNotice').textContent='计算超出有限数值范围，请复位并调整参数。';return false;}
    if(state.type==='incline'&&state.position>=1){state.position=1;state.boundary=true;}
    if(state.type==='freeRod'&&(Math.abs(state.dx)>1||Math.abs(state.dy)>.8))state.boundary=true;
    return true;
  }
  function drawIncline(s){
    if(!window.MechanicsApp){$('#alternateScene .box')?.setAttribute('transform',`translate(${-s.position*Math.cos(s.alpha*Math.PI/180)*60} ${s.position*Math.sin(s.alpha*Math.PI/180)*60})`);return;}
    const a=s.alpha*Math.PI/180,ux=Math.cos(a),uy=-Math.sin(a),nx=-Math.sin(a),ny=-Math.cos(a),along=150-s.position*60,cx=205+along*ux+nx*23,cy=270+along*uy+ny*23,model=engine.dynamics.inclineRelease({...s.model,velocity:s.velocity}),N=model.normal,f=model.friction;
    const arrow=(x,y,dx,dy,label)=>`<g><line x1="${x}" y1="${y}" x2="${x+dx}" y2="${y+dy}" stroke="#276b59" stroke-width="2" marker-end="url(#motionArrow)"/><text x="${x+dx+8}" y="${y+dy}" font-size="12">${label}</text></g>`;
    $('#alternateScene').innerHTML=`<svg viewBox="0 0 760 330" role="img" aria-label="当前坡角下块体运动与动态受力图"><defs><marker id="motionArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#276b59"/></marker></defs><text x="28" y="30" font-size="17">释放实验 · ${s.alpha}° · μs=${s.model.muS} · μk=${s.model.muK}</text><line x1="205" y1="270" x2="${205+270*ux}" y2="${270+270*uy}" stroke="#54645c" stroke-width="5"/><rect class="box" x="${cx-38}" y="${cy-23}" width="76" height="46" fill="#dce9df" stroke="#356a57" transform="rotate(${-s.alpha} ${cx} ${cy})"/>${arrow(cx,cy,0,58,'W=100 N')}${arrow(cx,cy,nx*N*.6,ny*N*.6,'N='+N.toFixed(1)+' N')}${arrow(cx,cy,ux*f*.6,uy*f*.6,'f='+Math.abs(f).toFixed(1)+' N')}<text x="28" y="306" font-size="13">沿坡向下为正 · s=${s.position.toFixed(3)} m · v=${s.velocity.toFixed(3)} m/s</text></svg>`;
    $('#reactionBox').textContent=`动态受力：N=${N.toFixed(2)} N，f=${Math.abs(f).toFixed(2)} N；${model.isStatic?'静摩擦维持静止':'动摩擦与相对速度方向相反'}。`;
  }
  function render(s){
    if(!s)return;const rod=s.type!=='incline';$('#statusTag').textContent=rod?`释放观察 · ω=${s.omega.toFixed(2)} rad/s`:`释放观察 · v=${s.velocity.toFixed(2)} m/s`;
    if(rod){
      const free=s.type==='freeRod',dx=(s.dx||0)*290,dy=-(s.dy||0)*290,pivot=free?390:100;
      $('#beam')?.setAttribute('transform',free?`translate(${dx} ${dy}) rotate(${-s.phi*180/Math.PI} ${pivot} 214)`:`rotate(${-s.phi*180/Math.PI} 100 214)`);
      const r=free?0:290;$('#weightForce')?.setAttribute('transform',`translate(${dx+r*(Math.cos(s.phi)-1)} ${dy-r*Math.sin(s.phi)})`);
      const rf=(s.options.forceAt-(free?1:0))*290;$('#appliedForce')?.setAttribute('transform',`translate(${dx+rf*(Math.cos(s.phi)-1)} ${dy-rf*Math.sin(s.phi)})`);$('#appliedForce')?.setAttribute('visibility',s.keep?'visible':'hidden');
      if(window.MechanicsApp){
        $('#reaction').setAttribute('visibility','hidden');
        const m=s.options.mass,I=free?m/3:4*m/3,K=.5*I*s.omega*s.omega+(free?.5*m*(s.vx*s.vx+s.vy*s.vy):0),U=20*(free?s.dy:Math.sin(s.phi));
        let reaction='';$('#motionReaction')?.remove();
        if(!free){const rx=m*(-Math.cos(s.phi)*s.omega*s.omega-Math.sin(s.phi)*s.acceleration)-s.options.force.x,ry=m*(-Math.sin(s.phi)*s.omega*s.omega+Math.cos(s.phi)*s.acceleration)+20-s.options.force.y;reaction=`支反力 Rx=${rx.toFixed(2)} N，Ry=${ry.toFixed(2)} N。`;
          const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.id='motionReaction';const ex=100+Math.max(-60,Math.min(60,rx*2)),ey=214-Math.max(-60,Math.min(60,ry*2));group.innerHTML=`<line x1="100" y1="214" x2="${ex}" y2="214" class="force reaction" marker-end="url(#arrow)"/><line x1="100" y1="214" x2="100" y2="${ey}" class="force reaction" marker-end="url(#arrow)"/>`;$('#scene').append(group);
        }
        $('#reactionBox').textContent=`${reaction}动能 ${K.toFixed(3)} J；重力势能 ${U.toFixed(3)} J（初始位置为零）。${s.keep?'保留外力，可有外力做功。':'仅重力做功，机械能应近似守恒。'}`;
        const cx=pivot+dx,cy=214+dy,r1=free?-290:0,r2=free?290:580,x1=cx+r1*Math.cos(s.phi),x2=cx+r2*Math.cos(s.phi),y1=cy-r1*Math.sin(s.phi),y2=cy-r2*Math.sin(s.phi),xmin=Math.min(0,x1-70,x2-70),ymin=Math.min(0,y1-80,y2-80),xmax=Math.max(760,x1+100,x2+100),ymax=Math.max(330,y1+100,y2+100);$('#scene').setAttribute('viewBox',`${xmin} ${ymin} ${xmax-xmin} ${ymax-ymin}`);
      }
    }else drawIncline(s);
    $('[data-motion-readout]')?.remove();const e=document.createElement('span');e.dataset.motionReadout='';e.className='motion-readout';e.textContent=rod?` t=${s.time.toFixed(2)} s · α=${s.acceleration.toFixed(2)} rad/s²`:` t=${s.time.toFixed(2)} s · a=${s.acceleration.toFixed(2)} m/s²`;$('.controls .panel-head').append(e);
    if(window.MechanicsApp){
      if(!history.length||s.time-history.at(-1).t>=.02)history.push({t:s.time,v:rod?s.omega:s.velocity});history=history.slice(-240);
      const max=Math.max(.001,...history.map(p=>Math.abs(p.v))),last=history.at(-1)?.t||1,first=history[0]?.t||0,points=history.map(p=>`${20+(p.t-first)/(last-first||1)*260},${50-p.v/max*30}`).join(' ');
      $('#motionChart').innerHTML=`<svg viewBox="0 0 310 95" role="img" aria-label="最近速度时间曲线"><text x="5" y="12" font-size="10">${rod?'角速度 rad/s':'沿坡速度 m/s'} · 范围 ±${max.toFixed(2)}</text><line x1="20" y1="50" x2="280" y2="50" stroke="#c2d1c4"/><polyline points="${points}" fill="none" stroke="#26725c" stroke-width="2"/><text x="20" y="90" font-size="10">${first.toFixed(2)} s</text><text x="255" y="90" font-size="10">${last.toFixed(2)} s</text></svg>`;
    }
    if(s.boundary){$('#interactionNotice').textContent='已到观察边界，实验暂停；不模拟坡底碰撞或地面接触。请复位再试。';stop();$('#pauseBtn').disabled=true;}
  }
  function tick(timestamp){
    if(!state||staleScene())return;if(!Number.isFinite(timestamp)){timer=requestAnimationFrame(tick);return;}
    if(lastTimestamp===null)lastTimestamp=timestamp;const speed=window.MechanicsApp?Number($('#motionSpeed').value):1;accumulator+=Math.min(.1,Math.max(0,(timestamp-lastTimestamp)/1000))*speed;lastTimestamp=timestamp;
    while(accumulator+1e-12>=.002){accumulator=Math.max(0,accumulator-.002);if(!advance(.002))return;if(state.boundary)break;}
    render(state);if(!state.boundary)timer=requestAnimationFrame(tick);
  }
  function reset(){if(!state||staleScene())return;stop();state=JSON.parse(JSON.stringify(initial));history=[];render(state);$('#pauseBtn').disabled=false;$('#pauseBtn').textContent='继续';}
  $('#releaseBtn').onclick=()=>{
    clear();const raw=$('#scenePicker').value;if(!['lever','friction'].includes(raw)){$('#interactionNotice').textContent='当前场景用观察时刻控件查看状态；连续释放支持杆件和斜面。';return;}
    if(window.MechanicsApp)snapshot={scene:$('#scene').innerHTML,alternate:$('#alternateScene').innerHTML,reaction:$('#reactionBox').textContent,explain:$('#explain').textContent,status:$('#statusTag').textContent,viewBox:$('#scene').getAttribute('viewBox'),notice:$('#interactionNotice').textContent};
    try{state=makeState();}catch(error){$('#interactionNotice').textContent=error.message;return;}
    initial=JSON.parse(JSON.stringify(state));history=[];
    $('#interactionNotice').textContent=state.type==='incline'?'按当前坡角与静摩擦系数释放；μk 不大于 μs。沿坡向下为正；观察行程 1 m，到边界暂停。':`${state.type==='freeRod'?'无支座，模拟质心平动与绕质心转动':'保留铰支座'}；${state.keep?'保留当前施力（方向相对地面固定）':'撤去施力，仅受重力'}；半隐式Euler数值近似。`;
    if(window.MechanicsApp)$('#explain').textContent='运动状态与受力同步更新；仅为理想刚体或质点模型，无空气阻力和接触碰撞。画面随运动缩放，标尺为初始参考；暂停后可单步观察。';
    $('#pauseBtn').disabled=false;$('#pauseBtn').textContent='暂停';$('#resetMotionBtn').disabled=false;render(state);timer=requestAnimationFrame(tick);
  };
  $('#pauseBtn').onclick=()=>{if(!state||staleScene()||state.boundary)return;resetClock();if(timer){cancelAnimationFrame(timer);timer=null;$('#pauseBtn').textContent='继续';}else{$('#pauseBtn').textContent='暂停';timer=requestAnimationFrame(tick);}};
  $('#resetMotionBtn').onclick=reset;
  window.MechanicsMotion={clear};
  if(window.MechanicsApp){
    const tools=document.createElement('details');tools.className='motion-settings';tools.innerHTML='<summary>释放条件、慢放与单步</summary><label>释放时外力 <select id="releaseForceMode"><option value="keep">保留当前施力</option><option value="remove">撤去施力</option></select></label><label>斜面 μk <input id="motionMuK" type="number" min="0" max="1" step="0.01" value="0.3"></label><label>播放速度 <select id="motionSpeed"><option value="1">1×</option><option value="0.25">0.25× 慢放</option></select></label><button type="button" id="motionStep" class="outline-btn">单步 0.02 s</button><div id="motionChart"></div>';$('.controls').append(tools);
    $('#motionStep').onclick=()=>{if(!state||staleScene()||state.boundary)return;stop();for(let i=0;i<10&&!state.boundary;i++)advance(.002);render(state);$('#pauseBtn').disabled=!!state.boundary;$('#pauseBtn').textContent='继续';};
    for(const id of ['#releaseForceMode','#motionMuK'])$(id).onchange=clear;
    document.addEventListener('visibilitychange',resetClock);
  }
})();
