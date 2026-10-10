// 第一轮校订：展示完整性与审核边界。原模型不等于已验证的工程求解器。
(() => {
  const descriptions = new Map();
  document.querySelectorAll('.scene-2d').forEach(scene => {
    const svg = scene.querySelector('svg');
    if (!svg) return;
    // SVG 单行说明不会自动换行，移至独立 HTML 区域，保留模型坐标不做拉伸。
    const heading = [...svg.children].filter(el => el.tagName.toLowerCase() === 'text' && Number(el.getAttribute('y')) <= 55);
    if (heading.length) {
      const caption = document.createElement('div');
      caption.className = 'scene-caption';
      heading.forEach((el, i) => {
        const text = document.createElement(i ? 'p' : 'h2');
        text.textContent = el.textContent;
        caption.append(text);
        el.remove();
      });
      scene.prepend(caption);
      descriptions.set(scene.dataset.sceneId, caption);
    }
  });
  const note = document.createElement('div');
  note.className = 'review-note';
  note.setAttribute('role', 'status');
  document.querySelector('.visual-panel .panel-header').after(note);
  const reviewed = new Set(['door-lever','simple-beam','disk-couple','three-force-equilibrium','force-couple-simplification','multi-force-panel','friction-slope','damped-vibration']);
  const originalSwitch = switchVisualByModel;
  switchVisualByModel = function(id) {
    originalSwitch(id);
    note.textContent = reviewed.has(id)
      ? '第一轮校订 · 已针对公式或几何问题修正；仍需结合下方假设理解，非工程设计结果。'
      : '审核进行中 · 本模型包含旧版示意内容，尚未完成公式、题目与图形的逐项验证。';
    if (['cantilever-beam','axial-bar','torsion-shaft'].includes(id)) {
      note.textContent = '待重建 · 旧版将此模型错误映射到简支梁。为避免误导，暂不显示不匹配的图形；概念资料仅供审阅。';
      document.querySelector('.scene-2d-active')?.classList.remove('scene-2d-active');
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
    note.textContent = '审核进行中 · 正在逐项校订旧版模型。3D 原为通用占位场景，暂不开放。';
    const concept = new URLSearchParams(location.search).get('concept');
    if (concept) {
      const card = [...document.querySelectorAll('.concept-card')].find(el=>el.dataset.conceptId===concept);
      if(card){
        card.classList.add('concept-card-highlight');
        card.tabIndex=0;
        requestAnimationFrame(()=>{card.scrollIntoView({block:'center'});card.focus({preventScroll:true});});
      }
    }
  });
})();
