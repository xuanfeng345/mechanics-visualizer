(() => {
  const aside=document.querySelector('.side-column');
  const task=document.querySelector('#challenge'),map=document.querySelector('.progress');
  const notes=document.createElement('div');notes.className='workspace-notes';
  const reasoning=document.querySelector('#reasoningDetails'),formula=document.querySelector('#formulaDetails');
  notes.append(formula,reasoning);aside.append(notes);
  reasoning.open=true;formula.open=true;
  const learning=document.querySelector('#learningHub');const panes={task,map,notes,...(learning?{learn:learning}:{})};
  function select(name){for(const [key,el]of Object.entries(panes))el.hidden=key!==name;document.querySelectorAll('[data-pane]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pane===name)));}
  document.querySelectorAll('[data-pane]').forEach(b=>b.onclick=()=>select(b.dataset.pane));
  document.querySelector('#levelList').addEventListener('click',e=>{if(e.target.closest('[data-level]')&&document.documentElement.dataset.ui!=='precision')select('task');});
  document.querySelector('#clearCards').addEventListener('click',()=>select('notes'));
  select('task');
})();
