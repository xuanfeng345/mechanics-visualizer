(async () => {
 const failures=[], checks=[];
 const check=(name,ok)=>{checks.push({name,ok});if(!ok)failures.push(name)};
 const input=(id,v)=>{const el=document.getElementById(id);el.value=v;el.dispatchEvent(new Event('input'))};
 switchVisualByModel('disk-couple');
 input('input-L',0.6);
 const disk=document.getElementById('disk-circle'), top=document.getElementById('disk-force-top'),bottom=document.getElementById('disk-force-bottom');
 check('disk forces tangent to current radius',Math.abs(+top.getAttribute('y1')-(200-+disk.getAttribute('r')))<1e-8 && Math.abs(+bottom.getAttribute('y1')-(200+ +disk.getAttribute('r')))<1e-8);
 switchVisualByModel('multi-force-panel');
 check('vector resultant not scalar sum',document.getElementById('hud-panel-FR').textContent.startsWith('49.71'));
 check('signed moment matches diagram',document.getElementById('hud-panel-MO').textContent.startsWith('-37.80'));
 switchVisualByModel('friction-slope');
 input('input-L',30);input('input-E',0);
 const a=document.getElementById('friction-g-parallel'),b=document.getElementById('friction-g-perp');
 check('gravity components sum to gravity',Math.abs(+a.getAttribute('x2')+ +b.getAttribute('x2')-440)<1e-8 && Math.abs(+a.getAttribute('y2')+ +b.getAttribute('y2')-500)<1e-8);
 check('zero friction accepted',document.getElementById('hud-friction-mu').textContent==='0.00');
 switchVisualByModel('door-lever');input('input-load',20);
 check('signed door moment',document.getElementById('hud-lever-moment').textContent.startsWith('-16.15'));
 for(const id of ['axial-bar','torsion-shaft','cantilever-beam']){switchVisualByModel(id);check(id+' does not show wrong beam',!document.querySelector('.scene-2d-active'));}
 switchVisualByModel('damped-vibration');switchVisualByModel('door-lever');await new Promise(r=>setTimeout(r,200));
 check('late initializer cannot activate hidden model',!sceneAnimationRunning.get('damped-vibration'));
 check('one visible scene',document.querySelectorAll('.scene-2d-active').length===1);
 check('no horizontal overflow',document.documentElement.scrollWidth<=innerWidth);
 if(failures.length) throw new Error(JSON.stringify({checks,failures}));
 return JSON.stringify({checks,passed:checks.length});
})()
