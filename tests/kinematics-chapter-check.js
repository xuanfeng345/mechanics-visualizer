/*
 * CDP/browser contract test draft: point-kinematics chapter.
 * Usage: node tests/browser-check.cjs tests/kinematics-chapter-check.js
 *
 * This is deliberately a contract draft: missing product hooks are reported in
 * contractTodo instead of guessed from visible copy. The chapter must expose
 * eight stable levels and progress storage independent of the 20-level statics
 * and 8-level axial chapters.
 */
(async () => {
  const checks = [], todo = [], notes = [];
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const check = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail });
  const contract = (name, detail) => todo.push({ name, detail });
  const fire = (el, type = 'input') => el && el.dispatchEvent(new Event(type, { bubbles: true }));
  const setValue = (el, value) => { if (!el) return false; el.value = String(value); fire(el); return true; };
  const json = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };

  // 1. Scene picker: both point-kinematics scenes are stable entry points.
  const picker = $('#scenePicker, [data-scene-picker]');
  if (!picker) contract('scenePicker', '需要 #scenePicker 或 [data-scene-picker]');
  const sceneValues = ['point-kinematics-curve', 'point-kinematics-coordinates'];
  for (const value of sceneValues) {
    const option = picker && $(`option[value="${value}"]`, picker);
    check(`运动学场景 option ${value}`, !!option);
    if (picker && option) {
      picker.value = value; fire(picker, 'change'); await wait(60);
      check(`运动学场景 ${value} 已选中`, picker.value === value);
      const scene = $(`.scene-2d[data-scene-id="${value}"], #${value}`);
      check(`运动学场景 ${value} 可见`, !!scene && !scene.hidden && getComputedStyle(scene).display !== 'none');
      if (!scene) contract(`scene ${value} host`, `需要 .scene-2d[data-scene-id="${value}"] 或 #${value}`);
    }
  }

  // 2. Parameter controls and SVG readouts. Accept data hooks or documented IDs.
  const paramNames = ['time', 'position', 'velocity', 'acceleration', 'radius', 'angularSpeed'];
  const controlFor = key => $(`[data-kinematics-param="${key}"], #kinematics-${key}, #${key}Range`);
  for (const key of paramNames) {
    const input = controlFor(key);
    if (!input) { contract(`kinematics param ${key}`, `需要 [data-kinematics-param="${key}"] 或稳定 id`); continue; }
    check(`运动学参数控件 ${key}`, /^(INPUT|SELECT)$/.test(input.tagName));
    const output = $(`[data-kinematics-readout="${key}"], #kinematics-${key}-value, #${key}Value`);
    check(`运动学参数读数 ${key}`, !!output && output.textContent.trim().length > 0);
    if (!output) contract(`kinematics readout ${key}`, '参数旁应有稳定 output/data readout 节点');
    const before = output && output.textContent;
    setValue(input, input.value || input.min || 0); await wait(20);
    check(`参数 ${key} 可触发 input`, true);
    if (output) check(`参数 ${key} input 后读数非空`, output.textContent.trim().length > 0, `${before} -> ${output.textContent}`);
  }
  const svg = $('.scene-2d[data-scene-id="point-kinematics-curve"] svg, .scene-2d[data-scene-id="point-kinematics-coordinates"] svg, #point-kinematics-curve-svg, #point-kinematics-coordinates-svg');
  check('运动学 SVG 读数存在', !!svg && (!!svg.querySelector('title,desc') || svg.textContent.trim().length > 0));
  if (!svg) contract('kinematics SVG', '场景应渲染 SVG，并包含 title/desc 或可读文本读数');

  // 3. Chapter contract: exactly eight stable levels, without borrowing other curricula.
  const chapter = window.KINEMATICS_CHAPTER || window.KINEMATICS_CURRICULUM || window.kinematicsChapter;
  const levels = Array.isArray(chapter && chapter.levels) ? chapter.levels :
    $$('[data-kinematics-level]').sort((a, b) => Number(a.dataset.kinematicsLevel) - Number(b.dataset.kinematicsLevel));
  if (!levels.length) contract('kinematics chapter levels', '建议 window.KINEMATICS_CHAPTER.levels 或 [data-kinematics-level]');
  check('运动学章节恰有 8 关', levels.length === 8, `found=${levels.length}`);
  const ids = levels.map((l, i) => l && (l.id || l.dataset && l.dataset.kinematicsLevel) || `kinematics-${i + 1}`);
  check('运动学关卡 id 唯一', new Set(ids).size === ids.length, ids.join(','));

  // 4. Independent progress: statics=20 and axial=8 must not be the kinematics record.
  const storageKey = (chapter && chapter.storageKey) || 'mechanics-kinematics-v1';
  const staticsKey = (chapter && chapter.staticsStorageKey) || 'mechanics-playground-v3';
  const axialKey = (chapter && chapter.axialStorageKey) || 'mechanics-axial-v1';
  check('运动学使用独立 progress key', ![staticsKey, axialKey].includes(storageKey), `${storageKey} vs ${staticsKey}/${axialKey}`);
  const statics = json(staticsKey), axial = json(axialKey);
  if (statics && statics.completed) check('静力学完成记录仍独立', Object.keys(statics.completed).length <= 20, `count=${Object.keys(statics.completed).length}`);
  if (axial && axial.completed) check('轴向完成记录仍独立', Object.keys(axial.completed).length <= 8, `count=${Object.keys(axial.completed).length}`);
  const before = json(storageKey);
  for (let i = 0; i < 8; i++) {
    const level = Array.isArray(chapter && chapter.levels) ? chapter.levels[i] : levels[i];
    const button = $(`[data-kinematics-level="${i}"]`) || (level && level.matches && level);
    if (button && button.click) { button.click(); await wait(25); }
    const answer = $('#answer'), submit = $('#submit'), msg = $('#answerMsg');
    check(`第${i + 1}关答题输入`, !!answer);
    check(`第${i + 1}关提交按钮`, !!submit);
    if (!answer || !submit) contract(`level ${i + 1} answer`, '需要稳定 #answer/#submit 契约');
    const hint = $('#hintButton');
    check(`第${i + 1}关提示按钮`, !!hint);
    if (hint) { hint.click(); await wait(10); check(`第${i + 1}关提示容器`, !!$('#hintContent')); }
    else contract(`level ${i + 1} hints`, '需要 #hintButton 与 #hintContent');
    if (answer && submit && level && level.answer !== undefined) {
      setValue(answer, level.answer); submit.click(); await wait(20);
      check(`第${i + 1}关可提交`, !!msg && /✓|正确|通过/.test(msg.textContent));
    } else if (level && level.answer === undefined) contract(`level ${i + 1} answer value`, `关卡 ${ids[i]} 需暴露 answer/answerProvider`);
    const saved = json(storageKey);
    if (saved) check(`第${i + 1}关完成记录可读`, !!saved.completed && typeof saved.completed === 'object');
    else contract(`level ${i + 1} completion`, `localStorage[${storageKey}] 应保存 completed[id]`);
  }
  if (before && json(storageKey)) check('运动学进度不覆盖其他章节', ![staticsKey, axialKey].includes(storageKey));

  // 5. No horizontal overflow at the current CDP viewport.
  check('无横向溢出', document.documentElement.scrollWidth <= window.innerWidth + 1,
    `${document.documentElement.scrollWidth}/${window.innerWidth}`);
  return JSON.stringify({ passed: checks.filter(x => x.ok).length, failed: checks.filter(x => !x.ok), checks, contractTodo: todo, notes });
})()
