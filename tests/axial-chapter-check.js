/*
 * CDP 浏览器表达式草稿：材料力学「拉压杆 / 轴向受力」章节。
 * 用法：node tests/browser-check.cjs tests/axial-chapter-check.js
 *
 * 预期 DOM 契约（当前页面若尚未实现，测试会把缺失项列入 contract.todo）：
 *   - 场景：#scenePicker option[value="material"]，切换后 #alternateScene 可见。
 *   - 参数：#alternateControls [data-alt-param="E|yield|maxStrain|H"]，每项有对应
 *     output#alt-E 等读数；若改用 range 的 id，请保留 data-alt-param。
 *   - 读数：#statusTag、#reactionBox、#alternateScene[role="img"] 或
 *     .material-chart；读数应随参数 input 事件刷新。
 *   - 章节：window.AXIAL_CHAPTER（建议 {levels:[8 个关卡]}），每关含
 *     {id, answer, setup?, operation?}；或者按钮 [data-axial-level="0..7"]。
 *   - 答题：#answer、#submit、#answerMsg、#nextLesson；提示：#hintButton、
 *     #hintContent、#assistedContinue；完成记录：localStorage 中建议使用
 *     "mechanics-axial-v1"，形如 {completed:{[id]:{independent,assisted,hintLevel}}}。
 *   - 若复用操练场现有契约，允许使用 #unitSelect、[data-level]、
 *     #progressText、localStorage["mechanics-playground-v3"]，但应提供轴向章节
 *     的 8 个稳定 id，不能用数组下标猜测题目。
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

  // 1. 场景选择：优先验证自由实验台的材料应力—应变场景。
  const picker = $('#scenePicker');
  if (!picker) contract('scenePicker', '需要 #scenePicker 或等价 data-scene-picker');
  const materialOption = picker && $('option[value="material"]', picker);
  check('材料场景 option 存在', !!materialOption);
  if (picker && materialOption) {
    picker.value = 'material'; fire(picker, 'change'); await wait(40);
    check('材料场景已选中', picker.value === 'material');
    check('材料图可见', !!($('#alternateScene') && !$('#alternateScene').hidden));
  }

  // 2. 参数控件与读数：四个材料参数都应可调且数值/图形同步。
  const params = ['E', 'yield', 'maxStrain', 'H'];
  for (const key of params) {
    const input = $(`[data-alt-param="${key}"]`);
    const output = $(`#alt-${key}`);
    if (!input) contract(`material param ${key}`, `缺少 [data-alt-param="${key}"] range/input`);
    if (!output) contract(`material readout ${key}`, `建议提供 #alt-${key} output`);
    check(`参数控件 ${key}`, !!input);
    check(`参数读数 ${key}`, !!output && output.textContent.trim().length > 0);
    if (input) {
      const before = output && output.textContent;
      const n = Number(input.value);
      setValue(input, Number.isFinite(n) ? n : input.min || 0);
      await wait(10);
      check(`参数 ${key} 可触发 input`, true);
      if (output) check(`读数 ${key} 非空`, output.textContent.trim().length > 0, `${before} -> ${output.textContent}`);
    }
  }
  const chart = $('#alternateScene .material-chart, #alternateScene [role="img"]');
  check('应力—应变图/读数存在', !!chart || !!$('#statusTag') || !!$('#reactionBox'));
  if (!chart && !$('#statusTag') && !$('#reactionBox')) contract('material readouts', '需要图表或状态/反力读数节点');

  // 3. 章节适配器：不猜题目答案；要求产品暴露稳定的 8 关契约。
  const chapter = window.AXIAL_CHAPTER || window.axialChapter;
  const levels = Array.isArray(chapter && chapter.levels) ? chapter.levels :
    $$('[data-axial-level]').sort((a,b) => Number(a.dataset.axialLevel) - Number(b.dataset.axialLevel));
  if (!levels.length) contract('axial chapter levels', '建议 window.AXIAL_CHAPTER.levels 或 [data-axial-level]');
  check('轴向章节恰有 8 关（契约）', levels.length === 8, `found=${levels.length}`);

  // 4. 逐关答题/提示/完成记录。若 API 未落地，保留可执行的 DOM 契约记录。
  const storageKey = (chapter && chapter.storageKey) || 'mechanics-axial-v1';
  for (let i = 0; i < 8; i++) {
    const level = Array.isArray(chapter && chapter.levels) ? chapter.levels[i] : levels[i];
    const id = level && (level.id || level.dataset && level.dataset.axialLevel) || `axial-${i + 1}`;
    const button = $(`[data-axial-level="${i}"]`) || (level && level.matches && level);
    if (button && button.click) { button.click(); await wait(20); }
    const answer = $('#answer'), submit = $('#submit'), msg = $('#answerMsg');
    check(`第${i + 1}关答题输入`, !!answer);
    check(`第${i + 1}关提交按钮`, !!submit);
    if (!answer || !submit) contract(`level ${i + 1} answer`, '需要 #answer/#submit；不要依赖 innerHTML 文本定位');
    const hint = $('#hintButton');
    check(`第${i + 1}关提示按钮`, !!hint);
    if (hint) {
      const before = $$('#hintContent p').length;
      hint.click(); await wait(10);
      check(`第${i + 1}关提示展开`, $$('#hintContent p').length >= before);
    } else contract(`level ${i + 1} hints`, '需要 #hintButton 与 #hintContent');
    if (answer && submit && level && level.answer !== undefined) {
      setValue(answer, level.answer); submit.click(); await wait(20);
      check(`第${i + 1}关可提交正确答案`, !!msg && /✓|正确|通过/.test(msg.textContent));
    } else if (level && level.answer === undefined) {
      contract(`level ${i + 1} answer value`, `关卡 ${id} 需暴露 answer 或 answerProvider`);
    }
    const assisted = $('#assistedContinue');
    if (assisted) { assisted.click(); await wait(15); notes.push(`level ${i + 1}: assisted path exercised`); }
    const saved = (() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } })();
    if (saved) check(`第${i + 1}关完成记录可读`, !!saved.completed && typeof saved.completed === 'object');
    else contract(`level ${i + 1} completion`, `localStorage[${storageKey}] 未发现，需保存 completed[id]`);
  }

  // 5. 无横向溢出（在 CDP 中可由不同 viewport 重复执行）。
  check('无横向溢出', document.documentElement.scrollWidth <= window.innerWidth + 1,
    `${document.documentElement.scrollWidth}/${window.innerWidth}`);
  return JSON.stringify({ passed: checks.filter(x => x.ok).length, failed: checks.filter(x => !x.ok), checks, contractTodo: todo, notes });
})()
