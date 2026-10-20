/* Precision workbench: reuse the existing controls, state, progress and MathJax components. */
(() => {
  'use strict';
  if(document.documentElement.dataset.ui!=='precision')return;
  const $=s=>document.querySelector(s),app=window.MechanicsApp;
  if(!app)return;
  let playing=false,frame=null,last=null,elapsed=0,lastParams='';
  const rail=document.createElement('nav');rail.className='precision-rail';rail.setAttribute('aria-label','工作区导航');
  rail.innerHTML=`<div class="precision-mark" aria-hidden="true">M/L</div>
    <button type="button" data-precision-pane="notes" aria-label="实验与图解公式"><b>01</b>实验<small>LAB</small></button>
    <button type="button" data-precision-pane="task" aria-label="当前学习任务"><b>02</b>任务<small>LEARN</small></button>
    <button type="button" data-precision-pane="learn" aria-label="学习进度与复习"><b>03</b>进度<small>PROGRESS</small></button>
    <button type="button" data-precision-pane="map" aria-label="课程地图"><b>04</b>课程<small>COURSES</small></button>
    <a href="playground.html?ui=classic">返回原版 ↗</a>`;
  document.body.prepend(rail);
  rail.querySelectorAll('[data-precision-pane]').forEach(b=>b.onclick=()=>{
    const target=$('[data-pane="'+b.dataset.precisionPane+'"]');target?.click();
    if(matchMedia('(max-width:850px)').matches){
      (b.dataset.precisionPane==='notes'?$('#formulaDetails'):$('.side-column')).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});
    }
  });
  const header=$('.topbar');header.querySelector('h1').textContent='力学实验室';
  const modes=$('.mode-switch');
  modes.querySelectorAll('.mode').forEach(b=>b.innerHTML=b.dataset.mode==='free'?'自由模式<small>FREE MODE</small>':'教学模式<small>TEACHING MODE</small>');
  header.insertBefore(modes,header.children[1]);
  const course=document.createElement('div');course.className='precision-course';
  const courseName=document.createElement('strong'),progress=document.createElement('span'),progressText=document.createElement('span'),meter=document.createElement('meter');
  meter.setAttribute('aria-label','已练习关卡');meter.min=0;progress.append(progressText,meter);course.append(courseName,progress);header.append(course);
  const menu=document.createElement('details');menu.className='precision-tools';const summary=document.createElement('summary');summary.textContent='数据与工具 ▾';menu.append(summary,header.querySelector('nav'));header.append(menu);
  const original=document.createElement('a');original.href='playground.html?ui=classic';original.textContent='返回原界面';menu.querySelector('nav').append(original);
  menu.querySelector('nav').addEventListener('click',()=>{menu.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.open=false;document.querySelectorAll('.motion-settings[open],.experiment-compare[open]').forEach(d=>d.open=false);pause();}});
  document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))menu.open=false;});
  const families={
    theory:[['statics','静力学','staticsCourseBtn'],['kinematics','运动学','kinematicsCourseBtn'],['particle-dynamics','质点动力学','dynamicsCourseBtn'],['rigid-body','刚体动力学','rigidCourseBtn'],['vibration','振动基础','vibrationCourseBtn'],['lagrangian','分析力学','lagrangianCourseBtn']],
    materials:[['axial','轴向杆','axialCourseBtn'],['torsion','圆轴扭转','torsionCourseBtn'],['beam-material','梁弯曲','beamMaterialCourseBtn'],['stress-transform','组合应力','stressTransformCourseBtn'],['buckling','屈曲稳定','bucklingCourseBtn'],['fatigue','疲劳强度','fatigueCourseBtn']]
  };
  const familyFor=id=>families.materials.some(c=>c[0]===id)?'materials':'theory';
  let selectedFamily=familyFor(app.getState().curriculum),lastCurriculum=app.getState().curriculum;
  const curriculum=document.createElement('section');curriculum.className='precision-curriculum';curriculum.setAttribute('aria-label','课程选择');
  curriculum.innerHTML='<div class="precision-families" role="group" aria-label="学科类别"><button type="button" data-course-family="theory" aria-controls="precisionCourses">理论力学<small>THEORETICAL</small></button><button type="button" data-course-family="materials" aria-controls="precisionCourses">材料力学<small>MATERIALS</small></button></div><nav id="precisionCourses" aria-label="理论力学课程"></nav>';
  header.after(curriculum);
  const courseNav=curriculum.querySelector('nav');let visibleCourse='';
  function syncCourses(){
    curriculum.querySelectorAll('[data-course-family]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.courseFamily===selectedFamily)));
    courseNav.setAttribute('aria-label',(selectedFamily==='theory'?'理论力学':'材料力学')+'课程');
    if(courseNav.dataset.family!==selectedFamily){
      courseNav.dataset.family=selectedFamily;courseNav.replaceChildren();
      families[selectedFamily].forEach(([id,label,target],i)=>{
        const b=document.createElement('button');b.type='button';b.dataset.topCourse=id;
        const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');b.append(n,document.createTextNode(label));
        b.onclick=()=>{if(app.getState().curriculum!==id){pause();$('#'+target).click();}sync();};
        courseNav.append(b);
      });
    }
    courseNav.querySelectorAll('button').forEach(b=>{if(b.dataset.topCourse===app.getState().curriculum)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    const key=selectedFamily+':'+app.getState().curriculum;
    if(key!==visibleCourse){visibleCourse=key;requestAnimationFrame(revealCurrentCourse);}
  }
  function revealCurrentCourse(){
    const active=courseNav.querySelector('[aria-current="page"]');if(!active)return;
    const a=active.getBoundingClientRect(),n=courseNav.getBoundingClientRect();
    if(a.left<n.left)courseNav.scrollLeft+=a.left-n.left;
    else if(a.right>n.right)courseNav.scrollLeft+=a.right-n.right;

  }
  curriculum.querySelectorAll('[data-course-family]').forEach(b=>b.onclick=()=>{selectedFamily=b.dataset.courseFamily;syncCourses();});
  // Arrow keys move between visible courses; selection is explicit with Enter/Space.
  courseNav.addEventListener('keydown',e=>{
    const buttons=[...courseNav.querySelectorAll('button')],i=buttons.indexOf(e.target);if(i<0)return;
    const next=e.key==='ArrowRight'?(i+1)%buttons.length:e.key==='ArrowLeft'?(i+buttons.length-1)%buttons.length:e.key==='Home'?0:e.key==='End'?buttons.length-1:null;
    if(next!==null){e.preventDefault();buttons[next].focus();}
  });
  const startLesson=document.createElement('button');startLesson.type='button';startLesson.className='solid-btn precision-start-lesson';startLesson.textContent='开始当前关卡 →';
  startLesson.onclick=()=>{$('[data-pane="task"]').click();if(matchMedia('(max-width:1100px)').matches)$('.side-column').scrollIntoView({block:'start',behavior:'instant'});};
  $('#unitSelect').after(startLesson);
  const footer=document.createElement('footer');footer.className='precision-footer';footer.innerHTML='<b>A / PRECISION WORKBENCH</b><span>本地存储 / SI · <b id="precisionStatus">就绪</b></span>';document.body.append(footer);
  $('#formulaDetails summary>span').textContent='02 / 图解公式';
  // The viewport owns the drawing size; SVG viewBox changes only move its camera.
  const canvas=document.createElement('div');canvas.className='precision-canvas';
  $('#scene').before(canvas);canvas.append($('#scene'),$('#alternateScene'));
  const sectionTitle=$('.apparatus .panel-head>span');sectionTitle.textContent='01 / 物理模型';
  $('.controls .panel-head>span').textContent='03 / 实验参数';
  const playback=document.createElement('div');playback.className='precision-playback';playback.hidden=true;
  playback.innerHTML='<button type="button" id="precisionPlay" class="precision-play">▶ 开始实验</button><button type="button" id="precisionPause" class="outline-btn" disabled>Ⅱ 暂停</button><button type="button" id="precisionStep" class="outline-btn">单步</button><button type="button" id="precisionReset" class="text-btn">复位</button><select id="precisionSpeed" aria-label="播放速度"><option value="1">1×</option><option value="0.25">0.25×</option></select><output id="precisionClock" aria-label="观察时刻">0.00 s</output>';
  $('.controls .panel-head').append(playback);
  function pause(persist=true){
    const wasPlaying=playing;playing=false;if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;elapsed=0;
    const info=app.playback(),time=info?.time||0,max=info?.max||20;$('#precisionPlay').disabled=false;$('#precisionPlay').textContent=time===0?'▶ 开始实验':time>=max?'▶ 重新开始':'▶ 继续实验';$('#precisionPause').disabled=true;$('#precisionStatus').textContent=time>0&&time<max?'已暂停':'就绪';
    if(wasPlaying&&persist)app.save();
  }
  function tick(timestamp){
    const info=app.playback();if(!playing||!info){pause();return;}
    if(last===null)last=timestamp;
    elapsed+=Math.max(0,Math.min(.1,(timestamp-last)/1000))*Number($('#precisionSpeed').value);last=timestamp;
    if(elapsed>=.04){const t=Math.min(info.max,info.time+elapsed);elapsed=0;app.setObservationTime(t,false);if(t>=info.max){pause();return;}}
    frame=requestAnimationFrame(tick);
  }
  function seek(time){pause(false);app.setObservationTime(time,true);sync();}
  $('#precisionPlay').onclick=()=>{
    const info=app.playback();if(playing||!info)return;
    if(info.time>=info.max)app.setObservationTime(0,false);
    playing=true;last=null;elapsed=0;$('#precisionPlay').disabled=true;$('#precisionPause').disabled=false;$('#precisionStatus').textContent='运行中';frame=requestAnimationFrame(tick);
  };
  $('#precisionPause').onclick=()=>pause();
  $('#precisionStep').onclick=()=>{const info=app.playback();if(info)seek(Math.min(info.max,info.time+.02));};
  $('#precisionReset').onclick=()=>seek(0);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('pagehide',()=>pause());
  for(const event of ['input','change'])document.addEventListener(event,e=>{
    const info=app.playback();if(info&&(e.target.dataset.altParam===info.timeKey||e.target.dataset.altNumber===info.timeKey))pause();
  },true);
  window.PrecisionWorkbench={seek,pause};
  function sync(){
    const s=app.getState(),info=app.playback();
    if(s.curriculum!==lastCurriculum){lastCurriculum=s.curriculum;selectedFamily=familyFor(s.curriculum);}
    syncCourses();
    const params=info?{...info.params}:{};if(info)delete params[info.timeKey];
    const parameters=JSON.stringify([s.scene,s.mode,s.curriculum,s.level,s.attemptSerial,params]);
    const changed=parameters!==lastParams;lastParams=parameters;
    if(playing&&(!info||changed))pause();
    document.body.dataset.precisionScene=s.scene;playback.hidden=!info;document.body.dataset.timePlayback=String(!!info);
    const name=$('#scenePicker').selectedOptions[0]?.textContent||'力学实验';if(courseName.textContent!==name)courseName.textContent=name;
    let done=0,total=0;for(const [pack,key] of Object.values(app.courses)){done+=pack.levels.filter(l=>s[key][l.id]).length;total+=pack.levels.length;}
    const label='已练习 '+done+' / '+total;if(progressText.textContent!==label){progressText.textContent=label;meter.max=total;meter.value=done;}
    const active=$('.workspace-tabs [aria-pressed="true"]')?.dataset.pane;
    rail.querySelectorAll('[data-precision-pane]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.precisionPane===active)));
    if(!playing){const time=info?.time||0;$('#precisionPlay').textContent=time===0?'▶ 开始实验':time>=(info?.max||20)?'▶ 重新开始':'▶ 继续实验';}
    const clock=(info?.time||0).toFixed(2)+' s';if($('#precisionClock').textContent!==clock)$('#precisionClock').textContent=clock;
  }
  new MutationObserver(sync).observe($('#reactionBox'),{childList:true,characterData:true,subtree:true});
  new MutationObserver(sync).observe($('.workspace-tabs'),{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
  // Opt-in routing uses the real free-mode controls, preserving the teaching bookmark.
  if(new URLSearchParams(location.search).get('scene')==='vibration'){
    $('[data-mode="free"]').click();$('#scenePicker').value='vibration';$('#scenePicker').dispatchEvent(new Event('change'));
  }else app.refresh();
  if(new URLSearchParams(location.search).get('scene')==='vibration')$('[data-pane="notes"]').click();
  $('#formulaDetails').open=true;$('#reasoningDetails').open=false;
  window.MathJax?.startup?.promise?.then(()=>{if(app.getState().scene==='vibration')$('[data-formula-step="1"]')?.click();});
  let resizeFrame=null;
  window.addEventListener('resize',()=>{
    if(resizeFrame!==null)cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(()=>{resizeFrame=null;if(app.playback()||['beam-material','materials-lab'].includes(app.getState().scene)){pause();app.refresh();}});
  });
  new ResizeObserver(revealCurrentCourse).observe(courseNav);
  sync();
})();
