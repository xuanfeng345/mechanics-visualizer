from pathlib import Path
p=Path(__file__).resolve().parents[1]/'main.js'
s=p.read_text(encoding='utf-8')
a=s.index('function initDoorLeverScene() {')
b=s.index('// DeepSeek 解答功能', a)
s=s[:a]+'''function initDoorLeverScene() {
  const svg = document.getElementById("door-lever-svg");
  const handle = document.getElementById("door-handle");
  const force = document.getElementById("door-force");
  if (!svg || !handle || !force) return;
  const pivot = {x:75, y:204};
  let point = {x:250, y:204};
  const update = () => {
    handle.setAttribute('cx',point.x); handle.setAttribute('cy',point.y);
    // 平面扳手模型：力始终竖直向下，作用点可移动；逆时针为正。
    force.setAttribute('x1',point.x); force.setAttribute('y1',point.y);
    force.setAttribute('x2',point.x); force.setAttribute('y2',point.y+50);
    const load = Number(document.getElementById('input-load').value);
    const F = Number.isFinite(load) ? load : 0;
    const d = (point.x-pivot.x)*0.9/195;
    document.getElementById('hud-lever-arm').textContent = Math.abs(d).toFixed(3)+' m';
    document.getElementById('hud-lever-moment').textContent = (-F*d).toFixed(2)+' N·m（逆时针为正）';
    const grip = svg.querySelector('line[stroke-width="6"]');
    if (grip) {grip.setAttribute('x1',pivot.x);grip.setAttribute('y1',pivot.y);grip.setAttribute('x2',point.x);grip.setAttribute('y2',point.y);}
  };
  const move = e => {
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const local = new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
    point = {x:Math.max(75,Math.min(270,local.x)),y:Math.max(125,Math.min(275,local.y))};
    update();
  };
  let activePointer = null;
  svg.style.touchAction='none';
  svg.addEventListener('pointerdown',e=>{
    if (e.button !== 0) return;
    activePointer=e.pointerId; svg.setPointerCapture(e.pointerId); move(e);
  });
  svg.addEventListener('pointermove',e=>{if(e.pointerId===activePointer) move(e);});
  const stop=()=>{activePointer=null;};
  svg.addEventListener('pointerup',stop); svg.addEventListener('pointercancel',stop);
  document.getElementById('input-load').addEventListener('input',update);
  update();
}

'''+s[b:]
p.write_text(s,encoding='utf-8')
