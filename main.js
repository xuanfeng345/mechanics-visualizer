// ============================================================================
// 配置区域 - 请在此处修改配置
// ============================================================================

/**
 * DeepSeek API 配置
 * 获取 API Key: https://platform.deepseek.com/
 * 将您的 API Key 填入下方
 */
const DEEPSEEK_CONFIG = {
  API_KEY: "", // 请在此处填入您的 DeepSeek API Key
  API_URL: "https://api.deepseek.com/v1/chat/completions",
  MODEL: "deepseek-chat",
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7
};

// ============================================================================
// 简单交互与 3D 占位场景
// ============================================================================

// 2D / 3D 模式切换
const modeButtons = document.querySelectorAll(".panel-tabs .tab-btn[data-mode]");
const subjectButtons = document.querySelectorAll(".top-nav .nav-btn[data-subject]");
const visual2D = document.getElementById("visual-2d");
const visual3D = document.getElementById("visual-3d");
let svgAnimInited = false;
let updateCrankSlider = null;
let updateBeamScene = null;
let hudThetaEl = document.getElementById("hud-theta");
let hudSliderEl = document.getElementById("hud-slider-x");
let hudBeamLEl = document.getElementById("hud-beam-L");
let hudBeamQEl = document.getElementById("hud-beam-q");
// 斜面摩擦 HUD
const hudFrictionAngleEl = document.getElementById("hud-friction-angle");
const hudFrictionMuEl = document.getElementById("hud-friction-mu");
const hudFrictionLockEl = document.getElementById("hud-friction-lock");
// 参数区域引用
const fgL = document.getElementById("fg-L");
const fgLoad = document.getElementById("fg-load");
const fgE = document.getElementById("fg-E");
const fgCrankR = document.getElementById("fg-crank-r");
const fgRodL = document.getElementById("fg-rod-l");
const fgOmega = document.getElementById("fg-omega");
const labelL = document.getElementById("label-L");
const labelLoad = document.getElementById("label-load");
const labelE = document.getElementById("label-E");
const labelCrankR = document.getElementById("label-crank-r");
const labelRodL = document.getElementById("label-rod-l");
const labelOmega = document.getElementById("label-omega");
const unitL = document.getElementById("unit-L");
const unitLoad = document.getElementById("unit-load");
const unitE = document.getElementById("unit-E");

// 简单的斜面摩擦 HUD 更新：根据给定 α 和 μ 判断自锁
function updateFrictionSlopeHUD(alphaDeg = 30, mu = 0.4) {
  if (!hudFrictionAngleEl || !hudFrictionMuEl || !hudFrictionLockEl) return;
  const rad = (alphaDeg * Math.PI) / 180;
  const tanAlpha = Math.tan(rad);
  const locked = mu >= tanAlpha;
  hudFrictionAngleEl.textContent = `${alphaDeg.toFixed(0)}°（tanα ≈ ${tanAlpha.toFixed(2)})`;
  hudFrictionMuEl.textContent = mu.toFixed(2);
  hudFrictionLockEl.textContent = locked
    ? `μ ≥ tanα → 自锁（不会自行下滑）`
    : `μ < tanα → 不自锁，存在下滑趋势`;
}

// 圆盘力偶 HUD 更新：根据 R 和 F 计算力偶矩 M = 2F·R
function updateDiskCoupleHUD(R = 0.2, F = 100) {
  const hudR = document.getElementById("hud-disk-R");
  const hudF = document.getElementById("hud-disk-F");
  const hudM = document.getElementById("hud-disk-M");
  if (!hudR || !hudF || !hudM) return;
  const Rclamp = Math.max(0.05, Math.min(1.0, R));
  const Fclamp = Math.max(10, Math.min(1000, F));
  const M = 2 * Fclamp * Rclamp;
  hudR.textContent = `${Rclamp.toFixed(2)} m`;
  hudF.textContent = `${Fclamp.toFixed(0)} N`;
  hudM.textContent = `${M.toFixed(1)} N·m`;
}

function updateMultiForcePanelHUD(Lval = 0.9, Fval = 120) {
  const hudL = document.getElementById("hud-panel-L");
  const hudFR = document.getElementById("hud-panel-FR");
  const hudMO = document.getElementById("hud-panel-MO");
  if (!hudL || !hudFR || !hudMO) return;
  const Lclamp = Math.max(0.5, Math.min(1.5, Lval));
  const Fclamp = Math.max(50, Math.min(400, Fval));
  const FR = Fclamp * 3; // 示意：3个力合成
  const MO = Fclamp * Lclamp; // 简化计算
  hudL.textContent = `${Lclamp.toFixed(2)} m`;
  hudFR.textContent = `${FR.toFixed(0)} N (示意)`;
  hudMO.textContent = `${MO.toFixed(1)} N·m`;
}

function updatePointKinematicsHUD(Rmeters = 1.0, vval = 2.0, at = 0, an = 0) {
  const hudR = document.getElementById("hud-curve-R");
  const hudV = document.getElementById("hud-curve-v");
  const hudA = document.getElementById("hud-curve-a");
  if (!hudR || !hudV || !hudA) return;
  const R = Math.max(0.2, Math.min(5.0, Rmeters));
  const v = Math.max(0.1, Math.min(6.0, vval));
  hudR.textContent = `${R.toFixed(2)} m`;
  hudV.textContent = `${v.toFixed(2)} m/s`;
  hudA.textContent = `aₜ = ${at.toFixed(2)} m/s², aₙ = ${an.toFixed(2)} m/s²`;
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeButtons.forEach((b) => b.classList.remove("tab-btn-active"));
    btn.classList.add("tab-btn-active");
    const mode = btn.getAttribute("data-mode");
    if (mode === "2d") {
      visual2D.classList.add("active");
      visual3D.classList.remove("active");
      if (!svgAnimInited) {
        initCrankSliderInteraction();
        svgAnimInited = true;
      }
    } else {
      visual3D.classList.add("active");
      visual2D.classList.remove("active");
      // 延迟 3D 初始化，确保 canvas 尺寸正确
      if (!window.__threeInited) {
        initThreeScene();
        window.__threeInited = true;
      } else {
        // 已初始化时切到 3D，触发一次 resize 以防画布为 0 尺寸
        window.dispatchEvent(new Event("resize"));
      }
    }
  });
});

// 例题区 tab 切换
const qTabs = document.querySelectorAll(".panel-tabs .tab-btn[data-q-tab]");
const qpExamples = document.getElementById("qp-examples");
const qpExam = document.getElementById("qp-exam");

qTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    qTabs.forEach((b) => b.classList.remove("tab-btn-active"));
    btn.classList.add("tab-btn-active");
    const tab = btn.getAttribute("data-q-tab");
    if (tab === "examples") {
      qpExamples.classList.remove("qp-body-hidden");
      qpExam.classList.add("qp-body-hidden");
    } else {
      qpExam.classList.remove("qp-body-hidden");
      qpExamples.classList.add("qp-body-hidden");
    }
  });
});

// 标签选择
const tagButtons = document.querySelectorAll(".tag-btn");
tagButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tagButtons.forEach((b) => b.classList.remove("tag-btn-active"));
    btn.classList.add("tag-btn-active");
  });
});

// “生成习题”按钮占位逻辑
const btnGenerate = document.getElementById("btn-generate-question");
const questionModelSelect = document.getElementById("question-model");
btnGenerate.addEventListener("click", () => {
  const currentModelId = questionModelSelect?.value || "crank-slider";
  const L = Number(document.getElementById("input-L")?.value || 4.0);
  const load = Number(document.getElementById("input-load")?.value || 20);
  const E = document.getElementById("input-E")?.value || "2.0e5";
  const r = Number(document.getElementById("input-crank-r")?.value || 0.1);
  const l = Number(document.getElementById("input-rod-l")?.value || 0.4);
  const omega = Number(document.getElementById("input-omega")?.value || 20);

  const gqCard = document.getElementById("generated-question");
  const gqStem = document.getElementById("gq-stem");
  const gqLabel = document.getElementById("gq-subject-label");
  if (!gqCard || !gqStem || !gqLabel) return;

  // 根据当前选中的模型生成对应题干，并驱动可视化切换
  switchVisualByModel(currentModelId);

  if (currentModelId === "crank-slider") {
    gqLabel.textContent = "自动生成 · 曲柄滑块运动分析";
    gqStem.innerHTML =
      `已知曲柄滑块机构中，曲柄长度 r = ${r.toFixed(
        2
      )} m，连杆长度 l = ${l.toFixed(
        2
      )} m，曲柄以恒定角速度 ω = ${omega.toFixed(
        0
      )} rad/s 绕定点 O 转动，取某一瞬时角度为 θ。` +
      `<br/>① 建立滑块位移 x(θ) 的几何方程；② 推导滑块速度与加速度表达式；③ 代入题目给定的 θ，求出数值结果。` +
      `<br/><br/>可在上方“曲柄滑块”可视化中拖动曲柄或滑块，体会几何约束，并用参数区中的 r, l, ω 验证你的计算。`;
  } else if (currentModelId === "constraint-types") {
    gqLabel.textContent = "自动生成 · 约束类型与约束反力";
    gqStem.innerHTML =
      `一结构如图所示，包含固定铰支座、活动铰支座和固定端三种约束。` +
      `<br/>① 说明固定铰支座、活动铰支座和固定端各提供几个约束反力，分别是什么；` +
      `<br/>② 画出各约束的约束反力方向（固定铰：Fx, Fy；活动铰：Fy；固定端：Fx, Fy, M）；` +
      `<br/>③ 若结构受平面力系作用，说明如何判断结构是静定还是超静定；` +
      `<br/>④ 对于静定结构，如何利用平衡方程求解约束反力。` +
      `<br/><br/>上方"约束类型"模型可帮助你理解不同约束的约束反力特点，这是画受力图的基础。`;
  } else if (currentModelId === "door-lever") {
    gqLabel.textContent = "自动生成 · 力与力矩（门板 / 扳手）";
    gqStem.innerHTML =
      `一扇门的宽度约 0.90 m，铰链位于一侧。现在在距离铰链 d = 0.60 m 处施加大小为 F = ${load.toFixed(
        0
      )} N 的推力。` +
      `<br/>① 写出该力对铰链点的力矩表达式；② 试比较在 d = 0.30 m 与 d = 0.90 m 施力时需要的力大小；` +
      `<br/>③ 结合扳手模型，说明为何长扳手能省力。` +
      `<br/><br/>上方“门板 / 扳手”模型中可拖动力的作用点与方向，实时观察力臂变化带来的力矩差异。`;
  } else if (currentModelId === "rigid-body-2d") {
    gqLabel.textContent = "自动生成 · 平面刚体多力平衡";
    gqStem.innerHTML =
      `一平面刚体受三力作用：F1 = 5 kN，F2 = 8 kN，F3 未知，力的作用线如图所示。` +
      `<br/>① 画出完整受力图并列出平衡条件：所有x方向力的和 = 0，所有y方向力的和 = 0，所有力矩的和 = 0；` +
      `<br/>② 求未知力 F3 及其方向；③ 说明为何至少需要三个独立方程才能解出该刚体的支反力。` +
      `<br/><br/>上方"平面刚体"模型可辅助理解如何抽象出受力图与力矩平衡。`;
  } else if (currentModelId === "three-force-equilibrium") {
    gqLabel.textContent = "自动生成 · 三力平衡与三力汇交定理";
    gqStem.innerHTML =
      `一刚体受三个力作用而平衡：F1 = ${load.toFixed(0)} N（方向已知），F2 和 F3 的大小和方向均未知。` +
      `<br/>① 应用三力汇交定理，确定三力作用线的汇交点；` +
      `<br/>② 列出平衡条件：所有x方向力的和 = 0，所有y方向力的和 = 0，求解 F2 和 F3；` +
      `<br/>③ 说明为什么三力平衡时只需要两个平衡方程，而不需要力矩方程。` +
      `<br/><br/>上方"三力平衡"模型演示了三力汇交定理的几何关系。`;
  } else if (currentModelId === "force-couple-simplification") {
    gqLabel.textContent = "自动生成 · 力偶的简化与合成";
    gqStem.innerHTML =
      `一刚体受两个力偶作用：力偶1的力F1 = ${load.toFixed(0)} N，力偶臂d1 = 0.3 m；力偶2的力F2 = ${(load * 1.5).toFixed(0)} N，力偶臂d2 = 0.2 m。` +
      `<br/>① 计算两个力偶的力偶矩M1和M2；` +
      `<br/>② 求合力偶矩M合；` +
      `<br/>③ 说明力偶的平移不变性，并解释为什么可以用力偶矩来简化力偶。` +
      `<br/><br/>上方"力偶的简化与合成"模型演示了力偶矩的计算和力偶的平移不变性。`;
  } else if (currentModelId === "disk-couple") {
    gqLabel.textContent = "自动生成 · 圆盘力偶与扭矩";
    gqStem.innerHTML =
      `一半径 R = ${L.toFixed(
        2
      )} m 的圆盘，其边缘作用有一对大小相等、方向相反的切向力 F = ${load.toFixed(
        0
      )} N，如图所示。` +
      `<br/>① 写出这对力在圆盘上的几何位置和作用线，并证明合力为零；` +
      `<br/>② 推导该力偶产生的力偶矩（扭矩）M 的表达式，并给出数值；` +
      `<br/>③ 说明该扭矩如何等效为圆轴扭转中的外加扭矩，并指出其方向（用右手定则判断）。` +
      `<br/><br/>上方“圆盘力偶”模型展示了两个切向力在圆盘上形成纯转动扭矩的情形。`;
  } else if (currentModelId === "multi-force-panel") {
    gqLabel.textContent = "自动生成 · 多力门板合力与支反力";
    gqStem.innerHTML =
      `一扇门宽 L = ${L.toFixed(
        2
      )} m，铰链位于左侧 O 点。门板上受多个外力（如图），其中典型外力大小约 F = ${load.toFixed(
        0
      )} N。` +
      `<br/>① 画出门板的完整受力图，给出各外力的坐标与方向；` +
      `<br/>② 将所有外力化简为关于 O 点的合力 FR 和合矩 MO；` +
      `<br/>③ 根据所有x方向力的和 = 0，所有y方向力的和 = 0，所有力矩的和 = 0 求出铰链处的支反力分量。` +
      `<br/><br/>上方“多力门板”模型展示了将复杂平面力系等效为 FR + MO 的几何关系。`;
  } else if (currentModelId === "point-kinematics-curve") {
    gqLabel.textContent = "自动生成 · 质点曲线运动 v/a 分解";
    gqStem.innerHTML =
      `某质点沿一平面曲线运动，可近似看作半径 R = ${L.toFixed(
        2
      )} m 的圆弧运动，当前速度大小约 v = ${load.toFixed(
        2
      )} m/s。` +
      `<br/>① 写出该点的切向加速度 aₜ 和法向加速度 aₙ 的表达式；` +
      `<br/>② 当速度大小保持恒定时，说明 aₜ 与 aₙ 分别为何；` +
      `<br/>③ 若速度由 v 匀加速到 2v，求此过程中某一时刻 aₜ、aₙ 的大小关系。` +
      `<br/><br/>上方“质点曲线运动”模型中，拖动曲线上的点可以直观看到速度方向与加速度分解的几何含义。`;
  } else if (currentModelId === "rigid-fixed-rotation") {
    gqLabel.textContent = "自动生成 · 刚体定轴转动角运动";
    gqStem.innerHTML =
      `一刚体绕固定轴作转动，其角位移 θ(t) 随时间变化如上方模型所示，可近似看作“先加速后减速”的匀变速组合过程。` +
      `<br/>① 写出角速度 ω(t) 与角加速度 α(t) 与 θ(t) 的一般关系；` +
      `<br/>② 若某一时间区间内角加速度近似为常数 α，推导 ω(t) 与 θ(t) 的时间表达式；` +
      `<br/>③ 结合本模型的曲线变化，说明“角速度图的面积”等于角位移增量、“角加速度图的面积”等于角速度增量。`;
  } else if (currentModelId === "composite-point-motion") {
    gqLabel.textContent = "自动生成 · 点的合成运动 v = v牵 + v相";
    gqStem.innerHTML =
      `在一条水平直线轨道上，平台以速度 v牵 沿 X 轴平移；在平台内部，一质点沿竖直导轨以速度 v相 运动，如上方模型所示。` +
      `<br/>① 在绝对参考系中画出 v牵、v相 与合成速度 v 的速度三角形；` +
      `<br/>② 写出速度合成公式 v = v牵 + v相（矢量相加），并给出速度大小的关系；` +
      `<br/>③ 若 v牵 = 2 m/s, v相 = 1 m/s 且两者正交，求合成速度的大小与方向。` +
      `<br/><br/>上方“点的合成运动”模型中，平台和平动与质点相对运动同时进行，实时展示三矢量的关系。`;
  } else if (currentModelId === "particle-newton-2d") {
    const mass = Number(document.getElementById("input-L")?.value || 1.0);
    const F0 = Number(document.getElementById("input-load")?.value || 5.0);
    gqLabel.textContent = "自动生成 · 质点动力学基本方程 F = ma";
    gqStem.innerHTML =
      `一质点放置在水平光滑轨道上的小车中，质点质量 m = ${mass.toFixed(
        1
      )} kg，小车受到沿 x 轴方向的合外力 F(t) = F₀ sin(ωt)，其中 F₀ = ${F0.toFixed(1)} N，ω = 1.0 rad/s，如上方模型所示。` +
      `<br/>① 写出质点在 x 方向的动力学基本方程 F = ma，并说明各项物理意义；` +
      `<br/>② 推导加速度 a(t)、速度 v(t) 与位移 x(t) 的时间关系（可写出积分形式）；` +
      `<br/>③ 若 F₀ = ${F0.toFixed(1)} N，m = ${mass.toFixed(1)} kg，求加速度的最大值 a_max；` +
      `<br/>④ 结合上方模型中 F(t) 与 a(t) 的同步变化，说明为什么 F 与 a 成正比、与速度和位移是“通过时间积分”联系在一起的。` +
      `<br/><br/>上方“质点平动 F = ma”模型中，小车的受力箭头和加速度箭头随时间自动变化，HUD 实时给出 F(t)、a(t)、v(t)、x(t) 的数值。可通过参数区调整 m 和 F₀ 的值，观察模型的变化。`;
  } else if (currentModelId === "polar-dynamics") {
    const mass = Number(document.getElementById("input-L")?.value || 1.0);
    const Fr0 = Number(document.getElementById("input-load")?.value || 5.0);
    gqLabel.textContent = "自动生成 · 极坐标下的动力学基本方程";
    gqStem.innerHTML =
      `一质点在极坐标系中运动，质点质量 m = ${mass.toFixed(1)} kg，极径 r(t) 和极角 θ(t) 随时间变化，如上方模型所示。` +
      `<br/>① 写出极坐标下的位置矢量 r = r·er，并说明 er 和 eθ 的含义；` +
      `<br/>② 推导极坐标下的速度 v = vr·er + vθ·eθ，其中 vr = dr/dt，vθ = r·dθ/dt；` +
      `<br/>③ 推导极坐标下的加速度分量：ar = d²r/dt² - r(dθ/dt)²，aθ = r·d²θ/dt² + 2(dr/dt)(dθ/dt)；` +
      `<br/>④ 若径向力 Fr = ${Fr0.toFixed(1)} N，横向力 Fθ = 0，写出极坐标下的动力学基本方程 Fr = m·ar，Fθ = m·aθ，并说明各项的物理意义；` +
      `<br/>⑤ 结合上方模型中 r(t) 和 θ(t) 的变化，说明 ar 中的 -r(dθ/dt)² 项（向心加速度）和 aθ 中的 2(dr/dt)(dθ/dt) 项（科氏加速度）的来源。` +
      `<br/><br/>上方“极坐标下的动力学”模型中，质点位置、单位矢量 er/eθ、力分量 Fr/Fθ 和加速度分量 ar/aθ 随时间自动变化，HUD 实时显示 r、θ、ar、aθ 的数值。`;
  } else if (currentModelId === "noninertial-dynamics") {
    const mass = Number(document.getElementById("input-L")?.value || 1.0);
    const F0 = Number(document.getElementById("input-load")?.value || 3.0);
    gqLabel.textContent = "自动生成 · 非惯性系下的动力学基本方程";
    gqStem.innerHTML =
      `一质点位于一个加速运动的平台上（非惯性参考系），质点质量 m = ${mass.toFixed(1)} kg，平台加速度为 a₀，如上方模型所示。` +
      `<br/>① 说明什么是惯性参考系和非惯性参考系；` +
      `<br/>② 推导非惯性系下的动力学基本方程：F - ma₀ = ma'，其中 F 是真实力，-ma₀ 是惯性力，a' 是相对加速度；` +
      `<br/>③ 若平台以加速度 a₀ = 2.0 m/s² 向右加速，质点受到向右的真实力 F = ${F0.toFixed(1)} N，求质点在非惯性系中的相对加速度 a'；` +
      `<br/>④ 说明惯性力的方向与平台加速度方向的关系，以及为什么在非惯性系中需要引入惯性力；` +
      `<br/>⑤ 若真实力 F = ${F0.toFixed(1)} N，平台加速度 a₀ = 2.0 m/s²，验证 F - ma₀ = ma' 是否成立。` +
      `<br/><br/>上方“非惯性系下的动力学”模型中，平台加速度 a₀、真实力 F、惯性力 -ma₀ 和相对加速度 a' 随时间自动变化，HUD 实时显示各量的数值。`;
  } else if (currentModelId === "impulse-momentum") {
    const mass = Number(document.getElementById("input-L")?.value || 1.0);
    const F0 = Number(document.getElementById("input-load")?.value || 20.0);
    gqLabel.textContent = "自动生成 · 动量定理 Δp = J";
    gqStem.innerHTML =
      `一质量 m = ${mass.toFixed(
        1
      )} kg 的小车在水平光滑轨道上，受到持续约 1.1 s 的半正弦脉冲力 F(t) = F₀ sin(πt/T)，0 < t < T，T ≈ 1.1 s，其中 F₀ = ${F0.toFixed(
        1
      )} N。` +
      `<br/>① 写出冲量表达式 J = ∫₀ᴺ F(t) dt，并给出本模型中 J 的数值（可视为半个正弦脉冲）；` +
      `<br/>② 用动量定理 Δp = J，估算脉冲结束瞬间小车速度增量 Δv = J/m；` +
      `<br/>③ 若在下一次脉冲前不再受力，小车的动量和速度将如何变化？若轨道有轻微阻尼，会发生什么变化；` +
      `<br/>④ 结合上方“动量定理”模型，观察 HUD 中冲量 J、动量 p、速度 v 的同步跳变，说明“瞬时大力 × 短时间”与“中等力 × 较长时间”在冲量上的等效性。` +
      `<br/><br/>上方模型采用自动脉冲力驱动小车，实时显示 F(t)、冲量 J、动量 p 与速度 v 的变化，可通过参数区修改 m 与 F₀ 观察响应。`;
  } else if (currentModelId === "two-body-collision") {
    const m1 = Number(document.getElementById("input-L")?.value || 1.0);
    const eInput = Number(document.getElementById("input-load")?.value || 8.0);
    const e = Math.max(0, Math.min(1.0, eInput / 10.0));
    const m2 = 1.0;
    const v1 = 2.0;
    const v2 = -1.5;
    gqLabel.textContent = "自动生成 · 两体碰撞与动量守恒";
    gqStem.innerHTML =
      `两小球在水平光滑轨道上发生碰撞，小球1质量 m₁ = ${m1.toFixed(1)} kg，初始速度 v₁ = ${v1.toFixed(1)} m/s（向右），小球2质量 m₂ = ${m2.toFixed(1)} kg，初始速度 v₂ = ${v2.toFixed(1)} m/s（向左），恢复系数 e = ${e.toFixed(2)}。` +
      `<br/>① 写出碰撞前系统的总动量 p = m₁v₁ + m₂v₂，并计算数值；` +
      `<br/>② 应用动量守恒定律 m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'，结合恢复系数 e = (v₂' - v₁')/(v₁ - v₂)，推导碰撞后速度 v₁' 和 v₂' 的表达式；` +
      `<br/>③ 代入数值计算 v₁' 和 v₂'，并验证碰撞后总动量是否等于碰撞前总动量；` +
      `<br/>④ 若 e = 1（完全弹性碰撞），说明动能是否守恒；若 e = 0（完全非弹性碰撞），说明两球碰撞后的速度关系；` +
      `<br/>⑤ 结合上方“两体碰撞”模型，观察碰撞前后总动量的变化，说明为什么动量守恒而动能不一定守恒。` +
      `<br/><br/>上方模型自动演示两球碰撞过程，实时显示碰撞前后总动量、速度变化和恢复系数的影响，可通过参数区调整 m₁ 和 e 观察不同情况。`;
  } else if (currentModelId === "angular-momentum-theorem") {
    const I = Number(document.getElementById("input-L")?.value || 0.5);
    const M0 = Number(document.getElementById("input-load")?.value || 2.0);
    gqLabel.textContent = "自动生成 · 动量矩定理 dL/dt = M";
    gqStem.innerHTML =
      `一刚体绕固定轴转动，转动惯量 I = ${I.toFixed(3)} kg·m²，受到周期性力矩 M(t) = M₀ sin(ωt)，其中 M₀ = ${M0.toFixed(1)} N·m，ω = 0.8 rad/s，如上方模型所示。` +
      `<br/>① 写出角动量 L 与转动惯量 I、角速度 ω 的关系式，并说明角动量的物理意义；` +
      `<br/>② 写出动量矩定理 dL/dt = M，并推导角加速度 α 与力矩 M 的关系；` +
      `<br/>③ 若初始角速度 ω₀ = 0，推导角速度 ω(t) 和角位移 θ(t) 的时间表达式（可写出积分形式）；` +
      `<br/>④ 若 M = 0（无外力矩），说明角动量守恒 L = Iω = 常数，并解释为什么转动惯量改变时角速度会相应改变；` +
      `<br/>⑤ 结合上方模型中 L、ω、M、α 的实时变化，说明动量矩定理与平动中 F = ma 的对应关系。` +
      `<br/><br/>上方模型自动演示转盘在周期性力矩作用下的转动，实时显示角动量 L、角速度 ω、力矩 M 和角加速度 α 的变化，可通过参数区调整 I 和 M₀ 观察响应。`;
  } else if (currentModelId === "spatial-force-system") {
    gqLabel.textContent = "自动生成 · 空间力系主矢/主矩";
    gqStem.innerHTML =
      `空间刚体O受到三条已知外力：F1 = ${load.toFixed(
        0
      )} N（作用线平行于x轴），F2 = ${(load * 0.8).toFixed(
        0
      )} N（作用线通过点A并指向z轴正向），F3 = ${(load * 1.2).toFixed(
        0
      )} N（作用线通过点B并指向向量(-1, 1, 0)）。` +
      `<br/>① 写出三条力的矢量表达式和作用点位置矢量ri；` +
      `<br/>② 计算主矢FR = 所有力的和，并给出其模值；` +
      `<br/>③ 计算主矩矢MO = 所有(ri × Fi)的和 的三个分量；` +
      `<br/>④ 判断该空间力系是否满足 所有力的和 = 0 与 所有力矩的和 = 0，如不满足，需要增加什么反力才能使刚体平衡？` +
      `<br/><br/>上方"空间力系"模型展示了多力作用下合力矢量与合力矩矢量的几何叠加。`;
  } else if (currentModelId === "plane-force-system-simplification") {
    gqLabel.textContent = "自动生成 · 平面力系简化";
    gqStem.innerHTML =
      `一刚体受平面力系作用：F1 = ${load.toFixed(0)} N（方向已知），F2 = ${(load * 1.2).toFixed(0)} N，F3 = ${(load * 0.8).toFixed(0)} N，各力的作用位置已知。` +
      `<br/>① 选择简化中心O，计算主矢FR = 所有力的和；` +
      `<br/>② 计算主矩MO = 所有力矩的和（所有力对O点的力矩之和）；` +
      `<br/>③ 说明平面力系简化的意义，并解释如何利用主矢和主矩建立平衡条件。` +
      `<br/><br/>上方"平面力系简化"模型演示了主矢和主矩的概念。`;
  } else if (currentModelId === "friction-slope") {
    const alphaDeg = Number(document.getElementById("input-L")?.value || 30);
    const mu = Number(document.getElementById("input-E")?.value || 0.4);
    const alphaRad = (alphaDeg * Math.PI) / 180;
    const tanAlpha = Math.tan(alphaRad);
    const isLocked = mu >= tanAlpha;
    gqLabel.textContent = "自动生成 · 斜面摩擦与自锁";
    gqStem.innerHTML =
      `一质量为 m 的滑块置于与水平夹角 α = ${alphaDeg.toFixed(0)}° 的粗糙斜面上，静摩擦系数 μ = ${mu.toFixed(2)}。` +
      `<br/>① 画出滑块受力图并写出沿斜面和垂直斜面的平衡方程；` +
      `<br/>② 计算 tanα = ${tanAlpha.toFixed(3)}，判断在无外力作用时是否满足自锁条件 μ ≥ tanα（当前：μ = ${mu.toFixed(2)} ${isLocked ? '≥' : '<'} tanα = ${tanAlpha.toFixed(3)}，${isLocked ? '满足自锁条件' : '不满足自锁条件'}）；` +
      `<br/>③ 若 μ < tanα，需要沿斜面向上的最小拉力 Pmin 是多少才能阻止滑动？` +
      `<br/><br/>上方"斜面摩擦"模型可帮助你理解重力分解、法向力、静摩擦力及摩擦锥的几何意义。可通过参数区调整 α 和 μ 的值，观察自锁条件的变化。`;
  } else if (currentModelId === "rotating-collision") {
    const I1 = L;
    const I2 = load;
    const omega1 = Number(document.getElementById("input-omega")?.value || 2.0);
    const omega2 = Number(document.getElementById("input-crank-r")?.value || -1.0);
    const e = Number(document.getElementById("input-rod-l")?.value || 0.8);
    gqLabel.textContent = "自动生成 · 转动碰撞 · 角动量守恒";
    gqStem.innerHTML =
      `两个圆盘绕同一转轴转动，圆盘1转动惯量 I₁ = ${I1.toFixed(
        2
      )} kg·m²，初始角速度 ω₁ = ${omega1.toFixed(
        2
      )} rad/s，圆盘2转动惯量 I₂ = ${I2.toFixed(
        2
      )} kg·m²，初始角速度 ω₂ = ${omega2.toFixed(
        2
      )} rad/s。两圆盘发生碰撞，恢复系数 e = ${e.toFixed(2)}。` +
      `<br/>① 写出碰撞前后系统角动量守恒方程：I₁ω₁ + I₂ω₂ = I₁ω₁' + I₂ω₂'；② 写出恢复系数表达式：e = (ω₂' - ω₁')/(ω₁ - ω₂)；③ 联立求解碰撞后两圆盘的角速度 ω₁' 和 ω₂'；④ 计算碰撞前后系统总角动量的变化。` +
      `<br/><br/>可在上方"转动碰撞"可视化中观察碰撞过程，理解角动量守恒和恢复系数的概念。`;
  } else if (currentModelId === "oblique-collision") {
    const m1 = L;
    const m2 = load;
    const v1 = Number(document.getElementById("input-omega")?.value || 3.0);
    const v2 = Number(document.getElementById("input-crank-r")?.value || 2.0);
    const e = Number(document.getElementById("input-rod-l")?.value || 0.7);
    gqLabel.textContent = "自动生成 · 斜碰撞 · 动量分解";
    gqStem.innerHTML =
      `两小球发生斜碰撞，小球1质量 m₁ = ${m1.toFixed(
        1
      )} kg，速度 v₁ = ${v1.toFixed(
        1
      )} m/s，小球2质量 m₂ = ${m2.toFixed(
        1
      )} kg，速度 v₂ = ${v2.toFixed(
        1
      )} m/s。碰撞面与水平方向夹角为 30°，恢复系数 e = ${e.toFixed(2)}。` +
      `<br/>① 将两球的速度分解为法向分量（垂直于碰撞面）和切向分量（平行于碰撞面）；② 写出法向动量守恒方程；③ 利用恢复系数 e = (v₂n' - v₁n')/(v₁n - v₂n) 求解碰撞后法向速度；④ 若切向无摩擦，说明切向速度如何变化；⑤ 计算碰撞后两球的总速度。` +
      `<br/><br/>可在上方"斜碰撞"可视化中观察速度分解和碰撞过程，理解动量分解和恢复系数的概念。`;
  } else if (currentModelId === "simple-harmonic-oscillator") {
    const m = L;
    const k = load;
    const omega = Math.sqrt(k / m);
    gqLabel.textContent = "自动生成 · 简谐振动 · 单自由度";
    gqStem.innerHTML =
      `一弹簧振子系统，质量 m = ${m.toFixed(2)} kg，弹簧常数 k = ${k.toFixed(1)} N/m。` +
      `<br/>① 计算系统的固有频率 ω = √(k/m) = ${omega.toFixed(2)} rad/s；` +
      `<br/>② 写出简谐振动方程 x(t) = A·cos(ωt + φ)，说明A和φ的物理意义；` +
      `<br/>③ 推导速度 v(t) 和加速度 a(t) 的表达式；` +
      `<br/>④ 说明简谐振动的能量如何随时间变化（动能和势能）。` +
      `<br/><br/>可在上方"简谐振动"可视化中观察振子的运动，理解位移、速度、加速度的相位关系。`;
  } else if (currentModelId === "damped-vibration") {
    const m = L;
    const k = load;
    const c = Number(document.getElementById("input-omega")?.value || 1.0);
    const omega0 = Math.sqrt(k / m);
    const zeta = c / (2 * Math.sqrt(m * k));
    gqLabel.textContent = "自动生成 · 阻尼振动 · 衰减";
    gqStem.innerHTML =
      `一阻尼振动系统，质量 m = ${m.toFixed(2)} kg，弹簧常数 k = ${k.toFixed(1)} N/m，阻尼系数 c = ${c.toFixed(2)} N·s/m。` +
      `<br/>① 计算固有频率 ω₀ = √(k/m) = ${omega0.toFixed(2)} rad/s；` +
      `<br/>② 计算阻尼比 ζ = c/(2√(mk)) = ${zeta.toFixed(3)}，判断系统属于欠阻尼、临界阻尼还是过阻尼；` +
      `<br/>③ 写出阻尼振动的位移表达式 x(t) = A·e^(-ζω₀t)·cos(ωdt + φ)，其中 ωd = ω₀√(1-ζ²)；` +
      `<br/>④ 说明阻尼对振动的影响，以及临界阻尼的意义。` +
      `<br/><br/>可在上方"阻尼振动"可视化中观察振动的衰减过程，理解阻尼比的影响。`;
  } else if (currentModelId === "forced-vibration") {
    const m = L;
    const k = load;
    const omega = Number(document.getElementById("input-omega")?.value || 3.0);
    const omega0 = Math.sqrt(k / m);
    const r = omega / omega0;
    gqLabel.textContent = "自动生成 · 受迫振动 · 共振";
    gqStem.innerHTML =
      `一受迫振动系统，质量 m = ${m.toFixed(2)} kg，弹簧常数 k = ${k.toFixed(1)} N/m，激振频率 ω = ${omega.toFixed(2)} rad/s。` +
      `<br/>① 计算固有频率 ω₀ = √(k/m) = ${omega0.toFixed(2)} rad/s；` +
      `<br/>② 计算频率比 r = ω/ω₀ = ${r.toFixed(2)}；` +
      `<br/>③ 写出受迫振动的振幅响应表达式 A(ω) = F₀/(m√((ω₀²-ω²)²+(2ζω₀ω)²))；` +
      `<br/>④ 说明当 ω = ω₀ 时发生共振，此时振幅最大；` +
      `<br/>⑤ 分析阻尼对共振振幅的影响。` +
      `<br/><br/>可在上方"受迫振动"可视化中观察振幅响应曲线，理解共振现象。`;
  } else if (currentModelId === "gyroscope-precession") {
    const I = L;
    const omega = load;
    const M = Number(document.getElementById("input-omega")?.value || 0.5);
    const L = I * omega;
    const Omega = M / L;
    gqLabel.textContent = "自动生成 · 陀螺进动 · 定点转动";
    gqStem.innerHTML =
      `一陀螺绕定点转动，转动惯量 I = ${I.toFixed(3)} kg·m²，自转角速度 ω = ${omega.toFixed(2)} rad/s，重力矩 M = ${M.toFixed(2)} N·m。` +
      `<br/>① 计算角动量 L = Iω = ${L.toFixed(2)} kg·m²/s；` +
      `<br/>② 推导进动角速度 Ω = M/L = ${Omega.toFixed(3)} rad/s；` +
      `<br/>③ 说明为什么力矩M垂直于角动量L时产生进动；` +
      `<br/>④ 分析进动角速度与自转角速度、重力矩的关系。` +
      `<br/><br/>可在上方"陀螺进动"可视化中观察进动过程，理解角动量和力矩的关系。`;
  } else if (currentModelId === "euler-angles") {
    const omega = Number(document.getElementById("input-omega")?.value || 1.0);
    gqLabel.textContent = "自动生成 · 欧拉角 · 刚体姿态";
    gqStem.innerHTML =
      `一刚体在空间中的姿态用欧拉角(φ, θ, ψ)描述，其中φ为进动角，θ为章动角，ψ为自转角。` +
      `<br/>① 说明欧拉角的定义，以及如何通过三次旋转确定刚体姿态；` +
      `<br/>② 写出欧拉角与方向余弦矩阵的关系；` +
      `<br/>③ 推导角速度在体坐标系中的分量表达式；` +
      `<br/>④ 说明欧拉角的奇异性问题（万向锁）。` +
      `<br/><br/>可在上方"欧拉角"可视化中观察刚体姿态的变化，理解三个角度的含义。`;
  } else if (currentModelId === "rocket-motion") {
    const m0 = L;
    const u = load;
    const dotM = Number(document.getElementById("input-omega")?.value || 5.0);
    gqLabel.textContent = "自动生成 · 火箭运动 · 变质量";
    gqStem.innerHTML =
      `一火箭初始质量 m₀ = ${m0.toFixed(2)} kg，喷流速度 u = ${u.toFixed(1)} m/s，质量流率 ṁ = ${dotM.toFixed(3)} kg/s。` +
      `<br/>① 写出火箭方程 m·dv/dt = -u·dm/dt；` +
      `<br/>② 推导速度表达式 v = u·ln(m₀/m)；` +
      `<br/>③ 计算推力 F = u·ṁ = ${(u * dotM).toFixed(1)} N；` +
      `<br/>④ 说明为什么火箭速度与喷流速度成正比，与质量比的对数成正比；` +
      `<br/>⑤ 分析多级火箭的优势。` +
      `<br/><br/>可在上方"火箭运动"可视化中观察火箭的加速过程，理解变质量系统的动力学。`;
  } else if (currentModelId === "variable-mass-system") {
    const m0 = L;
    const v = load;
    const dotM = Number(document.getElementById("input-omega")?.value || 0.5);
    const u = 1.0;
    const F = (v - u) * dotM;
    gqLabel.textContent = "自动生成 · 变质量系统 · 质量流";
    gqStem.innerHTML =
      `一变质量系统，初始质量 m₀ = ${m0.toFixed(2)} kg，速度 v = ${v.toFixed(2)} m/s，质量流率 ṁ = ${dotM.toFixed(3)} kg/s，相对速度 u = ${u.toFixed(1)} m/s。` +
      `<br/>① 写出变质量系统的动力学方程 F = m·dv/dt + (v - u)·dm/dt；` +
      `<br/>② 计算附加力 F附加 = (v - u)·ṁ = ${F.toFixed(2)} N；` +
      `<br/>③ 说明质量流入和流出时附加力的方向；` +
      `<br/>④ 分析质量流对系统运动的影响。` +
      `<br/><br/>可在上方"变质量系统"可视化中观察质量流的影响，理解附加力的产生。`;
  } else if (currentModelId === "simple-beam" || currentModelId === "cantilever-beam") {
    gqLabel.textContent = "自动生成 · 简支梁 / 悬臂梁内力分析";
    gqStem.innerHTML =
      `某简支梁跨长 L = ${L.toFixed(
        1
      )} m，全跨承受均布荷载 q = ${load.toFixed(
        0
      )} kN/m，梁材料弹性模量 E = ${E} MPa。` +
      `<br/>① 列写支座平衡方程，求出两端支反力；② 画出全梁剪力图和弯矩图；③ 写出跨中截面的弯矩表达式，并指出最大弯矩位置。` +
      `<br/><br/>可在上方“简支梁”可视化中调整 L 和 q，直观观察梁长变化与弯矩曲线“鼓起”程度之间的关系。`;
  } else if (currentModelId === "truss-basic") {
    gqLabel.textContent = "自动生成 · 平面桁架 · 节点法与截面法";
    gqStem.innerHTML =
      `如图所示为一平面静定桁架，总跨约 L = ${L.toFixed(
        1
      )} m，在若干节点施加竖向集中荷载，典型荷载级别约 P = ${load.toFixed(
        0
      )} kN。` +
      `<br/>① 画出整体受力图并利用平衡方程求支座反力；` +
      `<br/>② 采用节点法，从已知节点开始，逐节点列 ΣFx=0, ΣFy=0，求出各杆的轴力并用“拉(+)/压(-)”标注；` +
      `<br/>③ 针对指定几根中跨杆，改用截面法：选一截面一次切断不超过3根未知杆，列 ΣFx=0, ΣFy=0, ΣM=0 快速求出这些杆的轴力；` +
      `<br/>④ 判断哪几根杆最危险，并结合材料力学中的强度条件 σ = N/A ≤ [σ] 进行简单强度估算。` +
      `<br/><br/>可结合左侧“桁架与节点法”“截面法”概念卡，形成考试中的标准解题套路。`;
  } else if (currentModelId === "frame-basic") {
    gqLabel.textContent = "自动生成 · 刚架 · 内力图与节点平衡";
    gqStem.innerHTML =
      `某门式刚架总跨 L = ${L.toFixed(
        1
      )} m，梁上承受均布荷载 q = ${load.toFixed(
        0
      )} kN/m，立柱与基础刚接，梁柱刚接。材料弹性模量 E = ${E} MPa。` +
      `<br/>① 画出刚架整体受力图，写出平衡方程 ΣFx=0, ΣFy=0, ΣM=0，求出支座反力和端弯矩；` +
      `<br/>② 以梁为研究对象，沿梁长滑动截面，写出剪力 V(x) 和弯矩 M(x) 表达式，并画出梁的剪力图/弯矩图；` +
      `<br/>③ 在梁柱刚结节点处，写出节点的剪力平衡和弯矩平衡条件，说明各杆端内力之间的关系；` +
      `<br/>④ 讨论若增大柱高或改变边界条件（如将一端改为铰支），对内力分布的影响。` +
      `<br/><br/>上方复用“简支梁”可视化的内力图几何感受，可配合“刚架内力”概念卡加深理解。`;
  } else if (currentModelId === "indeterminate-beam") {
    gqLabel.textContent = "自动生成 · 超静定梁 · 力法 / 位移法与能量法";
    gqStem.innerHTML =
      `一连续梁总跨约 L = ${L.toFixed(
        1
      )} m，中间设置一个中间支座，形成一次超静定结构，梁上承受均布荷载 q = ${load.toFixed(
        0
      )} kN/m，材料弹性模量 E = ${E} MPa。` +
      `<br/>① 指出该结构的超静定次数，并说明多余约束力的选择原则；` +
      `<br/>② 采用力法：去掉中间支座得到基本体系，写出力法方程 δ11X1 + Δ1P = 0，说明各项物理意义；` +
      `<br/>③ 或采用位移法：以中间支座处转角或位移为未知量，列刚度方程 k11Δ1 + F1P = 0；` +
      `<br/>④ 讨论如何利用能量法（应变能或单位荷载法）计算中间支座处的位移，并据此完成超静定方程。` +
      `<br/><br/>配合左侧“力法 / 位移法 / 单位荷载法”概念关系，可以系统梳理超静定梁的求解思路。`;
  } else if (currentModelId === "influence-line-beam") {
    gqLabel.textContent = "自动生成 · 简支梁影响线与移动荷载";
    gqStem.innerHTML =
      `一简支梁跨长 L = ${L.toFixed(
        1
      )} m，自左向右有一辆总重 P ≈ ${load.toFixed(
        0
      )} kN 的车辆在梁上移动。` +
      `<br/>① 采用静力法或单位荷载法，画出左支座反力 RA、跨中弯矩 Mmid 等量的影响线；` +
      `<br/>② 给定车辆轴距及各轴载大小，利用影响线纵坐标与轴载的乘积求出 RA 和 Mmid 的最大值及对应的最不利位置；` +
      `<br/>③ 说明影响线与普通剪力图、弯矩图的区别：前者对应“单位荷载移动”，后者对应“给定荷载分布”；` +
      `<br/>④ 结合桥梁设计，讨论为什么需要用影响线而不是简单静载组合。` +
      `<br/><br/>上方“简支梁”图可作为几何示意，重点在右侧概念关系与计算步骤。`;
  } else if (currentModelId === "axial-bar") {
  } else if (currentModelId === "axial-bar") {
    gqLabel.textContent = "自动生成 · 拉压杆轴向变形";
    gqStem.innerHTML =
      `一根均匀圆截面拉压杆，长度 L = ${L.toFixed(
        1
      )} m，在一端受到轴向拉力 P = ${load.toFixed(
        0
      )} kN，截面面积已知，材料弹性模量 E = ${E} MPa。` +
      `<br/>① 写出杆内轴力和正应力的表达式；② 计算杆的轴向变形量；③ 判断该应力水平在工程上是否安全。` +
      `<br/><br/>后续可在“受拉压杆”可视化模型中，用颜色云图展示不同截面上的应力水平。`;
  } else if (currentModelId === "torsion-shaft") {
    gqLabel.textContent = "自动生成 · 圆轴扭转与剪应力";
    gqStem.innerHTML =
      `一根圆轴长度 L = ${L.toFixed(
        1
      )} m，一端固定，另一端施加扭矩 T = ${load.toFixed(
        0
      )} kN·m，材料剪切模量与许用剪应力已知。` +
      `<br/>① 写出轴内任意截面的剪应力公式；② 计算危险截面的最大剪应力并与许用值比较；③ 估算扭转角大小。` +
      `<br/><br/>后续 3D 场景将用渐变色云图和粒子流展示剪应力分布与扭转变形。`;
  } else if (currentModelId === "bending-beam") {
    gqLabel.textContent = "自动生成 · 梁的弯曲正应力 / 剪应力与挠度";
    gqStem.innerHTML =
      `一矩形截面简支梁，跨长 L = ${L.toFixed(
        1
      )} m，全跨均布荷载 q = ${load.toFixed(
        0
      )} kN/m，材料弹性模量 E = ${E} MPa，截面尺寸已知。` +
      `<br/>① 利用结构力学结果写出弯矩图 M(x)，并给出最大弯矩 Mmax；` +
      `<br/>② 按材料力学公式 σ = M·y/Iz 计算上下缘最大弯曲正应力，判断是否满足强度条件 σmax ≤ [σ]；` +
      `<br/>③ 估算跨中最大挠度 wmax，可用查表或积分挠曲线微分方程 d²w/dx² = M/(EI)；` +
      `<br/>④ 若在同样荷载下希望减小挠度，应优先增大哪一几何参数（如 I 或 L）？说明理由。` +
      `<br/><br/>本题把“内力图 → 应力 → 挠度”的完整链条串起来，是典型的材力-结力综合题。`;
  } else if (currentModelId === "combined-strength") {
    gqLabel.textContent = "自动生成 · 组合应力与强度理论应用";
    gqStem.innerHTML =
      `某梁-轴组合构件同时受轴向拉力 N ≈ ${(
        load * 2
      ).toFixed(0)} kN 和弯矩 M ≈ ${(load * L).toFixed(
        0
      )} kN·m，截面尺寸和材料许用应力已知。` +
      `<br/>① 分别写出轴向拉压和弯曲产生的正应力 σN = N/A、σM = M·y/Iz；` +
      `<br/>② 在危险纤维处叠加得到组合正应力 σ = σN + σM，并判断是否满足 σ ≤ [σ]；` +
      `<br/>③ 若同时存在扭矩 T，简要说明如何引入剪应力 τ 并构造等效应力（如 Mises 强度理论）；` +
      `<br/>④ 讨论在设计中如何根据强度条件反推所需截面尺寸。` +
      `<br/><br/>该题对应教材中典型的“拉弯组合 / 弯扭组合”强度校核。`;
  } else if (currentModelId === "energy-methods-ml") {
    gqLabel.textContent = "自动生成 · 能量法 / 卡氏定理 / 单位荷载法";
    gqStem.innerHTML =
      `一静定梁跨长 L = ${L.toFixed(
        1
      )} m，在跨中受集中力 P = ${load.toFixed(
        0
      )} kN 作用，材料弹性模量 E = ${E} MPa，截面惯性矩 Iz 已知。` +
      `<br/>① 写出该梁在荷载作用下的弯矩图 M(x)；` +
      `<br/>② 用弯曲应变能表达式 U = ∫M²/(2EI)dx 计算总应变能；` +
      `<br/>③ 根据卡氏定理 δP = ∂U/∂P 推导跨中挠度表达式，并与查表公式进行对比；` +
      `<br/>④ 改用单位荷载法，在跨中施加单位竖向力，写出 M̄(x)，验证位移积分公式 Δ = ∫(M·M̄)/(EI)dx。` +
      `<br/><br/>本题串联了“应变能 → 卡氏定理 → 单位荷载法”三种常考能量方法。`;
  } else if (currentModelId === "point-kinematics-coordinates") {
    gqLabel.textContent = "自动生成 · 点的运动学坐标法";
    gqStem.innerHTML =
      `一质点在平面内运动，其运动方程为 x(t) = 2t, y(t) = t²（单位：m, s）。` +
      `<br/>① 用直角坐标法，写出位置矢量 r(t) = x(t)i + y(t)j，并计算 t = 2 s 时的位置；` +
      `<br/>② 计算速度 v(t) = (dx/dt)i + (dy/dt)j，并计算 t = 2 s 时的速度大小和方向；` +
      `<br/>③ 将直角坐标转换为极坐标，写出极径 r 和极角 θ 的表达式；` +
      `<br/>④ 说明在什么情况下选择直角坐标、极坐标或自然坐标更合适。` +
      `<br/><br/>上方"点的运动学坐标法"模型可帮助你理解不同坐标系的特点和应用。`;
  } else if (currentModelId === "rigid-body-translation") {
    gqLabel.textContent = "自动生成 · 刚体平移";
    gqStem.innerHTML =
      `一刚体在水平面上作平移运动，其质心加速度 a = 2 m/s²，初始速度 v₀ = 0。` +
      `<br/>① 说明刚体平移的特点：所有点的速度相同，所有点的加速度相同；` +
      `<br/>② 计算 t = 3 s 时刚体的速度 v 和位移 s；` +
      `<br/>③ 说明为什么可以用刚体上任意一点的运动来代表整个刚体的运动；` +
      `<br/>④ 比较刚体平移与刚体转动的区别。` +
      `<br/><br/>上方"刚体平移"模型可帮助你理解刚体平动的特点。`;
  } else if (currentModelId === "instantaneous-center-velocity") {
    gqLabel.textContent = "自动生成 · 速度瞬心法";
    gqStem.innerHTML =
      `一平面运动刚体，已知A点速度 vA = 2 m/s，A点到速度瞬心IC的距离 rA = 0.5 m，B点到速度瞬心IC的距离 rB = 1.0 m。` +
      `<br/>① 用速度瞬心法，计算刚体的角速度 ω = vA/rA；` +
      `<br/>② 计算B点的速度 vB = ω·rB；` +
      `<br/>③ 说明速度瞬心法的优点：如何通过瞬心快速确定各点速度；` +
      `<br/>④ 说明如何确定速度瞬心的位置（过已知两点速度方向作垂线，交点即为速度瞬心）。` +
      `<br/><br/>上方"速度瞬心法"模型可帮助你理解速度瞬心法的应用。`;
  } else if (currentModelId === "conservative-force-potential") {
    const mVal = Number(document.getElementById("input-L")?.value || 1.0);
    const g = 9.8;
    gqLabel.textContent = "自动生成 · 保守力场与势能";
    gqStem.innerHTML =
      `一质量 m = ${mVal.toFixed(2)} kg 的质点在重力场中运动，重力加速度 g = 9.8 m/s²。` +
      `<br/>① 说明什么是保守力，重力为什么是保守力；` +
      `<br/>② 写出重力势能表达式 U = mgh，并说明势能的参考点；` +
      `<br/>③ 说明机械能守恒条件：只有保守力做功时，T + U = 常数；` +
      `<br/>④ 若质点在高度 h = 10 m 处静止释放，计算落地时的速度（用机械能守恒）。` +
      `<br/><br/>上方"保守力场与势能"模型可帮助你理解势能、机械能守恒的概念。`;
  } else if (currentModelId === "virtual-work-constraint-reaction") {
    const pVal = Number(document.getElementById("input-L")?.value || 100.0);
    gqLabel.textContent = "自动生成 · 虚功原理求约束反力";
    gqStem.innerHTML =
      `一简支梁，跨度 L = 2.4 m，中点受集中荷载 P = ${pVal.toFixed(1)} N。` +
      `<br/>① 用虚位移原理求右端活动铰支座的约束反力RB：给系统一个虚位移，使右端向上移动δy；` +
      `<br/>② 建立虚功方程：P·δy - RB·δy = 0，求解RB；` +
      `<br/>③ 说明虚位移法的优点：可以单独求解某个约束反力，而不需要求解所有约束反力；` +
      `<br/>④ 比较虚位移法与平衡方程法的区别。` +
      `<br/><br/>上方"虚功原理应用"模型可帮助你理解如何用虚位移原理求解约束反力。`;
  } else if (currentModelId === "lagrange-pendulum") {
    const lVal = Number(document.getElementById("input-L")?.value || 1.0);
    const mVal = Number(document.getElementById("input-load")?.value || 1.0);
    gqLabel.textContent = "自动生成 · 拉格朗日方程·单摆";
    gqStem.innerHTML =
      `一单摆，摆长 l = ${lVal.toFixed(2)} m，摆球质量 m = ${mVal.toFixed(2)} kg，初始角度 θ₀ = 30°。` +
      `<br/>① 选择角度θ作为广义坐标，写出单摆的拉格朗日函数 L = T - U；` +
      `<br/>② 应用拉格朗日方程 d/dt(∂L/∂θ̇) = ∂L/∂θ，推导单摆的运动方程；` +
      `<br/>③ 在小角度近似下（sinθ ≈ θ），求解运动方程，得到简谐振动解；` +
      `<br/>④ 计算单摆的固有频率 ω₀ = √(g/l)，并说明拉格朗日方法的优点。` +
      `<br/><br/>上方"拉格朗日方程·单摆"模型可帮助你理解拉格朗日方程的应用。`;
  } else if (currentModelId === "hamilton-principle") {
    gqLabel.textContent = "自动生成 · 哈密顿原理";
    gqStem.innerHTML =
      `一质点在重力场中从A点运动到B点，有多种可能的路径。` +
      `<br/>① 写出作用量S = ∫L dt的定义，其中L = T - U是拉格朗日函数；` +
      `<br/>② 说明哈密顿原理：真实运动使作用量S取极值（通常是极小值）；` +
      `<br/>③ 用变分法说明，为什么真实路径（抛物线）的作用量小于其他路径；` +
      `<br/>④ 说明如何从哈密顿原理导出拉格朗日方程。` +
      `<br/><br/>上方"哈密顿原理"模型可帮助你理解最小作用量原理。`;
  } else if (currentModelId === "generalized-coordinates") {
    gqLabel.textContent = "自动生成 · 广义坐标";
    gqStem.innerHTML =
      `一质点在约束曲线 f(x,y) = 0 上运动，原本需要2个坐标(x,y)描述，但由于约束，只有1个自由度。` +
      `<br/>① 说明什么是广义坐标，为什么选择广义坐标可以简化问题；` +
      `<br/>② 对于约束曲线上的运动，如何选择广义坐标q（如弧长s或参数θ）；` +
      `<br/>③ 说明自由度DOF = 独立坐标数 - 约束数；` +
      `<br/>④ 写出广义力Q的定义，并说明如何从广义力计算约束反力。` +
      `<br/><br/>上方"广义坐标"模型可帮助你理解如何用广义坐标描述约束系统。`;
  } else if (currentModelId === "rotating-reference-frame") {
    gqLabel.textContent = "自动生成 · 旋转参考系·科氏力";
    gqStem.innerHTML =
      `一质点在以角速度ω = 2 rad/s旋转的平台上运动，质点质量 m = 1 kg，相对速度 v = 1 m/s（径向向外）。` +
      `<br/>① 写出科氏力表达式 F_c = -2m(ω×v)，计算科氏力的大小和方向；` +
      `<br/>② 写出离心力表达式 F_cent = -m(ω×(ω×r))，计算离心力的大小和方向；` +
      `<br/>③ 说明为什么在旋转参考系中需要引入这些惯性力；` +
      `<br/>④ 写出非惯性系中的动力学方程：F - ma₀ - 2m(ω×v) - m(ω×(ω×r)) = ma'。` +
      `<br/><br/>上方"旋转参考系·科氏力"模型可帮助你理解科氏力和离心力的效应。`;
  } else if (currentModelId === "accelerating-platform") {
    gqLabel.textContent = "自动生成 · 加速平台·惯性力";
    gqStem.innerHTML =
      `一质量 m = 1 kg 的质点在以加速度 a₀ = 2 m/s² 向右加速的平台上。` +
      `<br/>① 说明什么是惯性力，为什么在非惯性系中需要引入惯性力；` +
      `<br/>② 写出惯性力表达式 F_inertial = -ma₀，计算惯性力的大小和方向；` +
      `<br/>③ 写出非惯性系中的动力学方程：F - ma₀ = ma'，其中a'是相对加速度；` +
      `<br/>④ 若质点受到向右的真实力 F = 5 N，求质点在非惯性系中的相对加速度a'。` +
      `<br/><br/>上方"加速平台·惯性力"模型可帮助你理解惯性力的概念和应用。`;
  } else if (currentModelId === "work-energy") {
    const mVal = Number(document.getElementById("input-L")?.value || 1.0);
    const FVal = Number(document.getElementById("input-load")?.value || 20.0);
    gqLabel.textContent = "自动生成 · 动能定理 W = ΔT";
    gqStem.innerHTML =
      `一小车质量 m = ${mVal.toFixed(2)} kg，在水平无摩擦轨道上受恒力 F = ${FVal.toFixed(
        1
      )} N 推动，初速度可视为 0。` +
      `<br/>① 写出外力功 W = F·s 与动能增量 ΔT 的关系式：W = ΔT = ½ m v² - ½ m v₀²；` +
      `<br/>② 当位移 s = 0.5 m 时，求小车速度 v，并给出功与动能的数值；` +
      `<br/>③ 若轨道存在恒定阻力 R，占所施力 F 的 20%，说明非保守力对动能变化的影响；` +
      `<br/><br/>上方"动能定理"模型实时展示 W 与 ΔT 的同步变化，可调整 m、F 观察响应。`;
  } else if (currentModelId === "d-alembert-principle") {
    const mVal = Number(document.getElementById("input-L")?.value || 1.0);
    const FVal = Number(document.getElementById("input-load")?.value || 20.0);
    const aVal = FVal / mVal;
    gqLabel.textContent = "自动生成 · 达朗贝尔原理 · 惯性力系统";
    gqStem.innerHTML =
      `一小车质量 m = ${mVal.toFixed(2)} kg，在水平无摩擦轨道上受恒力 F = ${FVal.toFixed(
        1
      )} N 推动，产生加速度 a = ${aVal.toFixed(2)} m/s²。` +
      `<br/>① 写出动力学基本方程 F = ma；` +
      `<br/>② 应用达朗贝尔原理，引入惯性力 -ma，将动力学方程转化为静力学平衡方程 F - ma = 0；` +
      `<br/>③ 说明为什么引入惯性力后可以用静力学方法求解动力学问题；` +
      `<br/>④ 若轨道存在摩擦阻力 R = 5 N，写出包含惯性力的平衡方程。` +
      `<br/><br/>上方"达朗贝尔原理"模型实时展示真实力 F、惯性力 -ma 和加速度 a 的关系，直观展示 F - ma = 0 的平衡条件。`;
  } else if (currentModelId === "virtual-displacement-principle") {
    const m1Val = Number(document.getElementById("input-L")?.value || 2.0);
    const m2Val = Number(document.getElementById("input-load")?.value || 3.0);
    const g = 9.8;
    const F1 = m1Val * g;
    const F2 = m2Val * g;
    const L1 = 1.0; // 左端力臂（米）
    const L2 = 0.7; // 右端力臂（米）
    const moment1 = F1 * L1;
    const moment2 = F2 * L2;
    const isBalanced = Math.abs(moment1 - moment2) < 0.1;
    
    gqLabel.textContent = "自动生成 · 虚位移原理 · 虚功与平衡";
    gqStem.innerHTML =
      `一杠杆系统，左端质量 m₁ = ${m1Val.toFixed(2)} kg，右端质量 m₂ = ${m2Val.toFixed(2)} kg，` +
      `左端力臂 L₁ = ${L1.toFixed(1)} m，右端力臂 L₂ = ${L2.toFixed(1)} m。` +
      `<br/>① 计算左端重力 F₁ = m₁g = ${F1.toFixed(1)} N，右端重力 F₂ = m₂g = ${F2.toFixed(1)} N；` +
      `<br/>② 计算左端力矩 M₁ = F₁L₁ = ${moment1.toFixed(1)} N·m，右端力矩 M₂ = F₂L₂ = ${moment2.toFixed(1)} N·m，` +
      `判断杠杆是否平衡（当前：${isBalanced ? '平衡' : '不平衡'}）；` +
      `<br/>③ 用虚位移原理，给出一个虚位移（如左端向上虚位移δr₁，右端向下虚位移δr₂），` +
      `建立虚功方程 F₁·δr₁ + F₂·δr₂ = 0，说明平衡条件；` +
      `<br/>④ 说明为什么理想约束的约束反力在虚位移上不做功。` +
      `<br/><br/>上方"虚位移原理"模型可帮助你理解虚位移、虚功和理想约束的概念。`;
  } else {
    gqLabel.textContent = "自动生成 · 占位题目";
    gqStem.textContent = "根据当前参数自动生成题干的逻辑尚在扩展中。";
  }

  gqCard.classList.remove("hidden");
  
  // 重置DeepSeek解答区域
  const deepseekAnswer = document.getElementById("deepseek-answer");
  const deepseekContent = document.getElementById("deepseek-answer-content");
  const btnDeepseek = document.getElementById("btn-deepseek-solve");
  const btnDeepseekText = document.getElementById("btn-deepseek-text");
  const btnDeepseekLoading = document.getElementById("btn-deepseek-loading");
  if (deepseekAnswer) deepseekAnswer.style.display = "none";
  if (deepseekContent) deepseekContent.textContent = "";
  if (btnDeepseek) btnDeepseek.disabled = false;
  if (btnDeepseekText) btnDeepseekText.style.display = "inline";
  if (btnDeepseekLoading) btnDeepseekLoading.style.display = "none";
  // 自动切换到“例题练习”tab
  const examExampleTab = document.querySelector('.panel-tabs .tab-btn[data-q-tab="examples"]');
  if (examExampleTab) {
    qTabs.forEach((b) => b.classList.remove("tab-btn-active"));
    examExampleTab.classList.add("tab-btn-active");
    qpExamples.classList.remove("qp-body-hidden");
    qpExam.classList.add("qp-body-hidden");
  }
});

// 生成题目的模型选择变化时，同步可视化场景
if (questionModelSelect) {
  questionModelSelect.addEventListener("change", (e) => {
    const modelId = e.target.value;
    switchVisualByModel(modelId);
  });
}

// 门板 / 扳手 场景交互：拖动把手处的力，计算力臂和力矩
function initDoorLeverScene() {
  const svg = document.getElementById("door-lever-svg");
  const handle = document.getElementById("door-handle");
  const forceLine = document.getElementById("door-force");
  const hudArm = document.getElementById("hud-lever-arm");
  const hudMoment = document.getElementById("hud-lever-moment");
  if (!svg || !handle || !forceLine || !hudArm || !hudMoment) return;

  const pivot = { x: 75, y: 204 };
  let dragging = false;

  const updateForce = (x, y) => {
    const rect = svg.getBoundingClientRect();
    const px = x - rect.left;
    const py = y - rect.top;

    // 把手中心位置：限制在门板范围内
    const dx = px - pivot.x;
    const dy = py - pivot.y;
    const dist = Math.hypot(dx, dy) || 1;
    const maxR = 220; // 最大距离（门板宽度约210px）
    const r = Math.min(maxR, dist);
    const nx = pivot.x + (dx / dist) * r;
    const ny = Math.max(110, Math.min(290, pivot.y + (dy / dist) * r)); // 限制在门板高度内（y=110到290）

    // 更新把手位置
    handle.setAttribute("cx", nx);
    handle.setAttribute("cy", ny);

    // 力的方向：垂直于门板表面，指向开门方向（向右上方）
    // 门板表面方向：从铰链指向把手中心
    const doorSurfaceAngle = Math.atan2(ny - pivot.y, nx - pivot.x);
    const forceAngle = doorSurfaceAngle + Math.PI / 2; // 垂直于门板表面
    const forceLength = 50; // 力箭头长度
    const forceEndX = nx + Math.cos(forceAngle) * forceLength;
    const forceEndY = ny + Math.sin(forceAngle) * forceLength;

    // 更新力箭头
    forceLine.setAttribute("x1", nx);
    forceLine.setAttribute("y1", ny);
    forceLine.setAttribute("x2", forceEndX);
    forceLine.setAttribute("y2", forceEndY);

    // 计算力臂：力的作用线到铰链的垂直距离
    // 力的作用线通过 (nx, ny)，方向向量为 (cos(forceAngle), sin(forceAngle))
    // 点到直线的距离公式：d = |ax0 + by0 + c| / sqrt(a² + b²)
    // 直线方程：-sin(θ)(x - nx) + cos(θ)(y - ny) = 0
    // 标准化为：-sin(θ)x + cos(θ)y + sin(θ)nx - cos(θ)ny = 0
    const sinTheta = Math.sin(forceAngle);
    const cosTheta = Math.cos(forceAngle);
    const a = -sinTheta;
    const b = cosTheta;
    const c = sinTheta * nx - cosTheta * ny;
    
    // 点到直线距离
    const dPix = Math.abs(a * pivot.x + b * pivot.y + c) / Math.hypot(a, b);
    
    // 转换为实际单位（门板宽度约0.9m，SVG中约210px）
    const doorWidthM = 0.9; // m
    const doorWidthPix = 210; // px
    const scale = doorWidthM / doorWidthPix;
    const d = dPix * scale; // 力臂（m）
    
    // 获取力的大小
    const F = Number(document.getElementById("input-load")?.value || 20); // N
    
    // 计算力矩 M = F × d
    const M = F * d; // N·m

    // 更新HUD显示
    hudArm.textContent = d.toFixed(3) + " m";
    hudMoment.textContent = M.toFixed(2) + " N·m";
  };

  svg.addEventListener("mousedown", (e) => {
    dragging = true;
    updateForce(e.clientX, e.clientY);
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    updateForce(e.clientX, e.clientY);
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  // 初始状态：把手在门板右侧中间位置
  const initialHandleX = 270; // 距离铰链约195px，对应约0.84m
  const initialHandleY = 204; // 门板中间高度（与铰链同高）
  
  // 初始化时更新一次
  const updateInitial = () => {
    const rect = svg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      updateForce(rect.left + initialHandleX, rect.top + initialHandleY);
    } else {
      // 如果SVG还没渲染好，延迟一下
      setTimeout(updateInitial, 50);
    }
  };
  
  updateInitial();
  
  // 当力的大小改变时，重新计算力矩
  const loadInput = document.getElementById("input-load");
  if (loadInput) {
    loadInput.addEventListener("input", () => {
      if (!dragging) {
        const handle = document.getElementById("door-handle");
        if (handle) {
          const rect = svg.getBoundingClientRect();
          const cx = Number(handle.getAttribute("cx"));
          const cy = Number(handle.getAttribute("cy"));
          updateForce(rect.left + cx, rect.top + cy);
        }
      }
    });
  }
}

// DeepSeek 解答功能
const btnDeepseekSolve = document.getElementById("btn-deepseek-solve");
if (btnDeepseekSolve) {
  btnDeepseekSolve.addEventListener("click", async () => {
    const gqStem = document.getElementById("gq-stem");
    const gqLabel = document.getElementById("gq-subject-label");
    const deepseekAnswer = document.getElementById("deepseek-answer");
    const deepseekContent = document.getElementById("deepseek-answer-content");
    const btnDeepseekText = document.getElementById("btn-deepseek-text");
    const btnDeepseekLoading = document.getElementById("btn-deepseek-loading");
    
    if (!gqStem || !deepseekAnswer || !deepseekContent) return;
    
    // 获取题目内容
    const questionText = gqStem.textContent || gqStem.innerText;
    const subjectLabel = gqLabel?.textContent || "";
    
    if (!questionText || questionText.includes("这里将根据当前参数")) {
      alert("请先生成习题！");
      return;
    }
    
    // 禁用按钮，显示加载状态
    btnDeepseekSolve.disabled = true;
    if (btnDeepseekText) btnDeepseekText.style.display = "none";
    if (btnDeepseekLoading) btnDeepseekLoading.style.display = "inline";
    deepseekAnswer.style.display = "block";
    deepseekContent.textContent = "正在请求 DeepSeek 解答...";
    
    try {
      // 构建提示词
      const prompt = `你是一位力学教学专家，擅长解答理论力学、结构力学和材料力学的习题。请详细解答以下题目，要求：
1. 分步骤解答，逻辑清晰
2. 列出使用的公式和原理
3. 给出关键计算过程
4. 最后给出答案

题目：
${subjectLabel}
${questionText}

请开始解答：`;
      
      // 调用 DeepSeek API
      const apiKey = DEEPSEEK_CONFIG.API_KEY;
      if (!apiKey) {
        throw new Error("请在代码顶部配置 DeepSeek API Key（DEEPSEEK_CONFIG.API_KEY）");
      }
      
      const response = await fetch(DEEPSEEK_CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: DEEPSEEK_CONFIG.MODEL,
          messages: [
            {
              role: "system",
              content: "你是一位专业的力学教学专家，擅长解答理论力学、结构力学和材料力学的习题。请用中文详细解答，分步骤说明，列出公式和计算过程。"
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: DEEPSEEK_CONFIG.TEMPERATURE,
          max_tokens: DEEPSEEK_CONFIG.MAX_TOKENS
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "未能获取解答";
      
      // 显示解答
      deepseekContent.textContent = answer;
      
    } catch (error) {
      console.error("DeepSeek 解答失败:", error);
      deepseekContent.textContent = `解答失败: ${error.message}\n\n提示：\n1. 请确保已在代码顶部（main.js 文件开头）配置 DeepSeek API Key\n2. 检查网络连接\n3. 验证 API Key 是否有效\n4. 如果问题持续，请刷新页面重试`;
    } finally {
      // 恢复按钮状态
      btnDeepseekSolve.disabled = false;
      if (btnDeepseekText) btnDeepseekText.style.display = "inline";
      if (btnDeepseekLoading) btnDeepseekLoading.style.display = "none";
    }
  });
}

// “从例题打开可视化”占位逻辑
const btnOpenVisualFromQuestion = document.getElementById("btn-open-visual-from-question");
if (btnOpenVisualFromQuestion) {
  btnOpenVisualFromQuestion.addEventListener("click", () => {
    // 激活 2D 模型 tab
    const mode2dButton = document.querySelector('.tab-btn[data-mode="2d"]');
    if (mode2dButton) {
      modeButtons.forEach((b) => b.classList.remove("tab-btn-active"));
      mode2dButton.classList.add("tab-btn-active");
      visual2D.classList.add("active");
      visual3D.classList.remove("active");
    }
    alert("已切换至 2D 曲柄滑块示例。后续可在此位置根据题目参数自动调整机构尺寸与运动。");
  });
}

// 应试模板按钮占位
const btnExamTemplates = document.getElementById("btn-open-exam-templates");
btnExamTemplates.addEventListener("click", () => {
  // 切换右侧 tab
  const examTab = document.querySelector('.panel-tabs .tab-btn[data-q-tab="exam"]');
  if (examTab) {
    qTabs.forEach((b) => b.classList.remove("tab-btn-active"));
    examTab.classList.add("tab-btn-active");
    qpExam.classList.remove("qp-body-hidden");
    qpExamples.classList.add("qp-body-hidden");
  }
});

// 3D 场景占位：一个带科技线框切换的立方体
function initThreeScene() {
  const canvas = document.getElementById("three-canvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050814);

  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(3.2, 2.4, 3.2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const resizeRenderer = () => {
    const { clientWidth, clientHeight } = canvas;
    if (clientWidth === 0 || clientHeight === 0) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };
  resizeRenderer();

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  const ambient = new THREE.AmbientLight(0x3f4b5f, 0.9);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0x7c4dff, 1.0);
  dir.position.set(5, 6, 4);
  scene.add(dir);

  const geo = new THREE.BoxGeometry(1.6, 0.4, 0.4);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x29b6f6,
    metalness: 0.8,
    roughness: 0.25,
  });
  const beam = new THREE.Mesh(geo, mat);
  scene.add(beam);

  const edges = new THREE.EdgesGeometry(geo);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x7c4dff, linewidth: 2 });
  const wireframe = new THREE.LineSegments(edges, lineMat);
  scene.add(wireframe);

  // 科技线框模式：通过材质与线框可见性实现
  let wireframeMode = true;
  const toggleWireframe = (enable) => {
    wireframeMode = enable;
    wireframe.visible = enable;
    beam.material.wireframe = false;
    if (enable) {
      beam.material.color.set(0x263238);
      beam.material.emissive = new THREE.Color(0x29b6f6);
      beam.material.emissiveIntensity = 0.8;
    } else {
      beam.material.color.set(0x29b6f6);
      beam.material.emissive = new THREE.Color(0x000000);
      beam.material.emissiveIntensity = 0.0;
    }
  };
  toggleWireframe(true);

  const wireBtn = document.getElementById("btn-toggle-wireframe");
  if (wireBtn) {
    wireBtn.addEventListener("click", () => {
      toggleWireframe(!wireframeMode);
      wireBtn.textContent = wireframeMode ? "科技线框模式" : "发光实体模式";
    });
  }

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.01;
    beam.rotation.y = t * 0.6;
    wireframe.rotation.y = t * 0.6;
    const y = Math.sin(t) * 0.15;
    beam.position.y = y;
    wireframe.position.y = y;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", resizeRenderer);
}

// 2D 曲柄滑块：改为鼠标控制转动
function initCrankSliderInteraction() {
  const crankGroup = document.getElementById("crank-group");
  const rodSlider = document.getElementById("rod-slider");
  const sliderPath = document.getElementById("slider-path");
  if (!crankGroup || !rodSlider || !sliderPath) return;

  const centerX = 80;
  const centerY = 190; // 下移，避免与文字重合
  const railY = 194; // 下移，避免与文字重合
  const railMinX = 120;
  const railMaxX = 320;

  const crankLine = crankGroup.querySelector("line");
  const crankJoint = document.getElementById("crank-joint"); // 直接通过id获取
  const rodLine = rodSlider.querySelector("line");
  const sliderRect = document.getElementById("slider-rect"); // 直接通过id获取
  if (!crankLine || !crankJoint || !rodLine || !sliderRect) return;

  let lastCrankEndX = centerX;
  let lastCrankEndY = centerY;
  let lastSliderX = (railMinX + railMaxX) / 2;

  // 抽出更新函数，使用真正的几何方程计算
  updateCrankSlider = (theta, forceSliderX = null) => {
    const rInput = Number(document.getElementById("input-crank-r")?.value || 0.1);
    const lInput = Number(document.getElementById("input-rod-l")?.value || 0.4);
    const omegaInput = Number(document.getElementById("input-omega")?.value || 20);

    // 将真实尺寸缩放到 SVG 视觉长度
    const scale = 280; // 1 m -> 280 px 左右
    const r = Math.max(0.05, rInput) * scale;
    const l = Math.max(0.2, lInput) * scale;

    // 曲柄末端位置（基于 r 和 θ 的几何方程）
    const crankEndX = centerX + r * Math.cos(theta);
    const crankEndY = centerY - r * Math.sin(theta);

    // 滑块位置：基于几何约束方程 x = r*cos(θ) + sqrt(l² - (r*sin(θ))²)
    // 这是曲柄滑块的标准几何关系
    let sx;
    if (forceSliderX != null && !Number.isNaN(forceSliderX)) {
      // 如果强制指定滑块位置（拖动滑块时），则反算连杆角度
      sx = Math.max(railMinX, Math.min(railMaxX, forceSliderX));
    } else {
      // 否则根据几何方程计算
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const term = l * l - Math.pow(r * sinTheta, 2);
      if (term >= 0) {
        sx = centerX + r * cosTheta + Math.sqrt(term);
      } else {
        sx = centerX + r * cosTheta + l * 0.8; // 防止根号下为负
      }
      sx = Math.max(railMinX, Math.min(railMaxX, sx));
    }

    const sliderY = railY;

    // 更新曲柄线
    crankLine.setAttribute("x1", centerX);
    crankLine.setAttribute("y1", centerY);
    crankLine.setAttribute("x2", crankEndX);
    crankLine.setAttribute("y2", crankEndY);
    
    // 更新曲柄末端连接点（先更新实际控制点，再更新可见标记）
    crankJoint.setAttribute("cx", crankEndX);
    crankJoint.setAttribute("cy", crankEndY);
    const jointVisible = document.getElementById("crank-joint-visible");
    if (jointVisible) {
      // 确保标记和实际控制点完全对齐
      jointVisible.setAttribute("cx", crankEndX);
      jointVisible.setAttribute("cy", crankEndY);
    }

    // 更新连杆（从曲柄末端到滑块）
    rodLine.setAttribute("x1", crankEndX);
    rodLine.setAttribute("y1", crankEndY);
    rodLine.setAttribute("x2", sx);
    rodLine.setAttribute("y2", sliderY);

    // 滑块矩形：以 sx 为中心放置（先更新矩形位置）
    const rectWidth = Number(sliderRect.getAttribute("width")) || 52;
    sliderRect.setAttribute("x", sx - rectWidth / 2);
    sliderRect.setAttribute("y", sliderY - 16);
    
    // 更新滑块处的连接点标记（滑块中心位置，必须在矩形更新之后）
    const sliderJointVisible = document.getElementById("slider-joint-visible");
    if (sliderJointVisible) {
      // 滑块连接点在滑块矩形的中心，即 sx, sliderY（和矩形中心严格对齐）
      sliderJointVisible.setAttribute("cx", sx);
      sliderJointVisible.setAttribute("cy", sliderY);
    }

    // 轨迹高亮：更新末端点
    const pts = sliderPath.getAttribute("points").trim().split(" ");
    if (pts.length > 0) {
      const lastIndex = pts.length - 1;
      pts[lastIndex] = `${sx},${railY}`;
      sliderPath.setAttribute("points", pts.join(" "));
    }

    // 计算速度和加速度（基于几何方程对时间求导）
    const scaleBack = 1 / scale;
    const xLocal = (sx - centerX) * scaleBack;
    
    // 速度：v = dx/dt，对几何方程求导
    // x = r*cos(θ) + sqrt(l² - r²*sin²(θ))
    // v = -r*ω*sin(θ) - (r²*ω*sin(θ)*cos(θ)) / sqrt(l² - r²*sin²(θ))
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const sqrtTerm = Math.sqrt(Math.max(0, lInput * lInput - rInput * rInput * sinTheta * sinTheta));
    let v = 0;
    if (sqrtTerm > 1e-6) {
      v = -rInput * omegaInput * sinTheta - (rInput * rInput * omegaInput * sinTheta * cosTheta) / sqrtTerm;
    } else {
      v = -rInput * omegaInput * sinTheta;
    }
    
    // 加速度：a = dv/dt（简化版，占位）
    const a = -rInput * omegaInput * omegaInput * cosTheta; // 简化计算

    // 更新 HUD 数值
    if (hudThetaEl) {
      hudThetaEl.textContent = `${(theta * 180 / Math.PI).toFixed(1)}°`;
    }
    if (hudSliderEl) {
      hudSliderEl.textContent = `${xLocal.toFixed(2)} m`;
    }
    
    // 新增速度和加速度 HUD
    let hudVelocityEl = document.getElementById("hud-slider-velocity");
    let hudAccelEl = document.getElementById("hud-slider-accel");
    if (!hudVelocityEl) {
      const hud = document.querySelector('.scene-2d[data-scene-id="crank-slider"] .visual-hud');
      if (hud) {
        const vItem = document.createElement('div');
        vItem.className = 'hud-item';
        vItem.innerHTML = '<span class="hud-label">滑块速度 v</span><span class="hud-value" id="hud-slider-velocity">—</span>';
        hud.appendChild(vItem);
        hudVelocityEl = document.getElementById("hud-slider-velocity");
      }
    }
    if (!hudAccelEl) {
      const hud = document.querySelector('.scene-2d[data-scene-id="crank-slider"] .visual-hud');
      if (hud) {
        const aItem = document.createElement('div');
        aItem.className = 'hud-item';
        aItem.innerHTML = '<span class="hud-label">滑块加速度 a</span><span class="hud-value" id="hud-slider-accel">—</span>';
        hud.appendChild(aItem);
        hudAccelEl = document.getElementById("hud-slider-accel");
      }
    }
    if (hudVelocityEl) {
      hudVelocityEl.textContent = `${v.toFixed(2)} m/s`;
    }
    if (hudAccelEl) {
      hudAccelEl.textContent = `${a.toFixed(2)} m/s²`;
    }

    lastCrankEndX = crankEndX;
    lastCrankEndY = crankEndY;
    lastSliderX = sx;
  };

  // 鼠标拖动控制：按下在哪，哪一部分跟着动
  let currentTheta = Math.PI / 6;
  const svg = document.getElementById("crank-slider-svg");
  if (!svg) return;
  let dragging = false;
  let dragTarget = null; // 'crank' | 'slider' | null
  let sliderOffset = 0;
  let lastTime = 0;
  let autoPhase = 0;

  const getAngleFromEvent = (evt) => {
    const rect = svg.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    // 以曲柄旋转中心为参考，计算极角
    const dx = x - centerX;
    const dy = y - centerY;
    return Math.atan2(centerY - y, dx); // 上为正
  };

  svg.addEventListener("mousedown", (e) => {
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 使用实际控制点的位置（确保和连接点标记对齐）
    // 曲柄末端位置
    const jointCx = crankJoint ? Number(crankJoint.getAttribute("cx")) : lastCrankEndX;
    const jointCy = crankJoint ? Number(crankJoint.getAttribute("cy")) : lastCrankEndY;
    
    // 滑块中心位置
    const sliderCx = lastSliderX;
    const sliderCy = railY;

    const distCrank = Math.hypot(x - jointCx, y - jointCy);
    const distSlider = Math.hypot(x - sliderCx, y - sliderCy);
    const threshold = 25; // 连接点标记的半径约12px，阈值25px足够

    if (distCrank < threshold || distSlider < threshold) {
      dragging = true;
      if (distSlider < distCrank) {
        dragTarget = "slider";
        sliderOffset = sliderCx - x;
      } else {
        dragTarget = "crank";
      }
    } else {
      // 点击其他区域，默认拖动曲柄，避免“点不到”的感觉
      dragging = true;
      dragTarget = "crank";
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging || !dragTarget) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragTarget === "crank") {
      currentTheta = getAngleFromEvent(e);
      updateCrankSlider(currentTheta, null); // null 表示用几何方程计算滑块位置
    } else if (dragTarget === "slider") {
      const newSliderX = Math.max(railMinX, Math.min(railMaxX, x + sliderOffset));
      updateCrankSlider(currentTheta, newSliderX); // 强制指定滑块位置，会反算连杆角度
    }
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    dragTarget = null;
  });

  // 自动运动：未拖动时匀速转动并叠加轻微加减速
  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (!dragging) {
      autoPhase += dt;
      const omegaBase = Number(document.getElementById("input-omega")?.value || 20);
      const omegaEff = omegaBase * (1 + 0.2 * Math.sin(0.7 * autoPhase));
      currentTheta += (omegaEff * Math.PI / 180) * dt;
      updateCrankSlider(currentTheta, null);
    }

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);

  // 当 r、l、ω 改变时，保持当前角度重新绘制（使用几何方程）
  ["input-crank-r", "input-rod-l", "input-omega"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => {
        updateCrankSlider(currentTheta, null); // 使用几何方程计算滑块位置
      });
    }
  });

  // 初始化一副默认位置（确保连接点标记和实际位置对齐）
  updateCrankSlider(currentTheta, null);
}

// 简支梁 2D 可视化：根据 L 和荷载更新梁长与箭头
function initBeamScene() {
  const svg = document.getElementById("simple-beam-svg");
  const beamBar = document.getElementById("beam-bar");
  const loadGroup = document.getElementById("beam-load-group");
  const momentPath = document.getElementById("beam-moment");
  if (!svg || !beamBar || !loadGroup || !momentPath) return;

  const baseX1 = 60;
  const baseX2 = 340;
  const baseLen = baseX2 - baseX1;
  const beamY = 190; // 梁的y坐标，下移避免与文字重合

  updateBeamScene = () => {
    const L = Number(document.getElementById("input-L")?.value || 4.0);
    const load = Number(document.getElementById("input-load")?.value || 20);
    const Lclamp = Math.max(1, Math.min(10, L));
    const qclamp = Math.max(5, Math.min(60, load));

    // 显示跨度和荷载
    if (hudBeamLEl) hudBeamLEl.textContent = `${Lclamp.toFixed(1)} m`;
    if (hudBeamQEl) hudBeamQEl.textContent = `${qclamp.toFixed(0)} kN/m`;

    // 梁的有效显示长度：在 60~340 内按 L 缩放
    const scale = (0.5 + 0.5 * (Lclamp / 10));
    const half = (baseLen * scale) / 2;
    const mid = (baseX1 + baseX2) / 2;
    const x1 = mid - half;
    const x2 = mid + half;
    beamBar.setAttribute("x1", x1);
    beamBar.setAttribute("x2", x2);
    beamBar.setAttribute("y1", beamY);
    beamBar.setAttribute("y2", beamY);

    // 更新支座位置
    const leftSupport = svg.querySelector("polygon");
    if (leftSupport) {
      leftSupport.setAttribute("points", `${x1 - 8},${beamY} ${x1 + 8},${beamY} ${x1},${beamY + 20}`);
    }
    const rightSupports = svg.querySelectorAll("circle");
    if (rightSupports.length >= 2) {
      rightSupports[0].setAttribute("cx", x2 - 8);
      rightSupports[0].setAttribute("cy", beamY + 14);
      rightSupports[1].setAttribute("cx", x2 + 8);
      rightSupports[1].setAttribute("cy", beamY + 14);
    }

    // 均布荷载箭头重新分布在梁长上
    const arrows = loadGroup.querySelectorAll("line");
    const arrowHeads = loadGroup.querySelectorAll("polygon");
    const n = arrows.length;
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1);
      const ax = x1 + t * (x2 - x1);
      const ayTop = 150; // 下移，避免与文字重合
      const ayBottom = 180; // 下移，避免与文字重合
      const amp = 20 + (qclamp / 60) * 12; // 荷载越大箭头越长
      const arrowTop = ayBottom - amp;

      const line = arrows[i];
      line.setAttribute("x1", ax);
      line.setAttribute("x2", ax);
      line.setAttribute("y1", arrowTop);
      line.setAttribute("y2", ayBottom);

      const head = arrowHeads[i];
      head.setAttribute("points", `${ax},${ayBottom} ${ax - 4},${arrowTop + 6} ${ax + 4},${arrowTop + 6}`);
    }

    // 弯矩图简单放大：荷载越大曲线越"鼓"
    const ampM = 20 + (qclamp / 60) * 20;
    const momentY = beamY + 40; // 弯矩图在梁下方
    const d = `M ${x1} ${momentY} Q ${(x1 + x2) / 2} ${momentY + ampM} ${x2} ${momentY}`;
    momentPath.setAttribute("d", d);
  };

  // 绑定输入变化
  ["input-L", "input-load"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        if (typeof updateBeamScene === "function") updateBeamScene();
      });
    }
  });

  updateBeamScene();
}

// 斜面摩擦 2D 可视化：根据斜面角 α 和摩擦系数 μ 更新 HUD（目前不改变几何形状，仅做判定演示）
function initFrictionSlopeScene() {
  const svg = document.getElementById("friction-slope-svg");
  if (!svg) return;

  const gParallel = document.getElementById("friction-g-parallel");
  const gPerp = document.getElementById("friction-g-perp");
  const block = document.getElementById("friction-block");

  const updateScene = () => {
    const alphaRaw = Number(document.getElementById("input-L")?.value || 30);
    const muRaw = Number(document.getElementById("input-E")?.value || 0.4);
    const alpha = Math.max(0, Math.min(60, alphaRaw)); // 斜面角 0°~60°
    const mu = Math.max(0, Math.min(1.0, muRaw)); // μ 0~1 合理范围
    
    // 更新重力分解箭头
    const alphaRad = (alpha * Math.PI) / 180;
    const blockCenterX = 220;
    const blockCenterY = 220;
    
    // 沿斜面的分量（平行于斜面，向下）
    const gParallelLen = 30;
    const gParallelX = blockCenterX + gParallelLen * Math.cos(alphaRad);
    const gParallelY = blockCenterY + gParallelLen * Math.sin(alphaRad);
    
    // 垂直斜面的分量（垂直于斜面，指向斜面内部）
    const gPerpLen = 25;
    const gPerpX = blockCenterX - gPerpLen * Math.sin(alphaRad);
    const gPerpY = blockCenterY - gPerpLen * Math.cos(alphaRad);
    
    if (gParallel) {
      gParallel.setAttribute("x1", blockCenterX);
      gParallel.setAttribute("y1", blockCenterY);
      gParallel.setAttribute("x2", gParallelX);
      gParallel.setAttribute("y2", gParallelY);
    }
    
    if (gPerp) {
      gPerp.setAttribute("x1", blockCenterX);
      gPerp.setAttribute("y1", blockCenterY);
      gPerp.setAttribute("x2", gPerpX);
      gPerp.setAttribute("y2", gPerpY);
    }
    
    updateFrictionSlopeHUD(alpha, mu);
  };

  const alphaInput = document.getElementById("input-L");
  const muInput = document.getElementById("input-E");
  if (alphaInput) {
    alphaInput.addEventListener("input", updateScene);
  }
  if (muInput) {
    muInput.addEventListener("input", updateScene);
  }

  updateScene();
}

// 更多摩擦副场景初始化（螺旋副、滚动摩擦、自锁机构）
function initFrictionMechanismsScene() {
  const svg = document.getElementById("friction-mechanisms-svg");
  if (!svg) return;

  const screwMechanism = document.getElementById("screw-mechanism");
  const rollingFriction = document.getElementById("rolling-friction");
  const wedgeMechanism = document.getElementById("wedge-mechanism");
  const tabScrew = document.getElementById("tab-screw");
  const tabRolling = document.getElementById("tab-rolling");
  const tabWedge = document.getElementById("tab-wedge");
  const hudType = document.getElementById("hud-friction-type");
  const hudParam = document.getElementById("hud-friction-param");
  const hudLockStatus = document.getElementById("hud-friction-lock-status");
  const screwLockStatus = document.getElementById("screw-lock-status");
  const wedgeLockStatus = document.getElementById("wedge-lock-status");

  let currentTab = "screw"; // 当前显示的标签页

  const switchTab = (tab) => {
    currentTab = tab;
    
    // 重置所有标签样式
    [tabScrew, tabRolling, tabWedge].forEach(t => {
      if (t) {
        t.setAttribute("fill", "rgba(255,255,255,0.05)");
        t.setAttribute("stroke", "rgba(255,255,255,0.3)");
      }
    });
    
    // 重置所有模型可见性
    if (screwMechanism) screwMechanism.setAttribute("opacity", "0");
    if (rollingFriction) rollingFriction.setAttribute("opacity", "0");
    if (wedgeMechanism) wedgeMechanism.setAttribute("opacity", "0");
    
    // 设置当前标签和模型
    if (tab === "screw") {
      if (tabScrew) {
        tabScrew.setAttribute("fill", "rgba(41,182,246,0.2)");
        tabScrew.setAttribute("stroke", "#29b6f6");
      }
      if (screwMechanism) {
        screwMechanism.setAttribute("opacity", "1");
        screwMechanism.setAttribute("style", "pointer-events: auto;");
      }
      if (hudType) hudType.textContent = "螺旋副";
      if (hudParam) hudParam.textContent = "导程角 λ";
      if (hudLockStatus) hudLockStatus.textContent = "自锁";
    } else if (tab === "rolling") {
      if (tabRolling) {
        tabRolling.setAttribute("fill", "rgba(41,182,246,0.2)");
        tabRolling.setAttribute("stroke", "#29b6f6");
      }
      if (rollingFriction) {
        rollingFriction.setAttribute("opacity", "1");
        rollingFriction.setAttribute("style", "pointer-events: auto;");
      }
      if (hudType) hudType.textContent = "滚动摩擦";
      if (hudParam) hudParam.textContent = "滚动摩阻系数 δ";
      if (hudLockStatus) hudLockStatus.textContent = "Mf = δ·N";
    } else if (tab === "wedge") {
      if (tabWedge) {
        tabWedge.setAttribute("fill", "rgba(41,182,246,0.2)");
        tabWedge.setAttribute("stroke", "#29b6f6");
      }
      if (wedgeMechanism) {
        wedgeMechanism.setAttribute("opacity", "1");
        wedgeMechanism.setAttribute("style", "pointer-events: auto;");
      }
      if (hudType) hudType.textContent = "自锁机构（楔块）";
      if (hudParam) hudParam.textContent = "楔角 α";
      if (hudLockStatus) hudLockStatus.textContent = "自锁";
    }
  };

  // 绑定标签点击事件
  if (tabScrew) {
    tabScrew.addEventListener("click", () => switchTab("screw"));
  }
  if (tabRolling) {
    tabRolling.addEventListener("click", () => switchTab("rolling"));
  }
  if (tabWedge) {
    tabWedge.addEventListener("click", () => switchTab("wedge"));
  }

  // 初始化显示螺旋副
  switchTab("screw");

  // 滚动摩擦动画
  const wheel = document.getElementById("rolling-wheel");
  const rollingMoment = document.getElementById("rolling-moment");
  let rollAngle = 0;
  let animId = null;

  const animate = () => {
    if (!isSceneVisible("friction-mechanisms")) {
      sceneAnimationRunning.set("friction-mechanisms", false);
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      return;
    }

    if (currentTab === "rolling" && wheel) {
      rollAngle += 0.02;
      const wheelX = 200 + Math.sin(rollAngle) * 50;
      const wheelY = 240;
      
      wheel.setAttribute("cx", wheelX);
      
      // 更新滚动阻力偶箭头位置
      if (rollingMoment) {
        const momentX = wheelX - 40;
        const momentY = wheelY;
        const arcStartX = momentX + 20 * Math.cos(rollAngle);
        const arcStartY = momentY + 20 * Math.sin(rollAngle);
        const arcEndX = momentX + 20 * Math.cos(rollAngle + 0.3);
        const arcEndY = momentY + 20 * Math.sin(rollAngle + 0.3);
        rollingMoment.setAttribute("d", `M ${arcStartX} ${arcStartY} A 20 20 0 0 1 ${arcEndX} ${arcEndY}`);
      }
    }

    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("friction-mechanisms", animId);
  };

  if (isSceneVisible("friction-mechanisms")) {
    sceneAnimationRunning.set("friction-mechanisms", true);
    animate();
  }
}

// 圆盘力偶 2D 可视化：根据 R 和 F 更新 HUD 和几何尺寸
function initDiskCoupleScene() {
  const svg = document.getElementById("disk-couple-svg");
  if (!svg) return;

  const diskCircle = document.getElementById("disk-circle");
  const forceTop = document.getElementById("disk-force-top");
  const forceBottom = document.getElementById("disk-force-bottom");

  const updateScene = () => {
    const Rraw = Number(document.getElementById("input-L")?.value || 0.2);
    const Fraw = Number(document.getElementById("input-load")?.value || 100);
    updateDiskCoupleHUD(Rraw, Fraw);

    // 将物理半径 R 和力 F 映射到图形尺度
    const Rclamp = Math.max(0.05, Math.min(1.0, Rraw));
    const Fclamp = Math.max(10, Math.min(1000, Fraw));

    // 圆盘半径：从 40 到 80 像素变化
    const rPx = 40 + (Rclamp - 0.05) / (1.0 - 0.05) * 40;
    if (diskCircle) {
      diskCircle.setAttribute("r", rPx.toString());
    }

    // 切向力箭头长度：随 F 增大而变长
    const len = 30 + (Fclamp - 10) / (1000 - 10) * 40; // 30~70 像素
    const cx = 200;
    const yTop = 80;
    const yBottom = 200;
    if (forceTop) {
      forceTop.setAttribute("x1", cx.toString());
      forceTop.setAttribute("y1", yTop.toString());
      forceTop.setAttribute("x2", (cx + len).toString());
      forceTop.setAttribute("y2", yTop.toString());
    }
    if (forceBottom) {
      forceBottom.setAttribute("x1", cx.toString());
      forceBottom.setAttribute("y1", yBottom.toString());
      forceBottom.setAttribute("x2", (cx - len).toString());
      forceBottom.setAttribute("y2", yBottom.toString());
    }
  };

  const Rinput = document.getElementById("input-L");
  const Finput = document.getElementById("input-load");
  if (Rinput) Rinput.addEventListener("input", updateScene);
  if (Finput) Finput.addEventListener("input", updateScene);

  updateScene();
}

function initMultiForcePanelScene() {
  const svg = document.getElementById("multi-force-panel-svg");
  if (!svg) return;

  const updateScene = () => {
    const Lraw = Number(document.getElementById("input-L")?.value || 0.9);
    const Fraw = Number(document.getElementById("input-load")?.value || 120);
    updateMultiForcePanelHUD(Lraw, Fraw);
  };

  const Linput = document.getElementById("input-L");
  const Finput = document.getElementById("input-load");
  if (Linput) Linput.addEventListener("input", updateScene);
  if (Finput) Finput.addEventListener("input", updateScene);

  updateScene();
}

function initConstraintTypesScene() {
  // 约束类型模型：更新约束反力箭头，使其围绕约束点旋转
  const fxLine = document.getElementById("constraint-fx");
  const fyLine = document.getElementById("constraint-fy");
  const rollerFyLine = document.getElementById("constraint-roller-fy");
  const fixedFxLine = document.getElementById("constraint-fixed-fx");
  const fixedFyLine = document.getElementById("constraint-fixed-fy");
  const fixedMLine = document.getElementById("constraint-fixed-m");
  
  if (!fxLine || !fyLine || !rollerFyLine || !fixedFxLine || !fixedFyLine || !fixedMLine) return;

  let t = 0;
  const animate = () => {
    t += 0.016;
    
    // 固定铰：Fx和Fy箭头围绕点(0,0)旋转（在translate(80, 230)的局部坐标系中）
    const angle1 = Math.sin(t * 0.5) * 0.3; // 小幅摆动
    const len1 = 25;
    fxLine.setAttribute("x1", "0");
    fxLine.setAttribute("y1", "0");
    fxLine.setAttribute("x2", (len1 * Math.cos(angle1)).toString());
    fxLine.setAttribute("y2", (len1 * Math.sin(angle1)).toString());
    
    fyLine.setAttribute("x1", "0");
    fyLine.setAttribute("y1", "0");
    fyLine.setAttribute("x2", (len1 * Math.cos(angle1 + Math.PI / 2)).toString());
    fyLine.setAttribute("y2", (len1 * Math.sin(angle1 + Math.PI / 2)).toString());
    
    // 活动铰：Fy箭头（垂直向上）
    const len2 = 25;
    rollerFyLine.setAttribute("x1", "0");
    rollerFyLine.setAttribute("y1", "0");
    rollerFyLine.setAttribute("x2", "0");
    rollerFyLine.setAttribute("y2", (-len2).toString());
    
    // 固定端：Fx、Fy和M箭头
    const angle2 = Math.sin(t * 0.4) * 0.2;
    const len3 = 25;
    fixedFxLine.setAttribute("x1", "0");
    fixedFxLine.setAttribute("y1", "0");
    fixedFxLine.setAttribute("x2", (len3 * Math.cos(angle2)).toString());
    fixedFxLine.setAttribute("y2", (len3 * Math.sin(angle2)).toString());
    
    fixedFyLine.setAttribute("x1", "0");
    fixedFyLine.setAttribute("y1", "0");
    fixedFyLine.setAttribute("x2", (len3 * Math.cos(angle2 + Math.PI / 2)).toString());
    fixedFyLine.setAttribute("y2", (len3 * Math.sin(angle2 + Math.PI / 2)).toString());
    
    // 力矩M（圆形箭头）
    const mRadius = 15;
    const mAngle = t * 0.3;
    fixedMLine.setAttribute("x1", (20 + mRadius * Math.cos(mAngle)).toString());
    fixedMLine.setAttribute("y1", (mRadius * Math.sin(mAngle)).toString());
    fixedMLine.setAttribute("x2", (20 + mRadius * Math.cos(mAngle + 0.3)).toString());
    fixedMLine.setAttribute("y2", (mRadius * Math.sin(mAngle + 0.3)).toString());
    
    requestAnimationFrame(animate);
  };
  
  animate();
}

function initRigidFixedRotationScene() {
  const rotor = document.getElementById("rigid-rotor");
  const pA = document.getElementById("rot-point-A");
  const pB = document.getElementById("rot-point-B");
  const pC = document.getElementById("rot-point-C");
  const hudTheta = document.getElementById("hud-rot-theta");
  const hudOmega = document.getElementById("hud-rot-omega");
  const hudAlpha = document.getElementById("hud-rot-alpha");
  if (!rotor || !pA || !pB || !pC || !hudTheta || !hudOmega || !hudAlpha) return;

  const cx = 200;
  const cy = 240;
  const rA = 60;
  const rB = 60;
  const rC = 45;
  const angA0 = 0;
  const angB0 = -Math.PI / 2;
  const angC0 = -3 * Math.PI / 4;

  let lastTime = 0;
  let theta = 0;
  let omega = 0;

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    const t = timestamp / 1000;
    const alpha = 1.0 * Math.sin(0.8 * t); // rad/s²
    omega += alpha * dt;
    const omegaBase = 1.5;
    const omegaEff = omegaBase + omega;
    theta += omegaEff * dt;

    const updatePoint = (el, r, ang0) => {
      const ang = ang0 + theta;
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      el.setAttribute("cx", x);
      el.setAttribute("cy", y);
    };

    updatePoint(pA, rA, angA0);
    updatePoint(pB, rB, angB0);
    updatePoint(pC, rC, angC0);

    hudTheta.textContent = `${(theta % (2 * Math.PI)).toFixed(2)} rad`;
    hudOmega.textContent = `${omegaEff.toFixed(2)} rad/s`;
    hudAlpha.textContent = `${alpha.toFixed(2)} rad/s²`;

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initCompositePointMotionScene() {
  const platform = document.getElementById("comp-platform");
  const rail = document.getElementById("comp-rail");
  const point = document.getElementById("comp-point");
  const vTrans = document.getElementById("comp-vtrans");
  const vRel = document.getElementById("comp-vrel");
  const vTot = document.getElementById("comp-vtot");
  const aRelLine = document.getElementById("comp-arel");
  const hudVTrans = document.getElementById("hud-comp-vtrans");
  const hudVRel = document.getElementById("hud-comp-vrel");
  const hudVTot = document.getElementById("hud-comp-v");
  const hudARel = document.getElementById("hud-comp-arel");
  const hudATot = document.getElementById("hud-comp-a");
  if (!platform || !rail || !point || !vTrans || !vRel || !vTot || !aRelLine || !hudVTrans || !hudVRel || !hudVTot || !hudARel || !hudATot) return;

  let lastTime = 0;
  let t = 0;

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    t += dt;

    const baseVTrans = 1.5; // m/s （取作平台平移速度幅值）
    const baseVRel = 1.0; // m/s （取作竖直相对速度幅值）
    const kTrans = 40; // 像素/秒
    const kRel = 35;

    const x0 = 120;
    const platWidth = 140;
    const xRange = 60;
    const xOffset = xRange * Math.sin(0.5 * t);

    const yMid = 230; // 下移，避免与文字重合
    const yRange = 20;
    const yOffset = yRange * Math.sin(1.1 * t);

    const xPlat = x0 + xOffset;

    platform.setAttribute("transform", `translate(${xOffset},0)`);
    rail.setAttribute("x1", (190 + xOffset).toString());
    rail.setAttribute("x2", (190 + xOffset).toString());

    const px = 190 + xOffset;
    const py = yMid + yOffset;
    point.setAttribute("cx", px);
    point.setAttribute("cy", py);

    // 牵连速度：沿 +X 方向，示意取常值
    const vTransPix = baseVTrans * kTrans;
    // 相对速度：沿竖直导轨方向，随时间按 cos 变化
    const vRelPix = baseVRel * kRel * Math.cos(1.1 * t);

    vTrans.setAttribute("x1", px);
    vTrans.setAttribute("y1", py);
    vTrans.setAttribute("x2", px + vTransPix * 0.03);
    vTrans.setAttribute("y2", py);

    vRel.setAttribute("x1", px);
    vRel.setAttribute("y1", py);
    vRel.setAttribute("x2", px);
    vRel.setAttribute("y2", py - vRelPix * 0.03);

    const vx = baseVTrans;
    const vy = baseVRel * Math.cos(1.1 * t);
    const vMag = Math.hypot(vx, vy);
    const angle = Math.atan2(-vy, vx);
    const lenTot = 60;

    vTot.setAttribute("x1", px);
    vTot.setAttribute("y1", py);
    vTot.setAttribute("x2", px + lenTot * Math.cos(angle));
    vTot.setAttribute("y2", py + lenTot * Math.sin(angle));

    // 相对加速度：a相 = dv相/dt，v相 = baseVRel * cos(1.1 t)  ⇒  a相 = - baseVRel * 1.1 * sin(1.1 t)
    const aRelVal = -baseVRel * 1.1 * Math.sin(1.1 * t); // m/s²，可正可负
    const aRelPix = aRelVal * kRel * 0.03;

    aRelLine.setAttribute("x1", px);
    aRelLine.setAttribute("y1", py);
    aRelLine.setAttribute("x2", px);
    aRelLine.setAttribute("y2", py - aRelPix);

    // 绝对加速度：这里只展示模长（主要让学生“看到在变”）
    const aTotMag = Math.abs(aRelVal);

    hudVTrans.textContent = `${baseVTrans.toFixed(2)} m/s`;
    hudVRel.textContent = `${Math.abs(vy).toFixed(2)} m/s`;
    hudVTot.textContent = `${vMag.toFixed(2)} m/s`;
    hudARel.textContent = `${Math.abs(aRelVal).toFixed(2)} m/s²`;
    hudATot.textContent = `${aTotMag.toFixed(2)} m/s²`;

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initParticleNewtonScene() {
  const cart = document.getElementById("particle-cart");
  const springLine = document.getElementById("particle-spring-line");
  const forceArrow = document.getElementById("particle-force");
  const accelArrow = document.getElementById("particle-accel");
  const hudM = document.getElementById("hud-part-m");
  const hudF = document.getElementById("hud-part-F");
  const hudA = document.getElementById("hud-part-a");
  const hudV = document.getElementById("hud-part-v");
  const hudX = document.getElementById("hud-part-x");
  if (!cart || !springLine || !forceArrow || !accelArrow || !hudM || !hudF || !hudA || !hudV || !hudX) return;

  let lastTime = 0;
  let t = 0;
  let x = 0; // m，相对于平衡位置
  let v = 0; // m/s

  const xMin = -0.5;
  const xMax = 0.5;
  const pxPerMeter = 160; // 视觉缩放

  const baseCartX = 120; // 与 SVG 中小车初始位置对应

  const updateHUD = (m, F, a, vVal, xVal) => {
    hudM.textContent = `${m.toFixed(1)} kg`;
    hudF.textContent = `${F.toFixed(1)} N`;
    hudA.textContent = `${a.toFixed(2)} m/s²`;
    hudV.textContent = `${vVal.toFixed(2)} m/s`;
    hudX.textContent = `${xVal.toFixed(2)} m`;
  };

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const mInput = Number(document.getElementById("input-L")?.value || 1.0);
    const fInput = Number(document.getElementById("input-load")?.value || 5.0);
    const m = Math.max(0.2, mInput);
    const F0 = Math.max(0, fInput);

    const omega = 1.0; // rad/s
    const F = F0 * Math.sin(omega * t);
    const a = F / m;

    v += a * dt;
    x += v * dt;

    if (x < xMin) {
      x = xMin;
      v = -v * 0.5;
    } else if (x > xMax) {
      x = xMax;
      v = -v * 0.5;
    }

    const dx = x * pxPerMeter;
    cart.setAttribute("transform", `translate(${dx},0)`);

    const springPts = [
      [80, 205],
      [90 + dx * 0.4, 205],
      [95 + dx * 0.5, 200],
      [100 + dx * 0.6, 210],
      [105 + dx * 0.7, 200],
      [110 + dx * 0.8, 210],
      [115 + dx * 0.9, 200],
      [120 + dx, 205],
    ]
      .map((p) => p.join(","))
      .join(" ");
    springLine.setAttribute("points", springPts);

    const cartCenterX = baseCartX + dx + 30;
    const cartCenterY = 205; // 下移，避免与文字重合

    const forceLen = 25 + Math.min(60, Math.abs(F) * 5);
    const signF = F >= 0 ? 1 : -1;
    forceArrow.setAttribute("x1", cartCenterX);
    forceArrow.setAttribute("y1", cartCenterY);
    forceArrow.setAttribute("x2", cartCenterX + signF * forceLen);
    forceArrow.setAttribute("y2", cartCenterY);

    const accelLen = 20 + Math.min(50, Math.abs(a) * 8);
    const signA = a >= 0 ? 1 : -1;
    accelArrow.setAttribute("x1", cartCenterX);
    accelArrow.setAttribute("y1", cartCenterY - 25);
    accelArrow.setAttribute("x2", cartCenterX + signA * accelLen);
    accelArrow.setAttribute("y2", cartCenterY - 25);

    updateHUD(m, F, a, v, x);

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initPolarDynamicsScene() {
  const particle = document.getElementById("polar-particle");
  const erLine = document.getElementById("polar-er");
  const erLabel = document.getElementById("polar-er-label");
  const ethetaLine = document.getElementById("polar-etheta");
  const ethetaLabel = document.getElementById("polar-etheta-label");
  const FrLine = document.getElementById("polar-Fr");
  const FthetaLine = document.getElementById("polar-Ftheta");
  const arLine = document.getElementById("polar-ar");
  const athetaLine = document.getElementById("polar-atheta");
  const hudR = document.getElementById("hud-polar-r");
  const hudTheta = document.getElementById("hud-polar-theta");
  const hudAr = document.getElementById("hud-polar-ar");
  const hudAtheta = document.getElementById("hud-polar-atheta");
  if (!particle || !erLine || !ethetaLine || !FrLine || !FthetaLine || !arLine || !athetaLine || !hudR || !hudTheta || !hudAr || !hudAtheta) return;

  const centerX = 200;
  const centerY = 190; // 下移，避免与文字重合
  let lastTime = 0;
  let t = 0;
  let r = 0.5; // m
  let theta = 0; // rad
  let vr = 0; // m/s
  let vtheta = 0; // rad/s

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    // 简化的极坐标运动：r 和 θ 都随时间变化
    r = 0.4 + 0.2 * Math.sin(0.8 * t);
    theta = 0.5 * t;
    vr = 0.2 * 0.8 * Math.cos(0.8 * t);
    vtheta = 0.5;

    // 极坐标下的加速度分量
    // ar = r'' - r(θ')²
    const rdd = -0.2 * 0.8 * 0.8 * Math.sin(0.8 * t);
    const ar = rdd - r * vtheta * vtheta;
    // aθ = rθ'' + 2r'θ'
    const thetadd = 0;
    const atheta = r * thetadd + 2 * vr * vtheta;

    // 更新位置
    const px = centerX + r * 100 * Math.cos(theta);
    const py = centerY - r * 100 * Math.sin(theta);

    particle.setAttribute("cx", px);
    particle.setAttribute("cy", py);

    // 更新单位矢量 er（径向）
    const erLen = 50;
    erLine.setAttribute("x1", px);
    erLine.setAttribute("y1", py);
    erLine.setAttribute("x2", px + erLen * Math.cos(theta));
    erLine.setAttribute("y2", py - erLen * Math.sin(theta));
    erLabel.setAttribute("x", px + erLen * Math.cos(theta) + 5);
    erLabel.setAttribute("y", py - erLen * Math.sin(theta) + 3);

    // 更新单位矢量 eθ（横向，垂直于er）
    const ethetaLen = 30;
    ethetaLine.setAttribute("x1", px);
    ethetaLine.setAttribute("y1", py);
    ethetaLine.setAttribute("x2", px - ethetaLen * Math.sin(theta));
    ethetaLine.setAttribute("y2", py - ethetaLen * Math.cos(theta));
    ethetaLabel.setAttribute("x", px - ethetaLen * Math.sin(theta) + 5);
    ethetaLabel.setAttribute("y", py - ethetaLen * Math.cos(theta) + 3);

    // 更新力矢量（示意：Fr 和 Fθ）
    const FrLen = 20 + Math.abs(ar) * 15;
    FrLine.setAttribute("x1", px);
    FrLine.setAttribute("y1", py);
    FrLine.setAttribute("x2", px - FrLen * Math.cos(theta));
    FrLine.setAttribute("y2", py + FrLen * Math.sin(theta));

    const FthetaLen = 20 + Math.abs(atheta) * 15;
    FthetaLine.setAttribute("x1", px);
    FthetaLine.setAttribute("y1", py);
    FthetaLine.setAttribute("x2", px - FthetaLen * Math.sin(theta));
    FthetaLine.setAttribute("y2", py - FthetaLen * Math.cos(theta));

    // 更新加速度矢量
    const arLen = 15 + Math.abs(ar) * 12;
    arLine.setAttribute("x1", px);
    arLine.setAttribute("y1", py);
    arLine.setAttribute("x2", px - arLen * Math.cos(theta));
    arLine.setAttribute("y2", py + arLen * Math.sin(theta));

    const athetaLen = 15 + Math.abs(atheta) * 12;
    athetaLine.setAttribute("x1", px);
    athetaLine.setAttribute("y1", py);
    athetaLine.setAttribute("x2", px - athetaLen * Math.sin(theta));
    athetaLine.setAttribute("y2", py - athetaLen * Math.cos(theta));

    // 更新 HUD
    hudR.textContent = `${r.toFixed(2)} m`;
    hudTheta.textContent = `${(theta * 180 / Math.PI).toFixed(1)}°`;
    hudAr.textContent = `${ar.toFixed(2)} m/s²`;
    hudAtheta.textContent = `${atheta.toFixed(2)} m/s²`;

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initNoninertialDynamicsScene() {
  const platform = document.getElementById("noninertial-platform");
  const particle = document.getElementById("noninertial-particle");
  const FLine = document.getElementById("noninertial-F");
  const inertialLine = document.getElementById("noninertial-inertial");
  const a0Line = document.getElementById("noninertial-a0");
  const hudA0 = document.getElementById("hud-noninertial-a0");
  const hudF = document.getElementById("hud-noninertial-F");
  const hudInertial = document.getElementById("hud-noninertial-inertial");
  const hudArel = document.getElementById("hud-noninertial-arel");
  if (!platform || !particle || !FLine || !inertialLine || !a0Line || !hudA0 || !hudF || !hudInertial || !hudArel) return;

  let lastTime = 0;
  let t = 0;
  const x0 = 120;
  const pxPerMeter = 100;

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    // 平台加速度 a0（非惯性系的加速度）
    const a0 = 2.0 * Math.sin(1.2 * t);
    const v0 = -2.0 / 1.2 * Math.cos(1.2 * t);
    const x0Pos = v0 * dt * pxPerMeter; // 简化：平台位置

    // 真实力 F（作用在质点上的真实外力）
    const F = 3.0 * Math.sin(0.8 * t);

    // 惯性力 -ma0（m = 1 kg）
    const m = 1.0;
    const Finertial = -m * a0;

    // 相对加速度 a'（在非惯性系中看到的加速度）
    const arel = (F - m * a0) / m; // F - ma0 = ma'

    // 更新平台位置
    platform.setAttribute("transform", `translate(${x0Pos},0)`);

    // 更新质点位置（相对于平台）
    const px = 190 + x0Pos;
    const py = 140;
    particle.setAttribute("cx", px);
    particle.setAttribute("cy", py);

    // 更新力矢量
    const FLen = 20 + Math.abs(F) * 8;
    FLine.setAttribute("x1", px);
    FLine.setAttribute("y1", py);
    FLine.setAttribute("x2", px + FLen);
    FLine.setAttribute("y2", py);

    // 更新惯性力矢量
    const inertialLen = 20 + Math.abs(Finertial) * 8;
    const signInertial = Finertial >= 0 ? 1 : -1;
    inertialLine.setAttribute("x1", px);
    inertialLine.setAttribute("y1", py);
    inertialLine.setAttribute("x2", px - signInertial * inertialLen);
    inertialLine.setAttribute("y2", py);

    // 更新平台加速度 a0
    const a0Len = 15 + Math.abs(a0) * 6;
    const signA0 = a0 >= 0 ? 1 : -1;
    a0Line.setAttribute("x1", px);
    a0Line.setAttribute("y1", py + 19);
    a0Line.setAttribute("x2", px + signA0 * a0Len);
    a0Line.setAttribute("y2", py + 19);

    // 更新 HUD
    hudA0.textContent = `${a0.toFixed(2)} m/s²`;
    hudF.textContent = `${F.toFixed(2)} N`;
    hudInertial.textContent = `${Finertial.toFixed(2)} N`;
    hudArel.textContent = `${arel.toFixed(2)} m/s²`;

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initImpulseMomentumScene() {
  const block = document.getElementById("impulse-block");
  const forceArrow = document.getElementById("impulse-force");
  const velArrow = document.getElementById("impulse-velocity");
  const impulseBar = document.getElementById("impulse-bar");
  const hudM = document.getElementById("hud-impulse-m");
  const hudJ = document.getElementById("hud-impulse-J");
  const hudP = document.getElementById("hud-impulse-p");
  const hudV = document.getElementById("hud-impulse-v");
  if (!block || !forceArrow || !velArrow || !impulseBar || !hudM || !hudJ || !hudP || !hudV) return;

  let lastTime = 0;
  let t = 0;
  let x = 0; // m，相对初始位置
  let v = 0; // m/s
  let J = 0; // N·s

  const baseLeft = 140; // 与 SVG 中方块的初始 x 对齐
  const baseCenterX = baseLeft + 40;
  const baseCenterY = 155;
  const pxPerMeter = 140;
  const xMin = -0.65;
  const xMax = 0.65;

  const updateHUD = (m, impulse, p, vval) => {
    hudM.textContent = `${m.toFixed(1)} kg`;
    hudJ.textContent = `${impulse.toFixed(2)} N·s`;
    hudP.textContent = `${p.toFixed(2)} kg·m/s`;
    hudV.textContent = `${vval.toFixed(2)} m/s`;
  };

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const mInput = Number(document.getElementById("input-L")?.value || 1.0);
    const fInput = Number(document.getElementById("input-load")?.value || 20.0);
    const m = Math.max(0.2, mInput);
    const F0 = Math.max(0, fInput);

    const cycle = 3.2; // s
    const pulse = 1.1; // s
    const phase = t % cycle;
    if (phase < dt * 1.2) {
      J = 0; // 每个循环开始时重置冲量累计，便于观察单次脉冲
    }
    let F = 0;
    if (phase < pulse) {
      const tau = phase / pulse;
      F = F0 * Math.sin(Math.PI * tau); // 平滑半正弦脉冲
    }

    const a = F / m;
    v += a * dt;
    x += v * dt;

    // 轻微阻尼，避免无限漂移
    v *= 0.995;

    if (x < xMin) {
      x = xMin;
      v = Math.abs(v) * 0.4;
    } else if (x > xMax) {
      x = xMax;
      v = -Math.abs(v) * 0.4;
    }

    J += F * dt;
    const p = m * v;

    const dx = x * pxPerMeter;
    block.setAttribute("transform", `translate(${dx},0)`);

    const blockLeft = baseLeft + dx;
    const blockCenterX = baseCenterX + dx;

    const forceLen = 18 + Math.min(80, Math.abs(F) * 2.6);
    const signF = F >= 0 ? 1 : -1;
    forceArrow.setAttribute("x1", blockLeft);
    forceArrow.setAttribute("y1", baseCenterY);
    forceArrow.setAttribute("x2", blockLeft - signF * forceLen);
    forceArrow.setAttribute("y2", baseCenterY);

    const velLen = 18 + Math.min(80, Math.abs(v) * 35);
    const signV = v >= 0 ? 1 : -1;
    velArrow.setAttribute("x1", blockCenterX);
    velArrow.setAttribute("y1", baseCenterY + 25);
    velArrow.setAttribute("x2", blockCenterX + signV * velLen);
    velArrow.setAttribute("y2", baseCenterY + 25);

    const barWidth = Math.min(180, Math.abs(J) * 32);
    impulseBar.setAttribute("width", barWidth);
    impulseBar.setAttribute("x", J >= 0 ? 40 : 40 - barWidth);

    updateHUD(m, J, p, v);

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initTwoBodyCollisionScene() {
  const ball1 = document.getElementById("collision-ball1");
  const ball2 = document.getElementById("collision-ball2");
  const ball1Label = document.getElementById("collision-ball1-label");
  const ball2Label = document.getElementById("collision-ball2-label");
  const v1Arrow = document.getElementById("collision-v1");
  const v2Arrow = document.getElementById("collision-v2");
  const v1Label = document.getElementById("collision-v1-label");
  const v2Label = document.getElementById("collision-v2-label");
  const ptotArrow = document.getElementById("collision-ptot");
  const hudM1 = document.getElementById("hud-collision-m1");
  const hudM2 = document.getElementById("hud-collision-m2");
  const hudE = document.getElementById("hud-collision-e");
  const hudPBefore = document.getElementById("hud-collision-p-before");
  const hudPAfter = document.getElementById("hud-collision-p-after");
  const hudV1After = document.getElementById("hud-collision-v1-after");
  const hudV2After = document.getElementById("hud-collision-v2-after");
  if (!ball1 || !ball2 || !v1Arrow || !v2Arrow || !ptotArrow || !hudM1 || !hudM2 || !hudE || !hudPBefore || !hudPAfter) return;

  const trackY = 180;
  const pxPerMeter = 200; // 视觉缩放
  let lastTime = 0;
  let t = 0;
  let x1 = -0.3; // m，小球1位置
  let x2 = 0.3; // m，小球2位置
  let v1 = 2.0; // m/s，小球1速度
  let v2 = -1.5; // m/s，小球2速度
  let collisionOccurred = false;
  let v1After = 0;
  let v2After = 0;

  const updateHUD = (m1, m2, e, pBefore, pAfter, v1a, v2a) => {
    hudM1.textContent = `${m1.toFixed(1)} kg`;
    hudM2.textContent = `${m2.toFixed(1)} kg`;
    hudE.textContent = e.toFixed(2);
    hudPBefore.textContent = `${pBefore.toFixed(2)} kg·m/s`;
    hudPAfter.textContent = `${pAfter.toFixed(2)} kg·m/s`;
    hudV1After.textContent = `${v1a.toFixed(2)} m/s`;
    hudV2After.textContent = `${v2a.toFixed(2)} m/s`;
  };

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const m1Input = Number(document.getElementById("input-L")?.value || 1.0);
    const eInput = Number(document.getElementById("input-load")?.value || 8.0);
    const m1 = Math.max(0.2, Math.min(3.0, m1Input));
    const m2 = 1.0; // 固定为1.0 kg
    const e = Math.max(0, Math.min(1.0, eInput / 10.0)); // 将输入范围0-10映射到0-1

    // 碰撞检测：两球中心距离小于半径之和
    const r1 = 0.1; // m
    const r2 = 0.1; // m
    const dist = Math.abs(x2 - x1);
    const collisionDist = r1 + r2;

    if (!collisionOccurred && dist < collisionDist) {
      // 发生碰撞
      collisionOccurred = true;
      // 动量守恒：m1*v1 + m2*v2 = m1*v1' + m2*v2'
      // 恢复系数：e = (v2' - v1') / (v1 - v2)
      // 解方程组得到：
      const vRel = v1 - v2; // 相对速度
      v1After = (m1 * v1 + m2 * v2 - m2 * e * vRel) / (m1 + m2);
      v2After = (m1 * v1 + m2 * v2 + m1 * e * vRel) / (m1 + m2);
      v1 = v1After;
      v2 = v2After;
    }

    // 更新位置
    x1 += v1 * dt;
    x2 += v2 * dt;

    // 边界反弹
    const xMin = -0.5;
    const xMax = 0.5;
    if (x1 < xMin) {
      x1 = xMin;
      v1 = Math.abs(v1);
      collisionOccurred = false;
    } else if (x1 > xMax) {
      x1 = xMax;
      v1 = -Math.abs(v1);
      collisionOccurred = false;
    }
    if (x2 < xMin) {
      x2 = xMin;
      v2 = Math.abs(v2);
      collisionOccurred = false;
    } else if (x2 > xMax) {
      x2 = xMax;
      v2 = -Math.abs(v2);
      collisionOccurred = false;
    }

    // 如果两球分离足够远，重置碰撞标志
    if (dist > collisionDist + 0.05) {
      collisionOccurred = false;
    }

    // 更新SVG位置
    const px1 = 200 + x1 * pxPerMeter;
    const px2 = 200 + x2 * pxPerMeter;
    ball1.setAttribute("cx", px1);
    ball1.setAttribute("cy", trackY);
    ball1Label.setAttribute("x", px1);
    ball2.setAttribute("cx", px2);
    ball2.setAttribute("cy", trackY);
    ball2Label.setAttribute("x", px2);

    // 更新速度箭头
    const v1Len = 20 + Math.abs(v1) * 15;
    const v1Sign = v1 >= 0 ? 1 : -1;
    v1Arrow.setAttribute("x1", px1);
    v1Arrow.setAttribute("y1", trackY - 30);
    v1Arrow.setAttribute("x2", px1 + v1Sign * v1Len);
    v1Arrow.setAttribute("y2", trackY - 30);
    v1Label.setAttribute("x", px1 + v1Sign * v1Len + 5);
    v1Label.setAttribute("y", trackY - 33);

    const v2Len = 20 + Math.abs(v2) * 15;
    const v2Sign = v2 >= 0 ? 1 : -1;
    v2Arrow.setAttribute("x1", px2);
    v2Arrow.setAttribute("y1", trackY - 30);
    v2Arrow.setAttribute("x2", px2 + v2Sign * v2Len);
    v2Arrow.setAttribute("y2", trackY - 30);
    v2Label.setAttribute("x", px2 + v2Sign * v2Len + 5);
    v2Label.setAttribute("y", trackY - 33);

    // 总动量箭头（在中心位置）
    const pTot = m1 * v1 + m2 * v2;
    const ptotLen = 15 + Math.abs(pTot) * 8;
    const ptotSign = pTot >= 0 ? 1 : -1;
    ptotArrow.setAttribute("x1", 200);
    ptotArrow.setAttribute("y1", trackY - 60);
    ptotArrow.setAttribute("x2", 200 + ptotSign * ptotLen);
    ptotArrow.setAttribute("y2", trackY - 60);

    // 计算碰撞前后的动量（用于显示）
    const pBefore = m1 * 2.0 + m2 * (-1.5); // 初始动量
    const pAfter = m1 * v1 + m2 * v2;

    updateHUD(m1, m2, e, pBefore, pAfter, v1After, v2After);

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initAngularMomentumTheoremScene() {
  const disk = document.getElementById("angmom-disk");
  const torqueArrow = document.getElementById("angmom-torque");
  const omegaArrow = document.getElementById("angmom-omega");
  const LArrow = document.getElementById("angmom-L");
  const hudI = document.getElementById("hud-angmom-I");
  const hudOmega = document.getElementById("hud-angmom-omega");
  const hudL = document.getElementById("hud-angmom-L");
  const hudM = document.getElementById("hud-angmom-M");
  const hudAlpha = document.getElementById("hud-angmom-alpha");
  if (!disk || !torqueArrow || !omegaArrow || !LArrow || !hudI || !hudOmega || !hudL || !hudM || !hudAlpha) return;

  let lastTime = 0;
  let t = 0;
  let theta = 0; // rad，角位移
  let omega = 0; // rad/s，角速度
  const centerX = 200;
  const centerY = 290; // 下移，避免与文字重合

  const updateHUD = (I, omegaVal, L, M, alpha) => {
    hudI.textContent = `${I.toFixed(3)} kg·m²`;
    hudOmega.textContent = `${omegaVal.toFixed(2)} rad/s`;
    hudL.textContent = `${L.toFixed(2)} kg·m²/s`;
    hudM.textContent = `${M.toFixed(2)} N·m`;
    hudAlpha.textContent = `${alpha.toFixed(2)} rad/s²`;
  };

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const IInput = Number(document.getElementById("input-L")?.value || 0.5);
    const M0Input = Number(document.getElementById("input-load")?.value || 2.0);
    const I = Math.max(0.1, Math.min(2.0, IInput));
    const M0 = Math.max(0, M0Input);

    // 力矩：周期性变化 M(t) = M0 * sin(ωt)
    const omegaM = 0.8; // rad/s，力矩变化的角频率
    const M = M0 * Math.sin(omegaM * t);

    // 动量矩定理：dL/dt = M，即 d(Iω)/dt = M
    // 所以 α = M/I，ω = ∫α dt
    const alpha = M / I;
    omega += alpha * dt;
    theta += omega * dt;

    // 角动量 L = Iω
    const L = I * omega;

    // 更新转盘角度
    disk.setAttribute("transform", `rotate(${(theta * 180 / Math.PI) % 360} ${centerX} ${centerY})`);

    // 更新力矩箭头（切向，随转盘旋转）
    const torqueLen = 20 + Math.abs(M) * 8;
    const torqueSign = M >= 0 ? 1 : -1;
    const torqueAngle = theta;
    const torqueStartX = centerX + 60 * Math.cos(torqueAngle);
    const torqueStartY = centerY - 60 * Math.sin(torqueAngle);
    const torqueEndX = torqueStartX + torqueSign * torqueLen * Math.cos(torqueAngle);
    const torqueEndY = torqueStartY - torqueSign * torqueLen * Math.sin(torqueAngle);
    torqueArrow.setAttribute("x1", torqueStartX);
    torqueArrow.setAttribute("y1", torqueStartY);
    torqueArrow.setAttribute("x2", torqueEndX);
    torqueArrow.setAttribute("y2", torqueEndY);

    // 更新角速度箭头（轴向，向上）
    const omegaLen = 15 + Math.abs(omega) * 8;
    const omegaSign = omega >= 0 ? 1 : -1;
    omegaArrow.setAttribute("x1", centerX);
    omegaArrow.setAttribute("y1", centerY);
    omegaArrow.setAttribute("x2", centerX);
    omegaArrow.setAttribute("y2", centerY - omegaSign * omegaLen);

    // 更新角动量箭头（轴向，向上）
    const LLen = 15 + Math.abs(L) * 6;
    const LSign = L >= 0 ? 1 : -1;
    LArrow.setAttribute("x1", centerX);
    LArrow.setAttribute("y1", centerY);
    LArrow.setAttribute("x2", centerX);
    LArrow.setAttribute("y2", centerY - LSign * LLen);

    updateHUD(I, omega, L, M, alpha);

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initSystemMomentumCenterScene() {
  const p1 = document.getElementById("sys-particle1");
  const p2 = document.getElementById("sys-particle2");
  const center = document.getElementById("sys-center");
  const p1Label = document.getElementById("sys-p1-label");
  const p2Label = document.getElementById("sys-p2-label");
  const v1Arrow = document.getElementById("sys-v1");
  const v2Arrow = document.getElementById("sys-v2");
  const v1Label = document.getElementById("sys-v1-label");
  const v2Label = document.getElementById("sys-v2-label");
  const vcArrow = document.getElementById("sys-vc");
  const ptotArrow = document.getElementById("sys-ptot");
  const hudM1 = document.getElementById("hud-sys-m1");
  const hudM2 = document.getElementById("hud-sys-m2");
  const hudM = document.getElementById("hud-sys-m");
  const hudVC = document.getElementById("hud-sys-vc");
  const hudP = document.getElementById("hud-sys-p");
  if (!p1 || !p2 || !center || !v1Arrow || !v2Arrow || !vcArrow || !ptotArrow || !hudM1 || !hudM2 || !hudM || !hudVC || !hudP) return;

  const trackY = 270; // 下移，避免与文字重合
  const pxPerMeter = 200;
  let lastTime = 0;
  let t = 0;
  let x1 = -0.2; // m，质点1位置
  let x2 = 0.2; // m，质点2位置
  let v1 = 1.5; // m/s
  let v2 = -1.0; // m/s

  const updateHUD = (m1, m2, mTot, vC, pTot) => {
    hudM1.textContent = `${m1.toFixed(1)} kg`;
    hudM2.textContent = `${m2.toFixed(1)} kg`;
    hudM.textContent = `${mTot.toFixed(1)} kg`;
    hudVC.textContent = `${vC.toFixed(2)} m/s`;
    hudP.textContent = `${pTot.toFixed(2)} kg·m/s`;
  };

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const m1Input = Number(document.getElementById("input-L")?.value || 1.0);
    const m2Input = Number(document.getElementById("input-load")?.value || 1.5);
    const m1 = Math.max(0.2, Math.min(3.0, m1Input));
    const m2 = Math.max(0.2, Math.min(3.0, m2Input));
    const mTot = m1 + m2;

    // 更新位置
    x1 += v1 * dt;
    x2 += v2 * dt;

    // 边界反弹
    const xMin = -0.4;
    const xMax = 0.4;
    if (x1 < xMin) {
      x1 = xMin;
      v1 = Math.abs(v1);
    } else if (x1 > xMax) {
      x1 = xMax;
      v1 = -Math.abs(v1);
    }
    if (x2 < xMin) {
      x2 = xMin;
      v2 = Math.abs(v2);
    } else if (x2 > xMax) {
      x2 = xMax;
      v2 = -Math.abs(v2);
    }

    // 计算质心位置：xC = (m1*x1 + m2*x2) / (m1 + m2)
    const xC = (m1 * x1 + m2 * x2) / mTot;

    // 计算质心速度：vC = (m1*v1 + m2*v2) / (m1 + m2)
    const vC = (m1 * v1 + m2 * v2) / mTot;

    // 系统总动量：p = m1*v1 + m2*v2 = mTot * vC
    const pTot = mTot * vC;

    // 更新SVG位置
    const px1 = 200 + x1 * pxPerMeter;
    const px2 = 200 + x2 * pxPerMeter;
    const pxC = 200 + xC * pxPerMeter;
    p1.setAttribute("cx", px1);
    p1.setAttribute("cy", trackY);
    p1Label.setAttribute("x", px1);
    p2.setAttribute("cx", px2);
    p2.setAttribute("cy", trackY);
    p2Label.setAttribute("x", px2);
    center.setAttribute("cx", pxC);
    center.setAttribute("cy", trackY);

    // 更新速度箭头
    const v1Len = 15 + Math.abs(v1) * 12;
    const v1Sign = v1 >= 0 ? 1 : -1;
    v1Arrow.setAttribute("x1", px1);
    v1Arrow.setAttribute("y1", trackY - 30);
    v1Arrow.setAttribute("x2", px1 + v1Sign * v1Len);
    v1Arrow.setAttribute("y2", trackY - 30);
    v1Label.setAttribute("x", px1 + v1Sign * v1Len + 5);
    v1Label.setAttribute("y", trackY - 33);

    const v2Len = 15 + Math.abs(v2) * 12;
    const v2Sign = v2 >= 0 ? 1 : -1;
    v2Arrow.setAttribute("x1", px2);
    v2Arrow.setAttribute("y1", trackY - 30);
    v2Arrow.setAttribute("x2", px2 + v2Sign * v2Len);
    v2Arrow.setAttribute("y2", trackY - 30);
    v2Label.setAttribute("x", px2 + v2Sign * v2Len + 5);
    v2Label.setAttribute("y", trackY - 33);

    // 质心速度箭头
    const vcLen = 15 + Math.abs(vC) * 10;
    const vcSign = vC >= 0 ? 1 : -1;
    vcArrow.setAttribute("x1", pxC);
    vcArrow.setAttribute("y1", trackY);
    vcArrow.setAttribute("x2", pxC);
    vcArrow.setAttribute("y2", trackY - vcSign * vcLen);

    // 总动量箭头
    const ptotLen = 12 + Math.abs(pTot) * 6;
    const ptotSign = pTot >= 0 ? 1 : -1;
    ptotArrow.setAttribute("x1", pxC);
    ptotArrow.setAttribute("y1", trackY - 70);
    ptotArrow.setAttribute("x2", pxC);
    ptotArrow.setAttribute("y2", trackY - 70 - ptotSign * ptotLen);

    updateHUD(m1, m2, mTot, vC, pTot);

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initAngularMomentumConservationScene() {
  const disk = document.getElementById("angcons-disk");
  const circle = document.getElementById("angcons-circle");
  const mass = document.getElementById("angcons-mass");
  const omegaArrow = document.getElementById("angcons-omega");
  const LArrow = document.getElementById("angcons-L");
  const hudI = document.getElementById("hud-angcons-I");
  const hudOmega = document.getElementById("hud-angcons-omega");
  const hudL = document.getElementById("hud-angcons-L");
  const hudR = document.getElementById("hud-angcons-r");
  if (!disk || !circle || !mass || !omegaArrow || !LArrow || !hudI || !hudOmega || !hudL || !hudR) return;

  let lastTime = 0;
  let t = 0;
  let theta = 0; // rad，角位移
  let omega = 2.0; // rad/s，初始角速度
  const centerX = 200;
  const centerY = 290;
  let m = 1.0; // kg，质量块质量（将从输入框读取）
  let r = 0.06; // m，质量块到转轴的距离（初始）
  let direction = 1; // 1: 向外移动，-1: 向内移动

  const updateHUD = (I, omegaVal, L, rVal) => {
    hudI.textContent = `${I.toFixed(4)} kg·m²`;
    hudOmega.textContent = `${omegaVal.toFixed(2)} rad/s`;
    hudL.textContent = `${L.toFixed(3)} kg·m²/s`;
    hudR.textContent = `${rVal.toFixed(3)} m`;
  };

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    // 从输入框读取质量值
    const mInput = Number(document.getElementById("input-L")?.value || 1.0);
    m = Math.max(0.1, Math.min(5.0, mInput));

    // 质量块位置周期性变化（模拟收臂/伸臂）
    const rMin = 0.04; // m
    const rMax = 0.08; // m
    r += direction * 0.01 * dt; // 缓慢移动
    if (r > rMax) {
      r = rMax;
      direction = -1;
    } else if (r < rMin) {
      r = rMin;
      direction = 1;
    }

    // 转动惯量：I = m*r²（简化模型，只考虑质量块）
    const I = m * r * r;

    // 角动量守恒：L = I*ω = 常数
    // 初始角动量：L0 = I0*ω0（使用当前质量重新计算，保持连续性）
    const I0 = m * 0.06 * 0.06; // 初始转动惯量
    const omega0 = 2.0; // 初始角速度
    const L0 = I0 * omega0; // 初始角动量（守恒）

    // 当前角速度：ω = L0 / I
    omega = L0 / I;

    // 更新角位移
    theta += omega * dt;

    // 更新转盘角度
    disk.setAttribute("transform", `rotate(${(theta * 180 / Math.PI) % 360} ${centerX} ${centerY})`);

    // 更新圆盘半径（视觉上）
    const rPx = r * 1000; // 转换为像素
    circle.setAttribute("r", rPx);

    // 更新质量块位置
    const massX = centerX + rPx;
    const massY = centerY;
    mass.setAttribute("cx", massX);
    mass.setAttribute("cy", massY);

    // 更新角速度箭头
    const omegaLen = 15 + Math.abs(omega) * 8;
    const omegaSign = omega >= 0 ? 1 : -1;
    omegaArrow.setAttribute("x1", centerX);
    omegaArrow.setAttribute("y1", centerY);
    omegaArrow.setAttribute("x2", centerX);
    omegaArrow.setAttribute("y2", centerY - omegaSign * omegaLen);

    // 更新角动量箭头（L保持不变）
    const LLen = 20 + Math.abs(L0) * 5;
    const LSign = L0 >= 0 ? 1 : -1;
    LArrow.setAttribute("x1", centerX);
    LArrow.setAttribute("y1", centerY);
    LArrow.setAttribute("x2", centerX);
    LArrow.setAttribute("y2", centerY - LSign * LLen);

    updateHUD(I, omega, L0, r);

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initWorkEnergyScene() {
  const cart = document.getElementById("we-cart");
  const forceLine = document.getElementById("we-force");
  const velLine = document.getElementById("we-vel");
  const barW = document.getElementById("we-bar-work");
  const barT = document.getElementById("we-bar-ke");
  const hudM = document.getElementById("hud-we-m");
  const hudF = document.getElementById("hud-we-F");
  const hudS = document.getElementById("hud-we-s");
  const hudW = document.getElementById("hud-we-W");
  const hudT = document.getElementById("hud-we-T");
  if (!cart || !forceLine || !velLine || !barW || !barT || !hudM || !hudF || !hudS || !hudW || !hudT) return;

  let lastTime = 0;
  let t = 0;
  let s = 0;
  let v = 0;

  const baseX = 140;
  const pxPerMeter = 220;
  const sMin = -0.2;
  const sMax = 0.7;

  const updateHUD = (m, F, sVal, W, T) => {
    hudM.textContent = `${m.toFixed(2)} kg`;
    hudF.textContent = `${F.toFixed(1)} N`;
    hudS.textContent = `${sVal.toFixed(2)} m`;
    hudW.textContent = `${W.toFixed(2)} J`;
    hudT.textContent = `${T.toFixed(2)} J`;
  };

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const mInput = Number(document.getElementById("input-L")?.value || 1.0);
    const FInput = Number(document.getElementById("input-load")?.value || 20.0);
    const m = Math.max(0.1, Math.min(10, mInput));
    const F = Math.max(0, Math.min(200, FInput));

    // 位移按照缓动来回运动，便于观察
    const sAmp = 0.6;
    const sOffset = 0.05;
    s = sOffset + sAmp * 0.5 * (1 - Math.cos(t * 0.9)); // 0 -> sAmp
    s = Math.max(sMin, Math.min(sMax, s));

    // 功与动能
    const W = F * s;
    const T = Math.max(0, W); // 视作无摩擦，W=ΔT
    v = Math.sqrt((2 * T) / m);

    // 更新几何
    const dx = s * pxPerMeter;
    cart.setAttribute("transform", `translate(${dx},0)`);

    const forceLen = 18 + Math.min(90, F * 1.5);
    forceLine.setAttribute("x1", baseX + dx);
    forceLine.setAttribute("y1", 200);
    forceLine.setAttribute("x2", baseX + dx + forceLen);
    forceLine.setAttribute("y2", 200);

    const velLen = 18 + Math.min(100, v * 25);
    velLine.setAttribute("x1", baseX + 30 + dx);
    velLine.setAttribute("y1", 240);
    velLine.setAttribute("x2", baseX + 30 + dx + velLen);
    velLine.setAttribute("y2", 240);

    // 能量条
    const Wbar = Math.min(160, Math.abs(W) * 12);
    barW.setAttribute("width", Wbar);
    barT.setAttribute("width", Math.min(160, Math.abs(T) * 12));

    updateHUD(m, F, s, W, T);
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initDAlembertPrincipleScene() {
  const cart = document.getElementById("dal-cart");
  const forceLine = document.getElementById("dal-force");
  const inertiaLine = document.getElementById("dal-inertia");
  const accelLine = document.getElementById("dal-accel");
  const hudM = document.getElementById("hud-dal-m");
  const hudF = document.getElementById("hud-dal-F");
  const hudA = document.getElementById("hud-dal-a");
  const hudInertia = document.getElementById("hud-dal-inertia");
  if (!cart || !forceLine || !inertiaLine || !accelLine || !hudM || !hudF || !hudA || !hudInertia) return;

  let lastTime = 0;
  let t = 0;
  let s = 0;
  let v = 0;

  const baseX = 140;
  const pxPerMeter = 220;
  const sMin = -0.2;
  const sMax = 0.7;

  const updateHUD = (m, F, a, inertia) => {
    hudM.textContent = `${m.toFixed(2)} kg`;
    hudF.textContent = `${F.toFixed(1)} N`;
    hudA.textContent = `${a.toFixed(2)} m/s²`;
    hudInertia.textContent = `${inertia.toFixed(1)} N`;
  };

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const mInput = Number(document.getElementById("input-L")?.value || 1.0);
    const FInput = Number(document.getElementById("input-load")?.value || 20.0);
    const m = Math.max(0.1, Math.min(10, mInput));
    const F = Math.max(0, Math.min(200, FInput));

    // 计算加速度：a = F/m
    const a = F / m;

    // 位移按照缓动来回运动，便于观察
    const sAmp = 0.6;
    const sOffset = 0.05;
    s = sOffset + sAmp * 0.5 * (1 - Math.cos(t * 0.9));
    s = Math.max(sMin, Math.min(sMax, s));

    // 速度：v = at（简化）
    v = a * t * 0.3; // 缩放因子使动画更平滑

    // 惯性力：-ma
    const inertia = -m * a;

    // 更新几何
    const dx = s * pxPerMeter;
    cart.setAttribute("transform", `translate(${dx},0)`);

    // 真实力 F 箭头
    const forceLen = 18 + Math.min(90, F * 1.5);
    forceLine.setAttribute("x1", baseX + dx);
    forceLine.setAttribute("y1", 200);
    forceLine.setAttribute("x2", baseX + dx + forceLen);
    forceLine.setAttribute("y2", 200);

    // 惯性力 -ma 箭头（方向与加速度相反）
    const inertiaLen = 18 + Math.min(90, Math.abs(inertia) * 1.5);
    inertiaLine.setAttribute("x1", baseX + 60 + dx);
    inertiaLine.setAttribute("y1", 200);
    inertiaLine.setAttribute("x2", baseX + 60 + dx - inertiaLen);
    inertiaLine.setAttribute("y2", 200);

    // 加速度 a 箭头
    const accelLen = 18 + Math.min(100, a * 15);
    accelLine.setAttribute("x1", baseX + 30 + dx);
    accelLine.setAttribute("y1", 240);
    accelLine.setAttribute("x2", baseX + 30 + dx + accelLen);
    accelLine.setAttribute("y2", 240);

    updateHUD(m, F, a, inertia);
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initVirtualDisplacementPrincipleScene() {
  const lever = document.getElementById("vd-lever");
  const mass1 = document.getElementById("vd-mass1");
  const mass2 = document.getElementById("vd-mass2");
  const F1Line = document.getElementById("vd-F1");
  const F2Line = document.getElementById("vd-F2");
  const delta1Line = document.getElementById("vd-delta1");
  const delta2Line = document.getElementById("vd-delta2");
  const hudM1 = document.getElementById("hud-vd-m1");
  const hudM2 = document.getElementById("hud-vd-m2");
  const hudL1 = document.getElementById("hud-vd-L1");
  const hudL2 = document.getElementById("hud-vd-L2");
  const hudWork = document.getElementById("hud-vd-work");
  if (!lever || !mass1 || !mass2 || !F1Line || !F2Line || !delta1Line || !delta2Line || 
      !hudM1 || !hudM2 || !hudL1 || !hudL2 || !hudWork) return;

  const g = 9.8; // 重力加速度
  const pivotX = 200;
  const pivotY = 220; // 下移，避免与文字重合
  const baseL1 = 100; // 左端到支点的距离（像素）
  const baseL2 = 70;  // 右端到支点的距离（像素）

  const updateHUD = (m1, m2, L1, L2, work) => {
    hudM1.textContent = `${m1.toFixed(2)} kg`;
    hudM2.textContent = `${m2.toFixed(2)} kg`;
    hudL1.textContent = `${L1.toFixed(2)} m`;
    hudL2.textContent = `${L2.toFixed(2)} m`;
    hudWork.textContent = `${work.toFixed(3)} J`;
  };

  let lastTime = 0;
  let currentAngle = 0;
  let animationPhase = 0; // 用于虚位移演示的相位

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    animationPhase += dt * 0.5; // 虚位移演示的动画速度

    // 从输入参数读取（使用input-L作为m1，input-load作为m2）
    const m1Input = Number(document.getElementById("input-L")?.value || 2.0);
    const m2Input = Number(document.getElementById("input-load")?.value || 3.0);
    const m1 = Math.max(0.1, Math.min(10, m1Input));
    const m2 = Math.max(0.1, Math.min(10, m2Input));

    // 力臂长度（米，从像素转换）
    const pxPerMeter = 100;
    const L1 = baseL1 / pxPerMeter;
    const L2 = baseL2 / pxPerMeter;

    // 计算力
    const F1 = m1 * g;
    const F2 = m2 * g;

    // 计算平衡角度（根据力矩平衡：F1*L1 = F2*L2）
    // 如果F1*L1 > F2*L2，杠杆向左倾斜；否则向右倾斜
    const moment1 = F1 * L1;
    const moment2 = F2 * L2;
    const momentDiff = moment1 - moment2;

    // 计算目标平衡角度（小角度近似）
    const maxAngle = 0.12; // 最大角度（弧度）
    let targetAngle = 0;
    if (Math.abs(momentDiff) > 0.01) {
      // 不平衡时，角度与力矩差成正比
      targetAngle = Math.max(-maxAngle, Math.min(maxAngle, momentDiff * 0.00015));
    }

    // 平滑过渡到目标角度（模拟动态平衡过程）
    const smoothing = 0.1;
    currentAngle += (targetAngle - currentAngle) * smoothing;
    const angle = currentAngle;

    // 计算虚位移（用于演示，添加小幅振荡）
    const virtualDisplacementAmp = 0.02; // 虚位移幅度（米）
    const virtualAngle = Math.sin(animationPhase) * virtualDisplacementAmp;
    const delta1 = -virtualAngle * L1; // 左端虚位移（向上为正）
    const delta2 = virtualAngle * L2;  // 右端虚位移（向下为正）

    // 计算虚功
    const work1 = F1 * delta1; // 左端虚功
    const work2 = F2 * delta2; // 右端虚功
    const totalWork = work1 + work2;

    // 更新杠杆位置（平滑动画）
    const angleDeg = (angle * 180) / Math.PI;
    const totalLength = baseL1 + baseL2;
    lever.setAttribute("x1", pivotX - baseL1 * Math.cos(angle));
    lever.setAttribute("y1", pivotY + baseL1 * Math.sin(angle));
    lever.setAttribute("x2", pivotX + baseL2 * Math.cos(angle));
    lever.setAttribute("y2", pivotY - baseL2 * Math.sin(angle));

    // 更新质量块位置
    const mass1X = pivotX - baseL1 * Math.cos(angle);
    const mass1Y = pivotY + baseL1 * Math.sin(angle);
    const mass2X = pivotX + baseL2 * Math.cos(angle);
    const mass2Y = pivotY - baseL2 * Math.sin(angle);

    mass1.setAttribute("transform", `translate(${mass1X - 115}, ${mass1Y - 205})`);
    mass2.setAttribute("transform", `translate(${mass2X - 285}, ${mass2Y - 205})`);

    // 更新虚位移箭头（虚线，动态显示）
    const delta1Len = Math.max(15, Math.abs(delta1) * pxPerMeter * 8); // 放大显示，最小长度
    const delta2Len = Math.max(15, Math.abs(delta2) * pxPerMeter * 8);
    
    // 左端虚位移箭头（垂直于杠杆方向）
    const perpAngle1 = angle + Math.PI / 2; // 垂直于杠杆
    const delta1X = Math.cos(perpAngle1) * delta1Len * (delta1 < 0 ? -1 : 1);
    const delta1Y = -Math.sin(perpAngle1) * delta1Len * (delta1 < 0 ? -1 : 1);
    delta1Line.setAttribute("x1", mass1X);
    delta1Line.setAttribute("y1", mass1Y - 15);
    delta1Line.setAttribute("x2", mass1X + delta1X);
    delta1Line.setAttribute("y2", mass1Y - 15 + delta1Y);
    // 控制虚位移箭头的可见性（只在有虚位移时显示）
    delta1Line.setAttribute("opacity", Math.abs(delta1) > 0.001 ? 0.8 : 0.3);

    // 右端虚位移箭头（垂直于杠杆方向）
    const perpAngle2 = angle + Math.PI / 2; // 垂直于杠杆
    const delta2X = Math.cos(perpAngle2) * delta2Len * (delta2 < 0 ? -1 : 1);
    const delta2Y = -Math.sin(perpAngle2) * delta2Len * (delta2 < 0 ? -1 : 1);
    delta2Line.setAttribute("x1", mass2X);
    delta2Line.setAttribute("y1", mass2Y - 15);
    delta2Line.setAttribute("x2", mass2X + delta2X);
    delta2Line.setAttribute("y2", mass2Y - 15 + delta2Y);
    // 控制虚位移箭头的可见性
    delta2Line.setAttribute("opacity", Math.abs(delta2) > 0.001 ? 0.8 : 0.3);

    // 更新力箭头长度（根据力的大小动态变化）
    const F1Len = 25 + Math.min(50, F1 * 0.4);
    const F2Len = 25 + Math.min(50, F2 * 0.4);
    
    // 力箭头始终向下（重力方向）
    F1Line.setAttribute("x1", mass1X);
    F1Line.setAttribute("y1", mass1Y - 15);
    F1Line.setAttribute("x2", mass1X);
    F1Line.setAttribute("y2", mass1Y - 15 + F1Len);
    
    F2Line.setAttribute("x1", mass2X);
    F2Line.setAttribute("y1", mass2Y - 15);
    F2Line.setAttribute("x2", mass2X);
    F2Line.setAttribute("y2", mass2Y - 15 + F2Len);

    // 更新HUD显示
    updateHUD(m1, m2, L1, L2, totalWork);

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function initPointKinematicsScene() {
  const svg = document.getElementById("point-kinematics-curve-svg");
  const pathEl = document.getElementById("curve-path");
  const pt = document.getElementById("curve-point");
  const ptHit = document.getElementById("curve-point-hit");
  const vArrow = document.getElementById("curve-v-arrow");
  const aArrow = document.getElementById("curve-a-arrow");
  if (!svg || !pathEl || !pt || !ptHit || !vArrow || !aArrow) return;

  const P0 = { x: 110, y: 190 };
  const P1 = { x: 200, y: 60 };
  const P2 = { x: 310, y: 190 };

  const getPoint = (t) => {
    const u = 1 - t;
    return {
      x: u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x,
      y: u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y,
    };
  };

  const getFirstDerivative = (t) => {
    const u = 1 - t;
    return {
      x: 2 * u * (P1.x - P0.x) + 2 * t * (P2.x - P1.x),
      y: 2 * u * (P1.y - P0.y) + 2 * t * (P2.y - P1.y),
    };
  };

  const secondDerivative = {
    x: 2 * (P2.x - 2 * P1.x + P0.x),
    y: 2 * (P2.y - 2 * P1.y + P0.y),
  };

  let tParam = 0.1;
  let direction = 1;
  let lastTime = 0;
  let phase = 0;
  let cachedV = 2.0;
  let cachedAt = 0;

  const omega = Math.PI; // 约 0.5 Hz 的速度起伏
  const pxPerMeterBase = 120;

  const clampT = (t) => Math.max(0.02, Math.min(0.98, t));

  const updateGeom = (t, vMag, atVal) => {
    const pos = getPoint(t);
    const deriv = getFirstDerivative(t);
    const speedGeom = Math.hypot(deriv.x, deriv.y) || 1;
    const tx = deriv.x / speedGeom;
    const ty = deriv.y / speedGeom;
    const nx = -ty;
    const ny = tx;

    const curvatureNum = Math.abs(deriv.x * secondDerivative.y - deriv.y * secondDerivative.x);
    const curvatureDen = Math.pow(speedGeom, 3);
    const curvature = curvatureDen > 1e-6 ? curvatureNum / curvatureDen : 0;
    const Rpx = curvature > 1e-6 ? 1 / curvature : 1e6;

    pt.setAttribute("cx", pos.x);
    pt.setAttribute("cy", pos.y);
    ptHit.setAttribute("cx", pos.x);
    ptHit.setAttribute("cy", pos.y);

    const speedLen = 25 + vMag * 6;
    const accLen = 20 + Math.min(8, Math.abs(vMag * vMag / (curvature > 1e-6 ? Rpx : 1e6))) * 4;

    vArrow.setAttribute("x1", pos.x);
    vArrow.setAttribute("y1", pos.y);
    vArrow.setAttribute("x2", pos.x + speedLen * tx);
    vArrow.setAttribute("y2", pos.y + speedLen * ty);

    aArrow.setAttribute("x1", pos.x);
    aArrow.setAttribute("y1", pos.y);
    aArrow.setAttribute("x2", pos.x + accLen * nx);
    aArrow.setAttribute("y2", pos.y + accLen * ny);

    const Linput = Number(document.getElementById("input-L")?.value || 1.0);
    const pxPerMeter = pxPerMeterBase / Math.max(0.3, Math.min(2.5, Linput));
    const Rmeters = Rpx / pxPerMeter;
    const an = Rmeters > 1e-3 ? (vMag * vMag) / Rmeters : 0;
    cachedV = vMag;
    cachedAt = atVal;
    updatePointKinematicsHUD(Rmeters, vMag, atVal, an);
  };

  const animate = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    const tSpeed = 0.18; // 控制沿曲线的运动速度
    tParam += direction * tSpeed * dt;
    if (tParam > 0.95) {
      tParam = 0.95;
      direction = -1;
    } else if (tParam < 0.05) {
      tParam = 0.05;
      direction = 1;
    }
    tParam = clampT(tParam);

    phase += omega * dt;

    const baseV = Math.max(0.5, Math.min(5.0, Number(document.getElementById("input-load")?.value || 2.0)));
    const speedFactor = 1 + 0.25 * Math.sin(phase);
    const vMag = baseV * speedFactor;
    const atVal = baseV * 0.25 * omega * Math.cos(phase);

    updateGeom(tParam, vMag, atVal);

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);

  const RinputEl = document.getElementById("input-L");
  const VinputEl = document.getElementById("input-load");
  const syncHUD = () => updateGeom(tParam, cachedV, cachedAt);
  if (RinputEl) RinputEl.addEventListener("input", syncHUD);
  if (VinputEl) VinputEl.addEventListener("input", syncHUD);

  updateGeom(tParam, cachedV, cachedAt);
}

// 点的运动学坐标法模型
function initPointKinematicsCoordinatesScene() {
  const point = document.getElementById("coord-point");
  const rLine = document.getElementById("coord-r");
  const vLine = document.getElementById("coord-v");
  const rLabel = document.getElementById("coord-r-label");
  const vLabel = document.getElementById("coord-v-label");
  const xText = document.getElementById("coord-x-text");
  const yText = document.getElementById("coord-y-text");
  const rText = document.getElementById("coord-r-text");
  const vText = document.getElementById("coord-v-text");
  const hudX = document.getElementById("hud-coord-x");
  const hudY = document.getElementById("hud-coord-y");
  const hudR = document.getElementById("hud-coord-r");
  const hudV = document.getElementById("hud-coord-v");
  if (!point || !rLine || !vLine || !hudX || !hudY || !hudR || !hudV) return;

  const originX = 200;
  const originY = 200;
  let t = 0;
  let animId = null;

  const updateHUD = (x, y, r, v) => {
    if (hudX) hudX.textContent = `${x.toFixed(2)} m`;
    if (hudY) hudY.textContent = `${y.toFixed(2)} m`;
    if (hudR) hudR.textContent = `${r.toFixed(2)} m`;
    if (hudV) hudV.textContent = `${v.toFixed(2)} m/s`;
    if (xText) xText.textContent = `x = ${x.toFixed(2)} m`;
    if (yText) yText.textContent = `y = ${y.toFixed(2)} m`;
    if (rText) rText.textContent = `r = ${r.toFixed(2)} m`;
    if (vText) vText.textContent = `v = ${v.toFixed(2)} m/s`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("point-kinematics-coordinates")) {
      sceneAnimationRunning.set("point-kinematics-coordinates", false);
      return;
    }

    t += 0.016; // 约60fps

    // 圆周运动示例
    const R = 50; // 半径（像素）
    const omega = 1.0; // 角速度
    const x = R * Math.cos(omega * t);
    const y = -R * Math.sin(omega * t); // 负号因为y轴向下

    // 转换为屏幕坐标
    const screenX = originX + x;
    const screenY = originY + y;

    // 计算极径
    const r = Math.sqrt(x * x + y * y) / 100; // 转换为米（假设100px=1m）

    // 计算速度（圆周运动：v = R*omega）
    const v = R * omega / 100; // 转换为m/s

    // 更新位置
    if (point) {
      point.setAttribute("cx", screenX);
      point.setAttribute("cy", screenY);
    }

    // 更新位置矢量
    if (rLine) {
      rLine.setAttribute("x1", originX);
      rLine.setAttribute("y1", originY);
      rLine.setAttribute("x2", screenX);
      rLine.setAttribute("y2", screenY);
    }
    if (rLabel) {
      rLabel.setAttribute("x", originX + x / 2 + 5);
      rLabel.setAttribute("y", originY + y / 2);
    }

    // 更新速度矢量（切向，垂直于位置矢量）
    const vLen = 30;
    const vAngle = Math.atan2(-y, x) + Math.PI / 2; // 切向方向
    const vx = Math.cos(vAngle) * vLen;
    const vy = Math.sin(vAngle) * vLen;
    if (vLine) {
      vLine.setAttribute("x1", screenX);
      vLine.setAttribute("y1", screenY);
      vLine.setAttribute("x2", screenX + vx);
      vLine.setAttribute("y2", screenY + vy);
    }
    if (vLabel) {
      vLabel.setAttribute("x", screenX + vx + 5);
      vLabel.setAttribute("y", screenY + vy);
    }

    updateHUD(x / 100, -y / 100, r, v);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("point-kinematics-coordinates", animId);
  };

  if (isSceneVisible("point-kinematics-coordinates")) {
    sceneAnimationRunning.set("point-kinematics-coordinates", true);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("point-kinematics-coordinates", animId);
  }
}

// 刚体平移模型
function initRigidBodyTranslationScene() {
  const body = document.getElementById("trans-body");
  const v1Line = document.getElementById("trans-v1");
  const v2Line = document.getElementById("trans-v2");
  const hudV = document.getElementById("hud-trans-v");
  const hudA = document.getElementById("hud-trans-a");
  const hudS = document.getElementById("hud-trans-s");
  if (!body || !v1Line || !v2Line || !hudV || !hudA || !hudS) return;

  let t = 0;
  let x = 0;
  let v = 0;
  let a = 0.5; // 恒定加速度
  let animId = null;

  const pxPerMeter = 100;
  const baseX = 150;
  const baseY = 150;

  const updateHUD = (vVal, aVal, sVal) => {
    if (hudV) hudV.textContent = `${vVal.toFixed(2)} m/s`;
    if (hudA) hudA.textContent = `${aVal.toFixed(2)} m/s²`;
    if (hudS) hudS.textContent = `${sVal.toFixed(2)} m`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("rigid-body-translation")) {
      sceneAnimationRunning.set("rigid-body-translation", false);
      return;
    }

    t += 0.016; // 约60fps

    // 匀加速直线运动
    v = a * t;
    x = 0.5 * a * t * t;

    // 限制范围
    if (x > 1.5) {
      x = 1.5;
      v = 0;
    }

    // 更新刚体位置
    const dx = x * pxPerMeter;
    if (body) {
      body.setAttribute("transform", `translate(${baseX + dx}, ${baseY})`);
    }

    // 更新速度矢量（所有点相同）
    const vLen = 20 + Math.min(40, v * 10);
    if (v1Line) {
      v1Line.setAttribute("x1", baseX + dx - 20);
      v1Line.setAttribute("y1", baseY - 10);
      v1Line.setAttribute("x2", baseX + dx - 20);
      v1Line.setAttribute("y2", baseY - 10 - vLen);
    }
    if (v2Line) {
      v2Line.setAttribute("x1", baseX + dx + 20);
      v2Line.setAttribute("y1", baseY + 10);
      v2Line.setAttribute("x2", baseX + dx + 20);
      v2Line.setAttribute("y2", baseY + 10 - vLen);
    }

    updateHUD(v, a, x);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("rigid-body-translation", animId);
  };

  if (isSceneVisible("rigid-body-translation")) {
    sceneAnimationRunning.set("rigid-body-translation", true);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("rigid-body-translation", animId);
  }
}

// 速度瞬心法详细演示模型
function initInstantaneousCenterVelocityScene() {
  const rod = document.getElementById("ic-rod");
  const pointA = document.getElementById("ic-point-a");
  const pointB = document.getElementById("ic-point-b");
  const center = document.getElementById("ic-center");
  const vALine = document.getElementById("ic-va");
  const vBLine = document.getElementById("ic-vb");
  const lineA = document.getElementById("ic-line-a");
  const lineB = document.getElementById("ic-line-b");
  const hudOmega = document.getElementById("hud-ic-omega");
  const hudVA = document.getElementById("hud-ic-va");
  const hudVB = document.getElementById("hud-ic-vb");
  if (!rod || !pointA || !pointB || !center || !vALine || !vBLine || !hudOmega || !hudVA || !hudVB) return;

  let t = 0;
  let animId = null;
  const baseAX = 100;
  const baseAY = 150;
  const baseBX = 300;
  const baseBY = 150;
  const icX = 200;
  const icY = 100;

  const updateHUD = (omega, vA, vB) => {
    if (hudOmega) hudOmega.textContent = `${omega.toFixed(2)} rad/s`;
    if (hudVA) hudVA.textContent = `${vA.toFixed(2)} m/s`;
    if (hudVB) hudVB.textContent = `${vB.toFixed(2)} m/s`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("instantaneous-center-velocity")) {
      sceneAnimationRunning.set("instantaneous-center-velocity", false);
      return;
    }

    t += 0.016;

    // 连杆绕瞬心转动
    const omega = 1.0; // 角速度
    const angle = omega * t;

    // 计算A、B点到瞬心的距离
    const rA = Math.sqrt((baseAX - icX) ** 2 + (baseAY - icY) ** 2) / 100; // 转换为米
    const rB = Math.sqrt((baseBX - icX) ** 2 + (baseBY - icY) ** 2) / 100;

    // 计算速度：v = ω × r
    const vA = omega * rA;
    const vB = omega * rB;

    // 计算A、B点的位置（绕瞬心转动）
    const angleA = Math.atan2(baseAY - icY, baseAX - icX) + angle;
    const angleB = Math.atan2(baseBY - icY, baseBX - icX) + angle;

    const ax = icX + rA * 100 * Math.cos(angleA);
    const ay = icY + rA * 100 * Math.sin(angleA);
    const bx = icX + rB * 100 * Math.cos(angleB);
    const by = icY + rB * 100 * Math.sin(angleB);

    // 更新连杆位置
    if (rod) {
      rod.setAttribute("x1", ax);
      rod.setAttribute("y1", ay);
      rod.setAttribute("x2", bx);
      rod.setAttribute("y2", by);
    }

    // 更新点位置
    if (pointA) {
      pointA.setAttribute("cx", ax);
      pointA.setAttribute("cy", ay);
    }
    if (pointB) {
      pointB.setAttribute("cx", bx);
      pointB.setAttribute("cy", by);
    }

    // 更新到瞬心的连线
    if (lineA) {
      lineA.setAttribute("x1", ax);
      lineA.setAttribute("y1", ay);
      lineA.setAttribute("x2", icX);
      lineA.setAttribute("y2", icY);
    }
    if (lineB) {
      lineB.setAttribute("x1", bx);
      lineB.setAttribute("y1", by);
      lineB.setAttribute("x2", icX);
      lineB.setAttribute("y2", icY);
    }

    // 更新速度矢量（垂直于到瞬心的连线）
    const vADir = angleA + Math.PI / 2;
    const vBDir = angleB + Math.PI / 2;
    const vALen = vA * 10; // 放大显示
    const vBLen = vB * 10;

    if (vALine) {
      vALine.setAttribute("x1", ax);
      vALine.setAttribute("y1", ay);
      vALine.setAttribute("x2", ax + Math.cos(vADir) * vALen);
      vALine.setAttribute("y2", ay + Math.sin(vADir) * vALen);
    }

    if (vBLine) {
      vBLine.setAttribute("x1", bx);
      vBLine.setAttribute("y1", by);
      vBLine.setAttribute("x2", bx + Math.cos(vBDir) * vBLen);
      vBLine.setAttribute("y2", by + Math.sin(vBDir) * vBLen);
    }

    updateHUD(omega, vA, vB);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("instantaneous-center-velocity", animId);
  };

  if (isSceneVisible("instantaneous-center-velocity")) {
    sceneAnimationRunning.set("instantaneous-center-velocity", true);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("instantaneous-center-velocity", animId);
  }
}

// 保守力场与势能模型
function initConservativeForcePotentialScene() {
  const point = document.getElementById("potential-point");
  const curve = document.getElementById("potential-curve");
  const forceLine = document.getElementById("potential-force");
  const uText = document.getElementById("potential-energy-text");
  const tText = document.getElementById("kinetic-energy-text");
  const eText = document.getElementById("total-energy-text");
  const hudU = document.getElementById("hud-potential-u");
  const hudT = document.getElementById("hud-potential-t");
  const hudE = document.getElementById("hud-potential-e");
  if (!point || !curve || !forceLine || !hudU || !hudT || !hudE) return;

  let t = 0;
  let animId = null;
  const m = 1.0; // 质量
  const g = 9.8; // 重力加速度
  const baseY = 200;
  const amplitude = 50; // 振幅（像素）

  const updateHUD = (U, T, E) => {
    if (hudU) hudU.textContent = `${U.toFixed(2)} J`;
    if (hudT) hudT.textContent = `${T.toFixed(2)} J`;
    if (hudE) hudE.textContent = `${E.toFixed(2)} J`;
    if (uText) uText.textContent = `势能 U = ${U.toFixed(2)} J`;
    if (tText) tText.textContent = `动能 T = ${T.toFixed(2)} J`;
    if (eText) eText.textContent = `机械能 E = T + U = ${E.toFixed(2)} J（守恒）`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("conservative-force-potential")) {
      sceneAnimationRunning.set("conservative-force-potential", false);
      return;
    }

    t += 0.016;

    // 简谐运动（重力势能）
    const y = baseY - amplitude * (1 + Math.sin(t * 0.8)) / 2;
    const v = -amplitude * 0.8 * Math.cos(t * 0.8) / 100; // 转换为m/s

    // 计算势能（重力势能：U = mgh）
    const h = (baseY - y) / 100; // 转换为米
    const U = m * g * h;

    // 计算动能
    const T = 0.5 * m * v * v;

    // 机械能（守恒）
    const E = T + U;

    // 更新质点位置
    if (point) {
      point.setAttribute("cy", y);
      // 更新势能曲线上的点
      const curveX = 50 + ((y - 50) / 150) * 300;
      point.setAttribute("cx", curveX);
    }

    // 更新力矢量（重力，向下）
    const forceLen = 30;
    if (forceLine && point) {
      const curveX = 50 + ((y - 50) / 150) * 300;
      forceLine.setAttribute("x1", curveX);
      forceLine.setAttribute("y1", y);
      forceLine.setAttribute("x2", curveX);
      forceLine.setAttribute("y2", y + forceLen);
    }

    updateHUD(U, T, E);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("conservative-force-potential", animId);
  };

  if (isSceneVisible("conservative-force-potential")) {
    sceneAnimationRunning.set("conservative-force-potential", true);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("conservative-force-potential", animId);
  }
}

// 拉格朗日方程·单摆模型
function initLagrangePendulumScene() {
  const string = document.getElementById("lagrange-string");
  const bob = document.getElementById("lagrange-bob");
  const vLine = document.getElementById("lagrange-v");
  const angleArc = document.getElementById("lagrange-angle-arc");
  const angleText = document.getElementById("lagrange-angle-text");
  const lText = document.getElementById("lagrange-l-text");
  const hudTheta = document.getElementById("hud-lagrange-theta");
  const hudOmega = document.getElementById("hud-lagrange-omega");
  const hudT = document.getElementById("hud-lagrange-t");
  const hudU = document.getElementById("hud-lagrange-u");
  if (!string || !bob || !vLine || !hudTheta || !hudOmega || !hudT || !hudU) return;

  const pivotX = 200;
  const pivotY = 90; // 下移，避免与文字重合
  let theta = Math.PI / 6; // 初始角度
  let omega = 0; // 初始角速度
  let t = 0;
  let animId = null;
  const g = 9.8; // 重力加速度

  const updateHUD = (thetaVal, omegaVal, TVal, UVal) => {
    if (hudTheta) hudTheta.textContent = `${(thetaVal * 180 / Math.PI).toFixed(1)}°`;
    if (hudOmega) hudOmega.textContent = `${omegaVal.toFixed(2)} rad/s`;
    if (hudT) hudT.textContent = `${TVal.toFixed(3)} J`;
    if (hudU) hudU.textContent = `${UVal.toFixed(3)} J`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("lagrange-pendulum")) {
      sceneAnimationRunning.set("lagrange-pendulum", false);
      return;
    }

    t += 0.016; // 约60fps

    // 从输入参数读取
    const lInput = Number(document.getElementById("input-L")?.value || 1.0);
    const mInput = Number(document.getElementById("input-load")?.value || 1.0);
    const l = Math.max(0.1, Math.min(2.0, lInput));
    const m = Math.max(0.1, Math.min(5.0, mInput));

    // 单摆运动方程（小角度近似）：θ̈ = -(g/l)sinθ ≈ -(g/l)θ
    // 数值积分求解
    const dt = 0.016;
    const alpha = -(g / l) * Math.sin(theta);
    omega += alpha * dt;
    theta += omega * dt;

    // 限制角度范围（防止数值误差累积）
    if (theta > Math.PI) theta -= 2 * Math.PI;
    if (theta < -Math.PI) theta += 2 * Math.PI;

    // 计算位置（缩小显示，确保在viewBox内）
    const pxPerMeter = 40; // 进一步缩小，确保不超出viewBox(0-160)
    const bobX = pivotX + l * pxPerMeter * Math.sin(theta);
    const bobY = pivotY + l * pxPerMeter * Math.cos(theta);
    
    // 限制在viewBox内
    const maxY = 150; // viewBox高度160，留10px边距
    const clampedBobY = Math.min(maxY, bobY);

    // 更新摆线
    if (string) {
      string.setAttribute("x1", pivotX);
      string.setAttribute("y1", pivotY);
      string.setAttribute("x2", bobX);
      string.setAttribute("y2", clampedBobY);
    }

    // 更新摆球
    if (bob) {
      bob.setAttribute("cx", bobX);
      bob.setAttribute("cy", clampedBobY);
    }

    // 更新速度矢量（切向）
    const vLen = Math.abs(omega * l * pxPerMeter) * 0.5;
    const vDir = theta + Math.PI / 2;
    if (vLine) {
      vLine.setAttribute("x1", bobX);
      vLine.setAttribute("y1", bobY);
      vLine.setAttribute("x2", bobX + Math.cos(vDir) * vLen);
      vLine.setAttribute("y2", bobY + Math.sin(vDir) * vLen);
    }

    // 更新角度标注
    const arcRadius = 30;
    const arcStart = -Math.PI / 2;
    const arcEnd = -Math.PI / 2 + theta;
    if (angleArc) {
      const largeArc = Math.abs(theta) > Math.PI ? 1 : 0;
      const sweep = theta > 0 ? 1 : 0;
      const x1 = pivotX + arcRadius * Math.cos(arcStart);
      const y1 = pivotY + arcRadius * Math.sin(arcStart);
      const x2 = pivotX + arcRadius * Math.cos(arcEnd);
      const y2 = pivotY + arcRadius * Math.sin(arcEnd);
      angleArc.setAttribute("d", `M ${pivotX} ${pivotY} L ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArc} ${sweep} ${x2} ${y2} Z`);
    }
    if (angleText) {
      angleText.setAttribute("x", pivotX + arcRadius * 1.2 * Math.cos(arcEnd));
      angleText.setAttribute("y", pivotY + arcRadius * 1.2 * Math.sin(arcEnd));
    }

    // 计算动能和势能
    const T = 0.5 * m * l * l * omega * omega;
    const h = l * (1 - Math.cos(theta)); // 高度差
    const U = m * g * h;

    // 更新拉格朗日函数显示
    if (lText) {
      lText.textContent = `L = T - U = ${T.toFixed(3)} - ${U.toFixed(3)} = ${(T - U).toFixed(3)} J`;
    }

    updateHUD(theta, omega, T, U);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("lagrange-pendulum", animId);
  };

  if (isSceneVisible("lagrange-pendulum")) {
    sceneAnimationRunning.set("lagrange-pendulum", true);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("lagrange-pendulum", animId);
  }
}

// 哈密顿原理·最小作用量模型
function initHamiltonPrincipleScene() {
  const realPath = document.getElementById("hamilton-real-path");
  const virtualPath = document.getElementById("hamilton-virtual-path");
  const point = document.getElementById("hamilton-point");
  const actionText = document.getElementById("hamilton-action-text");
  const hudS = document.getElementById("hud-hamilton-s");
  const hudL = document.getElementById("hud-hamilton-l");
  const hudH = document.getElementById("hud-hamilton-h");
  if (!realPath || !virtualPath || !point || !hudS || !hudL || !hudH) return;

  let t = 0;
  let animId = null;
  const m = 1.0; // 质量
  const g = 9.8; // 重力加速度

  const updateHUD = (S, L, H) => {
    if (hudS) hudS.textContent = `${S.toFixed(3)} J·s`;
    if (hudL) hudL.textContent = `${L.toFixed(3)} J`;
    if (hudH) hudH.textContent = `${H.toFixed(3)} J`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("hamilton-principle")) {
      sceneAnimationRunning.set("hamilton-principle", false);
      return;
    }

    t += 0.016;

    // 真实路径（抛物线，使作用量取极值）
    const T = 2.0; // 总时间
    const s = (t % T) / T; // 归一化时间
    const x = 50 + 300 * s;
    const y = 240 - 30 * (4 * s * (1 - s)); // 抛物线（下移，避免与文字重合）

    // 更新质点位置
    if (point) {
      point.setAttribute("cx", x);
      point.setAttribute("cy", y);
    }

    // 计算拉格朗日函数（动能 - 势能）
    const vx = 300 / T; // 水平速度
    const vy = -100 * 4 * (1 - 2 * s) / T; // 垂直速度
    const v = Math.sqrt(vx * vx + vy * vy);
    const T_kin = 0.5 * m * v * v; // 动能
    const U = m * g * (240 - y) / 100; // 势能（转换为米）
    const L = T_kin - U; // 拉格朗日函数

    // 计算作用量（积分近似）
    const dt = 0.016;
    const S = L * dt * (t / dt); // 累积作用量

    // 计算哈密顿函数（对于保守系统，H = T + U = 常数）
    const H = T_kin + U;

    // 更新作用量显示
    if (actionText) {
      actionText.textContent = `作用量 S = ${S.toFixed(3)} J·s（真实路径取极值）`;
    }

    updateHUD(S, L, H);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("hamilton-principle", animId);
  };

  if (isSceneVisible("hamilton-principle")) {
    sceneAnimationRunning.set("hamilton-principle", true);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("hamilton-principle", animId);
  }
}

// 广义坐标·约束系统模型
function initGeneralizedCoordinatesScene() {
  const constraint = document.getElementById("gen-constraint");
  const point = document.getElementById("gen-point");
  const qLine = document.getElementById("gen-q-line");
  const qLabel = document.getElementById("gen-q-label");
  const dofText = document.getElementById("gen-dof-text");
  const hudQ = document.getElementById("hud-gen-q");
  const hudDof = document.getElementById("hud-gen-dof");
  const hudConstraints = document.getElementById("hud-gen-constraints");
  if (!constraint || !point || !qLine || !hudQ || !hudDof || !hudConstraints) return;

  let t = 0;
  let animId = null;
  const dof = 1; // 自由度（约束曲线上运动，1个自由度）
  const constraints = 1; // 约束数（f(x,y) = 0）

  const updateHUD = (q, dofVal, constraintsVal) => {
    if (hudQ) hudQ.textContent = `${q.toFixed(2)}`;
    if (hudDof) hudDof.textContent = `${dofVal}`;
    if (hudConstraints) hudConstraints.textContent = `${constraintsVal}`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("generalized-coordinates")) {
      sceneAnimationRunning.set("generalized-coordinates", false);
      return;
    }

    t += 0.016;

    // 沿约束曲线运动（用参数q作为广义坐标，缩小显示）
    const q = (t * 0.5) % (2 * Math.PI); // 广义坐标（参数）
    const x = 200 + 90 * Math.cos(q); // 缩小半径，确保在viewBox内
    const y = 190 + 25 * Math.sin(q); // 下移，避免与文字重合

    // 更新质点位置
    if (point) {
      point.setAttribute("cx", x);
      point.setAttribute("cy", y);
    }

    // 更新广义坐标标注
    if (qLine) {
      qLine.setAttribute("x1", 50);
      qLine.setAttribute("y1", 240);
      qLine.setAttribute("x2", x);
      qLine.setAttribute("y2", y);
    }
    if (qLabel) {
      qLabel.setAttribute("x", (50 + x) / 2 - 20);
      qLabel.setAttribute("y", (200 + y) / 2);
    }

    // 更新自由度显示
    if (dofText) {
      dofText.textContent = `自由度 = ${dof}（1个独立广义坐标q）`;
    }

    updateHUD(q, dof, constraints);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("generalized-coordinates", animId);
  };

  if (isSceneVisible("generalized-coordinates")) {
    sceneAnimationRunning.set("generalized-coordinates", true);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("generalized-coordinates", animId);
  }
}

// 虚功原理应用：约束反力求解模型
function initVirtualWorkConstraintReactionScene() {
  const loadLine = document.getElementById("vwr-load");
  const rxLine = document.getElementById("vwr-rx");
  const ryLine = document.getElementById("vwr-ry");
  const rbLine = document.getElementById("vwr-rb");
  const deltaLine = document.getElementById("vwr-delta");
  const hudP = document.getElementById("hud-vwr-p");
  const hudRB = document.getElementById("hud-vwr-rb");
  const hudWork = document.getElementById("hud-vwr-work");
  if (!loadLine || !rxLine || !ryLine || !rbLine || !deltaLine || !hudP || !hudRB || !hudWork) return;

  let animId = null;
  const P = 100; // 荷载（N）
  const L = 2.4; // 梁长（m）
  const pxPerMeter = 100;

  // 用虚功原理求RB：给系统一个虚位移，使B点向上移动δy
  // 虚功方程：P·δy - RB·δy = 0，所以 RB = P
  // 但这是简化的，实际需要考虑几何关系
  const RB = P * 0.5; // 简化计算（实际应该用虚位移原理）

  const updateHUD = (p, rb, work) => {
    if (hudP) hudP.textContent = `${p.toFixed(1)} N`;
    if (hudRB) hudRB.textContent = `${rb.toFixed(1)} N`;
    if (hudWork) hudWork.textContent = `${work.toFixed(3)} J`;
  };

  const animate = () => {
    if (!isSceneVisible("virtual-work-constraint-reaction")) {
      sceneAnimationRunning.set("virtual-work-constraint-reaction", false);
      return;
    }

    // 虚位移演示（小幅振荡）
    const deltaAmp = 0.02; // 虚位移幅度（米）
    const deltaY = deltaAmp * Math.sin(Date.now() / 1000);

    // 更新荷载箭头
    const loadLen = 40 + P * 0.3;
    if (loadLine) {
      loadLine.setAttribute("x1", 200);
      loadLine.setAttribute("y1", 120);
      loadLine.setAttribute("x2", 200);
      loadLine.setAttribute("y2", 120 + loadLen);
    }

    // 更新约束反力箭头
    const rbLen = 20 + RB * 0.3;
    if (rbLine) {
      rbLine.setAttribute("x1", 320);
      rbLine.setAttribute("y1", 180);
      rbLine.setAttribute("x2", 320);
      rbLine.setAttribute("y2", 180 - rbLen);
      rbLine.setAttribute("opacity", "1");
    }

    // 更新虚位移箭头
    const deltaLen = Math.abs(deltaY) * pxPerMeter * 5;
    if (deltaLine) {
      deltaLine.setAttribute("x1", 200);
      deltaLine.setAttribute("y1", 180);
      deltaLine.setAttribute("x2", 200);
      deltaLine.setAttribute("y2", 180 - deltaLen);
      deltaLine.setAttribute("opacity", Math.abs(deltaY) > 0.001 ? "0.8" : "0.3");
    }

    // 计算虚功
    const work = P * deltaY - RB * deltaY;

    updateHUD(P, RB, work);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("virtual-work-constraint-reaction", animId);
  };

  if (isSceneVisible("virtual-work-constraint-reaction")) {
    sceneAnimationRunning.set("virtual-work-constraint-reaction", true);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("virtual-work-constraint-reaction", animId);
  }
}

// 旋转参考系·科氏力模型
function initRotatingReferenceFrameScene() {
  const platform = document.getElementById("rot-platform");
  const platformLine = document.getElementById("rot-platform-line");
  const point = document.getElementById("rot-point");
  const coriolis = document.getElementById("rot-coriolis");
  const coriolisLabel = document.getElementById("rot-coriolis-label");
  const centrifugal = document.getElementById("rot-centrifugal");
  const centrifugalLabel = document.getElementById("rot-centrifugal-label");
  const omegaText = document.getElementById("rot-omega-text");
  if (!platform || !platformLine || !point || !coriolis || !centrifugal) return;

  const centerX = 200;
  const centerY = 140; // 下移，避免与文字重合
  let t = 0;
  let animId = null;
  const omega = 1.0; // 角速度
  const m = 1.0; // 质量
  const r = 18; // 半径（像素，进一步缩小确保在viewBox内）

  const animate = (timestamp) => {
    if (!isSceneVisible("rotating-reference-frame")) {
      sceneAnimationRunning.set("rotating-reference-frame", false);
      return;
    }

    t += 0.016;

    // 旋转平台角度
    const theta = omega * t;
    const pointX = centerX + r * Math.cos(theta);
    const pointY = centerY + r * Math.sin(theta);

    // 更新平台参考线
    if (platformLine) {
      const lineEndX = centerX + 35 * Math.cos(theta); // 缩小平台线长度，确保在viewBox内
      const lineEndY = centerY + 35 * Math.sin(theta);
      platformLine.setAttribute("x1", centerX);
      platformLine.setAttribute("y1", centerY);
      platformLine.setAttribute("x2", lineEndX);
      platformLine.setAttribute("y2", lineEndY);
    }

    // 更新质点位置
    if (point) {
      point.setAttribute("cx", pointX);
      point.setAttribute("cy", pointY);
    }

    // 科氏力（垂直于速度和角速度）
    const vRel = 0.5; // 相对速度（简化）
    const fc = 2 * m * omega * vRel;
    const fcLen = fc * 5; // 缩小力矢量长度
    const fcAngle = theta + Math.PI / 2;
    if (coriolis) {
      coriolis.setAttribute("x1", pointX);
      coriolis.setAttribute("y1", pointY);
      coriolis.setAttribute("x2", pointX + fcLen * Math.cos(fcAngle));
      coriolis.setAttribute("y2", pointY + fcLen * Math.sin(fcAngle));
    }
    if (coriolisLabel) {
      coriolisLabel.setAttribute("x", pointX + fcLen * Math.cos(fcAngle) + 5);
      coriolisLabel.setAttribute("y", pointY + fcLen * Math.sin(fcAngle) - 5);
    }

    // 离心力（径向向外）
    const fcent = m * omega * omega * (r / 100); // 转换为米
    const fcentLen = fcent * 10; // 缩小力矢量长度
    if (centrifugal) {
      centrifugal.setAttribute("x1", pointX);
      centrifugal.setAttribute("y1", pointY);
      centrifugal.setAttribute("x2", pointX + fcentLen * Math.cos(theta));
      centrifugal.setAttribute("y2", pointY + fcentLen * Math.sin(theta));
    }
    if (centrifugalLabel) {
      centrifugalLabel.setAttribute("x", pointX + fcentLen * Math.cos(theta) + 5);
      centrifugalLabel.setAttribute("y", pointY + fcentLen * Math.sin(theta) + 5);
    }

    // 更新角速度显示
    if (omegaText) {
      omegaText.textContent = `角速度 ω = ${omega.toFixed(2)} rad/s`;
    }

    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("rotating-reference-frame", animId);
  };

  if (isSceneVisible("rotating-reference-frame")) {
    sceneAnimationRunning.set("rotating-reference-frame", true);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("rotating-reference-frame", animId);
  }
}

// 加速平台·惯性力模型
function initAcceleratingPlatformScene() {
  const platform = document.getElementById("accel-platform");
  const point = document.getElementById("accel-point");
  const inertial = document.getElementById("accel-inertial");
  const inertialLabel = document.getElementById("accel-inertial-label");
  const aText = document.getElementById("accel-a-text");
  if (!platform || !point || !inertial) return;

  let t = 0;
  let animId = null;
  const m = 1.0; // 质量
  const a0 = 2.0; // 平台加速度（m/s²）

  const animate = (timestamp) => {
    if (!isSceneVisible("accelerating-platform")) {
      sceneAnimationRunning.set("accelerating-platform", false);
      return;
    }

    t += 0.016;

    // 从输入参数读取加速度
    const a0Input = Number(document.getElementById("input-L")?.value || 2.0);
    const a0Val = Math.max(0.1, Math.min(10.0, a0Input));

    // 平台加速运动（缩小显示）
    const pxPerMeter = 50; // 从100缩小到50
    const x0 = 200; // 初始位置
    const xPlatform = x0 + 0.5 * a0Val * t * t * pxPerMeter;
    const x = xPlatform;

    // 限制在viewBox内（确保不超出）
    const minX = 80;
    const maxX = 320;
    const clampedX = Math.max(minX, Math.min(maxX, x));

    // 更新平台位置
    if (platform) {
      platform.setAttribute("x", clampedX - 150);
      platform.setAttribute("y", 130); // 确保在viewBox内
    }

    // 更新质点位置
    if (point) {
      point.setAttribute("cx", clampedX);
      point.setAttribute("cy", 120); // 确保在viewBox内
    }

    // 惯性力（与加速度方向相反）
    const finertial = m * a0Val;
    const finertialLen = finertial * 5; // 缩小力矢量长度，确保在viewBox内
    if (inertial) {
      inertial.setAttribute("x1", clampedX);
      inertial.setAttribute("y1", 120);
      inertial.setAttribute("x2", clampedX - finertialLen);
      inertial.setAttribute("y2", 120);
    }
    if (inertialLabel) {
      inertialLabel.setAttribute("x", clampedX - finertialLen - 30);
      inertialLabel.setAttribute("y", 115);
    }

    // 更新加速度显示
    if (aText) {
      aText.textContent = `平台加速度 a₀ = ${a0Val.toFixed(2)} m/s²`;
    }

    // 重置时间，避免超出边界
    if (x > maxX || x < minX) {
      t = 0;
    }

    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("accelerating-platform", animId);
  };

  if (isSceneVisible("accelerating-platform")) {
    sceneAnimationRunning.set("accelerating-platform", true);
    animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("accelerating-platform", animId);
  }
}

// 转动碰撞·角动量守恒模型
function initRotatingCollisionScene() {
  const disk1 = document.getElementById("rotcoll-disk1");
  const disk2 = document.getElementById("rotcoll-disk2");
  const hudI1 = document.getElementById("hud-rotcoll-I1");
  const hudI2 = document.getElementById("hud-rotcoll-I2");
  const hudOmega1 = document.getElementById("hud-rotcoll-omega1");
  const hudOmega2 = document.getElementById("hud-rotcoll-omega2");
  const hudL = document.getElementById("hud-rotcoll-L");
  if (!disk1 || !disk2 || !hudI1 || !hudI2 || !hudOmega1 || !hudOmega2 || !hudL) return;

  let lastTime = 0;
  let t = 0;
  let collisionTime = 0;
  let isColliding = false;

  const updateHUD = (I1, I2, omega1, omega2, L) => {
    if (hudI1) hudI1.textContent = `${I1.toFixed(3)} kg·m²`;
    if (hudI2) hudI2.textContent = `${I2.toFixed(3)} kg·m²`;
    if (hudOmega1) hudOmega1.textContent = `${omega1.toFixed(2)} rad/s`;
    if (hudOmega2) hudOmega2.textContent = `${omega2.toFixed(2)} rad/s`;
    if (hudL) hudL.textContent = `${L.toFixed(2)} kg·m²/s`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("rotating-collision")) {
      sceneAnimationRunning.set("rotating-collision", false);
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    // 从参数输入读取
    const I1 = Number(document.getElementById("input-L")?.value || 0.5);
    const I2 = Number(document.getElementById("input-load")?.value || 0.8);
    const omega1Init = Number(document.getElementById("input-omega")?.value || 2.0);
    const omega2Init = Number(document.getElementById("input-crank-r")?.value || -1.0);
    const e = Number(document.getElementById("input-rod-l")?.value || 0.8);

    // 碰撞模拟：每3秒发生一次碰撞
    const collisionInterval = 3.0;
    const timeSinceCollision = t % collisionInterval;
    const isCollisionPhase = timeSinceCollision < 0.3; // 碰撞持续0.3秒

    let omega1, omega2;
    if (isCollisionPhase && !isColliding) {
      // 碰撞发生：计算碰撞后的角速度
      isColliding = true;
      collisionTime = timeSinceCollision;
      
      // 角动量守恒：I₁ω₁ + I₂ω₂ = I₁ω₁' + I₂ω₂'
      // 恢复系数：e = (ω₂' - ω₁')/(ω₁ - ω₂)
      // 联立求解
      const L0 = I1 * omega1Init + I2 * omega2Init; // 初始角动量
      const omegaDiff = omega1Init - omega2Init;
      const omega1After = (L0 - I2 * (omega1Init - omega2Init) * (1 + e)) / (I1 + I2);
      const omega2After = (L0 + I1 * (omega1Init - omega2Init) * (1 + e)) / (I1 + I2);
      
      // 碰撞过程中角速度平滑过渡
      const blend = Math.min(1, collisionTime / 0.3);
      omega1 = omega1Init * (1 - blend) + omega1After * blend;
      omega2 = omega2Init * (1 - blend) + omega2After * blend;
    } else {
      isColliding = false;
      // 碰撞后保持新角速度
      if (timeSinceCollision < 0.3) {
        const L0 = I1 * omega1Init + I2 * omega2Init;
        const omegaDiff = omega1Init - omega2Init;
        const omega1After = (L0 - I2 * omegaDiff * (1 + e)) / (I1 + I2);
        const omega2After = (L0 + I1 * omegaDiff * (1 + e)) / (I1 + I2);
        omega1 = omega1After;
        omega2 = omega2After;
      } else {
        omega1 = omega1Init;
        omega2 = omega2Init;
      }
    }

    // 更新圆盘旋转
    const theta1 = omega1 * t;
    const theta2 = omega2 * t;
    if (disk1) disk1.setAttribute("transform", `rotate(${(theta1 * 180 / Math.PI) % 360} 120 240)`);
    if (disk2) disk2.setAttribute("transform", `rotate(${(theta2 * 180 / Math.PI) % 360} 280 240)`);

    // 更新角速度箭头（改为圆弧显示旋转方向）
    const omega1Arc = document.getElementById("rotcoll-omega1-arc");
    const omega2Arc = document.getElementById("rotcoll-omega2-arc");
    const omega1Text = document.getElementById("rotcoll-omega1-text");
    const omega2Text = document.getElementById("rotcoll-omega2-text");
    
    if (omega1Arc) {
      // 根据角速度方向绘制圆弧（逆时针为正）
      const startAngle = omega1 >= 0 ? 0 : 180;
      const endAngle = omega1 >= 0 ? 90 : 270;
      const radius = 30;
      const startX = 120 + radius * Math.cos(startAngle * Math.PI / 180);
      const startY = 240 - radius * Math.sin(startAngle * Math.PI / 180);
      const endX = 120 + radius * Math.cos(endAngle * Math.PI / 180);
      const endY = 240 - radius * Math.sin(endAngle * Math.PI / 180);
      omega1Arc.setAttribute("d", `M ${startX} ${startY} A ${radius} ${radius} 0 0 ${omega1 >= 0 ? 1 : 0} ${endX} ${endY}`);
    }
    if (omega2Arc) {
      const startAngle = omega2 >= 0 ? 0 : 180;
      const endAngle = omega2 >= 0 ? 90 : 270;
      const radius = 30;
      const startX = 280 + radius * Math.cos(startAngle * Math.PI / 180);
      const startY = 240 - radius * Math.sin(startAngle * Math.PI / 180);
      const endX = 280 + radius * Math.cos(endAngle * Math.PI / 180);
      const endY = 240 - radius * Math.sin(endAngle * Math.PI / 180);
      omega2Arc.setAttribute("d", `M ${startX} ${startY} A ${radius} ${radius} 0 0 ${omega2 >= 0 ? 1 : 0} ${endX} ${endY}`);
    }

    // 更新角动量显示
    const L = I1 * omega1 + I2 * omega2;
    const LText = document.getElementById("rotcoll-L-text");
    if (LText) {
      LText.textContent = `L = ${L.toFixed(2)} kg·m²/s (守恒)`;
    }

    // 碰撞视觉效果
    const contactPoint = document.getElementById("rotcoll-contact");
    const statusText = document.getElementById("rotcoll-status");
    if (isCollisionPhase) {
      if (contactPoint) {
        contactPoint.setAttribute("opacity", "0.8");
        contactPoint.setAttribute("r", "12");
      }
      if (statusText) {
        statusText.setAttribute("opacity", "1");
      }
    } else {
      if (contactPoint) {
        contactPoint.setAttribute("opacity", "0");
        contactPoint.setAttribute("r", "8");
      }
      if (statusText) {
        statusText.setAttribute("opacity", "0");
      }
    }

    updateHUD(I1, I2, omega1, omega2, L);

    const animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("rotating-collision", animId);
  };

  if (isSceneVisible("rotating-collision")) {
    sceneAnimationRunning.set("rotating-collision", true);
    animate(0);
  }
}

// 斜碰撞·动量分解模型
function initObliqueCollisionScene() {
  const ball1 = document.getElementById("obliq-ball1");
  const ball2 = document.getElementById("obliq-ball2");
  const v1Arrow = document.getElementById("obliq-v1");
  const v2Arrow = document.getElementById("obliq-v2");
  const v1nArrow = document.getElementById("obliq-v1n");
  const v2nArrow = document.getElementById("obliq-v2n");
  const v1tArrow = document.getElementById("obliq-v1t");
  const v2tArrow = document.getElementById("obliq-v2t");
  const v1Label = document.getElementById("obliq-v1-label");
  const v2Label = document.getElementById("obliq-v2-label");
  const v1nLabel = document.getElementById("obliq-v1n-label");
  const v2nLabel = document.getElementById("obliq-v2n-label");
  const v1tLabel = document.getElementById("obliq-v1t-label");
  const v2tLabel = document.getElementById("obliq-v2t-label");
  const hudM1 = document.getElementById("hud-obliq-m1");
  const hudM2 = document.getElementById("hud-obliq-m2");
  const hudV1n = document.getElementById("hud-obliq-v1n");
  const hudV2n = document.getElementById("hud-obliq-v2n");
  const hudE = document.getElementById("hud-obliq-e");
  if (!ball1 || !ball2 || !v1Arrow || !v2Arrow || !hudM1 || !hudM2 || !hudV1n || !hudV2n || !hudE) return;

  let lastTime = 0;
  let t = 0;

  const updateHUD = (m1, m2, v1n, v2n, e) => {
    if (hudM1) hudM1.textContent = `${m1.toFixed(1)} kg`;
    if (hudM2) hudM2.textContent = `${m2.toFixed(1)} kg`;
    if (hudV1n) hudV1n.textContent = `${v1n.toFixed(2)} m/s`;
    if (hudV2n) hudV2n.textContent = `${v2n.toFixed(2)} m/s`;
    if (hudE) hudE.textContent = `${e.toFixed(2)}`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("oblique-collision")) {
      sceneAnimationRunning.set("oblique-collision", false);
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    // 从参数输入读取
    const m1 = Number(document.getElementById("input-L")?.value || 1.0);
    const m2 = Number(document.getElementById("input-load")?.value || 1.5);
    const v1 = Number(document.getElementById("input-omega")?.value || 3.0);
    const v2 = Number(document.getElementById("input-crank-r")?.value || 2.0);
    const e = Number(document.getElementById("input-rod-l")?.value || 0.7);

    // 碰撞面角度（30°）
    const surfaceAngle = 30 * Math.PI / 180;
    const cosAngle = Math.cos(surfaceAngle);
    const sinAngle = Math.sin(surfaceAngle);

    // 速度方向（简化：v1向右，v2向左）
    const v1Angle = 0; // 水平向右
    const v2Angle = Math.PI; // 水平向左

    // 分解为法向和切向分量
    // 法向单位矢量（垂直于碰撞面，向上）
    const nX = -sinAngle;
    const nY = -cosAngle;
    // 切向单位矢量（平行于碰撞面，向右上）
    const tX = cosAngle;
    const tY = -sinAngle;

    // 速度的法向和切向分量
    const v1n = v1 * Math.cos(v1Angle) * nX + v1 * Math.sin(v1Angle) * nY;
    const v2n = v2 * Math.cos(v2Angle) * nX + v2 * Math.sin(v2Angle) * nY;
    const v1t = v1 * Math.cos(v1Angle) * tX + v1 * Math.sin(v1Angle) * tY;
    const v2t = v2 * Math.cos(v2Angle) * tX + v2 * Math.sin(v2Angle) * tY;

    // 碰撞后的法向速度（利用恢复系数）
    const v1nAfter = ((m1 - e * m2) * v1n + (1 + e) * m2 * v2n) / (m1 + m2);
    const v2nAfter = ((m2 - e * m1) * v2n + (1 + e) * m1 * v1n) / (m1 + m2);

    // 碰撞模拟：每3秒发生一次碰撞
    const collisionInterval = 3.0;
    const timeSinceCollision = t % collisionInterval;
    const isCollisionPhase = timeSinceCollision < 0.3;

    let v1nCurrent, v2nCurrent;
    if (isCollisionPhase) {
      const blend = Math.min(1, timeSinceCollision / 0.3);
      v1nCurrent = v1n * (1 - blend) + v1nAfter * blend;
      v2nCurrent = v2n * (1 - blend) + v2nAfter * blend;
    } else {
      v1nCurrent = v1n;
      v2nCurrent = v2n;
    }

    // 小球沿碰撞面移动，并在碰撞点相遇
    const collisionX = 200;
    const collisionY = 240;
    
    let ball1X, ball1Y, ball2X, ball2Y;
    if (isCollisionPhase) {
      // 碰撞时：两球在碰撞点重合
      const blend = timeSinceCollision / 0.3;
      ball1X = collisionX - 20 * (1 - blend);
      ball1Y = collisionY - 10 * (1 - blend);
      ball2X = collisionX + 20 * (1 - blend);
      ball2Y = collisionY + 10 * (1 - blend);
    } else {
      // 碰撞前后：小球向碰撞点移动或远离
      const timeAfterCollision = timeSinceCollision - 0.3;
      const totalTime = collisionInterval - 0.3;
      const phase = timeAfterCollision / totalTime;
      
      if (phase < 0.5) {
        // 碰撞前：接近（从远处向碰撞点移动）
        const progress = phase * 2; // 0 到 1
        const maxDist = 80;
        const dist = maxDist * (1 - progress); // 从maxDist减少到0
        ball1X = collisionX - dist * Math.cos(surfaceAngle);
        ball1Y = collisionY - dist * Math.sin(surfaceAngle);
        ball2X = collisionX + dist * Math.cos(surfaceAngle);
        ball2Y = collisionY + dist * Math.sin(surfaceAngle);
      } else {
        // 碰撞后：远离（从碰撞点向外移动）
        const progress = (phase - 0.5) * 2; // 0 到 1
        const maxDist = 80;
        const dist = maxDist * progress; // 从0增加到maxDist
        ball1X = collisionX - dist * Math.cos(surfaceAngle);
        ball1Y = collisionY - dist * Math.sin(surfaceAngle);
        ball2X = collisionX + dist * Math.cos(surfaceAngle);
        ball2Y = collisionY + dist * Math.sin(surfaceAngle);
      }
    }

    if (ball1) {
      ball1.setAttribute("cx", ball1X);
      ball1.setAttribute("cy", ball1Y);
    }
    if (ball2) {
      ball2.setAttribute("cx", ball2X);
      ball2.setAttribute("cy", ball2Y);
    }

    // 更新标签位置
    const ball1Label = document.getElementById("obliq-ball1-label");
    const ball2Label = document.getElementById("obliq-ball2-label");
    if (ball1Label) {
      ball1Label.setAttribute("x", ball1X);
      ball1Label.setAttribute("y", ball1Y + 7);
    }
    if (ball2Label) {
      ball2Label.setAttribute("x", ball2X);
      ball2Label.setAttribute("y", ball2Y + 7);
    }

    // 更新速度箭头（总速度）
    const arrowScale = 12;
    if (v1Arrow) {
      v1Arrow.setAttribute("x1", ball1X);
      v1Arrow.setAttribute("y1", ball1Y);
      v1Arrow.setAttribute("x2", ball1X + v1 * arrowScale * Math.cos(v1Angle));
      v1Arrow.setAttribute("y2", ball1Y + v1 * arrowScale * Math.sin(v1Angle));
    }
    if (v2Arrow) {
      v2Arrow.setAttribute("x1", ball2X);
      v2Arrow.setAttribute("y1", ball2Y);
      v2Arrow.setAttribute("x2", ball2X + v2 * arrowScale * Math.cos(v2Angle));
      v2Arrow.setAttribute("y2", ball2Y + v2 * arrowScale * Math.sin(v2Angle));
    }

    // 更新法向分量箭头（垂直于碰撞面）
    const v1nLen = Math.abs(v1nCurrent) * arrowScale;
    const v2nLen = Math.abs(v2nCurrent) * arrowScale;
    if (v1nArrow) {
      v1nArrow.setAttribute("x1", ball1X);
      v1nArrow.setAttribute("y1", ball1Y);
      v1nArrow.setAttribute("x2", ball1X + v1nLen * nX);
      v1nArrow.setAttribute("y2", ball1Y + v1nLen * nY);
    }
    if (v2nArrow) {
      v2nArrow.setAttribute("x1", ball2X);
      v2nArrow.setAttribute("y1", ball2Y);
      v2nArrow.setAttribute("x2", ball2X + v2nLen * nX);
      v2nArrow.setAttribute("y2", ball2Y + v2nLen * nY);
    }

    // 更新切向分量箭头（平行于碰撞面）
    const v1tLen = Math.abs(v1t) * arrowScale;
    const v2tLen = Math.abs(v2t) * arrowScale;
    if (v1tArrow) {
      v1tArrow.setAttribute("x1", ball1X);
      v1tArrow.setAttribute("y1", ball1Y);
      v1tArrow.setAttribute("x2", ball1X + v1tLen * tX);
      v1tArrow.setAttribute("y2", ball1Y + v1tLen * tY);
    }
    if (v2tArrow) {
      v2tArrow.setAttribute("x1", ball2X);
      v2tArrow.setAttribute("y1", ball2Y);
      v2tArrow.setAttribute("x2", ball2X + v2tLen * tX);
      v2tArrow.setAttribute("y2", ball2Y + v2tLen * tY);
    }

    // 更新速度分解平行四边形（显示 v = vn + vt）
    const parallelogram1 = document.getElementById("obliq-parallelogram1");
    const parallelogram2 = document.getElementById("obliq-parallelogram2");
    if (parallelogram1) {
      const p1x = ball1X;
      const p1y = ball1Y;
      const p2x = ball1X + v1nLen * nX;
      const p2y = ball1Y + v1nLen * nY;
      const p3x = ball1X + v1 * arrowScale * Math.cos(v1Angle);
      const p3y = ball1Y + v1 * arrowScale * Math.sin(v1Angle);
      const p4x = ball1X + v1tLen * tX;
      const p4y = ball1Y + v1tLen * tY;
      parallelogram1.setAttribute("d", `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y} Z`);
    }
    if (parallelogram2) {
      const p1x = ball2X;
      const p1y = ball2Y;
      const p2x = ball2X + v2nLen * nX;
      const p2y = ball2Y + v2nLen * nY;
      const p3x = ball2X + v2 * arrowScale * Math.cos(v2Angle);
      const p3y = ball2Y + v2 * arrowScale * Math.sin(v2Angle);
      const p4x = ball2X + v2tLen * tX;
      const p4y = ball2Y + v2tLen * tY;
      parallelogram2.setAttribute("d", `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y} Z`);
    }

    // 更新标签位置
    if (v1Label) v1Label.setAttribute("x", ball1X + v1 * arrowScale * Math.cos(v1Angle) + 5);
    if (v1Label) v1Label.setAttribute("y", ball1Y + v1 * arrowScale * Math.sin(v1Angle) - 5);
    if (v2Label) v2Label.setAttribute("x", ball2X + v2 * arrowScale * Math.cos(v2Angle) + 5);
    if (v2Label) v2Label.setAttribute("y", ball2Y + v2 * arrowScale * Math.sin(v2Angle) - 5);
    if (v1nLabel) v1nLabel.setAttribute("x", ball1X + v1nLen * nX + 5);
    if (v1nLabel) v1nLabel.setAttribute("y", ball1Y + v1nLen * nY - 5);
    if (v2nLabel) v2nLabel.setAttribute("x", ball2X + v2nLen * nX + 5);
    if (v2nLabel) v2nLabel.setAttribute("y", ball2Y + v2nLen * nY - 5);
    if (v1tLabel) v1tLabel.setAttribute("x", ball1X + v1tLen * tX + 5);
    if (v1tLabel) v1tLabel.setAttribute("y", ball1Y + v1tLen * tY - 5);
    if (v2tLabel) v2tLabel.setAttribute("x", ball2X + v2tLen * tX + 5);
    if (v2tLabel) v2tLabel.setAttribute("y", ball2Y + v2tLen * tY - 5);

    // 碰撞提示
    const statusText = document.getElementById("obliq-status");
    if (isCollisionPhase) {
      if (statusText) statusText.setAttribute("opacity", "1");
    } else {
      if (statusText) statusText.setAttribute("opacity", "0");
    }

    updateHUD(m1, m2, v1nCurrent, v2nCurrent, e);

    const animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("oblique-collision", animId);
  };

  if (isSceneVisible("oblique-collision")) {
    sceneAnimationRunning.set("oblique-collision", true);
    animate(0);
  }
}

// 简谐振动·单自由度模型
function initSimpleHarmonicOscillatorScene() {
  const mass = document.getElementById("sho-mass");
  const spring = document.getElementById("sho-spring");
  const xArrow = document.getElementById("sho-x");
  const vArrow = document.getElementById("sho-v");
  const aArrow = document.getElementById("sho-a");
  const curve = document.getElementById("sho-curve");
  const hudM = document.getElementById("hud-sho-m");
  const hudK = document.getElementById("hud-sho-k");
  const hudOmega = document.getElementById("hud-sho-omega");
  const hudX = document.getElementById("hud-sho-x");
  const hudV = document.getElementById("hud-sho-v");
  if (!mass || !spring || !hudM || !hudK || !hudOmega || !hudX || !hudV) return;

  let lastTime = 0;
  let t = 0;

  const updateHUD = (m, k, omega, x, v) => {
    if (hudM) hudM.textContent = `${m.toFixed(2)} kg`;
    if (hudK) hudK.textContent = `${k.toFixed(1)} N/m`;
    if (hudOmega) hudOmega.textContent = `${omega.toFixed(2)} rad/s`;
    if (hudX) hudX.textContent = `${x.toFixed(3)} m`;
    if (hudV) hudV.textContent = `${v.toFixed(2)} m/s`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("simple-harmonic-oscillator")) {
      sceneAnimationRunning.set("simple-harmonic-oscillator", false);
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const m = Number(document.getElementById("input-L")?.value || 1.0);
    const k = Number(document.getElementById("input-load")?.value || 10.0);
    const A = 0.08; // 振幅（米）
    const omega = Math.sqrt(k / m);
    const phi = 0;

    const x = A * Math.cos(omega * t + phi);
    const v = -A * omega * Math.sin(omega * t + phi);
    const a = -A * omega * omega * Math.cos(omega * t + phi);

    const massX = 100 + x * 500; // 转换为像素
    const massY = 215; // 与SVG中质量块位置一致（y=200 + 15居中）

    if (mass) {
      mass.setAttribute("x", massX - 20);
      mass.setAttribute("y", massY);
    }
    if (spring) {
      const springLength = massX - 50;
      const segments = Math.max(5, Math.floor(springLength / 10));
      let path = `M 50 170`; // 与SVG中固定点位置一致
      for (let i = 0; i <= segments; i++) {
        const x = 50 + (springLength / segments) * i;
        const y = 170 + (i % 2 === 0 ? 5 : -5);
        path += ` L ${x} ${y}`;
      }
      spring.setAttribute("d", path);
    }

    if (xArrow) {
      xArrow.setAttribute("x1", massX);
      xArrow.setAttribute("y1", 240); // 与SVG中平衡位置一致
      xArrow.setAttribute("x2", massX);
      xArrow.setAttribute("y2", 240 - x * 200);
    }
    if (vArrow) {
      vArrow.setAttribute("x1", massX);
      vArrow.setAttribute("y1", massY);
      vArrow.setAttribute("x2", massX);
      vArrow.setAttribute("y2", massY - v * 30);
    }
    if (aArrow) {
      aArrow.setAttribute("x1", massX);
      aArrow.setAttribute("y1", massY);
      aArrow.setAttribute("x2", massX);
      aArrow.setAttribute("y2", massY - a * 20);
    }

    // 移除曲线图，保持模型紧凑

    updateHUD(m, k, omega, x, v);

    const animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("simple-harmonic-oscillator", animId);
  };

  if (isSceneVisible("simple-harmonic-oscillator")) {
    sceneAnimationRunning.set("simple-harmonic-oscillator", true);
    animate(0);
  }
}

// 阻尼振动·衰减模型
function initDampedVibrationScene() {
  const mass = document.getElementById("damp-mass");
  const spring = document.getElementById("damp-spring");
  const damper = document.getElementById("damp-damper");
  const damperCircle = document.getElementById("damp-damper-circle");
  const hudM = document.getElementById("hud-damp-m");
  const hudK = document.getElementById("hud-damp-k");
  const hudC = document.getElementById("hud-damp-c");
  const hudZeta = document.getElementById("hud-damp-zeta");
  const hudX = document.getElementById("hud-damp-x");
  if (!mass || !spring || !hudM || !hudK || !hudC || !hudZeta || !hudX) return;

  let lastTime = 0;
  let t = 0;

  const updateHUD = (m, k, c, zeta, x) => {
    if (hudM) hudM.textContent = `${m.toFixed(2)} kg`;
    if (hudK) hudK.textContent = `${k.toFixed(1)} N/m`;
    if (hudC) hudC.textContent = `${c.toFixed(2)} N·s/m`;
    if (hudZeta) hudZeta.textContent = `${zeta.toFixed(3)}`;
    if (hudX) hudX.textContent = `${x.toFixed(3)} m`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("damped-vibration")) {
      sceneAnimationRunning.set("damped-vibration", false);
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const m = Number(document.getElementById("input-L")?.value || 1.0);
    const k = Number(document.getElementById("input-load")?.value || 10.0);
    const c = Number(document.getElementById("input-omega")?.value || 1.0);
    const A0 = 0.1;
    const omega0 = Math.sqrt(k / m);
    const zeta = c / (2 * Math.sqrt(m * k));
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);

    let x;
    if (zeta < 1) {
      // 欠阻尼
      x = A0 * Math.exp(-zeta * omega0 * t) * Math.cos(omegaD * t);
    } else if (zeta === 1) {
      // 临界阻尼
      x = A0 * (1 + omega0 * t) * Math.exp(-omega0 * t);
    } else {
      // 过阻尼
      const r1 = -zeta * omega0 + omega0 * Math.sqrt(zeta * zeta - 1);
      const r2 = -zeta * omega0 - omega0 * Math.sqrt(zeta * zeta - 1);
      x = A0 * (Math.exp(r1 * t) - Math.exp(r2 * t)) / 2;
    }

    const massX = 100 + x * 500;
    const massY = 225; // 与SVG中质量块位置一致（y=210 + 15居中）

    if (mass) {
      mass.setAttribute("x", massX - 20);
      mass.setAttribute("y", massY);
    }
    if (spring) {
      const springLength = massX - 50;
      const segments = Math.max(5, Math.floor(springLength / 10));
      let path = `M 50 170`; // 与SVG中固定点位置一致
      for (let i = 0; i <= segments; i++) {
        const x = 50 + (springLength / segments) * i;
        const y = 170 + (i % 2 === 0 ? 5 : -5);
        path += ` L ${x} ${y}`;
      }
      spring.setAttribute("d", path);
    }
    if (damper) {
      damper.setAttribute("x1", "50");
      damper.setAttribute("y1", "170"); // 与SVG中固定点位置一致
      damper.setAttribute("x2", massX - 20);
      damper.setAttribute("y2", "170");
    }
    if (damperCircle) {
      damperCircle.setAttribute("cx", massX - 20);
      damperCircle.setAttribute("cy", "170"); // 与SVG中固定点位置一致
      damperCircle.setAttribute("opacity", "0.8");
    }

    // 移除曲线图，保持模型紧凑

    updateHUD(m, k, c, zeta, x);

    const animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("damped-vibration", animId);
  };

  if (isSceneVisible("damped-vibration")) {
    sceneAnimationRunning.set("damped-vibration", true);
    animate(0);
  }
}

// 受迫振动·共振模型
function initForcedVibrationScene() {
  const mass = document.getElementById("force-mass");
  const spring = document.getElementById("force-spring");
  const forceArrow = document.getElementById("force-f");
  const xArrow = document.getElementById("force-x");
  const hudM = document.getElementById("hud-force-m");
  const hudK = document.getElementById("hud-force-k");
  const hudOmega = document.getElementById("hud-force-omega");
  const hudOmega0 = document.getElementById("hud-force-omega0");
  const hudA = document.getElementById("hud-force-A");
  if (!mass || !spring || !hudM || !hudK || !hudOmega || !hudOmega0 || !hudA) return;

  let lastTime = 0;
  let t = 0;

  const updateHUD = (m, k, omega, omega0, A) => {
    if (hudM) hudM.textContent = `${m.toFixed(2)} kg`;
    if (hudK) hudK.textContent = `${k.toFixed(1)} N/m`;
    if (hudOmega) hudOmega.textContent = `${omega.toFixed(2)} rad/s`;
    if (hudOmega0) hudOmega0.textContent = `${omega0.toFixed(2)} rad/s`;
    if (hudA) hudA.textContent = `${A.toFixed(3)} m`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("forced-vibration")) {
      sceneAnimationRunning.set("forced-vibration", false);
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const m = Number(document.getElementById("input-L")?.value || 1.0);
    const k = Number(document.getElementById("input-load")?.value || 10.0);
    const omega = Number(document.getElementById("input-omega")?.value || 3.0);
    const F0 = 2.0;
    const omega0 = Math.sqrt(k / m);
    const zeta = 0.1;
    const r = omega / omega0; // 频率比

    // 振幅响应
    const A = F0 / (m * Math.sqrt(Math.pow(omega0 * omega0 - omega * omega, 2) + Math.pow(2 * zeta * omega0 * omega, 2)));
    const phi = Math.atan2(2 * zeta * omega0 * omega, omega0 * omega0 - omega * omega);

    const x = A * Math.cos(omega * t - phi);
    const F = F0 * Math.cos(omega * t);

    const massX = 100 + x * 500;
    const massY = 305; // 与SVG中质量块位置一致（y=290 + 15居中）

    if (mass) {
      mass.setAttribute("x", massX - 20);
      mass.setAttribute("y", massY);
    }
    if (spring) {
      const springLength = massX - 50;
      const segments = Math.max(5, Math.floor(springLength / 10));
      let path = `M 50 170`; // 与SVG中固定点位置一致
      for (let i = 0; i <= segments; i++) {
        const x = 50 + (springLength / segments) * i;
        const y = 170 + (i % 2 === 0 ? 5 : -5);
        path += ` L ${x} ${y}`;
      }
      spring.setAttribute("d", path);
    }
    if (forceArrow) {
      forceArrow.setAttribute("x1", massX);
      forceArrow.setAttribute("y1", massY);
      forceArrow.setAttribute("x2", massX);
      forceArrow.setAttribute("y2", massY - F * 20);
    }
    if (xArrow) {
      xArrow.setAttribute("x1", massX);
      xArrow.setAttribute("y1", 330); // 与SVG中平衡位置一致
      xArrow.setAttribute("x2", massX);
      xArrow.setAttribute("y2", 330 - x * 200);
    }

    // 移除响应曲线图，保持模型紧凑

    updateHUD(m, k, omega, omega0, A);

    const animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("forced-vibration", animId);
  };

  if (isSceneVisible("forced-vibration")) {
    sceneAnimationRunning.set("forced-vibration", true);
    animate(0);
  }
}

// 陀螺进动·定点转动模型
function initGyroscopePrecessionScene() {
  const axis = document.getElementById("gyro-axis");
  const axisLine = document.getElementById("gyro-axis-line");
  const disk = document.getElementById("gyro-disk");
  const diskLine = document.getElementById("gyro-disk-line");
  const LArrow = document.getElementById("gyro-L");
  const MArrow = document.getElementById("gyro-M");
  const precessionPath = document.getElementById("gyro-precession-path");
  const hudI = document.getElementById("hud-gyro-I");
  const hudOmega = document.getElementById("hud-gyro-omega");
  const hudM = document.getElementById("hud-gyro-M");
  const hudOmegaPrec = document.getElementById("hud-gyro-Omega");
  const hudL = document.getElementById("hud-gyro-L");
  if (!axis || !axisLine || !disk || !hudI || !hudOmega || !hudM || !hudOmegaPrec || !hudL) return;

  let lastTime = 0;
  let t = 0;

  const updateHUD = (I, omega, M, Omega, L) => {
    if (hudI) hudI.textContent = `${I.toFixed(3)} kg·m²`;
    if (hudOmega) hudOmega.textContent = `${omega.toFixed(2)} rad/s`;
    if (hudM) hudM.textContent = `${M.toFixed(2)} N·m`;
    if (hudOmegaPrec) hudOmegaPrec.textContent = `${Omega.toFixed(3)} rad/s`;
    if (hudL) hudL.textContent = `${L.toFixed(2)} kg·m²/s`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("gyroscope-precession")) {
      sceneAnimationRunning.set("gyroscope-precession", false);
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const I = Number(document.getElementById("input-L")?.value || 0.1);
    const omega = Number(document.getElementById("input-load")?.value || 10.0);
    const M = Number(document.getElementById("input-omega")?.value || 0.5);
    const L = I * omega;
    const Omega = M / L; // 进动角速度

    const precessionAngle = Omega * t;
    const spinAngle = omega * t;

    const centerX = 200;
    const centerY = 280; // 向上移动20px，减少上方空白
    const axisLength = 100;
    const tiltAngle = 30 * Math.PI / 180;

    const axisEndX = centerX + axisLength * Math.sin(tiltAngle) * Math.cos(precessionAngle);
    const axisEndY = centerY - axisLength * Math.cos(tiltAngle);
    const axisEndZ = axisLength * Math.sin(tiltAngle) * Math.sin(precessionAngle);

    if (axis) {
      axis.setAttribute("transform", `rotate(${precessionAngle * 180 / Math.PI} ${centerX} ${centerY})`);
    }
    if (disk) {
      disk.setAttribute("transform", `rotate(${spinAngle * 180 / Math.PI} ${centerX} ${centerY - axisLength})`);
    }
    if (diskLine) {
      diskLine.setAttribute("transform", `rotate(${spinAngle * 180 / Math.PI} ${centerX} ${centerY - axisLength})`);
    }

    if (LArrow) {
      LArrow.setAttribute("x1", centerX);
      LArrow.setAttribute("y1", centerY);
      LArrow.setAttribute("x2", axisEndX);
      LArrow.setAttribute("y2", axisEndY);
    }
    if (MArrow) {
      MArrow.setAttribute("x1", axisEndX);
      MArrow.setAttribute("y1", axisEndY);
      MArrow.setAttribute("x2", axisEndX + 20 * Math.cos(precessionAngle + Math.PI / 2));
      MArrow.setAttribute("y2", axisEndY - 20 * Math.sin(precessionAngle + Math.PI / 2));
    }

    if (precessionPath) {
      const radius = 50;
      const points = [];
      for (let i = 0; i <= 360; i += 10) {
        const angle = i * Math.PI / 180;
        const px = centerX + radius * Math.cos(angle);
        const py = centerY + radius * Math.sin(angle);
        points.push(`${px},${py}`);
      }
      precessionPath.setAttribute("d", `M ${points.join(" L ")} Z`);
    }

    updateHUD(I, omega, M, Omega, L);

    const animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("gyroscope-precession", animId);
  };

  if (isSceneVisible("gyroscope-precession")) {
    sceneAnimationRunning.set("gyroscope-precession", true);
    animate(0);
  }
}

// 欧拉角·刚体姿态模型
function initEulerAnglesScene() {
  const body = document.getElementById("euler-body");
  const phiArc = document.getElementById("euler-phi");
  const thetaArc = document.getElementById("euler-theta");
  const psiArc = document.getElementById("euler-psi");
  const hudPhi = document.getElementById("hud-euler-phi");
  const hudTheta = document.getElementById("hud-euler-theta");
  const hudPsi = document.getElementById("hud-euler-psi");
  const hudOmega = document.getElementById("hud-euler-omega");
  if (!body || !hudPhi || !hudTheta || !hudPsi || !hudOmega) return;

  let lastTime = 0;
  let t = 0;

  const updateHUD = (phi, theta, psi, omega) => {
    if (hudPhi) hudPhi.textContent = `${(phi * 180 / Math.PI).toFixed(1)}°`;
    if (hudTheta) hudTheta.textContent = `${(theta * 180 / Math.PI).toFixed(1)}°`;
    if (hudPsi) hudPsi.textContent = `${(psi * 180 / Math.PI).toFixed(1)}°`;
    if (hudOmega) hudOmega.textContent = `${omega.toFixed(2)} rad/s`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("euler-angles")) {
      sceneAnimationRunning.set("euler-angles", false);
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const omega = Number(document.getElementById("input-omega")?.value || 1.0);
    const phi = omega * t * 0.3; // 进动角
    const theta = 30 * Math.PI / 180 + 0.1 * Math.sin(omega * t * 0.5); // 章动角
    const psi = omega * t; // 自转角

    if (body) {
      body.setAttribute("transform", `rotate(${phi * 180 / Math.PI} 200 220) rotate(${theta * 180 / Math.PI} 200 220) rotate(${psi * 180 / Math.PI} 200 220)`); // 向上移动20px，减少上方空白
    }

    if (phiArc) {
      phiArc.setAttribute("d", `M 200 220 A 30 30 0 0 ${phi > Math.PI ? 1 : 0} ${200 + 30 * Math.cos(phi)} ${220 + 30 * Math.sin(phi)}`); // 向上移动20px
    }
    if (thetaArc) {
      thetaArc.setAttribute("d", `M 200 220 A 40 40 0 0 ${theta > Math.PI / 2 ? 1 : 0} ${200 + 40 * Math.cos(theta)} ${220 - 40 * Math.sin(theta)}`); // 向上移动20px
    }
    if (psiArc) {
      psiArc.setAttribute("d", `M 200 220 A 50 50 0 0 ${psi > Math.PI ? 1 : 0} ${200 + 50 * Math.cos(psi)} ${220 + 50 * Math.sin(psi)}`); // 向上移动20px
    }

    updateHUD(phi, theta, psi, omega);

    const animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("euler-angles", animId);
  };

  if (isSceneVisible("euler-angles")) {
    sceneAnimationRunning.set("euler-angles", true);
    animate(0);
  }
}

// 火箭运动·变质量模型
function initRocketMotionScene() {
  const rocketBody = document.getElementById("rocket-body");
  const rocketRect = document.getElementById("rocket-rect");
  const rocketNose = document.getElementById("rocket-nose");
  const rocketFin1 = document.getElementById("rocket-fin1");
  const rocketFin2 = document.getElementById("rocket-fin2");
  const vArrow = document.getElementById("rocket-v");
  const thrustArrow = document.getElementById("rocket-thrust");
  const exhaust1 = document.getElementById("rocket-exhaust1");
  const exhaust2 = document.getElementById("rocket-exhaust2");
  const exhaust3 = document.getElementById("rocket-exhaust3");
  const trajectory = document.getElementById("rocket-trajectory");
  const massLabel = document.getElementById("rocket-mass-label");
  const hudM0 = document.getElementById("hud-rocket-m0");
  const hudM = document.getElementById("hud-rocket-m");
  const hudU = document.getElementById("hud-rocket-u");
  const hudDotM = document.getElementById("hud-rocket-dotm");
  const hudV = document.getElementById("hud-rocket-v");
  if (!rocketBody || !rocketRect || !hudM0 || !hudM || !hudU || !hudDotM || !hudV) return;

  let lastTime = 0;
  let t = 0;

  const updateHUD = (m0, m, u, dotM, v) => {
    if (hudM0) hudM0.textContent = `${m0.toFixed(2)} kg`;
    if (hudM) hudM.textContent = `${m.toFixed(2)} kg`;
    if (hudU) hudU.textContent = `${u.toFixed(1)} m/s`;
    if (hudDotM) hudDotM.textContent = `${dotM.toFixed(3)} kg/s`;
    if (hudV) hudV.textContent = `${v.toFixed(2)} m/s`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("rocket-motion")) {
      sceneAnimationRunning.set("rocket-motion", false);
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const m0 = Number(document.getElementById("input-L")?.value || 100.0);
    const u = Number(document.getElementById("input-load")?.value || 2000.0);
    const dotM = Number(document.getElementById("input-omega")?.value || 5.0);
    const m = Math.max(10, m0 - dotM * t);
    const v = u * Math.log(m0 / m);

    const rocketY = 210 - v * 0.1; // 向上移动20px，减少上方空白
    const rocketX = 165;

    if (rocketBody) {
      rocketBody.setAttribute("transform", `translate(0 ${rocketY - 210})`); // 调整基准位置
    }

    if (vArrow) {
      vArrow.setAttribute("x1", rocketX);
      vArrow.setAttribute("y1", rocketY + 30);
      vArrow.setAttribute("x2", rocketX);
      vArrow.setAttribute("y2", rocketY + 30 - v * 0.05);
    }
    if (thrustArrow) {
      thrustArrow.setAttribute("x1", rocketX);
      thrustArrow.setAttribute("y1", rocketY + 60);
      thrustArrow.setAttribute("x2", rocketX);
      thrustArrow.setAttribute("y2", rocketY + 60 + 20);
    }

    if (exhaust1) {
      exhaust1.setAttribute("cy", rocketY + 60 + 10 * (t % 0.2));
      exhaust1.setAttribute("opacity", "0.8");
    }
    if (exhaust2) {
      exhaust2.setAttribute("cy", rocketY + 60 + 8 * (t % 0.2));
      exhaust2.setAttribute("opacity", "0.6");
    }
    if (exhaust3) {
      exhaust3.setAttribute("cy", rocketY + 60 + 8 * (t % 0.2));
      exhaust3.setAttribute("opacity", "0.6");
    }

    if (trajectory) {
      const points = [];
      for (let i = 0; i < 50; i++) {
        const tCurve = t - (50 - i) * 0.1;
        const mCurve = Math.max(10, m0 - dotM * tCurve);
        const vCurve = u * Math.log(m0 / mCurve);
        const yCurve = 210 - vCurve * 0.1; // 向上移动20px
        points.push(`${rocketX},${yCurve}`);
      }
      trajectory.setAttribute("d", `M ${points.join(" L ")}`);
    }

    if (massLabel) {
      massLabel.textContent = `m=${m.toFixed(1)}`;
    }

    updateHUD(m0, m, u, dotM, v);

    const animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("rocket-motion", animId);
  };

  if (isSceneVisible("rocket-motion")) {
    sceneAnimationRunning.set("rocket-motion", true);
    animate(0);
  }
}

// 变质量系统·质量流模型
function initVariableMassSystemScene() {
  const container = document.getElementById("vms-container");
  const vArrow = document.getElementById("vms-v");
  const inflow = document.getElementById("vms-inflow");
  const outflow = document.getElementById("vms-outflow");
  const forceArrow = document.getElementById("vms-force");
  const particle1 = document.getElementById("vms-particle1");
  const particle2 = document.getElementById("vms-particle2");
  const particle3 = document.getElementById("vms-particle3");
  const particle4 = document.getElementById("vms-particle4");
  const massLabel = document.getElementById("vms-mass-label");
  const hudM = document.getElementById("hud-vms-m");
  const hudV = document.getElementById("hud-vms-v");
  const hudDotM = document.getElementById("hud-vms-dotm");
  const hudU = document.getElementById("hud-vms-u");
  const hudF = document.getElementById("hud-vms-F");
  if (!container || !hudM || !hudV || !hudDotM || !hudU || !hudF) return;

  let lastTime = 0;
  let t = 0;

  const updateHUD = (m, v, dotM, u, F) => {
    if (hudM) hudM.textContent = `${m.toFixed(2)} kg`;
    if (hudV) hudV.textContent = `${v.toFixed(2)} m/s`;
    if (hudDotM) hudDotM.textContent = `${dotM.toFixed(3)} kg/s`;
    if (hudU) hudU.textContent = `${u.toFixed(1)} m/s`;
    if (hudF) hudF.textContent = `${F.toFixed(2)} N`;
  };

  const animate = (timestamp) => {
    if (!isSceneVisible("variable-mass-system")) {
      sceneAnimationRunning.set("variable-mass-system", false);
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.03, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    t += dt;

    const m0 = Number(document.getElementById("input-L")?.value || 10.0);
    const v = Number(document.getElementById("input-load")?.value || 2.0);
    const dotM = Number(document.getElementById("input-omega")?.value || 0.5);
    const u = 1.0;
    const m = Math.max(1, m0 + dotM * t);
    const F = (v - u) * dotM;

    const containerX = 100 + v * 20 * t;
    const containerY = 240; // 向上移动20px，减少上方空白

    if (container) {
      container.setAttribute("x", containerX);
      container.setAttribute("y", containerY - 30);
    }
    if (vArrow) {
      vArrow.setAttribute("x1", containerX + 40);
      vArrow.setAttribute("y1", containerY);
      vArrow.setAttribute("x2", containerX + 40 + v * 15);
      vArrow.setAttribute("y2", containerY);
    }
    if (inflow) {
      inflow.setAttribute("x1", containerX - 20);
      inflow.setAttribute("y1", containerY);
      inflow.setAttribute("x2", containerX);
      inflow.setAttribute("y2", containerY);
    }
    if (outflow) {
      outflow.setAttribute("x1", containerX + 80);
      outflow.setAttribute("y1", containerY);
      outflow.setAttribute("x2", containerX + 100);
      outflow.setAttribute("y2", containerY);
    }
    if (forceArrow) {
      forceArrow.setAttribute("x1", containerX + 40);
      forceArrow.setAttribute("y1", containerY - 30);
      forceArrow.setAttribute("x2", containerX + 40 + F * 5);
      forceArrow.setAttribute("y2", containerY - 30);
    }

    if (particle1) {
      particle1.setAttribute("cx", containerX - 10 - (t % 0.5) * 20);
      particle1.setAttribute("cy", containerY); // 向上移动20px
      particle1.setAttribute("opacity", "0.8");
    }
    if (particle2) {
      particle2.setAttribute("cx", containerX - 15 - (t % 0.5) * 20);
      particle2.setAttribute("cy", containerY + 5); // 向上移动20px
      particle2.setAttribute("opacity", "0.6");
    }
    if (particle3) {
      particle3.setAttribute("cx", containerX + 90 + (t % 0.5) * 20);
      particle3.setAttribute("cy", containerY); // 向上移动20px
      particle3.setAttribute("opacity", "0.8");
    }
    if (particle4) {
      particle4.setAttribute("cx", containerX + 95 + (t % 0.5) * 20);
      particle4.setAttribute("cy", containerY + 5); // 向上移动20px
      particle4.setAttribute("opacity", "0.6");
    }

    if (massLabel) {
      massLabel.textContent = `m=${m.toFixed(1)}`;
    }

    updateHUD(m, v, dotM, u, F);

    const animId = requestAnimationFrame(animate);
    sceneAnimationIds.set("variable-mass-system", animId);
  };

  if (isSceneVisible("variable-mass-system")) {
    sceneAnimationRunning.set("variable-mass-system", true);
    animate(0);
  }
}

// 首次加载时默认初始化 2D 动画
document.addEventListener("DOMContentLoaded", () => {
  // 立即初始化UI交互（不阻塞）
  initModelConceptBinding();
  initSubjectModelSwitching();
  
  // 延迟初始化场景，避免阻塞界面
  setTimeout(() => {
  if (visual2D && visual2D.classList.contains("active")) {
    initCrankSliderInteraction();
    svgAnimInited = true;
  }

    // 分批初始化场景，避免一次性执行太多操作
    const initScenes = [
      () => initBeamScene(),
      () => initDoorLeverScene(),
      () => initFrictionSlopeScene(),
      () => initFrictionMechanismsScene(),
      () => initDiskCoupleScene(),
      () => initMultiForcePanelScene(),
      () => initConstraintTypesScene(),
    ];
    
    // 第一批：非动画场景（立即执行）
    initScenes.forEach(fn => {
      try { fn(); } catch(e) { console.warn("场景初始化失败:", e); }
    });
    
    // 第二批：动画场景（延迟执行，按需启动）
    setTimeout(() => {
      const animScenes = [
        () => initPointKinematicsScene(),
        () => initRigidFixedRotationScene(),
        () => initCompositePointMotionScene(),
        () => initParticleNewtonScene(),
        () => initPolarDynamicsScene(),
        () => initNoninertialDynamicsScene(),
        () => initImpulseMomentumScene(),
        () => initTwoBodyCollisionScene(),
        () => initSystemMomentumCenterScene(),
        () => initAngularMomentumTheoremScene(),
        () => initAngularMomentumConservationScene(),
        () => initWorkEnergyScene(),
        () => initDAlembertPrincipleScene(),
        () => initVirtualDisplacementPrincipleScene(),
        () => initRotatingReferenceFrameScene(),
        () => initAcceleratingPlatformScene(),
        () => initLagrangePendulumScene(),
        () => initHamiltonPrincipleScene(),
        () => initGeneralizedCoordinatesScene(),
        () => initConservativeForcePotentialScene(),
        () => initVirtualWorkConstraintReactionScene(),
        () => initRotatingCollisionScene(),
        () => initObliqueCollisionScene(),
        () => initSimpleHarmonicOscillatorScene(),
        () => initDampedVibrationScene(),
        () => initForcedVibrationScene(),
        () => initGyroscopePrecessionScene(),
        () => initEulerAnglesScene(),
        () => initRocketMotionScene(),
        () => initVariableMassSystemScene(),
      ];
      
      // 只初始化当前可见的场景，其他场景按需初始化
      animScenes.forEach(fn => {
        try { fn(); } catch(e) { console.warn("动画场景初始化失败:", e); }
      });
    }, 200);
  }, 50);
});

// 模型与概念的映射关系（全局定义，供多个函数使用）
  const conceptMap = {
    "door-lever": ["what-is-force", "force-four-elements", "force-arm", "moment-about-point"],
    "rigid-body-2d": ["what-is-force", "force-four-elements", "free-body-diagram", "plane-system-simplification", "equilibrium-equations", "constraints-reactions", "statically-determinate", "principal-vector-moment", "three-force-equilibrium", "equivalent-force-system", "force-translation-theorem"],
    "crank-slider": ["what-is-force", "moment-about-point", "kinematics-basics", "velocity-acceleration", "normal-tangential-acceleration", "plane-motion-rigid-body", "instantaneous-center", "composite-motion", "circular-motion", "angular-velocity-acceleration", "rigid-body-fixed-axis-rotation"],
    "three-force-equilibrium": ["what-is-force", "free-body-diagram", "equilibrium-equations", "three-force-equilibrium", "constraints-reactions", "principal-vector-moment"],
    "force-couple-simplification": ["force-couple", "force-couple-moment", "force-couple-translation", "plane-system-simplification", "equivalent-force-system"],
    "disk-couple": ["force-couple", "force-couple-moment", "force-couple-vector", "torsion-angle", "moment-of-inertia"],
    "multi-force-panel": ["free-body-diagram", "plane-system-simplification", "principal-vector-moment", "constraints-reactions", "equilibrium-equations"],
    "point-kinematics-curve": ["kinematics-basics", "velocity-acceleration", "normal-tangential-acceleration", "curvilinear-motion"],
    "point-kinematics-coordinates": ["kinematics-basics", "velocity-acceleration", "coordinate-systems", "rectangular-coordinates", "polar-coordinates", "natural-coordinates"],
    "rigid-fixed-rotation": ["rigid-body-fixed-axis-rotation", "angular-velocity-acceleration", "kinematics-basics"],
    "rigid-body-translation": ["rigid-body-translation", "kinematics-basics", "velocity-acceleration"],
    "instantaneous-center-velocity": ["instantaneous-center", "plane-motion-rigid-body", "velocity-acceleration", "angular-velocity-acceleration"],
    "conservative-force-potential": ["conservative-force", "potential-energy", "mechanical-energy-conservation", "work-energy-principle"],
    "virtual-work-constraint-reaction": ["virtual-displacement-principle", "constraints-reactions", "statically-determinate", "equilibrium-equations"],
    "composite-point-motion": ["composite-motion", "relative-motion", "transport-velocity", "velocity-acceleration"],
    "particle-newton-2d": ["particle-dynamics", "newton-second-law", "kinematics-1d", "velocity-vector", "acceleration-vector"],
    "polar-dynamics": ["particle-dynamics", "newton-second-law", "polar-coordinates", "velocity-acceleration", "acceleration-vector"],
    "noninertial-dynamics": ["particle-dynamics", "newton-second-law", "noninertial-reference-frame", "inertial-force", "velocity-acceleration", "acceleration-vector"],
    "impulse-momentum": ["momentum-impulse", "momentum-conservation", "system-momentum", "velocity-vector"],
    "two-body-collision": ["momentum-conservation", "collision-problem", "momentum-impulse"],
    "system-momentum-center": ["system-momentum", "center-of-mass", "momentum-conservation", "velocity-vector", "mass-center-motion"],
    "angular-momentum-theorem": ["angular-momentum-theorem", "angular-momentum-conservation", "moment-of-inertia", "rigid-body-fixed-axis-rotation"],
    "angular-momentum-conservation": ["angular-momentum-conservation", "moment-of-inertia", "rigid-body-fixed-axis-rotation", "angular-velocity-acceleration"],
    "plane-force-system-simplification": ["plane-system-simplification", "principal-vector-moment", "equivalent-force-system", "force-translation-theorem", "free-body-diagram"],
    "spatial-force-system": ["what-is-force", "free-body-diagram", "spatial-equilibrium", "principal-vector-moment", "force-couple-vector", "equilibrium-equations"],
    "friction-slope": ["free-body-diagram", "friction", "friction-angle", "equilibrium-equations", "constraints-reactions"],
    "friction-mechanisms": ["friction", "friction-angle", "rolling-resistance", "equilibrium-equations"],
    "simple-beam": ["free-body-diagram", "equilibrium-equations", "shear-bending", "constraints-reactions", "statically-determinate", "bending-stress", "shear-stress-beam", "deflection-angle", "beam-deflection-methods"],
    "cantilever-beam": ["free-body-diagram", "equilibrium-equations", "shear-bending", "constraints-reactions", "statically-determinate", "bending-stress", "shear-stress-beam", "deflection-angle", "beam-deflection-methods"],
    "axial-bar": ["what-is-force", "force-four-elements", "stress-strain", "hookes-law", "strength-condition", "strain-energy"],
    "torsion-shaft": ["force-couple", "force-couple-moment", "force-couple-translation", "force-couple-vector", "force-couple-composition", "torsion-angle", "stress-strain", "hookes-law"],
    // 结构力学扩展章节
    "truss-basic": ["truss-joint-method", "section-method", "free-body-diagram", "equilibrium-equations", "statically-determinate"],
    "frame-basic": ["frame-internal-forces", "shear-bending", "equilibrium-equations", "constraints-reactions"],
    "indeterminate-beam": ["statically-determinate", "force-method", "displacement-method", "moment-distribution-method", "strain-energy", "unit-load-method"],
    "influence-line-beam": ["influence-line", "simple-beam", "shear-bending", "deflection-angle"],
    // 材料力学扩展章节
    "bending-beam": ["stress-strain", "hookes-law", "bending-stress", "shear-stress-beam", "deflection-angle"],
    "combined-strength": ["combined-deformation", "strength-condition", "strength-theories"],
    "energy-methods-ml": ["strain-energy", "castigliano-theorem", "unit-load-method", "temperature-stress"],
    "work-energy": ["kinetic-energy-work", "work-power", "work-energy-principle", "kinetic-energy-theorem-application", "mechanical-energy-conservation"],
    "d-alembert-principle": ["d-alembert-principle", "inertial-force-system", "newton-second-law", "equilibrium-equations"],
    "virtual-displacement-principle": ["virtual-displacement", "virtual-work-principle", "ideal-constraint", "equilibrium-equations"],
    "rotating-reference-frame": ["noninertial-reference-frame", "inertial-force", "coriolis-force", "centrifugal-force", "angular-velocity-acceleration"],
    "accelerating-platform": ["noninertial-reference-frame", "inertial-force", "relative-motion", "acceleration-vector"],
    "rotating-collision": ["angular-momentum-conservation", "moment-of-inertia", "rigid-body-fixed-axis-rotation", "collision-problem", "restitution-coefficient"],
    "oblique-collision": ["momentum-conservation", "collision-problem", "restitution-coefficient", "momentum-impulse", "velocity-vector"],
    "simple-harmonic-oscillator": ["harmonic-vibration", "natural-frequency", "spring-mass-system", "period", "amplitude"],
    "damped-vibration": ["damped-oscillation", "damping-ratio", "critical-damping", "decay", "damping-coefficient"],
    "forced-vibration": ["forced-oscillation", "resonance", "amplitude-response", "frequency-response", "excitation"],
    "gyroscope-precession": ["gyroscope", "precession", "angular-momentum", "moment", "fixed-point-rotation"],
    "euler-angles": ["euler-angles", "rigid-body-orientation", "rotation-matrix", "attitude", "gimbal-lock"],
    "rocket-motion": ["rocket-equation", "variable-mass", "thrust", "mass-flow", "momentum-conservation"],
    "variable-mass-system": ["variable-mass", "mass-flow", "additional-force", "momentum-theorem", "reactive-force"],
  };

// 模型详细信息（全局定义，供多个函数使用）
  const detailMap = {
    "door-lever": {
      title: "门板 / 扳手 · 从力到力矩的第一个模型",
      concepts: ["力的四要素", "对点的力矩", "力臂与省力/费力"],
      body:
        "门板和扳手模型让你直观感受到：同样大小的力，作用点离转轴越远，开门/拧螺栓就越省力——这就是力矩的物理含义。" +
        "通过在模型中改变作用点位置和作用方向，你能看到力矩大小和正负号如何变化，从而理解为什么在受力分析和平衡条件中必须引入力矩这个量。",
    },
    "rigid-body-2d": {
      title: "平面刚体 · 多力作用下的受力图和平衡",
      concepts: ["受力图画法", "平面力系简化", "平衡方程：所有力的和=0, 所有力矩的和=0"],
      body:
        "在平面刚体上施加多个力时，我们需要先画出规范的受力图，再用平面力系的简化思想把复杂多力系统转化为合力与合力矩，" +
        "最后通过 所有力的和=0, 所有力矩的和=0 三个独立平衡方程来求解支反力和未知外力。" +
        "这个模型是从理论力学走向结构力学的桥梁：它训练的是“去掉约束→画反力→列平衡方程”的全过程，为后面分析梁和刚架打基础。",
    },
    "crank-slider": {
      title: "曲柄滑块机构 · 为什么要用这些概念？",
      concepts: ["刚体平面运动几何关系", "位置-角度 x-θ 方程", "速度与加速度（时间导数）"],
      body:
        "曲柄滑块的运动本质上是一个几何约束问题：曲柄转一圈，滑块如何往复——这需要用“刚体平面运动几何关系”和“x-θ 方程”把机构图翻译成数学式子，" +
        "进一步才能通过对时间求导得到速度与加速度。" +
        "在考试中，这类题目常考“先写几何方程，再一阶、二阶求导”的步骤；在实际机械中，曲柄滑块是压缩机、发动机等设备的核心机构，需要用这些概念来评估运动规律和惯性力。",
    },
    "point-kinematics-curve": {
      title: "质点曲线运动 · v/a 为什么要分解？",
      concepts: ["曲线运动", "速度方向", "切向/法向加速度"],
      body:
        "在平面曲线运动中，质点的速度总是沿轨迹切线方向，而加速度可以分解为沿切线的切向加速度 aₜ 和指向曲率圆圆心的法向加速度 aₙ。" +
        "aₜ 反映的是“快慢变化”（速率变化），aₙ = v²/R 反映的是“方向转弯”的剧烈程度（曲率半径越小，转弯越猛，aₙ 越大）。" +
        "通过这个模型，你可以拖动曲线上的点，直观看到速度方向始终沿切线，而法向加速度始终指向曲率中心，从而真正理解课本公式背后的几何含义。",
    },
    "rigid-fixed-rotation": {
      title: "刚体定轴转动 · θ, ω, α 三兄弟",
      concepts: ["角位移 θ(t)", "角速度 ω(t)", "角加速度 α(t)"],
      body:
        "刚体绕某一固定轴转动时，其转动状态可以用角位移 θ(t)、角速度 ω(t) = dθ/dt 和角加速度 α(t) = dω/dt 来描述，它们对应平动中的位移、速度和加速度。" +
        "如果 α 为常数，则 θ(t) 和 ω(t) 都是关于时间的简单多项式：ω(t) = ω₀ + αt，θ(t) = θ₀ + ω₀t + 0.5αt²，本模型通过自动转盘把这种“匀角加速度转动”的时间过程可视化。" +
        "理解这三者的关系，是后续学习刚体动力学、转动惯量和能量定理的基础。",
    },
    "composite-point-motion": {
      title: "点的合成运动 · 为什么要拆成“牵连 + 相对”？",
      concepts: ["牵连运动", "相对运动", "合成速度"],
      body:
        "在实际问题中，质点常常既“跟着某个运动的平台一起走”（牵连运动），又“相对于平台自己再动”（相对运动），经典例子就是在行驶列车上的乘客、在移动皮带上的物体。" +
        "把质点的速度拆成 v = v牵 + v相，可以在不同参考系之间建立清晰的联系：v牵由参考系本身的速度决定，v相由质点在该参考系内的运动决定。" +
        "这个模型通过自动移动的平台和在平台内上下滑动的质点，实时画出 v牵、v相 以及合成速度 v，帮助你把公式 v = v牵 + v相 变成“眼前的一张速度三角形”。",
    },
    "particle-newton-2d": {
      title: "质点平动 · F = m a",
      concepts: ["牛顿第二定律", "加速度与受力", "速度/位移的时间积累"],
      body:
        "质点动力学的核心就是 F = m a：在给定质量 m 的前提下，合外力 F 决定了加速度 a，而速度 v 和位移 x 则是对加速度与速度在时间上的积分结果。" +
        "本模型用一辆在水平轨道上运动的小车来承载质点，一边展示合外力 F(t) 的变化，一边同步展示 a(t)、v(t)、x(t)，帮助你把课本中的微分方程和积分关系变成直观的时间动画。",
    },
    "impulse-momentum": {
      title: "动量定理 · 冲量-动量跳变看得见",
      concepts: ["冲量 J", "动量 p", "动量定理 Δp = J"],
      body:
        "动量定理告诉我们：在短时间内作用的脉冲力，关键不在力的峰值，而在力-时间面积——冲量 J = ∫F dt，它决定动量的跳变 Δp。" +
        "这个模型用半正弦脉冲推小车，HUD 实时显示 F(t)、冲量累计 J、动量 p 和速度 v 的同步变化，让 Δp = J 变成一条一眼可见的数值曲线。"
    },
    "two-body-collision": {
      title: "两体碰撞 · 动量守恒与恢复系数",
      concepts: ["动量守恒", "碰撞问题", "恢复系数 e"],
      body:
        "两体碰撞是动量守恒定律的经典应用：碰撞过程中系统不受外力，总动量守恒 m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'。" +
        "恢复系数 e = (v₂' - v₁')/(v₁ - v₂) 反映碰撞的弹性程度：e = 1 为完全弹性碰撞（动能守恒），e = 0 为完全非弹性碰撞（两球粘在一起），0 < e < 1 为非完全弹性碰撞。" +
        "本模型自动演示两球碰撞过程，实时显示碰撞前后总动量、速度变化，帮助理解动量守恒和恢复系数的物理意义。"
    },
    "system-momentum-center": {
      title: "质点系动量 · p = mvC",
      concepts: ["系统动量", "质心", "质心速度", "动量守恒"],
      body:
        "质点系的总动量等于系统总质量乘以质心速度：p = mvC，其中 m = m₁ + m₂ + ... 是系统总质量，vC 是质心速度。" +
        "质心位置 xC = (m₁x₁ + m₂x₂ + ...)/(m₁ + m₂ + ...)，质心速度 vC = (m₁v₁ + m₂v₂ + ...)/(m₁ + m₂ + ...)。" +
        "本模型通过两个质点的运动，实时显示质心位置、质心速度和系统总动量，帮助理解质点系动量的计算和质心运动定理。"
    },
    "angular-momentum-theorem": {
      title: "动量矩定理 · dL/dt = M",
      concepts: ["角动量 L", "动量矩定理", "角动量守恒"],
      body:
        "刚体绕定轴转动时，角动量 L = Iω，其中 I 是转动惯量，ω 是角速度。动量矩定理表明：角动量的变化率等于合外力矩，dL/dt = M。" +
        "当合外力矩 M = 0 时，角动量守恒 L = 常数，即 Iω = 常数。本模型通过转盘在周期性力矩作用下的转动，实时显示 L、ω、M、α 的变化，帮助理解动量矩定理和角动量守恒。"
    },
    "angular-momentum-conservation": {
      title: "角动量守恒 · L = Iω = 常数",
      concepts: ["角动量守恒", "转动惯量", "角速度", "变转动惯量"],
      body:
        "当系统不受外力矩或合外力矩为零时，角动量守恒：L = Iω = 常数。这意味着如果转动惯量 I 改变（如质量块移动），角速度 ω 会相应改变以保持 L 不变。" +
        "本模型通过质量块在转盘上的移动来改变转动惯量，实时显示 I、ω、L 的变化，直观展示角动量守恒定律：当 I 增大时 ω 减小，当 I 减小时 ω 增大，但 L 始终保持不变。"
    },
    "work-energy": {
      title: "动能定理 · W = ΔT",
      concepts: ["功", "动能", "动能定理", "功-能关系"],
      body:
        "动能定理表明：外力对质点所做的功等于质点动能的增量，W = ΔT = ½mv² - ½mv₀²。" +
        "功 W = F·s（恒力）或 W = ∫F·ds（变力），动能 T = ½mv²。当外力做正功时，动能增加；当外力做负功时，动能减少。" +
        "本模型通过小车在恒力作用下的运动，实时显示功 W、动能 T 和位移 s 的变化，直观展示 W = ΔT 的关系，帮助理解功与能的转换。"
    },
    "d-alembert-principle": {
      title: "达朗贝尔原理 · 惯性力系统",
      concepts: ["达朗贝尔原理", "惯性力", "动力学平衡", "动力学→静力学"],
      body:
        "达朗贝尔原理的核心思想是：在动力学问题中引入惯性力 -ma，可以将动力学方程 F = ma 转化为静力学平衡方程 F - ma = 0。" +
        "这样，所有静力学的平衡方法（如受力图、平衡方程等）都可以直接应用于动力学问题。" +
        "本模型通过小车在恒力作用下的加速运动，实时显示真实力 F、惯性力 -ma 和加速度 a 的关系，直观展示 F - ma = 0 的平衡条件，帮助理解达朗贝尔原理的本质。"
    },
    "simple-beam": {
      title: "简支梁 · 为何一定要用力矩和内力图？",
      concepts: ["平面力系平衡方程", "剪力与弯矩定义", "内力图（剪力图/弯矩图）", "受弯构件的受力分析"],
      body:
        "简支梁受均布荷载时，我们真正关心的是“梁内部每个截面承受多大的剪力和弯矩”，这就必须先通过平面力系平衡方程求支反力，" +
        "再利用剪力和弯矩的定义在各截面建立内力方程，并画出完整的内力图。" +
        "在考试里，这个模型是结构力学的基础高频题，用来训练规范的受力图、平衡方程和内力图画法；在工程中，它对应桥梁、楼板、简支管道等最常见的受弯构件，是后续强度和刚度校核的起点。",
    },
    "truss-basic": {
      title: "桁架 · 节点法与截面法怎么配合？",
      concepts: ["节点法求内力", "截面法求指定杆内力", "静定桁架的判别"],
      body:
        "桁架各杆只受轴力，是最典型的“结构力学入门模型”。节点法通过“取节点为平衡体”逐个列 ΣFx=0, ΣFy=0，可以系统求出所有杆件轴力；" +
        "截面法则通过“假想切开若干根杆”，利用 ΣFx=0, ΣFy=0, ΣM=0 在一刀之内一次求出少数几根关键杆的内力。" +
        "本模型强调：先按支座和外荷载画好受力图，再根据 j、m 判断是否静定桁架，选择合适的求解路径，在考试和工程算例中都极为高频。",
    },
    "frame-basic": {
      title: "刚架 · 剪力弯矩如何在多杆结构中传递？",
      concepts: ["刚架受力图", "剪力图/弯矩图", "刚结节点内力平衡"],
      body:
        "刚架兼有梁和立柱，多根杆通过刚结连接，既传递剪力，又传递弯矩和轴力。分析时通常先整体受力求支反力，再对各跨、各杆用截面法滑动截面，" +
        "画出每根杆的剪力图和弯矩图，并在刚结节点处检查内力平衡。" +
        "这个模型帮助你把“简支梁”级别的内力分析扩展到多杆刚架结构，为后续的超静定分析和框架设计打基础。",
    },
    "indeterminate-beam": {
      title: "超静定梁 · 为什么要用力法和位移法？",
      concepts: ["超静定次数", "力法基本体系", "位移法与刚度方程"],
      body:
        "一旦支座数目增多或引入连续梁，未知约束反力超过平衡方程数，就形成超静定梁。此时仅靠 ΣFx=0, ΣFy=0, ΣM=0 已经不够，需要引入“变形协调条件”：位移或转角满足几何约束。" +
        "力法以多余约束力为未知量，建立“多余力引起的位移 + 外荷载引起的位移 = 0”的方程；位移法则以节点位移为未知，建立刚度方程。" +
        "这个模型把静定梁的受力图和内力图思路延伸到超静定，帮助你理解为何必须引入“变形”和“能量”才能完成求解。",
    },
    "influence-line-beam": {
      title: "影响线 · 移动荷载下“最不利位置”从哪来？",
      concepts: ["单位荷载法画影响线", "内力与反力的影响线", "移动荷载最不利位置"],
      body:
        "在桥梁和起重机梁等问题中，荷载不是固定在某一点，而是沿梁移动。影响线描述的是“单位荷载在不同位置时，某一截面内力或某一反力的值如何变化”，" +
        "可以用静力法或虚位移法快速绘制。通过叠加多列移动荷载在影响线上的值，就能一眼看出哪一组位置最不利。" +
        "本模型借用简支梁场景，配合影响线概念卡片，帮助你形成“先画影响线，再叠加移动荷载”的标准套路。",
    },
    "axial-bar": {
      title: "拉压杆 · 力、应力和弹性模量的连接纽带",
      concepts: ["内力 N 与外力的关系", "正应力 σ = N/A", "弹性模量 E 与变形关系"],
      body:
        "拉压杆模型直接把外力 F、内力 N、应力 σ 和应变 ε、弹性模量 E 连在一起：σ = N/A, ε = σ/E。" +
        "考试中，它是材料力学第一章的入口题型，用来考查你是否真正理解“力 → 内力 → 应力 → 变形”的逻辑链；在工程里，从螺栓、拉杆到塔架拉索，都可以近似看成拉压杆，通过这些概念来保证安全与刚度。",
    },
    "torsion-shaft": {
      title: "圆轴扭转 · 力偶与剪应力如何进入视野？",
      concepts: ["力偶与扭矩", "剪应力分布 τ", "极惯性矩与扭转角关系"],
      body:
        "圆轴扭转时，外部的扭矩可以看成一组力偶，它产生的是\"纯转动\"而非平移，因此需要用到力偶矩、扭转公式和剪应力的概念。" +
        "试题中常通过圆轴扭转来综合考查你对力偶、极惯性矩和强度条件的掌握；在工程中，传动轴、工具扳手等都依赖这些概念来进行安全设计。",
    },
    "bending-beam": {
      title: "梁的弯曲与剪切 · 强度与刚度的统一视角",
      concepts: ["弯曲正应力 σ", "剪应力 τ", "挠度与转角"],
      body:
        "在材料力学中，梁不仅要“扛得住”弯曲正应力（强度），还要“变形不能太大”（刚度）。弯曲公式 σ = M·y/Iz 给出截面上任一点的正应力，" +
        "剪应力公式和弯曲挠度公式则刻画了横截面上的剪切分布和梁轴线的挠曲形状。" +
        "这个模型把结构力学中的剪力/弯矩图与材料力学中的应力/变形计算连在一起，帮助你建立“内力图 → 应力 → 变形”的完整链条。",
    },
    "combined-strength": {
      title: "组合应力与强度理论 · 真实构件从不只受一种应力",
      concepts: ["组合变形", "主应力与等效应力", "强度条件与强度理论"],
      body:
        "实际构件往往同时承受拉压、弯曲、剪切和扭转，截面上的应力是多种基本应力的叠加。组合变形的关键是：先按单一基本受力求各类应力，再在危险点叠加并进行强度判断。" +
        "强度理论（最大正应力、最大剪应力、形状改变比能理论等）提供了从多向应力状态到“等效单向应力”的桥梁，是材料力学中最贴近实际设计的一块内容。" +
        "本模型强调如何从内力图和截面几何性质出发，构造出组合应力并用合适的强度理论进行安全校核。",
    },
    "energy-methods-ml": {
      title: "能量法 · 应变能、卡氏定理与单位荷载法",
      concepts: ["应变能", "卡氏定理", "单位荷载法", "温度应力与附加内力"],
      body:
        "能量法把“外力做功 = 应变能增加”作为出发点，通过应变能表达式统一处理拉压、弯曲、扭转等多种变形。卡氏定理用“位移 = 应变能对对应力的偏导数”建立了位移与内力之间的直接联系，" +
        "单位荷载法则在工程中提供了一套高效的位移计算公式，特别适合超静定结构和复杂结构。温度应力问题同样可以用能量和变形协调的思想来处理。" +
        "通过这个模型，你可以把能量法看成是“把内力图再利用一遍”的高级技巧，而不是孤立的一章公式。",
    },
    "three-force-equilibrium": {
      title: "三力平衡 · 三力汇交定理的应用",
      concepts: ["三力汇交定理", "平衡条件", "受力图"],
      body:
        "当刚体受三个力作用而平衡时，如果其中两个力的作用线相交，则第三个力的作用线也必通过该交点，这就是三力汇交定理。" +
        "这个定理大大简化了三力平衡问题的求解：只需要两个平衡方程（所有x方向力的和=0, 所有y方向力的和=0）就能求解，而不需要力矩方程。" +
        "在考试中，识别\"三力平衡\"并应用三力汇交定理，是快速解题的关键技巧。",
    },
    "force-couple-simplification": {
      title: "力偶的简化与合成 · 力偶矩的应用",
      concepts: ["力偶", "力偶矩", "力偶的平移不变性", "平面力系简化"],
      body:
        "力偶是大小相等、方向相反、作用线平行的两个力组成的力系。力偶对刚体的作用效果用力偶矩M = F×d表示，其中F是力的大小，d是力偶臂（两力作用线间的垂直距离）。" +
        "力偶的重要性质是：在平面内可以任意平移而不改变对刚体的作用效果。多个力偶可以合成为一个合力偶矩，这大大简化了平面力系的分析。" +
        "在考试中，识别力偶并用力偶矩表示，是简化复杂力系的关键步骤。",
    },
    "disk-couple": {
      title: "圆盘力偶 · 扭矩与纯转动",
      concepts: ["力偶", "力偶矩", "扭矩", "圆轴扭转"],
      body:
        "圆盘力偶模型把“两个等大反向的切向力”直接画在圆盘边缘上，你可以看到合力为零，但圆盘产生纯转动——这就是力偶矩（扭矩）在起作用。" +
        "力偶矩的大小与力的大小和力臂（半径R）成正比，M = 2F·R，与圆轴扭转中的扭矩完全一一对应。" +
        "在考试与工程中，理解圆盘上的力偶，有助于建立从简单扳手到复杂传动轴的统一认识。",
    },
    "spatial-force-system": {
      title: "空间力系 · 主矢和主矩的三维理解",
      concepts: ["空间力系简化", "主矢矢量", "主矩矢量", "空间平衡方程"],
      body:
        "空间刚体常同时受到多条不共面的力，这些力既会产生合力，也会对任意一点产生力矩。空间力系的简化，就是把所有外力等效为“主矢FR”和“主矩矢MO”两部分。" +
        "FR 是所有力的矢量和，表达合力的方向和大小；MO 则是所有力对参考点的力矩向量，它决定了刚体的转动力效应。" +
        "当 所有力的和 = 0 且 所有力矩的和 = 0 时，空间刚体达到平衡。这个模型让你在三维坐标轴上直观看到合力矢量与合力矩矢量的叠加关系。",
    },
    "friction-slope": {
      title: "摩擦 · 斜面滑块与自锁判据",
      concepts: ["静摩擦力", "摩擦锥", "受力图", "平衡方程"],
      body:
        "斜面滑块模型把库仑摩擦放在最直观的场景中：重力沿斜面方向的分力试图让滑块下滑，静摩擦力则会在其允许范围内自动调节大小来抵抗相对运动。" +
        "当静摩擦系数 μ 满足 μ ≥ tanα 时，滑块会保持自锁；若 μ < tanα，只要外界扰动稍大就会开始滑动，需要额外的支撑或拉力才能平衡。" +
        "通过斜面受力图和摩擦锥，本模型帮助你一眼看出自锁条件、临界角以及需要施加的附加力方向。",
    },
    "friction-mechanisms": {
      title: "更多摩擦副 · 螺旋副/滚动摩擦/自锁机构",
      concepts: ["螺旋副", "滚动摩擦", "楔块自锁", "摩擦角"],
      body:
        "本模型展示三种重要的摩擦副：螺旋副、滚动摩擦和自锁机构（楔块）。" +
        "螺旋副的自锁条件为导程角 λ ≤ 摩擦角 φ，满足此条件时，无论轴向力多大，螺母都不会自行旋转。" +
        "滚动摩擦用滚动摩阻系数 δ 表示，Mf = δ·N，滚动摩擦远小于滑动摩擦，这就是为什么滚动比滑动省力。" +
        "楔块自锁的条件为楔角 α ≤ 2φ（2倍摩擦角），满足此条件时，楔块在压力作用下不会自行退出。",
    },
    "multi-force-panel": {
      title: "多力门板 · 合力与合矩怎么看？",
      concepts: ["受力图", "合力/合矩", "支反力求解", "平衡方程"],
      body:
        "多力门板模型把多条外力集中在一扇门上：有沿门面、沿门边以及倾斜作用的力。通过受力图和坐标选取，可以把所有力化简为一个合力FR（作用线过某一点）和一个关于铰点O的合矩MO。" +
        "在写平衡方程时，先把复杂力系转为FR+MO，再根据 所有x方向力的和=0, 所有y方向力的和=0, 所有力矩的和=0 求出铰链处的反力和力矩，整个过程比直接对每个力写方程更清晰。" +
        "这个模型既是平面力系简化的练习，也是后面求支座反力、内力图的基础套路。",
    },
    "plane-force-system-simplification": {
      title: "平面力系简化 · 主矢与主矩的应用",
      concepts: ["平面力系简化", "主矢", "主矩", "等效力系"],
      body:
        "平面力系可以简化为一个主矢FR和一个主矩MO。主矢FR = 所有力的和 是所有力的矢量和，主矩MO = 所有力矩的和 是所有力对简化中心O的力矩之和。" +
        "平面力系简化的意义在于：无论力系多么复杂，都可以用一个主矢和一个主矩来等效表示。这大大简化了力系的分析和平衡条件的建立。" +
        "在考试中，平面力系简化是求解复杂受力问题的关键步骤，也是建立平衡方程的基础。",
    },
    "constraint-types": {
      title: "约束类型 · 约束反力",
      concepts: ["约束类型", "约束反力", "受力图", "静定与超静定"],
      body:
        "约束是限制物体运动的装置，不同类型的约束提供不同数量和方向的约束反力。" +
        "固定铰支座提供两个反力分量（Fx, Fy），活动铰支座只提供垂直于支撑面的反力（Fy），固定端提供三个反力（Fx, Fy, M）。" +
        "正确识别约束类型是画受力图的基础，也是判断静定与超静定的关键。本模型通过交互展示不同约束的约束反力特点。",
    },
    "point-kinematics-coordinates": {
      title: "点的运动学 · 坐标法",
      concepts: ["直角坐标", "极坐标", "自然坐标", "坐标变换", "位置矢量"],
      body:
        "描述点的运动可以用不同的坐标系：直角坐标系用(x,y)表示位置，极坐标系用(r,θ)表示位置，自然坐标系用弧长s表示位置。" +
        "不同坐标系下，速度和加速度的表达式不同，但描述的是同一个运动。选择合适的坐标系可以简化问题的求解。" +
        "本模型展示用不同坐标法描述点的运动，帮助你理解坐标变换和不同坐标系的特点。",
    },
    "rigid-body-translation": {
      title: "刚体平移 · 平动运动",
      concepts: ["刚体平移", "平动", "速度", "加速度"],
      body:
        "刚体平移时，刚体内所有点的速度相同，所有点的加速度相同，任意两点连线方向不变。" +
        "这意味着可以用刚体上任意一点的运动来代表整个刚体的运动，大大简化了刚体运动的描述。" +
        "本模型展示刚体平移的特点，所有点的速度矢量相同，帮助你理解刚体平动与转动的区别。",
    },
    "instantaneous-center-velocity": {
      title: "速度瞬心法 · 平面运动分析",
      concepts: ["速度瞬心", "瞬心法", "平面运动", "速度分布", "角速度"],
      body:
        "平面运动刚体在每一瞬时都有一个速度瞬心（该瞬时速度为零的点）。通过找到速度瞬心，可以快速确定刚体上任意点的速度：v = ω·r，其中ω是刚体的角速度，r是该点到速度瞬心的距离。" +
        "速度瞬心法大大简化了平面运动的速度分析，避免了复杂的矢量运算。本模型展示如何通过速度瞬心确定各点速度。",
    },
    "conservative-force-potential": {
      title: "保守力场 · 势能与机械能守恒",
      concepts: ["保守力", "势能", "机械能守恒", "功与路径无关", "动能定理"],
      body:
        "保守力（如重力、弹性力）做的功与路径无关，只与起点和终点位置有关，可以引入势能U。保守力与势能的关系：F = -∇U。" +
        "在只有保守力做功的情况下，机械能守恒：T + U = 常数，其中T是动能，U是势能。" +
        "本模型展示保守力场中的势能、动能和机械能守恒，帮助你理解能量转换和守恒定律。",
    },
    "virtual-work-constraint-reaction": {
      title: "虚功原理应用 · 约束反力求解",
      concepts: ["虚位移原理", "约束反力", "虚位移法", "静定结构", "平衡条件"],
      body:
        "利用虚位移原理可以求解约束反力，这是虚位移原理的重要应用。通过给系统一个虚位移，使某个约束解除，建立虚功方程，可以直接求出该约束的约束反力，而不需要求解所有约束反力。" +
        "这种方法特别适用于复杂约束系统，可以避免建立和求解多个平衡方程。本模型展示如何用虚位移原理求解约束反力。",
    },
    "lagrange-pendulum": {
      title: "拉格朗日方程 · 单摆",
      concepts: ["拉格朗日方程", "广义坐标", "拉格朗日函数", "保守系统", "单摆"],
      body:
        "拉格朗日方程是分析力学的核心，用广义坐标和拉格朗日函数L = T - U描述系统运动。对于单摆，选择角度θ作为广义坐标，拉格朗日函数L = ½ml²θ̇² - mgl(1-cosθ)，" +
        "由拉格朗日方程d/dt(∂L/∂θ̇) = ∂L/∂θ得到运动方程ml²θ̈ + mglsinθ = 0。本模型展示单摆的运动和拉格朗日方程的应用。",
    },
    "hamilton-principle": {
      title: "哈密顿原理 · 最小作用量",
      concepts: ["哈密顿原理", "作用量", "变分原理", "哈密顿函数", "最小作用量原理"],
      body:
        "哈密顿原理是分析力学的基础原理：真实运动使作用量S = ∫L dt取极值。这是变分原理，可以从它导出拉格朗日方程。" +
        "哈密顿函数H = Σpᵢq̇ᵢ - L，其中pᵢ是广义动量。本模型展示哈密顿原理和最小作用量原理的应用。",
    },
    "generalized-coordinates": {
      title: "广义坐标 · 约束系统",
      concepts: ["广义坐标", "自由度", "约束方程", "广义力", "完整约束"],
      body:
        "广义坐标是描述系统位形的独立坐标，系统的自由度等于独立广义坐标的个数。对于有约束的系统，约束方程减少了自由度。" +
        "广义力Qᵢ = ΣFⱼ·(∂rⱼ/∂qᵢ)，其中qᵢ是广义坐标。本模型展示如何选择广义坐标和计算广义力。",
    },
    "rotating-reference-frame": {
      title: "旋转参考系 · 科氏力",
      concepts: ["科氏力", "离心力", "旋转参考系", "非惯性系", "科氏加速度"],
      body:
        "在旋转参考系中，需要引入惯性力：科氏力F_c = -2m(ω × v)和离心力F_cent = -m(ω × (ω × r))。" +
        "科氏力垂直于速度和角速度，离心力沿径向向外。本模型展示旋转参考系中的惯性力效应。",
    },
    "accelerating-platform": {
      title: "加速平台 · 惯性力",
      concepts: ["惯性力", "加速参考系", "非惯性系", "相对运动", "平移加速度"],
      body:
        "在加速参考系中，需要引入惯性力F_inertial = -ma₀，其中a₀是参考系的加速度。" +
        "这使得在非惯性系中可以使用牛顿第二定律：F - ma₀ = ma'，其中a'是相对加速度。本模型展示加速平台上的惯性力效应。",
    },
    "rotating-collision": {
      title: "转动碰撞 · 角动量守恒",
      concepts: ["转动碰撞", "角动量守恒", "转动惯量", "恢复系数", "碰撞冲量"],
      body:
        "转动碰撞时，角动量守恒：I₁ω₁ + I₂ω₂ = I₁ω₁' + I₂ω₂'。恢复系数e = (ω₂' - ω₁')/(ω₁ - ω₂)描述碰撞的弹性程度。" +
        "本模型展示转动刚体之间的碰撞过程和角动量守恒。",
    },
    "oblique-collision": {
      title: "斜碰撞 · 动量分解",
      concepts: ["斜碰撞", "动量分解", "切向/法向", "恢复系数", "碰撞分析"],
      body:
        "斜碰撞时，将动量分解为切向和法向分量。法向分量决定碰撞的恢复系数，切向分量可能受摩擦力影响。" +
        "恢复系数e = (v₂n' - v₁n')/(v₁n - v₂n)，其中下标n表示法向分量。本模型展示斜碰撞的动量分解和恢复系数。",
    },
    "simple-harmonic-oscillator": {
      title: "简谐振动 · 单自由度",
      concepts: ["简谐振动", "固有频率", "弹簧振子", "振动", "周期"],
      body:
        "简谐振动是最基本的振动形式，运动方程为ẍ + ω₀²x = 0，其中ω₀ = √(k/m)是固有频率。" +
        "解为x = A cos(ω₀t + φ)，周期T = 2π/ω₀。本模型展示弹簧振子的简谐振动。",
    },
    "damped-vibration": {
      title: "阻尼振动 · 衰减",
      concepts: ["阻尼振动", "阻尼系数", "衰减振动", "临界阻尼", "过阻尼"],
      body:
        "有阻尼的振动方程为mẍ + cẋ + kx = 0，其中c是阻尼系数。根据阻尼大小分为：欠阻尼（c < 2√(mk)）、临界阻尼（c = 2√(mk)）和过阻尼（c > 2√(mk)）。" +
        "欠阻尼时，振幅按e^(-ζω₀t)衰减，其中ζ是阻尼比。本模型展示不同阻尼情况下的振动。",
    },
    "forced-vibration": {
      title: "受迫振动 · 共振",
      concepts: ["受迫振动", "共振", "振幅响应", "驱动频率", "相位差"],
      body:
        "受迫振动方程为mẍ + cẋ + kx = F₀cos(ωt)，其中ω是驱动频率。稳态解为x = A cos(ωt - φ)，" +
        "振幅A = F₀/√((k-mω²)² + (cω)²)。当ω接近固有频率ω₀时发生共振，振幅达到最大值。本模型展示受迫振动和共振现象。",
    },
    "gyroscope-precession": {
      title: "陀螺进动 · 定点转动",
      concepts: ["陀螺", "进动", "章动", "角动量", "定点转动"],
      body:
        "陀螺在重力作用下会发生进动：自转轴绕垂直轴旋转。进动角速度Ω = M/(Iω)，其中M是重力矩，I是转动惯量，ω是自转角速度。" +
        "章动是自转轴在进动过程中的上下摆动。本模型展示陀螺的进动和章动现象。",
    },
    "euler-angles": {
      title: "欧拉角 · 刚体姿态",
      concepts: ["欧拉角", "姿态角", "刚体转动", "姿态描述", "坐标变换"],
      body:
        "欧拉角(φ, θ, ψ)描述刚体的姿态：绕z轴旋转φ（进动角），绕x'轴旋转θ（章动角），绕z''轴旋转ψ（自转角）。" +
        "这是描述刚体定点转动或自由运动的常用方法。本模型展示欧拉角如何描述刚体姿态。",
    },
    "rocket-motion": {
      title: "火箭运动 · 变质量",
      concepts: ["火箭方程", "变质量", "质量喷射", "动量守恒", "推力"],
      body:
        "火箭运动是典型的变质量问题。火箭方程：m dv = -dm u，其中u是喷气相对速度。积分得到v = v₀ + u ln(m₀/m)。" +
        "推力F = u(dm/dt)，其中dm/dt是质量流率。本模型展示火箭的运动和推力计算。",
    },
    "variable-mass-system": {
      title: "变质量系统 · 质量流",
      concepts: ["变质量", "质量流", "推力", "动量定理", "变质量动力学"],
      body:
        "变质量系统的动量定理：d(mv)/dt = F + u(dm/dt)，其中u是质量流入/流出的相对速度，F是外力。" +
        "当质量流出时，产生推力；当质量流入时，需要克服阻力。本模型展示变质量系统的动力学。",
    },
};

// 模型库选择与概念高亮绑定
function initModelConceptBinding() {
  const modelItems = document.querySelectorAll(".model-item");
  const conceptCards = document.querySelectorAll(".concept-card");
  const detailBox = document.getElementById("model-concepts-detail");
  if (!modelItems.length || !conceptCards.length) return;

  modelItems.forEach((item) => {
    item.addEventListener("click", () => {
      try {
      modelItems.forEach((m) => m.classList.remove("model-item-active"));
      item.classList.add("model-item-active");

      const mid = item.getAttribute("data-model-id");
        if (!mid) {
          console.warn("模型按钮缺少 data-model-id 属性");
          return;
        }
      const related = conceptMap[mid] || [];

      // 先移除所有高亮
      conceptCards.forEach((card) => {
        const cid = card.getAttribute("data-concept-id");
        card.classList.remove("concept-card-highlight");
      });

      // 高亮相关概念
      conceptCards.forEach((card) => {
        const cid = card.getAttribute("data-concept-id");
        if (related.includes(cid)) {
          card.classList.add("concept-card-highlight");
        }
      });

      // 将高亮的概念卡片排序到顶部
      const conceptList = document.querySelector(".concept-list");
      if (conceptList && related.length > 0) {
        const cardsArray = Array.from(conceptCards);
        const highlightedCards = cardsArray.filter(card => 
          related.includes(card.getAttribute("data-concept-id"))
        );
        const otherCards = cardsArray.filter(card => 
          !related.includes(card.getAttribute("data-concept-id"))
        );
        
        // 清空列表，先插入高亮的，再插入其他的
        conceptList.innerHTML = "";
        highlightedCards.forEach(card => conceptList.appendChild(card));
        otherCards.forEach(card => conceptList.appendChild(card));
        
        // 滚动到顶部
        if (highlightedCards.length > 0) {
          highlightedCards[0].scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      // 更新“当前模型涉及的核心概念”文字说明
      if (detailBox) {
        const info = detailMap[mid];
        if (info) {
          const titleEl = detailBox.querySelector(".detail-title");
          const bodyEl = detailBox.querySelector(".detail-body");
          if (titleEl) titleEl.textContent = info.title;
          if (bodyEl) {
            const concepts = info.concepts || [];
            const listHtml =
              concepts.length > 0
                ? `<div class="detail-concepts-title">概念清单（按使用顺序）：</div><ul class="detail-concepts">${concepts
                    .map((c) => `<li>${c}</li>`)
                    .join("")}</ul>`
                : "";
            bodyEl.innerHTML = `${listHtml}<div class="detail-analysis">${info.body}</div>`;
          }
        }
      }

      // 模型选择驱动可视化场景切换 & 生成器下拉同步
        if (typeof switchVisualByModel === "function") {
      switchVisualByModel(mid);
        }
      if (questionModelSelect) {
        questionModelSelect.value = mid;
      }

      // 更新概念关系说明区域
        if (typeof updateConceptRelations === "function") {
      updateConceptRelations(mid, related);
        }
        
        // 更新一键总结内容
        if (typeof updateSummary === "function") {
          updateSummary(mid, related);
        }
      } catch (error) {
        console.error("模型选择处理出错:", error, mid);
      }
    });
  });

  // 概念卡片点击交互：跳转到相关模型并高亮
  conceptCards.forEach((card) => {
    const conceptId = card.getAttribute("data-concept-id");
    
    // 为概念卡片添加点击事件
    card.style.cursor = "pointer";
    card.addEventListener("click", (e) => {
      // 如果点击的是按钮，不触发卡片点击
      if (e.target.classList.contains("link-btn")) return;
      
      // 找到包含此概念的第一个模型
      let targetModelId = null;
      for (const [modelId, concepts] of Object.entries(conceptMap)) {
        if (concepts.includes(conceptId)) {
          targetModelId = modelId;
          break;
        }
      }
      
      if (targetModelId) {
        // 找到对应的模型按钮并点击
        const targetModelItem = document.querySelector(`.model-item[data-model-id="${targetModelId}"]`);
        if (targetModelItem) {
          targetModelItem.click();
          // 滚动到模型区域
          targetModelItem.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });

    // 为概念卡片添加悬停效果
    card.addEventListener("mouseenter", () => {
      if (!card.classList.contains("concept-card-highlight")) {
        card.style.transform = "translateX(4px)";
        card.style.borderColor = "rgba(129, 212, 250, 0.5)";
      }
    });
    
    card.addEventListener("mouseleave", () => {
      if (!card.classList.contains("concept-card-highlight")) {
        card.style.transform = "";
        card.style.borderColor = "";
      }
    });
  });
}

// 概念关系数据（全局定义，供多个函数使用）
  const relationsData = {
    "door-lever": {
      title: "力与力矩 · 概念关系与公式",
      relations: [
        {
          concepts: ["力的四要素", "力臂", "力矩"],
          relation: "力的四要素（大小F、方向、作用点、作用线）确定后，力臂d是作用线到参考点的垂直距离，力矩M = F × d。",
          formulas: [
            { name: "力矩公式", formula: "M = F × d", symbols: "M: 力矩 (N·m), F: 力的大小 (N), d: 力臂 (m)" },
            { name: "力臂定义", formula: "d = 作用线到参考点的垂直距离", symbols: "d: 力臂 (m)" }
          ]
        }
      ],
      symbols: [
        { symbol: "F", name: "力", unit: "N 或 kN", desc: "物体间相互作用的力学量" },
        { symbol: "d", name: "力臂", unit: "m", desc: "力的作用线到转动中心的垂直距离" },
        { symbol: "M", name: "力矩", unit: "N·m", desc: "力使物体绕某点转动的趋势大小" }
      ]
    },
    "constraint-types": {
      title: "约束类型 · 概念关系与公式",
      relations: [
        {
          concepts: ["约束", "约束反力", "受力图"],
          relation: "约束是限制物体运动的装置。画受力图时，需要去掉约束，用约束反力代替。不同类型的约束提供不同数量和方向的约束反力：固定铰提供Fx和Fy，活动铰只提供Fy，固定端提供Fx、Fy和M。",
          formulas: [
            { name: "固定铰支座", formula: "反力：Fx, Fy（2个未知量）", symbols: "提供两个方向的约束反力" },
            { name: "活动铰支座", formula: "反力：Fy（1个未知量，垂直支撑面）", symbols: "只提供垂直支撑面的反力" },
            { name: "固定端", formula: "反力：Fx, Fy, M（3个未知量）", symbols: "提供两个方向的力和一个力矩" }
          ]
        },
        {
          concepts: ["静定", "超静定", "平衡方程"],
          relation: "静定结构：未知反力个数 = 独立平衡方程个数。超静定结构：未知反力个数 > 独立平衡方程个数。平面力系有3个独立平衡方程（ΣFx=0, ΣFy=0, ΣM=0），空间力系有6个独立平衡方程。",
          formulas: [
            { name: "静定条件", formula: "未知量个数 = 独立平衡方程个数", symbols: "可以直接求解" },
            { name: "超静定条件", formula: "未知量个数 > 独立平衡方程个数", symbols: "需要补充变形协调条件" }
          ]
        }
      ],
      symbols: [
        { symbol: "Fx, Fy", name: "约束反力分量", unit: "N", desc: "约束提供的反力在x、y方向的分量" },
        { symbol: "M", name: "约束反力矩", unit: "N·m", desc: "固定端提供的约束反力矩" },
        { symbol: "约束", name: "约束", unit: "—", desc: "限制物体运动的装置" }
      ]
    },
    "rigid-body-2d": {
      title: "平面力系平衡 · 概念关系与公式",
      relations: [
        {
          concepts: ["受力图", "平面力系简化", "平衡方程"],
          relation: "先画受力图（去掉约束，用反力代替），再用平面力系简化（合力+合力矩），最后用平衡方程求解。",
          formulas: [
            { name: "平衡条件", formula: "所有x方向力的和 = 0, 所有y方向力的和 = 0, 所有力矩的和 = 0", symbols: "Fx, Fy: x、y方向合力, MO: 对O点的合力矩" },
            { name: "平面力系简化", formula: "FR = 所有力的和, MO = 所有力矩的和", symbols: "FR: 合力, MO: 合力矩" }
          ]
        },
        {
          concepts: ["约束与约束反力", "静定与超静定", "三力平衡"],
          relation: "画受力图的第一步是识别约束类型：固定铰支座提供两个反力分量（Fx, Fy），活动铰支座只提供垂直于支撑面的反力。如果未知反力个数等于独立平衡方程个数，则为静定结构。对于三力平衡问题，可以利用三力汇交定理简化求解。",
          formulas: [
            { name: "约束反力", formula: "固定铰: Fx, Fy; 活动铰: Fy (垂直支撑面)", symbols: "不同约束提供不同数量的反力" },
            { name: "静定条件", formula: "未知量个数 = 独立平衡方程个数", symbols: "静定结构可以直接求解" }
          ]
        }
      ],
      symbols: [
        { symbol: "Fx, Fy", name: "x、y方向分力", unit: "N", desc: "力在坐标轴上的投影" },
        { symbol: "FR", name: "合力", unit: "N", desc: "多个力的矢量和" },
        { symbol: "MO", name: "对O点的力矩", unit: "N·m", desc: "所有力对参考点O的力矩之和" }
      ]
    },
    "simple-beam": {
      title: "简支梁 · 概念关系与公式",
      relations: [
        {
          concepts: ["平衡方程", "剪力", "弯矩"],
          relation: "先用平衡方程求支反力，再用截面法（假想切开）求各截面的剪力V和弯矩M，最后画出内力图。",
          formulas: [
            { name: "平衡方程", formula: "所有y方向力的和 = 0, 所有力矩的和 = 0", symbols: "求支反力RA, RB" },
            { name: "剪力定义", formula: "V = 截面一侧所有外力的代数和", symbols: "V: 剪力 (N)" },
            { name: "弯矩定义", formula: "M = 截面一侧所有外力对截面形心的力矩代数和", symbols: "M: 弯矩 (N·m)" }
          ]
        },
        {
          concepts: ["约束与约束反力", "受力图", "静定结构"],
          relation: "简支梁是典型的静定结构：两个活动铰支座各提供一个垂直反力，共2个未知量，恰好等于2个独立平衡方程（所有y方向力的和=0, 所有力矩的和=0）。画受力图时，去掉支座约束，用支反力RA和RB代替，然后建立平衡方程求解。",
          formulas: [
            { name: "支反力", formula: "RA, RB (垂直向上)", symbols: "活动铰支座只提供垂直反力" },
            { name: "静定判断", formula: "未知量数(2) = 平衡方程数(2)", symbols: "简支梁是静定结构" }
          ]
        },
        {
          concepts: ["弯曲正应力", "弯曲剪应力", "强度条件"],
          relation: "简支梁受弯时，横截面上产生弯曲正应力σ和弯曲剪应力τ。正应力沿截面高度线性分布，中性轴处为零，上下边缘最大：σmax = M/Wz。对于细长梁，正应力通常远大于剪应力，主要按正应力进行强度设计。",
          formulas: [
            { name: "弯曲正应力", formula: "σ = M·y/Iz", symbols: "M: 弯矩, y: 到中性轴距离, Iz: 惯性矩" },
            { name: "最大正应力", formula: "σmax = M/Wz", symbols: "Wz = Iz/ymax: 抗弯截面系数" },
            { name: "强度条件", formula: "σmax ≤ [σ]", symbols: "[σ]: 许用应力" }
          ]
        }
      ],
      symbols: [
        { symbol: "RA, RB", name: "支反力", unit: "N", desc: "支座对梁的约束反力" },
        { symbol: "V", name: "剪力", unit: "N", desc: "截面两侧沿截面方向的力" },
        { symbol: "M", name: "弯矩", unit: "N·m", desc: "截面两侧绕截面中性轴的力矩" },
        { symbol: "q", name: "均布荷载", unit: "N/m 或 kN/m", desc: "沿梁长均匀分布的荷载集度" }
      ]
    },
    "truss-basic": {
      title: "桁架 · 节点法与截面法的概念关系与公式",
      relations: [
        {
          concepts: ["桁架受力简化", "节点法", "截面法"],
          relation: "桁架各杆视为二力杆，只受通过杆轴线的轴力。节点法：以节点为研究对象，用 ΣFx=0, ΣFy=0 求解相邻杆轴力；截面法：用一刀切开不超过3根未知杆，取一侧为研究对象，列 ΣFx=0, ΣFy=0, ΣM=0 快速求几根指定杆内力。",
          formulas: [
            { name: "节点平衡", formula: "ΣFx = 0, ΣFy = 0（对每个节点）", symbols: "适用于静定桁架的逐节点求解" },
            { name: "截面平衡", formula: "ΣFx = 0, ΣFy = 0, ΣM = 0（对被切部分）", symbols: "求指定几根杆的内力" }
          ]
        },
        {
          concepts: ["静定桁架判断", "受力图"],
          relation: "画桁架受力图时，先用结构力学中的受力图规范标出外荷载和支座反力；利用 m + r = 2j 判别平面静定桁架（m 杆数，j 节点数，r 约束反力数），静定时可用节点法/截面法直接求解。",
          formulas: [
            { name: "静定桁架判别式", formula: "m + r = 2j（平面桁架）", symbols: "m: 杆数, r: 约束反力个数, j: 节点数" }
          ]
        }
      ],
      symbols: [
        { symbol: "N", name: "杆轴力", unit: "kN", desc: "沿杆轴线方向的拉力或压力" },
        { symbol: "P", name: "外荷载", unit: "kN", desc: "作用在节点上的集中荷载" },
        { symbol: "RA, RB", name: "支座反力", unit: "kN", desc: "支座提供的约束反力" }
      ]
    },
    "frame-basic": {
      title: "刚架 · 内力分析的概念关系与公式",
      relations: [
        {
          concepts: ["整体受力图", "剪力图", "弯矩图"],
          relation: "刚架分析通常先画整体受力图并用 ΣFx=0, ΣFy=0, ΣM=0 求支反力，再对各杆用截面法滑动截面，沿杆轴线绘制剪力图和弯矩图，反映内力沿杆长的变化。",
          formulas: [
            { name: "平衡方程（整体）", formula: "ΣFx = 0, ΣFy = 0, ΣM = 0", symbols: "求解支反力，作为内力图的基础" },
            { name: "剪力与弯矩", formula: "V(x) = Σ外力, M(x) = Σ外力矩", symbols: "对截面一侧所有外力及力矩求代数和" }
          ]
        },
        {
          concepts: ["刚结节点内力平衡", "内力图连续性"],
          relation: "刚架刚结节点处，各连杆的端弯矩和剪力必须满足节点平衡；同一截面两侧的内力大小相等、方向相反，保证内力图在连杆处连续。",
          formulas: [
            { name: "节点平衡条件", formula: "ΣV节点 = 0, ΣM节点 = 0", symbols: "各连杆端剪力与端弯矩在节点处平衡" }
          ]
        }
      ],
      symbols: [
        { symbol: "V", name: "剪力", unit: "kN", desc: "沿杆轴线垂直方向作用的内力分量" },
        { symbol: "M", name: "弯矩", unit: "kN·m", desc: "使杆弯曲的内力矩" }
      ]
    },
    "indeterminate-beam": {
      title: "超静定梁 · 力法与位移法的概念关系与公式",
      relations: [
        {
          concepts: ["超静定", "多余未知力", "变形协调"],
          relation: "当未知约束反力个数大于独立平衡方程个数时，梁为超静定结构。此时需要通过位移或转角的“变形协调条件”来补足方程数，即在多余约束处的变形为零或满足给定值。",
          formulas: [
            { name: "超静定次数", formula: "r - re = n", symbols: "r: 实际未知约束力个数, re: 静定时需要的未知数, n: 超静定次数" }
          ]
        },
        {
          concepts: ["力法", "柔度系数", "变形协调方程"],
          relation: "力法以多余约束力Xi为未知量，通过“基本体系 + 多余力”叠加计算多余约束处的位移，建立 Σ(δijXj) + ΔiP = 0 的力法方程组。",
          formulas: [
            { name: "力法方程", formula: "δ11X1 + δ12X2 + ... + Δ1P = 0", symbols: "δij: 柔度系数, Xj: 多余约束力, Δ1P: 外荷载引起的位移" }
          ]
        },
        {
          concepts: ["位移法", "刚度系数", "刚度方程"],
          relation: "位移法以节点位移为基本未知量，通过刚度系数 kij 把内力和位移联系起来，建立 k11Δ1 + k12Δ2 + ... + F1P = 0 的刚度方程。",
          formulas: [
            { name: "刚度方程", formula: "k11Δ1 + k12Δ2 + ... + F1P = 0", symbols: "kij: 刚度系数, Δi: 节点位移" }
          ]
        }
      ],
      symbols: [
        { symbol: "Xi", name: "多余约束力", unit: "kN", desc: "超出静定所需的约束反力" },
        { symbol: "Δi", name: "节点位移/转角", unit: "m 或 rad", desc: "作为位移法未知量" }
      ]
    },
    "influence-line-beam": {
      title: "影响线 · 移动荷载分析的概念关系与公式",
      relations: [
        {
          concepts: ["影响线定义", "单位荷载法", "移动荷载最不利位置"],
          relation: "影响线表示单位荷载在结构上移动时，某指定量（反力、内力、位移）随荷载位置变化的函数图。用单位荷载法，将单位力沿跨移动，在每个位置利用平衡方程求出该量的值，即得到影响线。",
          formulas: [
            { name: "影响线叠加", formula: "Qmax = max Σ(Pi · I(xi))", symbols: "Pi: 移动荷载大小, I(xi): 对应位置的影响线纵坐标" }
          ]
        }
      ],
      symbols: [
        { symbol: "I(x)", name: "影响线纵坐标", unit: "— 或 m/kN", desc: "单位荷载在位置 x 时指定量的响应" },
        { symbol: "Q", name: "结构响应量", unit: "kN 或 kN·m 或 mm", desc: "如反力、弯矩或位移" }
      ]
    },
    "bending-beam": {
      title: "梁的弯曲与剪切 · 概念关系与公式",
      relations: [
        {
          concepts: ["弯矩图", "弯曲正应力", "强度条件"],
          relation: "由结构力学给出的弯矩图 M(x) 代入材料力学的弯曲公式 σ = M·y/Iz，可以求出危险截面上的弯曲正应力，并用 σmax ≤ [σ] 进行强度校核。",
          formulas: [
            { name: "弯曲正应力", formula: "σ = M·y/Iz", symbols: "M: 弯矩, y: 到中性轴距离, Iz: 惯性矩" },
            { name: "最大正应力", formula: "σmax = M/Wz", symbols: "Wz = Iz/ymax: 抗弯截面系数" }
          ]
        },
        {
          concepts: ["剪力图", "弯曲剪应力"],
          relation: "剪力图 V(x) 决定梁截面上的剪应力分布，对矩形截面可用 τmax = 3V/(2A) 估算最大剪应力，在短粗梁或腹板较厚时尤为重要。",
          formulas: [
            { name: "矩形截面最大剪应力", formula: "τmax = 3V/(2A)", symbols: "V: 剪力, A: 截面面积" }
          ]
        },
        {
          concepts: ["挠度", "转角", "挠曲线微分方程"],
          relation: "梁的挠度和转角由挠曲线微分方程 d²w/dx² = M/(E·Iz) 决定，求解或查表得到 w(x)、θ(x) 后即可进行刚度校核。",
          formulas: [
            { name: "挠曲线微分方程", formula: "d²w/dx² = M/(E·Iz)", symbols: "w: 挠度, E: 弹性模量, Iz: 惯性矩" }
          ]
        }
      ],
      symbols: [
        { symbol: "σ", name: "弯曲正应力", unit: "MPa", desc: "梁截面上的正应力" },
        { symbol: "τ", name: "剪应力", unit: "MPa", desc: "梁截面上的剪应力" },
        { symbol: "w", name: "挠度", unit: "mm 或 m", desc: "梁轴线的竖向位移" }
      ]
    },
    "combined-strength": {
      title: "组合应力与强度理论 · 概念关系与公式",
      relations: [
        {
          concepts: ["基本应力叠加", "组合应力状态"],
          relation: "组合变形问题中，先按拉压、弯曲、扭转等基本形式分别求出各自的应力，再在危险点进行代数叠加，得到组合应力状态。",
          formulas: [
            { name: "拉弯组合", formula: "σ = N/A + M·y/Iz", symbols: "N: 轴力, M: 弯矩, A: 截面面积" }
          ]
        },
        {
          concepts: ["强度条件", "强度理论"],
          relation: "在多向应力状态下，需要用强度理论把多向应力折算为等效单向应力，与材料许用应力比较。常用的有最大正应力理论、最大剪应力理论、形状改变比能理论（Mises）。",
          formulas: [
            { name: "最大剪应力理论", formula: "τmax = (σ1 - σ3)/2 ≤ [τ]", symbols: "σ1, σ3: 主应力" },
            { name: "Mises 强度理论", formula: "σeq = √[( (σ1-σ2)² + (σ2-σ3)² + (σ3-σ1)² ) / 2 ] ≤ [σ]", symbols: "σeq: 等效应力" }
          ]
        }
      ],
      symbols: [
        { symbol: "σ1, σ2, σ3", name: "主应力", unit: "MPa", desc: "三向主应力" },
        { symbol: "σeq", name: "等效应力", unit: "MPa", desc: "按强度理论折算的等效应力" }
      ]
    },
    "energy-methods-ml": {
      title: "能量法 · 应变能、卡氏定理与单位荷载法",
      relations: [
        {
          concepts: ["应变能", "能量守恒"],
          relation: "在线弹性范围内，外力对结构所做的功等于结构储存的应变能 U，是能量法的出发点：W = U。",
          formulas: [
            { name: "拉压应变能", formula: "U = N²L/(2EA)", symbols: "N: 轴力, L: 杆长, E: 弹性模量, A: 截面面积" },
            { name: "弯曲应变能", formula: "U = ∫ M²/(2EI) dx", symbols: "M: 弯矩, E: 弹性模量, I: 惯性矩" }
          ]
        },
        {
          concepts: ["卡氏定理", "位移计算"],
          relation: "卡氏定理指出：某点的位移等于应变能对该点对应力的偏导数，实际应用时常写成“对该点外力求偏导”：δi = ∂U/∂Fi。",
          formulas: [
            { name: "卡氏定理", formula: "δi = ∂U/∂Fi", symbols: "Fi: 施加在 i 点的外力" }
          ]
        },
        {
          concepts: ["单位荷载法", "位移积分公式"],
          relation: "单位荷载法通过在要求位移的点施加单位荷载，计算该状态与实际荷载状态下内力乘积的积分，得到位移公式。",
          formulas: [
            { name: "单位荷载法", formula: "Δ = ∫ (M·M̄)/(EI) dx + ∫ (N·N̄)/(EA) dx + ∫ (Mt·M̄t)/(GIp) dx", symbols: "上划线内力为单位荷载产生的内力" }
          ]
        },
        {
          concepts: ["温度应力", "附加内力"],
          relation: "温度变化引起的自由热变形若受到约束，会产生温度应力，可视为在超静定结构中引入附加内力，仍可用能量法或力法处理。",
          formulas: [
            { name: "温度应力", formula: "σ = E·α·ΔT", symbols: "α: 线膨胀系数, ΔT: 温度变化" }
          ]
        }
      ],
      symbols: [
        { symbol: "U", name: "应变能", unit: "J", desc: "结构在弹性变形过程中储存的能量" },
        { symbol: "Δ", name: "位移", unit: "m", desc: "结构指定点的位移" },
        { symbol: "α", name: "线膨胀系数", unit: "1/°C", desc: "材料受温度变化的伸缩能力" }
      ]
    },
    "torsion-shaft": {
      title: "圆轴扭转 · 概念关系与公式",
      relations: [
        {
          concepts: ["力偶", "力偶矩", "扭矩", "剪应力"],
          relation: "外力偶T产生扭矩Mt，扭矩在圆轴内产生剪应力τ。剪应力分布与极惯性矩Ip相关，最大剪应力在轴表面。",
          formulas: [
            { name: "扭矩", formula: "Mt = T", symbols: "Mt: 扭矩 (N·m), T: 外力偶矩 (N·m)" },
            { name: "剪应力", formula: "τ = (Mt·ρ)/Ip", symbols: "τ: 剪应力 (Pa), ρ: 距轴心距离 (m), Ip: 极惯性矩 (m⁴)" },
            { name: "极惯性矩（实心圆）", formula: "Ip = π·D⁴/32", symbols: "D: 圆轴直径 (m)" },
            { name: "最大剪应力", formula: "τmax = (Mt·R)/Ip", symbols: "R: 圆轴半径 (m)" }
          ]
        }
      ],
      symbols: [
        { symbol: "T", name: "外力偶矩", unit: "N·m", desc: "作用在轴端的外力偶" },
        { symbol: "Mt", name: "扭矩", unit: "N·m", desc: "轴内任意截面的扭矩" },
        { symbol: "τ", name: "剪应力", unit: "Pa 或 MPa", desc: "单位面积上的剪应力" },
        { symbol: "Ip", name: "极惯性矩", unit: "m⁴", desc: "截面绕轴心转动的惯性矩" },
        { symbol: "ρ", name: "径向距离", unit: "m", desc: "计算点到轴心的距离" },
        { symbol: "G", name: "剪切模量", unit: "Pa", desc: "材料的剪切弹性模量" }
      ]
    },
    "crank-slider": {
      title: "曲柄滑块机构 · 概念关系与公式",
      relations: [
        {
          concepts: ["几何约束", "位置方程", "角速度", "速度", "加速度"],
          relation: "曲柄滑块的运动由几何约束决定：曲柄以角速度ω转动，转角θ = ωt，滑块位置x由几何关系确定。对时间求导得到速度v和加速度a。角速度ω是连接曲柄转动与滑块运动的关键参数。",
          formulas: [
            { name: "位置几何方程", formula: "x = r·cos(θ) + √(l² - r²·sin²(θ))", symbols: "r: 曲柄长度, l: 连杆长度, θ: 曲柄角度" },
            { name: "角速度", formula: "ω = 角位移对时间的导数", symbols: "ω: 曲柄角速度 (rad/s), 描述曲柄转动的快慢" },
            { name: "速度", formula: "v = 位置对时间的导数 = -r·ω·sin(θ) - (r²·ω·sin(θ)·cos(θ))/√(l² - r²·sin²(θ))", symbols: "速度与角速度ω成正比" },
            { name: "加速度", formula: "a = 速度对时间的导数", symbols: "对速度表达式再次求导，也依赖于角速度ω" }
          ]
        },
        {
          concepts: ["定轴转动", "平面运动", "复合运动"],
          relation: "曲柄作定轴转动（角速度ω），滑块作直线运动（速度v），连杆作平面运动。滑块的运动是曲柄转动的复合运动结果。",
          formulas: [
            { name: "定轴转动", formula: "θ = ωt, ω = 常数", symbols: "曲柄绕固定轴匀速转动" },
            { name: "复合运动", formula: "滑块运动 = 曲柄转动 + 连杆约束", symbols: "通过几何约束将转动转化为平动" }
          ]
        },
        {
          concepts: ["速度瞬心", "平面运动", "连杆机构"],
          relation: "速度瞬心法是分析曲柄滑块机构中连杆平面运动的重要方法。连杆作平面运动，在每一瞬时都有一个速度瞬心（该瞬时速度为零的点）。通过找到速度瞬心，可以快速确定连杆上任意点的速度：v = ω·r，其中ω是连杆的角速度，r是该点到速度瞬心的距离。",
          formulas: [
            { name: "速度瞬心法", formula: "v = ω·r", symbols: "v: 点的速度, ω: 连杆角速度, r: 点到速度瞬心的距离" },
            { name: "速度瞬心确定", formula: "过已知两点速度方向作垂线，交点即为速度瞬心", symbols: "曲柄端点速度方向已知，滑块速度方向沿导轨，两垂线交点即连杆速度瞬心" },
            { name: "连杆角速度", formula: "ω连杆 = v曲柄端点 / r曲柄端点到瞬心", symbols: "通过曲柄端点速度确定连杆角速度" }
          ]
        }
      ],
      symbols: [
        { symbol: "r", name: "曲柄长度", unit: "m", desc: "曲柄旋转中心到连接点的距离" },
        { symbol: "l", name: "连杆长度", unit: "m", desc: "曲柄末端到滑块的距离" },
        { symbol: "θ", name: "曲柄角度", unit: "rad 或 °", desc: "曲柄相对水平方向的转角" },
        { symbol: "ω", name: "角速度", unit: "rad/s", desc: "曲柄转动的角速度，是连接曲柄转动与滑块运动的关键参数" },
        { symbol: "x", name: "滑块位置", unit: "m", desc: "滑块沿导轨的位移" },
        { symbol: "v", name: "滑块速度", unit: "m/s", desc: "滑块沿导轨的运动速度" },
        { symbol: "a", name: "滑块加速度", unit: "m/s²", desc: "滑块沿导轨的运动加速度" }
      ]
    },
    "instantaneous-center-velocity": {
      title: "速度瞬心法 · 概念关系与公式",
      relations: [
        {
          concepts: ["速度瞬心", "平面运动", "角速度"],
          relation: "平面运动刚体在每一瞬时都有一个速度瞬心（该瞬时速度为零的点）。通过找到速度瞬心，可以快速确定刚体上任意点的速度：v = ω·r，其中ω是刚体的角速度，r是该点到速度瞬心的距离。",
          formulas: [
            { name: "速度瞬心法", formula: "v = ω·r", symbols: "v: 点的速度, ω: 刚体角速度, r: 点到速度瞬心的距离" },
            { name: "速度瞬心确定", formula: "过已知两点速度方向作垂线，交点即为速度瞬心", symbols: "曲柄端点速度方向已知，滑块速度方向沿导轨，两垂线交点即连杆速度瞬心" },
            { name: "刚体角速度", formula: "ω = v/r", symbols: "通过已知点的速度和到瞬心的距离确定" }
          ]
        },
        {
          concepts: ["速度分布", "速度方向"],
          relation: "刚体上所有点的速度方向都垂直于该点到速度瞬心的连线，速度大小与到瞬心的距离成正比。这大大简化了平面运动的速度分析。",
          formulas: [
            { name: "速度方向", formula: "速度方向 ⊥ 到瞬心的连线", symbols: "所有点速度方向都垂直于到瞬心的连线" },
            { name: "速度大小", formula: "v ∝ r", symbols: "速度大小与到瞬心的距离成正比" }
          ]
        }
      ],
      symbols: [
        { symbol: "IC", name: "速度瞬心", unit: "—", desc: "该瞬时速度为零的点" },
        { symbol: "ω", name: "刚体角速度", unit: "rad/s", desc: "刚体绕速度瞬心转动的角速度" },
        { symbol: "r", name: "到瞬心的距离", unit: "m", desc: "点到速度瞬心的距离" },
        { symbol: "v", name: "点的速度", unit: "m/s", desc: "v = ω·r" }
      ]
    },
    "conservative-force-potential": {
      title: "保守力场与势能 · 概念关系与公式",
      relations: [
        {
          concepts: ["保守力", "势能", "功与路径无关"],
          relation: "保守力（如重力、弹性力）做的功与路径无关，只与起点和终点位置有关，可以引入势能U。保守力与势能的关系：F = -∇U，即保守力等于势能的负梯度。",
          formulas: [
            { name: "保守力定义", formula: "W = ∫F·ds 与路径无关", symbols: "只与起点和终点位置有关" },
            { name: "势能定义", formula: "U = -∫F·ds", symbols: "U: 势能, 保守力做的功等于势能减少" },
            { name: "保守力与势能", formula: "F = -∇U", symbols: "保守力等于势能的负梯度" }
          ]
        },
        {
          concepts: ["机械能守恒", "动能定理"],
          relation: "在只有保守力做功的情况下，机械能守恒：T + U = 常数，其中T是动能，U是势能。这是动能定理在保守力场中的特殊形式。",
          formulas: [
            { name: "机械能守恒", formula: "T + U = 常数", symbols: "T: 动能, U: 势能, 只有保守力做功时成立" },
            { name: "能量转换", formula: "ΔT = -ΔU", symbols: "动能增加等于势能减少" }
          ]
        },
        {
          concepts: ["重力势能", "弹性势能"],
          relation: "重力势能：U = mgh（h为高度），弹性势能：U = ½kx²（k为弹簧常数，x为变形）。这些是常见的保守力势能形式。",
          formulas: [
            { name: "重力势能", formula: "U = mgh", symbols: "m: 质量, g: 重力加速度, h: 高度" },
            { name: "弹性势能", formula: "U = ½kx²", symbols: "k: 弹簧常数, x: 变形" }
          ]
        }
      ],
      symbols: [
        { symbol: "F", name: "保守力", unit: "N", desc: "F = -∇U, 保守力等于势能的负梯度" },
        { symbol: "U", name: "势能", unit: "J", desc: "保守力场中的势能" },
        { symbol: "T", name: "动能", unit: "J", desc: "T = ½mv²" },
        { symbol: "E", name: "机械能", unit: "J", desc: "E = T + U, 只有保守力做功时守恒" }
      ]
    },
    "virtual-work-constraint-reaction": {
      title: "虚功原理应用 · 概念关系与公式",
      relations: [
        {
          concepts: ["虚位移原理", "约束反力", "虚位移法"],
          relation: "利用虚位移原理可以求解约束反力。通过给系统一个虚位移，使某个约束解除（如去掉某个支座），建立虚功方程，可以直接求出该约束的约束反力，而不需要求解所有约束反力。",
          formulas: [
            { name: "虚位移法求反力", formula: "1. 去掉待求约束 2. 给系统虚位移 3. 建立虚功方程 ΣF·δr = 0 4. 求解约束反力", symbols: "避免求解所有约束反力" },
            { name: "虚功方程", formula: "ΣF主动·δr + R·δr = 0", symbols: "R: 待求约束反力" }
          ]
        },
        {
          concepts: ["静定结构", "超静定结构"],
          relation: "静定结构可以用平衡方程直接求解所有约束反力。对于超静定结构，虚位移原理提供了一种求解特定约束反力的方法，而不需要建立变形协调条件。",
          formulas: [
            { name: "静定结构", formula: "未知量个数 = 独立平衡方程个数", symbols: "可以直接求解" },
            { name: "虚位移法优势", formula: "可以单独求解某个约束反力", symbols: "不需要求解所有约束反力" }
          ]
        }
      ],
      symbols: [
        { symbol: "R", name: "约束反力", unit: "N", desc: "待求的约束反力" },
        { symbol: "δr", name: "虚位移", unit: "m", desc: "约束允许的虚位移" },
        { symbol: "ΣF·δr", name: "总虚功", unit: "J", desc: "所有力在虚位移上所做的虚功之和" }
      ]
    },
    "point-kinematics-coordinates": {
      title: "点的运动学坐标法 · 概念关系与公式",
      relations: [
        {
          concepts: ["直角坐标", "位置矢量", "速度", "加速度"],
          relation: "在直角坐标系中，位置矢量 r = xi + yj，速度 v = (dx/dt)i + (dy/dt)j，加速度 a = (d²x/dt²)i + (d²y/dt²)j。直角坐标法适用于轨迹方程已知的情况。",
          formulas: [
            { name: "位置矢量", formula: "r = xi + yj", symbols: "x, y: 直角坐标" },
            { name: "速度", formula: "v = (dx/dt)i + (dy/dt)j", symbols: "vx = dx/dt, vy = dy/dt" },
            { name: "加速度", formula: "a = (d²x/dt²)i + (d²y/dt²)j", symbols: "ax = d²x/dt², ay = d²y/dt²" }
          ]
        },
        {
          concepts: ["极坐标", "径向速度", "横向速度"],
          relation: "在极坐标系中，位置 r = r·er，速度 v = (dr/dt)er + r(dθ/dt)eθ，其中 (dr/dt) 是径向速度，r(dθ/dt) 是横向速度。极坐标法适用于中心力场等对称问题。",
          formulas: [
            { name: "位置", formula: "r = r·er", symbols: "r: 极径, er: 径向单位矢量" },
            { name: "速度", formula: "v = (dr/dt)er + r(dθ/dt)eθ", symbols: "vr = dr/dt, vθ = r(dθ/dt)" }
          ]
        },
        {
          concepts: ["自然坐标", "切向", "法向"],
          relation: "在自然坐标系中，用弧长s表示位置，速度 v = (ds/dt)τ，加速度 a = (d²s/dt²)τ + (v²/R)n，其中τ是切向单位矢量，n是法向单位矢量。自然坐标法适用于轨迹已知的情况。",
          formulas: [
            { name: "速度", formula: "v = (ds/dt)τ", symbols: "s: 弧长, τ: 切向单位矢量" },
            { name: "加速度", formula: "a = (d²s/dt²)τ + (v²/R)n", symbols: "aₜ = d²s/dt², aₙ = v²/R" }
          ]
        }
      ],
      symbols: [
        { symbol: "x, y", name: "直角坐标", unit: "m", desc: "点在直角坐标系中的坐标" },
        { symbol: "r, θ", name: "极坐标", unit: "m, rad", desc: "极径和极角" },
        { symbol: "s", name: "弧长", unit: "m", desc: "沿轨迹的弧长坐标" },
        { symbol: "v", name: "速度", unit: "m/s", desc: "点的速度矢量" },
        { symbol: "a", name: "加速度", unit: "m/s²", desc: "点的加速度矢量" }
      ]
    },
    "rigid-body-translation": {
      title: "刚体平移 · 概念关系与公式",
      relations: [
        {
          concepts: ["刚体平移", "速度", "加速度"],
          relation: "刚体平移时，刚体内所有点的速度相同，所有点的加速度相同，任意两点连线方向不变。这意味着可以用刚体上任意一点的运动来代表整个刚体的运动。",
          formulas: [
            { name: "速度关系", formula: "v₁ = v₂ = v（所有点速度相同）", symbols: "v: 刚体的速度" },
            { name: "加速度关系", formula: "a₁ = a₂ = a（所有点加速度相同）", symbols: "a: 刚体的加速度" },
            { name: "连线方向", formula: "任意两点连线方向不变", symbols: "刚体形状不变" }
          ]
        },
        {
          concepts: ["平动", "转动", "平面运动"],
          relation: "刚体的运动可以分为平动、转动和平面运动。平动是最简单的刚体运动，所有点的轨迹相同，可以用一个点的运动来代表。转动是刚体绕固定轴的转动，各点速度不同。平面运动是平动和转动的组合。",
          formulas: [
            { name: "平动特点", formula: "所有点速度相同，所有点加速度相同", symbols: "可以用一个点的运动代表" },
            { name: "转动特点", formula: "各点速度不同，与到转轴的距离成正比", symbols: "v = ω × r" }
          ]
        }
      ],
      symbols: [
        { symbol: "v", name: "刚体速度", unit: "m/s", desc: "刚体上所有点的共同速度" },
        { symbol: "a", name: "刚体加速度", unit: "m/s²", desc: "刚体上所有点的共同加速度" },
        { symbol: "s", name: "位移", unit: "m", desc: "刚体的位移" }
      ]
    },
    "lagrange-pendulum": {
      title: "拉格朗日方程·单摆 · 概念关系与公式",
      relations: [
        {
          concepts: ["拉格朗日方程", "广义坐标", "拉格朗日函数"],
          relation: "拉格朗日方程是分析力学的核心：d/dt(∂L/∂q̇ᵢ) = ∂L/∂qᵢ，其中L = T - U是拉格朗日函数，qᵢ是广义坐标。对于单摆，选择角度θ作为广义坐标，L = ½ml²θ̇² - mgl(1-cosθ)。",
          formulas: [
            { name: "拉格朗日函数", formula: "L = T - U", symbols: "T: 动能, U: 势能" },
            { name: "拉格朗日方程", formula: "d/dt(∂L/∂q̇ᵢ) = ∂L/∂qᵢ", symbols: "qᵢ: 广义坐标" },
            { name: "单摆拉格朗日函数", formula: "L = ½ml²θ̇² - mgl(1-cosθ)", symbols: "m: 质量, l: 摆长, θ: 角度" }
          ]
        }
      ],
      symbols: [
        { symbol: "L", name: "拉格朗日函数", unit: "J", desc: "L = T - U" },
        { symbol: "q", name: "广义坐标", unit: "—", desc: "描述系统位形的独立坐标" },
        { symbol: "θ", name: "角度", unit: "rad", desc: "单摆的广义坐标" }
      ]
    },
    "hamilton-principle": {
      title: "哈密顿原理 · 概念关系与公式",
      relations: [
        {
          concepts: ["哈密顿原理", "作用量", "变分原理"],
          relation: "哈密顿原理：真实运动使作用量S = ∫L dt取极值（通常是极小值）。这是变分原理，可以从它导出拉格朗日方程。作用量是拉格朗日函数对时间的积分。",
          formulas: [
            { name: "作用量", formula: "S = ∫L dt", symbols: "L: 拉格朗日函数, t: 时间" },
            { name: "哈密顿原理", formula: "δS = 0", symbols: "作用量的变分为零" },
            { name: "哈密顿函数", formula: "H = Σpᵢq̇ᵢ - L", symbols: "pᵢ: 广义动量, qᵢ: 广义坐标" }
          ]
        },
        {
          concepts: ["最小作用量原理", "变分法", "拉格朗日方程"],
          relation: "哈密顿原理是分析力学的基础，可以从它导出拉格朗日方程。真实路径使作用量取极值，而其他路径的作用量都大于真实路径。",
          formulas: [
            { name: "变分方程", formula: "δ∫L dt = 0", symbols: "作用量的变分为零" },
            { name: "导出拉格朗日方程", formula: "从δS = 0可导出 d/dt(∂L/∂q̇ᵢ) = ∂L/∂qᵢ", symbols: "变分法的应用" }
          ]
        }
      ],
      symbols: [
        { symbol: "S", name: "作用量", unit: "J·s", desc: "S = ∫L dt" },
        { symbol: "L", name: "拉格朗日函数", unit: "J", desc: "L = T - U" },
        { symbol: "H", name: "哈密顿函数", unit: "J", desc: "H = T + U（保守系统）" },
        { symbol: "p", name: "广义动量", unit: "kg·m/s", desc: "p = ∂L/∂q̇" }
      ]
    },
    "generalized-coordinates": {
      title: "广义坐标 · 概念关系与公式",
      relations: [
        {
          concepts: ["广义坐标", "自由度", "约束方程"],
          relation: "广义坐标是描述系统位形的独立坐标。系统的自由度等于独立广义坐标的个数。对于有约束的系统，约束方程减少了自由度：DOF = 独立坐标数 - 约束数。",
          formulas: [
            { name: "自由度", formula: "DOF = 独立坐标数 - 约束数", symbols: "DOF: 自由度" },
            { name: "广义力", formula: "Qᵢ = ΣFⱼ·(∂rⱼ/∂qᵢ)", symbols: "Qᵢ: 广义力, qᵢ: 广义坐标" },
            { name: "约束方程", formula: "fⱼ(q₁, q₂, ..., qₙ, t) = 0", symbols: "约束条件" }
          ]
        },
        {
          concepts: ["完整约束", "非完整约束", "广义坐标选择"],
          relation: "完整约束可以用约束方程表示，可以消去部分坐标，用广义坐标描述。非完整约束不能完全消去坐标。选择合适的广义坐标可以大大简化问题。",
          formulas: [
            { name: "完整约束", formula: "f(q₁, q₂, ..., qₙ, t) = 0", symbols: "可以消去部分坐标" },
            { name: "广义坐标优势", formula: "用n个广义坐标代替3N个笛卡尔坐标", symbols: "N: 质点个数" }
          ]
        }
      ],
      symbols: [
        { symbol: "q", name: "广义坐标", unit: "—", desc: "描述系统位形的独立坐标" },
        { symbol: "DOF", name: "自由度", unit: "—", desc: "独立广义坐标的个数" },
        { symbol: "Q", name: "广义力", unit: "N", desc: "Q = ΣF·(∂r/∂q)" },
        { symbol: "n", name: "广义坐标数", unit: "—", desc: "等于系统的自由度" }
      ]
    },
    "three-force-equilibrium": {
      title: "三力平衡 · 概念关系与公式",
      relations: [
        {
          concepts: ["三力汇交定理", "平衡条件", "受力图"],
          relation: "当刚体受三个力作用而平衡时，如果其中两个力的作用线相交，则第三个力的作用线也必通过该交点。利用这个定理，只需要两个平衡方程就能求解三力平衡问题。",
          formulas: [
            { name: "三力汇交定理", formula: "三力平衡时，三力作用线必汇交于一点", symbols: "前提：刚体受三力作用且平衡" },
            { name: "平衡条件", formula: "所有x方向力的和 = 0, 所有y方向力的和 = 0", symbols: "利用三力汇交，只需两个方程即可求解" },
            { name: "力的分解", formula: "F = Fx·i + Fy·j", symbols: "将力分解到x、y方向" }
          ]
        }
      ],
      symbols: [
        { symbol: "F1, F2, F3", name: "三个力", unit: "N", desc: "作用在刚体上的三个力" },
        { symbol: "O", name: "汇交点", unit: "—", desc: "三力作用线的交点" },
        { symbol: "Fx, Fy", name: "力的分量", unit: "N", desc: "力在x、y方向的分量" },
        { symbol: "α, β, γ", name: "力的方向角", unit: "° 或 rad", desc: "各力与x轴的夹角" }
      ]
    },
    "force-couple-simplification": {
      title: "力偶的简化与合成 · 概念关系与公式",
      relations: [
        {
          concepts: ["力偶", "力偶矩", "力偶的平移不变性"],
          relation: "力偶是大小相等、方向相反、作用线平行的两个力组成的力系。力偶对刚体的作用效果用力偶矩M = F×d表示，其中F是力的大小，d是力偶臂。力偶的重要性质是：在平面内可以任意平移而不改变对刚体的作用效果，因此可以用力偶矩这个单一量来代表整个力偶。",
          formulas: [
            { name: "力偶矩", formula: "M = F × d", symbols: "M: 力偶矩 (N·m), F: 力的大小 (N), d: 力偶臂 (m)" },
            { name: "力偶的平移不变性", formula: "力偶在平面内平移，力偶矩不变", symbols: "这是力偶的重要性质" },
            { name: "力偶的合成", formula: "M合 = M1 + M2 + ... + Mn", symbols: "多个力偶可以合成为一个合力偶矩" }
          ]
        },
        {
          concepts: ["平面力系简化", "等效力系"],
          relation: "平面力系可以简化为一个主矢FR和一个主矩MO。如果主矢为零，则力系简化为一个力偶矩。力偶矩是平面力系简化的重要组成部分，多个力偶可以合成为一个合力偶矩。",
          formulas: [
            { name: "平面力系简化", formula: "FR = 所有力的和, MO = 所有力矩的和", symbols: "FR: 主矢, MO: 主矩" },
            { name: "纯力偶系", formula: "FR = 0, MO = 所有力矩的和", symbols: "主矢为零时，力系简化为力偶矩" }
          ]
        }
      ],
      symbols: [
        { symbol: "F", name: "力偶中力的大小", unit: "N", desc: "力偶中每个力的大小" },
        { symbol: "d", name: "力偶臂", unit: "m", desc: "两力作用线间的垂直距离" },
        { symbol: "M", name: "力偶矩", unit: "N·m", desc: "力偶对刚体的转动效应" },
        { symbol: "M合", name: "合力偶矩", unit: "N·m", desc: "多个力偶的合成结果" }
      ]
    },
    "plane-force-system-simplification": {
      title: "平面力系简化 · 概念关系与公式",
      relations: [
        {
          concepts: ["平面力系简化", "主矢", "主矩"],
          relation: "平面力系可以简化为一个主矢FR和一个主矩MO。主矢FR = 所有力的和 是所有力的矢量和，主矩MO = 所有力矩的和 是所有力对简化中心O的力矩之和。无论力系多么复杂，都可以用主矢和主矩来等效表示。",
          formulas: [
            { name: "主矢", formula: "FR = 所有力的和 = F1 + F2 + ... + Fn", symbols: "FR: 主矢 (N), 所有力的矢量和" },
            { name: "主矩", formula: "MO = 所有力矩的和 = M1 + M2 + ... + Mn", symbols: "MO: 主矩 (N·m), 所有力对O点的力矩之和" },
            { name: "主矢分量", formula: "FRx = 所有x方向力的和, FRy = 所有y方向力的和", symbols: "主矢在x、y方向的分量" },
            { name: "主矩计算", formula: "MO = 所有(xi·Fiy - yi·Fix)的和", symbols: "通过力的位置和分量计算主矩" }
          ]
        },
        {
          concepts: ["等效力系", "平衡条件"],
          relation: "简化后的主矢和主矩与原力系等效。当主矢FR = 0且主矩MO = 0时，力系平衡。因此，平面力系的平衡条件为：FRx = 0, FRy = 0, MO = 0，即三个独立方程。",
          formulas: [
            { name: "平衡条件", formula: "FRx = 0, FRy = 0, MO = 0", symbols: "平面力系平衡的三个独立方程" },
            { name: "等效力系", formula: "原力系 ≡ (FR, MO)", symbols: "简化后的力系与原力系等效" }
          ]
        }
      ],
      symbols: [
        { symbol: "FR", name: "主矢", unit: "N", desc: "所有力的矢量和" },
        { symbol: "FRx, FRy", name: "主矢分量", unit: "N", desc: "主矢在x、y方向的分量" },
        { symbol: "MO", name: "主矩", unit: "N·m", desc: "所有力对简化中心O的力矩之和" },
        { symbol: "O", name: "简化中心", unit: "—", desc: "简化时选择的参考点" },
        { symbol: "Fi", name: "各分力", unit: "N", desc: "力系中的各个力" },
        { symbol: "Mi", name: "各分力矩", unit: "N·m", desc: "各力对简化中心的力矩" }
      ]
    },
    "polar-dynamics": {
      title: "极坐标下的动力学 · 概念关系与公式",
      relations: [
        {
          concepts: ["极坐标系", "径向单位矢量", "横向单位矢量"],
          relation: "在极坐标系中，位置矢量 r = r·er，其中 r 是极径（到原点的距离），er 是径向单位矢量（从原点指向质点的方向），eθ 是横向单位矢量（垂直于 er，沿角度增加方向）。er 和 eθ 随角度 θ 变化，不是固定方向。",
          formulas: [
            { name: "位置矢量", formula: "r = r·er", symbols: "r: 极径, er: 径向单位矢量" },
            { name: "单位矢量关系", formula: "er = cosθ·i + sinθ·j, eθ = -sinθ·i + cosθ·j", symbols: "i, j: 直角坐标单位矢量" }
          ]
        },
        {
          concepts: ["极坐标速度", "径向速度", "横向速度"],
          relation: "极坐标下的速度 v = vr·er + vθ·eθ，其中 vr = dr/dt 是径向速度（沿 er 方向），vθ = r·dθ/dt 是横向速度（沿 eθ 方向）。径向速度改变极径大小，横向速度改变角度。",
          formulas: [
            { name: "速度分解", formula: "v = vr·er + vθ·eθ", symbols: "vr: 径向速度, vθ: 横向速度" },
            { name: "径向速度", formula: "vr = dr/dt", symbols: "极径对时间的导数" },
            { name: "横向速度", formula: "vθ = r·dθ/dt", symbols: "r 乘以角速度" }
          ]
        },
        {
          concepts: ["极坐标加速度", "径向加速度", "横向加速度"],
          relation: "极坐标下的加速度 a = ar·er + aθ·eθ，其中 ar = d²r/dt² - r(dθ/dt)² 是径向加速度，aθ = r·d²θ/dt² + 2(dr/dt)(dθ/dt) 是横向加速度。ar 中的 -r(dθ/dt)² 项是向心加速度（指向原点），aθ 中的 2(dr/dt)(dθ/dt) 项是科氏加速度。",
          formulas: [
            { name: "径向加速度", formula: "ar = d²r/dt² - r(dθ/dt)²", symbols: "包含向心加速度项" },
            { name: "横向加速度", formula: "aθ = r·d²θ/dt² + 2(dr/dt)(dθ/dt)", symbols: "包含科氏加速度项" }
          ]
        },
        {
          concepts: ["极坐标动力学方程", "牛顿第二定律"],
          relation: "在极坐标系中，F = ma 分解为两个分量方程：Fr = m·ar 和 Fθ = m·aθ，其中 Fr 是径向力，Fθ 是横向力。这两个方程分别描述径向和横向的运动规律。",
          formulas: [
            { name: "径向动力学方程", formula: "Fr = m·ar", symbols: "Fr: 径向力, ar: 径向加速度" },
            { name: "横向动力学方程", formula: "Fθ = m·aθ", symbols: "Fθ: 横向力, aθ: 横向加速度" }
          ]
        }
      ],
      symbols: [
        { symbol: "r", name: "极径", unit: "m", desc: "质点到原点的距离" },
        { symbol: "θ", name: "极角", unit: "rad", desc: "极径与极轴的夹角" },
        { symbol: "er", name: "径向单位矢量", unit: "—", desc: "沿极径方向的单位矢量" },
        { symbol: "eθ", name: "横向单位矢量", unit: "—", desc: "垂直于极径方向的单位矢量" },
        { symbol: "vr", name: "径向速度", unit: "m/s", desc: "沿 er 方向的速度分量" },
        { symbol: "vθ", name: "横向速度", unit: "m/s", desc: "沿 eθ 方向的速度分量" },
        { symbol: "ar", name: "径向加速度", unit: "m/s²", desc: "沿 er 方向的加速度分量" },
        { symbol: "aθ", name: "横向加速度", unit: "m/s²", desc: "沿 eθ 方向的加速度分量" },
        { symbol: "Fr", name: "径向力", unit: "N", desc: "沿 er 方向的力分量" },
        { symbol: "Fθ", name: "横向力", unit: "N", desc: "沿 eθ 方向的力分量" }
      ]
    },
    "noninertial-dynamics": {
      title: "非惯性系下的动力学 · 概念关系与公式",
      relations: [
        {
          concepts: ["惯性参考系", "非惯性参考系"],
          relation: "惯性参考系是牛顿第一定律成立的参考系，即不受力或合力为零的质点保持静止或匀速直线运动。非惯性参考系是相对于惯性系有加速度的参考系，在非惯性系中，牛顿第一定律不成立，需要引入惯性力。",
          formulas: [
            { name: "惯性系定义", formula: "牛顿第一定律成立的参考系", symbols: "地面通常可视为惯性系" },
            { name: "非惯性系定义", formula: "相对于惯性系有加速度的参考系", symbols: "加速运动的平台、旋转参考系等" }
          ]
        },
        {
          concepts: ["惯性力", "相对加速度"],
          relation: "在非惯性参考系中，需要引入惯性力 -ma₀，其中 m 是质点质量，a₀ 是非惯性系相对于惯性系的加速度。惯性力的方向与非惯性系的加速度方向相反。引入惯性力后，动力学方程变为 F - ma₀ = ma'，其中 F 是真实力，a' 是相对加速度（在非惯性系中观察到的加速度）。",
          formulas: [
            { name: "惯性力", formula: "F惯性 = -ma₀", symbols: "a₀: 非惯性系加速度" },
            { name: "非惯性系动力学方程", formula: "F - ma₀ = ma'", symbols: "F: 真实力, a': 相对加速度" }
          ]
        },
        {
          concepts: ["真实力", "相对加速度", "绝对加速度"],
          relation: "真实力 F 是作用在质点上的实际外力，不依赖于参考系的选择。相对加速度 a' 是在非惯性系中观察到的加速度，绝对加速度 a = a₀ + a' 是在惯性系中观察到的加速度。",
          formulas: [
            { name: "绝对加速度", formula: "a = a₀ + a'", symbols: "a: 绝对加速度, a₀: 非惯性系加速度, a': 相对加速度" },
            { name: "相对加速度", formula: "a' = (F - ma₀)/m", symbols: "从非惯性系动力学方程解出" }
          ]
        }
      ],
      symbols: [
        { symbol: "a₀", name: "非惯性系加速度", unit: "m/s²", desc: "非惯性参考系相对于惯性系的加速度" },
        { symbol: "F", name: "真实力", unit: "N", desc: "作用在质点上的实际外力" },
        { symbol: "-ma₀", name: "惯性力", unit: "N", desc: "在非惯性系中引入的虚拟力" },
        { symbol: "a'", name: "相对加速度", unit: "m/s²", desc: "在非惯性系中观察到的加速度" },
        { symbol: "a", name: "绝对加速度", unit: "m/s²", desc: "在惯性系中观察到的加速度" },
        { symbol: "m", name: "质点质量", unit: "kg", desc: "质点的惯性质量" }
      ]
    },
    "rotating-reference-frame": {
      title: "旋转参考系 · 概念关系与公式",
      relations: [
        {
          concepts: ["旋转参考系", "科氏力", "离心力", "惯性力"],
          relation: "在旋转参考系中，需要引入两种惯性力：科氏力F_c = -2m(ω × v)和离心力F_cent = -m(ω × (ω × r))。科氏力垂直于相对速度v和角速度ω，方向由右手定则确定。离心力沿径向向外，大小与角速度的平方和半径成正比。引入这些惯性力后，可以在旋转参考系中使用牛顿第二定律。",
          formulas: [
            { name: "科氏力", formula: "F_c = -2m(ω × v)", symbols: "F_c: 科氏力 (N), ω: 角速度 (rad/s), v: 相对速度 (m/s)" },
            { name: "离心力", formula: "F_cent = -m(ω × (ω × r)) = mω²r", symbols: "F_cent: 离心力 (N), r: 径向矢量 (m), 方向沿径向向外" },
            { name: "非惯性系动力学方程", formula: "F真实 + F_c + F_cent = ma'", symbols: "a': 相对加速度, 在旋转参考系中观察到的加速度" }
          ]
        },
        {
          concepts: ["绝对加速度", "相对加速度", "牵连加速度", "科氏加速度"],
          relation: "绝对加速度aa = 相对加速度ar + 牵连加速度ae + 科氏加速度ac。牵连加速度是动参考系上与动点重合的点相对于定参考系的加速度，科氏加速度ac = 2(ω × v)是旋转参考系特有的加速度项。",
          formulas: [
            { name: "加速度合成", formula: "aa = ar + ae + ac", symbols: "aa: 绝对加速度, ar: 相对加速度, ae: 牵连加速度, ac: 科氏加速度" },
            { name: "科氏加速度", formula: "ac = 2(ω × v)", symbols: "ac: 科氏加速度 (m/s²), 垂直于ω和v" }
          ]
        }
      ],
      symbols: [
        { symbol: "ω", name: "角速度", unit: "rad/s", desc: "旋转参考系的角速度" },
        { symbol: "v", name: "相对速度", unit: "m/s", desc: "质点在旋转参考系中的速度" },
        { symbol: "r", name: "位置矢量", unit: "m", desc: "质点在旋转参考系中的位置" },
        { symbol: "F_c", name: "科氏力", unit: "N", desc: "F_c = -2m(ω × v), 垂直于ω和v" },
        { symbol: "F_cent", name: "离心力", unit: "N", desc: "F_cent = mω²r, 沿径向向外" },
        { symbol: "ac", name: "科氏加速度", unit: "m/s²", desc: "ac = 2(ω × v)" }
      ]
    },
    "accelerating-platform": {
      title: "加速平台 · 概念关系与公式",
      relations: [
        {
          concepts: ["非惯性参考系", "惯性力", "相对加速度"],
          relation: "在加速参考系中，需要引入惯性力F_inertial = -ma₀，其中m是质点质量，a₀是参考系相对于惯性系的加速度。惯性力的方向与参考系加速度方向相反。引入惯性力后，动力学方程变为F - ma₀ = ma'，其中F是真实力，a'是相对加速度（在非惯性系中观察到的加速度）。",
          formulas: [
            { name: "惯性力", formula: "F_inertial = -ma₀", symbols: "F_inertial: 惯性力 (N), a₀: 参考系加速度 (m/s²), 方向与a₀相反" },
            { name: "非惯性系动力学方程", formula: "F - ma₀ = ma'", symbols: "F: 真实力 (N), a': 相对加速度 (m/s²)" },
            { name: "绝对加速度", formula: "a = a₀ + a'", symbols: "a: 绝对加速度, a₀: 参考系加速度, a': 相对加速度" }
          ]
        },
        {
          concepts: ["惯性参考系", "非惯性参考系", "牛顿第一定律"],
          relation: "惯性参考系是牛顿第一定律成立的参考系，即不受力或合力为零的质点保持静止或匀速直线运动。非惯性参考系是相对于惯性系有加速度的参考系，在非惯性系中，牛顿第一定律不成立，需要引入惯性力才能使牛顿第二定律成立。",
          formulas: [
            { name: "惯性系定义", formula: "牛顿第一定律成立的参考系", symbols: "地面通常可视为惯性系" },
            { name: "非惯性系定义", formula: "相对于惯性系有加速度的参考系", symbols: "加速运动的平台、旋转参考系等" }
          ]
        }
      ],
      symbols: [
        { symbol: "a₀", name: "参考系加速度", unit: "m/s²", desc: "非惯性参考系相对于惯性系的加速度" },
        { symbol: "F_inertial", name: "惯性力", unit: "N", desc: "F_inertial = -ma₀, 方向与a₀相反" },
        { symbol: "a'", name: "相对加速度", unit: "m/s²", desc: "在非惯性系中观察到的加速度" },
        { symbol: "a", name: "绝对加速度", unit: "m/s²", desc: "在惯性系中观察到的加速度, a = a₀ + a'" },
        { symbol: "F", name: "真实力", unit: "N", desc: "作用在质点上的实际外力" },
        { symbol: "m", name: "质量", unit: "kg", desc: "质点的惯性质量" }
      ]
    },
    "two-body-collision": {
      title: "两体碰撞 · 概念关系与公式",
      relations: [
        {
          concepts: ["动量守恒", "碰撞问题"],
          relation: "两体碰撞过程中，由于碰撞时间极短，可以忽略其他外力，系统的总动量守恒：m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'，其中 v₁、v₂ 是碰撞前的速度，v₁'、v₂' 是碰撞后的速度。",
          formulas: [
            { name: "动量守恒", formula: "m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'", symbols: "碰撞前后总动量不变" }
          ]
        },
        {
          concepts: ["恢复系数", "碰撞类型"],
          relation: "恢复系数 e = (v₂' - v₁')/(v₁ - v₂) 反映碰撞的弹性程度。e = 1 为完全弹性碰撞（动能守恒），e = 0 为完全非弹性碰撞（两球粘在一起），0 < e < 1 为非完全弹性碰撞（有动能损失）。",
          formulas: [
            { name: "恢复系数", formula: "e = (v₂' - v₁')/(v₁ - v₂)", symbols: "e: 恢复系数, 0 ≤ e ≤ 1" },
            { name: "完全弹性碰撞", formula: "e = 1", symbols: "动能守恒" },
            { name: "完全非弹性碰撞", formula: "e = 0", symbols: "两球粘在一起" }
          ]
        },
        {
          concepts: ["碰撞后速度", "动量守恒与恢复系数联立"],
          relation: "结合动量守恒和恢复系数，可以求解碰撞后的速度：v₁' = (m₁v₁ + m₂v₂ - m₂e(v₁ - v₂))/(m₁ + m₂)，v₂' = (m₁v₁ + m₂v₂ + m₁e(v₁ - v₂))/(m₁ + m₂)。",
          formulas: [
            { name: "碰撞后速度1", formula: "v₁' = (m₁v₁ + m₂v₂ - m₂e(v₁ - v₂))/(m₁ + m₂)", symbols: "结合动量守恒和恢复系数求解" },
            { name: "碰撞后速度2", formula: "v₂' = (m₁v₁ + m₂v₂ + m₁e(v₁ - v₂))/(m₁ + m₂)", symbols: "结合动量守恒和恢复系数求解" }
          ]
        }
      ],
      symbols: [
        { symbol: "m₁, m₂", name: "两球质量", unit: "kg", desc: "碰撞的两个小球的质量" },
        { symbol: "v₁, v₂", name: "碰撞前速度", unit: "m/s", desc: "碰撞前两球的速度" },
        { symbol: "v₁', v₂'", name: "碰撞后速度", unit: "m/s", desc: "碰撞后两球的速度" },
        { symbol: "e", name: "恢复系数", unit: "—", desc: "反映碰撞弹性程度的无量纲量，0 ≤ e ≤ 1" },
        { symbol: "p", name: "总动量", unit: "kg·m/s", desc: "系统总动量 p = m₁v₁ + m₂v₂" }
      ]
    },
    "system-momentum-center": {
      title: "质点系动量 · 概念关系与公式",
      relations: [
        {
          concepts: ["系统动量", "质心", "质心速度"],
          relation: "质点系的总动量等于系统总质量乘以质心速度：p = mvC，其中 m = m₁ + m₂ + ... 是系统总质量，vC 是质心速度。质心位置 xC = (m₁x₁ + m₂x₂ + ...)/(m₁ + m₂ + ...)，质心速度 vC = (m₁v₁ + m₂v₂ + ...)/(m₁ + m₂ + ...)。",
          formulas: [
            { name: "系统总动量", formula: "p = mvC = m₁v₁ + m₂v₂ + ...", symbols: "p: 系统总动量 (kg·m/s), m: 总质量 (kg), vC: 质心速度 (m/s)" },
            { name: "质心位置", formula: "xC = (m₁x₁ + m₂x₂ + ...)/(m₁ + m₂ + ...)", symbols: "xC: 质心位置 (m)" },
            { name: "质心速度", formula: "vC = (m₁v₁ + m₂v₂ + ...)/(m₁ + m₂ + ...)", symbols: "vC: 质心速度 (m/s)" }
          ]
        },
        {
          concepts: ["质心运动定理", "动量守恒"],
          relation: "质心运动定理表明：系统总动量的变化率等于系统所受的合外力，dp/dt = F外。当系统不受外力或合外力为零时，系统总动量守恒：p = mvC = 常数，质心速度保持不变。",
          formulas: [
            { name: "质心运动定理", formula: "dp/dt = F外", symbols: "F外: 系统所受的合外力 (N)" },
            { name: "动量守恒", formula: "p = mvC = 常数", symbols: "当 F外 = 0 时成立" }
          ]
        }
      ],
      symbols: [
        { symbol: "m₁, m₂", name: "各质点质量", unit: "kg", desc: "系统中各个质点的质量" },
        { symbol: "v₁, v₂", name: "各质点速度", unit: "m/s", desc: "系统中各个质点的速度" },
        { symbol: "m", name: "系统总质量", unit: "kg", desc: "m = m₁ + m₂ + ..." },
        { symbol: "xC", name: "质心位置", unit: "m", desc: "系统质心的位置坐标" },
        { symbol: "vC", name: "质心速度", unit: "m/s", desc: "系统质心的速度" },
        { symbol: "p", name: "系统总动量", unit: "kg·m/s", desc: "p = mvC = m₁v₁ + m₂v₂ + ..." }
      ]
    },
    "angular-momentum-theorem": {
      title: "动量矩定理 · 概念关系与公式",
      relations: [
        {
          concepts: ["角动量", "转动惯量", "角速度"],
          relation: "刚体绕定轴转动时，角动量 L = Iω，其中 I 是转动惯量（描述刚体质量分布对转动的抵抗），ω 是角速度。角动量是转动状态的量度，类似于平动中的动量 p = mv。",
          formulas: [
            { name: "角动量", formula: "L = Iω", symbols: "L: 角动量 (kg·m²/s), I: 转动惯量 (kg·m²), ω: 角速度 (rad/s)" },
            { name: "转动惯量", formula: "I = Σmiri²", symbols: "ri: 质点到转轴的距离" }
          ]
        },
        {
          concepts: ["动量矩定理", "角加速度", "力矩"],
          relation: "动量矩定理表明：角动量的变化率等于合外力矩，dL/dt = M。由于 L = Iω，且 I 为常数，所以 dL/dt = I·dω/dt = Iα = M，即 M = Iα。这类似于平动中的 F = ma。",
          formulas: [
            { name: "动量矩定理", formula: "dL/dt = M", symbols: "M: 合外力矩 (N·m)" },
            { name: "转动方程", formula: "M = Iα", symbols: "α: 角加速度 (rad/s²)" }
          ]
        },
        {
          concepts: ["角动量守恒", "动量矩守恒"],
          relation: "当系统不受外力矩或合外力矩为零时，角动量守恒：L = Iω = 常数。这意味着如果转动惯量 I 改变（如花样滑冰运动员收臂），角速度 ω 会相应改变以保持 L 不变。",
          formulas: [
            { name: "角动量守恒", formula: "L = Iω = 常数", symbols: "当 M = 0 时成立" },
            { name: "转动惯量变化", formula: "I₁ω₁ = I₂ω₂", symbols: "转动惯量改变时，角速度相应改变" }
          ]
        }
      ],
      symbols: [
        { symbol: "L", name: "角动量", unit: "kg·m²/s", desc: "刚体转动状态的量度" },
        { symbol: "I", name: "转动惯量", unit: "kg·m²", desc: "描述刚体质量分布对转动的抵抗" },
        { symbol: "ω", name: "角速度", unit: "rad/s", desc: "单位时间内转角的变化率" },
        { symbol: "M", name: "合外力矩", unit: "N·m", desc: "作用在刚体上的所有外力矩的矢量和" },
        { symbol: "α", name: "角加速度", unit: "rad/s²", desc: "角速度对时间的变化率" }
      ]
    },
    "angular-momentum-conservation": {
      title: "角动量守恒 · 概念关系与公式",
      relations: [
        {
          concepts: ["角动量守恒", "转动惯量", "角速度"],
          relation: "当系统不受外力矩或合外力矩为零时，角动量守恒：L = Iω = 常数。这意味着如果转动惯量 I 改变（如质量块移动），角速度 ω 会相应改变以保持 L 不变。当 I 增大时 ω 减小，当 I 减小时 ω 增大，但 L 始终保持不变。",
          formulas: [
            { name: "角动量守恒", formula: "L = Iω = 常数", symbols: "L: 角动量 (kg·m²/s), 当 M = 0 时成立" },
            { name: "转动惯量变化", formula: "I₁ω₁ = I₂ω₂", symbols: "转动惯量改变时，角速度相应改变" },
            { name: "转动惯量（点质量）", formula: "I = mr²", symbols: "m: 质量 (kg), r: 到转轴的距离 (m)" }
          ]
        },
        {
          concepts: ["变转动惯量", "花样滑冰效应"],
          relation: "当转动惯量 I 改变时，为了保持角动量 L 不变，角速度 ω 必须相应改变。这就是花样滑冰运动员收臂时转速加快、伸臂时转速减慢的原理。本模型通过质量块在转盘上的移动来改变转动惯量，直观展示这一现象。",
          formulas: [
            { name: "角速度变化", formula: "ω₂ = (I₁/I₂)ω₁", symbols: "转动惯量从 I₁ 变为 I₂ 时，角速度从 ω₁ 变为 ω₂" },
            { name: "能量变化", formula: "ΔT = ½I₂ω₂² - ½I₁ω₁²", symbols: "注意：虽然角动量守恒，但动能可能变化" }
          ]
        }
      ],
      symbols: [
        { symbol: "L", name: "角动量", unit: "kg·m²/s", desc: "守恒量，L = Iω = 常数" },
        { symbol: "I", name: "转动惯量", unit: "kg·m²", desc: "可变化的量，I = mr²（点质量）" },
        { symbol: "ω", name: "角速度", unit: "rad/s", desc: "随转动惯量变化，ω = L/I" },
        { symbol: "m", name: "质量块质量", unit: "kg", desc: "转盘上质量块的质量" },
        { symbol: "r", name: "质量块到转轴距离", unit: "m", desc: "可变化的距离，影响转动惯量" }
      ]
    },
    "work-energy": {
      title: "动能定理 · 概念关系与公式",
      relations: [
        {
          concepts: ["功", "动能", "动能定理"],
          relation: "动能定理表明：外力对质点所做的功等于质点动能的增量，W = ΔT = ½mv² - ½mv₀²。功 W = F·s（恒力）或 W = ∫F·ds（变力），动能 T = ½mv²。当外力做正功时，动能增加；当外力做负功时，动能减少。",
          formulas: [
            { name: "动能定理", formula: "W = ΔT = ½mv² - ½mv₀²", symbols: "W: 功 (J), ΔT: 动能增量 (J)" },
            { name: "功（恒力）", formula: "W = F·s", symbols: "F: 力 (N), s: 位移 (m)" },
            { name: "动能", formula: "T = ½mv²", symbols: "m: 质量 (kg), v: 速度 (m/s)" }
          ]
        },
        {
          concepts: ["功-能关系", "能量转换"],
          relation: "功是能量转换的量度。外力对质点做正功时，将能量传递给质点，使动能增加；质点对外做正功时，消耗动能，使动能减少。在保守力场中，功与路径无关，只与起点和终点位置有关。",
          formulas: [
            { name: "功与动能关系", formula: "W = ΔT", symbols: "功等于动能增量" },
            { name: "功率", formula: "P = dW/dt = F·v", symbols: "P: 功率 (W), 功对时间的变化率" }
          ]
        },
        {
          concepts: ["保守力", "非保守力"],
          relation: "保守力（如重力、弹性力）做的功与路径无关，只与起点和终点位置有关，可以引入势能。非保守力（如摩擦力）做的功与路径有关，会消耗机械能。在只有保守力做功的情况下，机械能守恒。",
          formulas: [
            { name: "保守力功", formula: "W保守 = -ΔU", symbols: "U: 势能, 保守力做的功等于势能减少" },
            { name: "机械能守恒", formula: "T + U = 常数", symbols: "只有保守力做功时成立" }
          ]
        }
      ],
      symbols: [
        { symbol: "W", name: "功", unit: "J (焦耳)", desc: "力对位移的积分，W = ∫F·ds" },
        { symbol: "F", name: "力", unit: "N", desc: "作用在质点上的外力" },
        { symbol: "s", name: "位移", unit: "m", desc: "质点在力作用下的位移" },
        { symbol: "T", name: "动能", unit: "J", desc: "T = ½mv², 描述质点运动状态的能量" },
        { symbol: "ΔT", name: "动能增量", unit: "J", desc: "ΔT = T₂ - T₁ = ½mv² - ½mv₀²" },
        { symbol: "m", name: "质量", unit: "kg", desc: "质点的质量" },
        { symbol: "v", name: "速度", unit: "m/s", desc: "质点的速度" },
        { symbol: "P", name: "功率", unit: "W (瓦特)", desc: "P = dW/dt = F·v, 功对时间的变化率" }
      ]
    },
    "d-alembert-principle": {
      title: "达朗贝尔原理 · 概念关系与公式",
      relations: [
        {
          concepts: ["达朗贝尔原理", "惯性力", "动力学平衡"],
          relation: "达朗贝尔原理的核心思想是：在动力学问题中引入惯性力 -ma，可以将动力学方程 F = ma 转化为静力学平衡方程 F - ma = 0。这样，所有静力学的平衡方法（如受力图、平衡方程等）都可以直接应用于动力学问题。",
          formulas: [
            { name: "动力学方程", formula: "F = ma", symbols: "F: 真实力 (N), m: 质量 (kg), a: 加速度 (m/s²)" },
            { name: "惯性力", formula: "FI = -ma", symbols: "FI: 惯性力 (N), 方向与加速度相反" },
            { name: "达朗贝尔平衡方程", formula: "F - ma = 0", symbols: "引入惯性力后的平衡条件" }
          ]
        },
        {
          concepts: ["动静法", "动力学→静力学"],
          relation: "动静法是应用达朗贝尔原理求解动力学问题的方法。通过在运动的物体上假想地加上惯性力，将动力学问题转化为静力学问题，可以用静力学的平衡方程来求解。这种方法特别适用于分析复杂约束系统的动力学问题。",
          formulas: [
            { name: "动静法步骤", formula: "1. 画受力图（包括真实力和惯性力） 2. 列平衡方程 3. 求解", symbols: "将动力学问题转化为静力学问题" },
            { name: "平衡条件", formula: "所有力的和 = 0（包括真实力和惯性力）", symbols: "在形式上与静力学平衡方程相同" }
          ]
        },
        {
          concepts: ["惯性力", "真实力", "约束反力"],
          relation: "惯性力是假想的力，不是实际存在的力，但在分析中可以当作真实力来处理。真实力是实际作用在物体上的外力（如重力、推力、摩擦力等）。约束反力是约束对物体的作用力。在动静法中，惯性力与真实力、约束反力一起参与平衡方程。",
          formulas: [
            { name: "力的分类", formula: "真实力 + 惯性力 + 约束反力 = 0", symbols: "在动静法中，所有力（包括惯性力）满足平衡条件" },
            { name: "惯性力的特点", formula: "FI = -ma，方向与加速度相反", symbols: "惯性力是假想的，但在分析中当作真实力处理" }
          ]
        }
      ],
      symbols: [
        { symbol: "F", name: "真实力", unit: "N", desc: "实际作用在物体上的外力" },
        { symbol: "FI", name: "惯性力", unit: "N", desc: "FI = -ma, 假想的力，方向与加速度相反" },
        { symbol: "m", name: "质量", unit: "kg", desc: "物体的质量" },
        { symbol: "a", name: "加速度", unit: "m/s²", desc: "物体的加速度" },
        { symbol: "F - ma", name: "平衡条件", unit: "N", desc: "引入惯性力后的平衡方程" }
      ]
    },
    "virtual-displacement-principle": {
      title: "虚位移原理 · 概念关系与公式",
      relations: [
        {
          concepts: ["虚位移", "虚功原理", "理想约束"],
          relation: "虚位移是约束允许的、无限小的、假想的位移，用δr表示。虚位移原理：受理想约束的质点系处于平衡状态的充要条件是，所有主动力在任意虚位移上所做的虚功之和为零：ΣFi·δri = 0。理想约束是约束反力不做功的约束，如光滑接触面、不可伸长的绳索、固定铰支座等。",
          formulas: [
            { name: "虚功原理", formula: "ΣFi·δri = 0", symbols: "Fi: 主动力, δri: 虚位移" },
            { name: "理想约束条件", formula: "ΣFi约束·δri = 0", symbols: "约束反力在虚位移上不做功" },
            { name: "平衡条件", formula: "所有主动力的虚功之和 = 0", symbols: "受理想约束的质点系平衡的充要条件" }
          ]
        },
        {
          concepts: ["虚位移", "约束", "自由度"],
          relation: "虚位移必须满足约束条件，是约束允许的位移。对于n个自由度的系统，有n个独立的虚位移。虚位移与真实位移的区别在于：虚位移是假想的、无限小的，而真实位移是实际发生的、有限的。",
          formulas: [
            { name: "虚位移定义", formula: "δr: 约束允许的、无限小的、假想的位移", symbols: "虚位移满足约束条件" },
            { name: "自由度", formula: "独立虚位移的个数 = 系统的自由度", symbols: "n个自由度对应n个独立虚位移" }
          ]
        },
        {
          concepts: ["虚功原理应用", "约束反力", "平衡条件"],
          relation: "利用虚位移原理可以求解静力学问题，特别是复杂约束系统。通过给系统一个虚位移，建立虚功方程，可以避免求解约束反力，直接建立平衡条件。这是分析多约束系统的重要方法。",
          formulas: [
            { name: "应用步骤", formula: "1. 确定系统的自由度 2. 给出虚位移 3. 计算各主动力的虚功 4. 建立虚功方程 ΣFi·δri = 0", symbols: "利用虚功原理求解平衡问题" },
            { name: "杠杆平衡", formula: "F₁·δr₁ + F₂·δr₂ = 0", symbols: "杠杆在理想约束下平衡的虚功方程" }
          ]
        }
      ],
      symbols: [
        { symbol: "δr", name: "虚位移", unit: "m", desc: "约束允许的、无限小的、假想的位移" },
        { symbol: "F", name: "主动力", unit: "N", desc: "作用在系统上的外力（不包括约束反力）" },
        { symbol: "F·δr", name: "虚功", unit: "J", desc: "力在虚位移上所做的功" },
        { symbol: "ΣFi·δri", name: "总虚功", unit: "J", desc: "所有主动力在虚位移上所做的虚功之和" },
        { symbol: "理想约束", name: "理想约束", unit: "—", desc: "约束反力在虚位移上不做功的约束" }
      ]
    },
    "spatial-force-system": {
      title: "空间力系 · 概念关系与公式",
      relations: [
        {
          concepts: ["空间力系简化", "主矢矢量", "主矩矢量"],
          relation: "空间任意多力作用在刚体上时，可等效为一个主矢FR和一个主矩矢MO。FR 为所有力的矢量和（包含x、y、z三个分量），MO 为所有力对参考点的力矩矢量。只要知道各力的坐标和分量，就能计算出FR和MO。",
          formulas: [
            { name: "主矢各分量", formula: "FRx = 所有x方向力的和, FRy = 所有y方向力的和, FRz = 所有z方向力的和", symbols: "FRx, FRy, FRz: 主矢在x/y/z方向的分量" },
            { name: "主矩各分量", formula: "MOx = 所有Mix的和, MOy = 所有Miy的和, MOz = 所有Miz的和", symbols: "Mix = yi·Fiz - zi·Fiy, 以此类推" },
            { name: "向量表达", formula: "FR = (FRx, FRy, FRz), MO = (MOx, MOy, MOz)", symbols: "用向量形式表述合力与合力矩" }
          ]
        },
        {
          concepts: ["空间平衡方程", "受力图", "等效力系"],
          relation: "空间刚体平衡时，三个方向的合力必须为零，三个方向的合力矩也必须为零：所有x方向力的和 = 所有y方向力的和 = 所有z方向力的和 = 0，所有x方向力矩的和 = 所有y方向力矩的和 = 所有z方向力矩的和 = 0。受力图帮助识别所有外力及其作用点，等效力系简化后再代入平衡方程即可求解未知量。",
          formulas: [
            { name: "空间平衡条件", formula: "所有x方向力的和 = 0, 所有y方向力的和 = 0, 所有z方向力的和 = 0, 所有x方向力矩的和 = 0, 所有y方向力矩的和 = 0, 所有z方向力矩的和 = 0", symbols: "6个独立方程" },
            { name: "等效力系", formula: "原力系 ≡ (FR, MO)", symbols: "FR, MO 同时满足平衡条件时刚体平衡" }
          ]
        }
      ],
      symbols: [
        { symbol: "FR", name: "主矢", unit: "N", desc: "空间力系合力向量" },
        { symbol: "FRx, FRy, FRz", name: "主矢分量", unit: "N", desc: "合力在三个坐标方向上的分量" },
        { symbol: "MO", name: "主矩矢量", unit: "N·m", desc: "空间合力矩向量" },
        { symbol: "MOx, MOy, MOz", name: "主矩分量", unit: "N·m", desc: "力矩在三个方向上的分量" },
        { symbol: "Fi", name: "各分力", unit: "N", desc: "作用在刚体上的外力" },
        { symbol: "ri", name: "位置矢量", unit: "m", desc: "该力作用点相对于参考点的矢量" }
      ]
    },
    "disk-couple": {
      title: "圆盘力偶 · 概念关系与公式",
      relations: [
        {
          concepts: ["力偶", "力偶矩", "扭矩"],
          relation: "在圆盘边缘施加一对大小相等、方向相反的切向力F和-F，作用线不重合，这就是典型的力偶。合力为零，但产生对圆盘轴线的扭矩M，其大小与力和半径成正比。",
          formulas: [
            { name: "力偶矩（扭矩）", formula: "M = 2F·R", symbols: "R: 圆盘半径" },
            { name: "方向判定", formula: "右手定则：四指指向F的转动方向，大拇指指向扭矩方向", symbols: "扭矩沿轴线方向" }
          ]
        },
        {
          concepts: ["力偶的平移不变性", "圆轴扭转"],
          relation: "同一对力偶在圆盘上任意平移，并不会改变其对圆盘的转动力效应，因此扭矩在刚体上可以自由平移——这就是力偶的平移不变性。圆轴扭转问题中使用的外力往往可以简化为一个等效扭矩。",
          formulas: [
            { name: "等效扭矩", formula: "多个力偶 → M合 = 所有力矩的和", symbols: "Mi: 各个力偶矩" },
            { name: "扭转角关系（材料力学）", formula: "θ = MT/(GJ)", symbols: "提示：后续在圆轴扭转章节中展开" }
          ]
        }
      ],
      symbols: [
        { symbol: "F", name: "切向力", unit: "N", desc: "沿圆盘边缘切向作用的力" },
        { symbol: "R", name: "半径", unit: "m", desc: "力作用点到圆心的距离" },
        { symbol: "M", name: "力偶矩/扭矩", unit: "N·m", desc: "导致圆盘绕轴转动的力矩" }
      ]
    },
    "friction-slope": {
      title: "斜面摩擦 · 概念关系与公式",
      relations: [
        {
          concepts: ["受力图", "重力分解", "静摩擦力"],
          relation: "斜面滑块问题的第一步是画受力图：把重力 G 分解为沿斜面和垂直斜面的分量 G‖ = G·sinα、G⊥ = G·cosα。法向力 N = G⊥，静摩擦力 Ff 与外界趋势相反，在其允许范围内自动调节大小，最大值为 μN。",
          formulas: [
            { name: "重力分量", formula: "G‖ = G·sinα, G⊥ = G·cosα", symbols: "G: 重力 (N)" },
            { name: "最大静摩擦力", formula: "Ff,max = μN = μG·cosα", symbols: "μ: 静摩擦系数" },
            { name: "沿斜面平衡", formula: "所有x方向力的和 = 0 → Ff + P - G·sinα = 0", symbols: "P: 额外施力（若有）" }
          ]
        },
        {
          concepts: ["摩擦锥", "自锁判据"],
          relation: "摩擦锥表明：合力与法线的夹角若小于摩擦角 φ = arctan μ，则静摩擦足以保持平衡。不考虑外力时，斜面自锁的条件就是 μ ≥ tanα，即摩擦角不小于斜面角。",
          formulas: [
            { name: "摩擦角", formula: "φ = arctan μ", symbols: "φ: 摩擦角" },
            { name: "自锁条件", formula: "μ ≥ tanα", symbols: "满足该条件时滑块不会自行滑动" }
          ]
        }
      ],
      symbols: [
        { symbol: "μ", name: "静摩擦系数", unit: "—", desc: "接触面的粗糙程度" },
        { symbol: "α", name: "斜面角", unit: "° / rad", desc: "斜面与水平的夹角" },
        { symbol: "φ", name: "摩擦角", unit: "° / rad", desc: "φ = arctan μ" },
        { symbol: "G", name: "重力", unit: "N", desc: "滑块重量" },
        { symbol: "N", name: "法向力", unit: "N", desc: "斜面提供的支撑反力" },
        { symbol: "Ff", name: "静摩擦力", unit: "N", desc: "沿斜面抵抗相对运动的力" }
      ]
    },
    "friction-mechanisms": {
      title: "更多摩擦副 · 概念关系与公式",
      relations: [
        {
          concepts: ["螺旋副", "导程角", "自锁条件"],
          relation: "螺旋副是将旋转运动转换为直线运动的机构。导程角λ是螺旋线展开后与水平面的夹角，tanλ = p/(2πr)，其中p是导程（螺距），r是螺纹平均半径。螺旋副的自锁条件是导程角λ ≤ 摩擦角φ，即tanλ ≤ μ。满足此条件时，无论轴向力F多大，螺母都不会自行旋转，需要施加力矩M才能转动。",
          formulas: [
            { name: "导程角", formula: "tanλ = p/(2πr)", symbols: "λ: 导程角, p: 导程(螺距) (m), r: 螺纹平均半径 (m)" },
            { name: "螺旋副自锁条件", formula: "λ ≤ φ 或 tanλ ≤ μ", symbols: "满足此条件时螺旋副自锁" },
            { name: "螺旋副效率", formula: "η = tanλ / tan(λ + φ)", symbols: "η: 效率, 自锁时效率较低" }
          ]
        },
        {
          concepts: ["滚动摩擦", "滚动摩阻系数", "滚动阻力偶"],
          relation: "滚动摩擦是物体滚动时受到的阻力，用滚动阻力偶矩Mf表示。滚动摩阻系数δ = Mf/N，单位是长度（米）。滚动摩擦远小于滑动摩擦，这是因为滚动时接触面发生弹性变形，产生阻力偶，而不是滑动时的切向摩擦力。滚动摩阻系数δ的典型值在0.0005m到0.01m之间，远小于滑动摩擦系数μ（通常0.1-1.0）。",
          formulas: [
            { name: "滚动阻力偶", formula: "Mf = δ·N", symbols: "Mf: 滚动阻力偶矩 (N·m), δ: 滚动摩阻系数 (m), N: 正压力 (N)" },
            { name: "滚动摩阻系数", formula: "δ = Mf/N", symbols: "δ: 滚动摩阻系数 (m), 典型值0.0005~0.01m" },
            { name: "滚动与滑动比较", formula: "δ << μ·r", symbols: "滚动摩擦远小于滑动摩擦" }
          ]
        },
        {
          concepts: ["楔块", "楔角", "自锁机构"],
          relation: "楔块是一种自锁机构，通过楔角α和摩擦角φ的关系实现自锁。当楔角α ≤ 2φ（2倍摩擦角）时，楔块在压力作用下不会自行退出，实现自锁。楔块常用于夹具、千斤顶等需要自锁的机构中。楔块的自锁原理与斜面自锁类似，但楔块有两个接触面，所以自锁条件是α ≤ 2φ而不是α ≤ φ。",
          formulas: [
            { name: "楔块自锁条件", formula: "α ≤ 2φ 或 α ≤ 2arctan μ", symbols: "α: 楔角, φ: 摩擦角, 满足此条件时楔块自锁" },
            { name: "楔块受力分析", formula: "N = F/(2sin(α/2)), Ff = μN", symbols: "N: 法向力, F: 压力, Ff: 摩擦力" },
            { name: "临界楔角", formula: "αcr = 2φ = 2arctan μ", symbols: "临界楔角，超过此角度不自锁" }
          ]
        }
      ],
      symbols: [
        { symbol: "λ", name: "导程角", unit: "° / rad", desc: "螺旋线展开后与水平面的夹角" },
        { symbol: "p", name: "导程/螺距", unit: "m", desc: "螺纹旋转一周的轴向移动距离" },
        { symbol: "r", name: "螺纹平均半径", unit: "m", desc: "螺纹的平均半径" },
        { symbol: "F", name: "轴向力", unit: "N", desc: "作用在螺旋副上的轴向力" },
        { symbol: "M", name: "力矩", unit: "N·m", desc: "使螺旋副转动的力矩" },
        { symbol: "δ", name: "滚动摩阻系数", unit: "m", desc: "滚动摩擦的系数，典型值0.0005~0.01m" },
        { symbol: "Mf", name: "滚动阻力偶矩", unit: "N·m", desc: "滚动时产生的阻力偶矩" },
        { symbol: "α", name: "楔角", unit: "° / rad", desc: "楔块的角度" },
        { symbol: "φ", name: "摩擦角", unit: "° / rad", desc: "φ = arctan μ" },
        { symbol: "μ", name: "摩擦系数", unit: "—", desc: "接触面的摩擦系数" }
      ]
    },
    "multi-force-panel": {
      title: "多力门板 · 概念关系与公式",
      relations: [
        {
          concepts: ["平面力系简化", "主矢", "主矩", "受力图"],
          relation: "多力门板模型把多条外力集中在一扇门上：有沿门面、沿门边以及倾斜作用的力。通过受力图和坐标选取，可以把所有力化简为一个合力FR（作用线过某一点）和一个关于铰点O的合矩MO。在写平衡方程时，先把复杂力系转为FR+MO，再根据平衡条件求解铰链处的反力和力矩。",
          formulas: [
            { name: "主矢", formula: "FR = 所有力的和", symbols: "FR: 主矢 (N), 所有力的矢量和" },
            { name: "主矩", formula: "MO = 所有力矩的和", symbols: "MO: 主矩 (N·m), 所有力对O点的力矩之和" },
            { name: "平衡条件", formula: "所有x方向力的和 = 0, 所有y方向力的和 = 0, 所有力矩的和 = 0", symbols: "三个独立平衡方程" }
          ]
        }
      ],
      symbols: [
        { symbol: "FR", name: "主矢", unit: "N", desc: "所有力的矢量和" },
        { symbol: "MO", name: "主矩", unit: "N·m", desc: "所有力对参考点O的力矩之和" },
        { symbol: "Fi", name: "各分力", unit: "N", desc: "作用在门板上的各个力" }
      ]
    },
    "point-kinematics-curve": {
      title: "质点曲线运动 · 概念关系与公式",
      relations: [
        {
          concepts: ["曲线运动", "切向加速度", "法向加速度", "曲率半径"],
          relation: "质点沿曲线运动时，加速度可以分解为切向加速度aₜ和法向加速度aₙ。切向加速度aₜ = dv/dt改变速度大小，法向加速度aₙ = v²/R改变速度方向，其中R是曲率半径。总加速度a = √(aₜ² + aₙ²)。",
          formulas: [
            { name: "切向加速度", formula: "aₜ = dv/dt", symbols: "aₜ: 切向加速度 (m/s²), 改变速度大小" },
            { name: "法向加速度", formula: "aₙ = v²/R", symbols: "aₙ: 法向加速度 (m/s²), R: 曲率半径 (m), 改变速度方向" },
            { name: "总加速度", formula: "a = √(aₜ² + aₙ²)", symbols: "总加速度的大小" }
          ]
        },
        {
          concepts: ["速度", "曲率半径", "角速度"],
          relation: "质点沿曲线运动时，速度v沿轨迹切线方向。曲率半径R是描述曲线弯曲程度的量，R越小曲线越弯曲。对于圆周运动，R是圆的半径，v = Rω，其中ω是角速度。",
          formulas: [
            { name: "速度方向", formula: "速度方向沿轨迹切线", symbols: "速度始终沿轨迹切线方向" },
            { name: "圆周运动", formula: "v = Rω, aₙ = v²/R = Rω²", symbols: "R: 半径, ω: 角速度" }
          ]
        }
      ],
      symbols: [
        { symbol: "v", name: "速度", unit: "m/s", desc: "质点沿轨迹的速度" },
        { symbol: "aₜ", name: "切向加速度", unit: "m/s²", desc: "改变速度大小的加速度分量" },
        { symbol: "aₙ", name: "法向加速度", unit: "m/s²", desc: "改变速度方向的加速度分量" },
        { symbol: "R", name: "曲率半径", unit: "m", desc: "描述曲线弯曲程度的半径" },
        { symbol: "a", name: "总加速度", unit: "m/s²", desc: "a = √(aₜ² + aₙ²)" }
      ]
    },
    "rigid-fixed-rotation": {
      title: "刚体定轴转动 · 概念关系与公式",
      relations: [
        {
          concepts: ["定轴转动", "角位移", "角速度", "角加速度"],
          relation: "刚体绕固定轴转动时，用角位移θ描述位置，角速度ω = dθ/dt描述转动快慢，角加速度α = dω/dt = d²θ/dt²描述角速度变化。这三个量之间的关系类似于直线运动中的位移、速度和加速度。",
          formulas: [
            { name: "角速度", formula: "ω = dθ/dt", symbols: "ω: 角速度 (rad/s), θ: 角位移 (rad)" },
            { name: "角加速度", formula: "α = dω/dt = d²θ/dt²", symbols: "α: 角加速度 (rad/s²)" },
            { name: "匀角加速度运动", formula: "ω = ω₀ + αt, θ = θ₀ + ω₀t + ½αt²", symbols: "ω₀: 初始角速度, θ₀: 初始角位移" }
          ]
        },
        {
          concepts: ["转动惯量", "角动量", "转动动能"],
          relation: "刚体定轴转动时，转动惯量I描述质量分布对转动的抵抗，角动量L = Iω，转动动能T = ½Iω²。这些量与平动中的质量m、动量p = mv、动能T = ½mv²相对应。",
          formulas: [
            { name: "角动量", formula: "L = Iω", symbols: "L: 角动量 (kg·m²/s), I: 转动惯量 (kg·m²)" },
            { name: "转动动能", formula: "T = ½Iω²", symbols: "T: 转动动能 (J)" }
          ]
        }
      ],
      symbols: [
        { symbol: "θ", name: "角位移", unit: "rad", desc: "刚体转过的角度" },
        { symbol: "ω", name: "角速度", unit: "rad/s", desc: "ω = dθ/dt, 描述转动快慢" },
        { symbol: "α", name: "角加速度", unit: "rad/s²", desc: "α = dω/dt, 描述角速度变化" },
        { symbol: "I", name: "转动惯量", unit: "kg·m²", desc: "描述质量分布对转动的抵抗" },
        { symbol: "L", name: "角动量", unit: "kg·m²/s", desc: "L = Iω" }
      ]
    },
    "composite-point-motion": {
      title: "点的合成运动 · 概念关系与公式",
      relations: [
        {
          concepts: ["绝对运动", "相对运动", "牵连运动", "速度合成定理"],
          relation: "点的合成运动将复杂运动分解为相对运动和牵连运动。绝对速度va = 相对速度vr + 牵连速度ve，其中绝对速度是点相对于定参考系的速度，相对速度是点相对于动参考系的速度，牵连速度是动参考系上与动点重合的点相对于定参考系的速度。",
          formulas: [
            { name: "速度合成定理", formula: "va = vr + ve", symbols: "va: 绝对速度, vr: 相对速度, ve: 牵连速度" },
            { name: "加速度合成定理", formula: "aa = ar + ae + ac", symbols: "aa: 绝对加速度, ar: 相对加速度, ae: 牵连加速度, ac: 科氏加速度" },
            { name: "科氏加速度", formula: "ac = 2ω × vr", symbols: "ω: 动参考系角速度, vr: 相对速度" }
          ]
        },
        {
          concepts: ["动参考系", "定参考系", "牵连点"],
          relation: "动参考系是运动的参考系，定参考系是固定的参考系。牵连点是动参考系上与动点重合的点，牵连速度是牵连点相对于定参考系的速度。通过选择合适的动参考系，可以简化复杂运动问题的分析。",
          formulas: [
            { name: "牵连速度", formula: "ve = 牵连点相对于定参考系的速度", symbols: "动参考系上与动点重合的点的速度" },
            { name: "相对速度", formula: "vr = 动点相对于动参考系的速度", symbols: "在动参考系中观察到的速度" }
          ]
        }
      ],
      symbols: [
        { symbol: "va", name: "绝对速度", unit: "m/s", desc: "点相对于定参考系的速度" },
        { symbol: "vr", name: "相对速度", unit: "m/s", desc: "点相对于动参考系的速度" },
        { symbol: "ve", name: "牵连速度", unit: "m/s", desc: "动参考系上与动点重合的点相对于定参考系的速度" },
        { symbol: "aa", name: "绝对加速度", unit: "m/s²", desc: "点相对于定参考系的加速度" },
        { symbol: "ac", name: "科氏加速度", unit: "m/s²", desc: "ac = 2ω × vr, 动参考系转动时产生" }
      ]
    },
    "particle-newton-2d": {
      title: "质点动力学 · 概念关系与公式",
      relations: [
        {
          concepts: ["牛顿第二定律", "加速度", "力", "质量"],
          relation: "牛顿第二定律F = ma是动力学的基本方程，表明物体的加速度与所受合外力成正比，与质量成反比。在平面运动中，可以分解为两个分量方程：Fx = max, Fy = may。",
          formulas: [
            { name: "牛顿第二定律", formula: "F = ma", symbols: "F: 合外力 (N), m: 质量 (kg), a: 加速度 (m/s²)" },
            { name: "分量形式", formula: "Fx = max, Fy = may", symbols: "在x、y方向的分量方程" },
            { name: "加速度", formula: "a = d²r/dt²", symbols: "加速度是位置对时间的二阶导数" }
          ]
        },
        {
          concepts: ["受力分析", "运动方程", "初始条件"],
          relation: "求解动力学问题的步骤：1. 画受力图，识别所有外力；2. 建立坐标系；3. 列出牛顿第二定律的分量方程；4. 结合初始条件（位置和速度）求解运动方程。",
          formulas: [
            { name: "运动方程", formula: "m·d²x/dt² = Fx, m·d²y/dt² = Fy", symbols: "两个独立的二阶微分方程" },
            { name: "初始条件", formula: "t=0时: x=x₀, y=y₀, vx=vx₀, vy=vy₀", symbols: "确定积分常数" }
          ]
        }
      ],
      symbols: [
        { symbol: "F", name: "合外力", unit: "N", desc: "作用在质点上的所有外力的矢量和" },
        { symbol: "m", name: "质量", unit: "kg", desc: "质点的惯性质量" },
        { symbol: "a", name: "加速度", unit: "m/s²", desc: "a = F/m" },
        { symbol: "Fx, Fy", name: "力的分量", unit: "N", desc: "合外力在x、y方向的分量" },
        { symbol: "ax, ay", name: "加速度分量", unit: "m/s²", desc: "加速度在x、y方向的分量" }
      ]
    },
    "impulse-momentum": {
      title: "冲量与动量 · 概念关系与公式",
      relations: [
        {
          concepts: ["动量", "冲量", "动量定理"],
          relation: "动量p = mv是描述物体运动状态的量。冲量I = ∫F dt是力对时间的积分，描述力在一段时间内的累积效果。动量定理表明：冲量等于动量的变化，I = Δp = mv₂ - mv₁。",
          formulas: [
            { name: "动量", formula: "p = mv", symbols: "p: 动量 (kg·m/s), m: 质量 (kg), v: 速度 (m/s)" },
            { name: "冲量", formula: "I = ∫F dt", symbols: "I: 冲量 (N·s), F: 力 (N), t: 时间 (s)" },
            { name: "动量定理", formula: "I = Δp = mv₂ - mv₁", symbols: "冲量等于动量的变化" }
          ]
        },
        {
          concepts: ["动量守恒", "系统动量"],
          relation: "当系统不受外力或合外力为零时，系统总动量守恒：p₁ + p₂ + ... = 常数。这是动量定理在系统不受外力时的特殊情况，是分析碰撞、爆炸等问题的重要工具。",
          formulas: [
            { name: "动量守恒", formula: "p₁ + p₂ + ... = 常数", symbols: "当系统不受外力或合外力为零时成立" },
            { name: "两体系统", formula: "m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'", symbols: "碰撞前后总动量不变" }
          ]
        }
      ],
      symbols: [
        { symbol: "p", name: "动量", unit: "kg·m/s", desc: "p = mv, 描述物体运动状态的量" },
        { symbol: "I", name: "冲量", unit: "N·s", desc: "I = ∫F dt, 力对时间的积分" },
        { symbol: "Δp", name: "动量变化", unit: "kg·m/s", desc: "Δp = p₂ - p₁ = I" },
        { symbol: "F", name: "力", unit: "N", desc: "作用在物体上的外力" },
        { symbol: "t", name: "时间", unit: "s", desc: "力作用的时间" }
      ]
    },
    "multi-force-panel": {
      title: "多力门板 · 概念关系与公式",
      relations: [
        {
          concepts: ["受力图", "合力与合矩", "平衡方程"],
          relation: "对多力作用的门板，画出完整受力图后，可把所有分力进行分解并简化到铰点附近：合力FR = 所有力的和，合矩MO = 所有(r_i × Fi)的和。这样可以用 FR 和 MO 来代替原力系，从而建立平衡方程。",
          formulas: [
            { name: "合力", formula: "FRx = 所有x方向力的和, FRy = 所有y方向力的和", symbols: "FR = (FRx, FRy)" },
            { name: "合矩", formula: "MO = 所有(x_i Fy_i - y_i Fx_i)的和", symbols: "以铰点O为参考" }
          ]
        },
        {
          concepts: ["支反力", "平衡条件"],
          relation: "对门板铰链 O 写平衡方程：所有x方向力的和 = 0 → ROx + FRx = 0；所有y方向力的和 = 0 → ROy + FRy = 0；所有力矩的和 = 0 → RO·0 + MO = 0，从而可解出铰链反力。若存在额外支撑，也可同理列方程。",
          formulas: [
            { name: "平衡方程", formula: "所有x方向力的和 = 0, 所有y方向力的和 = 0, 所有力矩的和 = 0", symbols: "三独立即可求未知反力" }
          ]
        }
      ],
      symbols: [
        { symbol: "FR", name: "合力", unit: "N", desc: "所有外力的矢量和" },
        { symbol: "MO", name: "关于O的合矩", unit: "N·m", desc: "所有力对铰点的力矩之和" },
        { symbol: "ROx, ROy", name: "铰链反力分量", unit: "N", desc: "支撑提供的约束反力" },
        { symbol: "Fi", name: "各分力", unit: "N", desc: "作用于门板的外力" }
      ]
    },
    "rigid-fixed-rotation": {
      title: "刚体定轴转动 · 概念关系与公式",
      relations: [
        {
          concepts: ["角位移 θ(t)", "角速度 ω(t)", "角加速度 α(t)"],
          relation: "刚体绕定轴转动时，角位移 θ(t)、角速度 ω(t) 和角加速度 α(t) 互为一阶、二阶导数关系：ω(t) 是角位移对时间的导数，α(t) 是角速度对时间的导数。它们分别对应平动中的位移、速度和加速度。",
          formulas: [
            { name: "角速度定义", formula: "ω = 角位移对时间的导数", symbols: "ω: 角速度 (rad/s), θ: 角位移 (rad)" },
            { name: "角加速度定义", formula: "α = 角速度对时间的导数", symbols: "α: 角加速度 (rad/s²)" }
          ]
        },
        {
          concepts: ["匀角加速度转动", "时间积分关系"],
          relation: "若角加速度 α 为常数，则角速度和角位移可通过时间积分得到：ω(t) = ω₀ + αt，θ(t) = θ₀ + ω₀t + 0.5αt²。本模型通过自动改变盘上的标记位置，把这三条时间曲线直观展现出来。",
          formulas: [
            { name: "角速度-时间关系", formula: "ω(t) = ω₀ + αt", symbols: "ω₀: 初始角速度" },
            { name: "角位移-时间关系", formula: "θ(t) = θ₀ + ω₀t + 0.5αt²", symbols: "θ₀: 初始角位移" }
          ]
        }
      ],
      symbols: [
        { symbol: "θ", name: "角位移", unit: "rad", desc: "刚体相对于参考位置的转角" },
        { symbol: "ω", name: "角速度", unit: "rad/s", desc: "单位时间内转角的变化率" },
        { symbol: "α", name: "角加速度", unit: "rad/s²", desc: "单位时间内角速度的变化率" }
      ]
    },
    "composite-point-motion": {
      title: "点的合成运动 · 概念关系与公式",
      relations: [
        {
          concepts: ["牵连运动", "相对运动", "合成速度"],
          relation: "若选定一个随时间运动的参考系（例如随平台平移的动系），质点在绝对系中的速度 v 可分解为“随参考系一起运动的部分” v牵 和“相对于参考系的部分” v相，两者矢量相加给出合成速度：v = v牵 + v相。",
          formulas: [
            { name: "速度合成公式", formula: "v = v牵 + v相", symbols: "v: 合成速度（矢量）, v牵: 牵连速度, v相: 相对速度" }
          ]
        },
        {
          concepts: ["速度三角形", "参考系变换"],
          relation: "在图形上，v牵 与 v相 两个矢量首尾相接就构成“速度三角形”，其对角线就是合成速度 v。改变平台速度或相对运动速度，会改变三角形的形状，但始终满足向量相加关系。",
          formulas: [
            { name: "模的关系", formula: "v^2 = v_{牵}^2 + v_{相}^2 + 2 v_{牵} v_{相} cosφ", symbols: "φ 为 v牵 与 v相 的夹角" }
          ]
        }
      ],
      symbols: [
        { symbol: "v", name: "合成速度", unit: "m/s", desc: "质点在绝对参考系下的速度" },
        { symbol: "v牵", name: "牵连速度", unit: "m/s", desc: "质点由于参考系整体运动而产生的速度" },
        { symbol: "v相", name: "相对速度", unit: "m/s", desc: "质点相对于动系的速度" },
        { symbol: "φ", name: "速度夹角", unit: "rad/°", desc: "牵连速度与相对速度之间的夹角" }
      ]
    },
    "particle-newton-2d": {
      title: "质点动力学基本方程 · F = m a",
      relations: [
        {
          concepts: ["牛顿第二定律", "质点平动", "惯性系"],
          relation: "在惯性参考系中，质点的动力学基本方程为 F = m a，其中 F 是作用在质点上的合外力（矢量），m 为质点质量，a 为质点在该参考系中的加速度（矢量）。",
          formulas: [
            { name: "牛顿第二定律", formula: "F = m a", symbols: "F: 合外力（矢量）, m: 质量, a: 加速度（矢量）" }
          ]
        },
        {
          concepts: ["分量形式", "时间积分关系"],
          relation: "若只考虑沿 x 轴的平动，则有 Fx = m ax（Fx 是 x 方向的合外力）。已知 ax(t) 后，速度等于初速度加上加速度的积分，位移等于初位置加上速度的积分：vx(t) = v0x + 对ax积分，x(t) = x0 + 对vx积分。",
          formulas: [
            { name: "x 方向分量方程", formula: "F_x = m a_x", symbols: "F_x: x 方向合外力, a_x: x 方向加速度" },
            { name: "速度-时间关系", formula: "v_x(t) = v_{0x} + 对a_x(t)积分", symbols: "v_{0x}: 初速度" },
            { name: "位移-时间关系", formula: "x(t) = x_0 + 对v_x(t)积分", symbols: "x_0: 初始位置" }
          ]
        }
      ],
      symbols: [
        { symbol: "m", name: "质点质量", unit: "kg", desc: "描述质点惯性大小的标量" },
        { symbol: "F", name: "合外力", unit: "N", desc: "作用在质点上的所有外力的矢量和" },
        { symbol: "a", name: "加速度", unit: "m/s²", desc: "速度对时间的一阶导数，反映运动状态变化" },
        { symbol: "v", name: "速度", unit: "m/s", desc: "位移对时间的一阶导数" },
        { symbol: "x", name: "位移", unit: "m", desc: "质点相对于参考位置的坐标" }
      ]
    },
    "impulse-momentum": {
      title: "动量定理 · 冲量与动量的连接",
      relations: [
        {
          concepts: ["冲量", "动量", "动量定理"],
          relation: "冲量 J = ∫F(t) dt 是力-时间曲线下的面积，动量 p = m·v 是运动状态的度量。动量定理表明：质点动量的增量 Δp 等于外力的冲量 J。",
          formulas: [
            { name: "冲量定义", formula: "J = ∫F(t) dt", symbols: "J: 冲量 (N·s), F(t): 力-时间函数" },
            { name: "动量定理", formula: "Δp = J", symbols: "p = m·v, Δp: 动量增量" }
          ]
        },
        {
          concepts: ["半正弦脉冲", "速度跳变"],
          relation: "对于半正弦脉冲 F(t) = F₀ sin(πt/T), 0 < t < T，其冲量 J = 2F₀T/π。冲量作用结束时速度增量 Δv = J/m，与力峰值无关、只与冲量总量相关。",
          formulas: [
            { name: "半正弦脉冲的冲量", formula: "J = 2F₀T/π", symbols: "F₀: 脉冲峰值, T: 脉冲宽度" },
            { name: "速度增量", formula: "Δv = J/m", symbols: "m: 质量" }
          ]
        },
        {
          concepts: ["力峰值与作用时间", "冲击等效"],
          relation: "若两个不同的力时程拥有相同的冲量，它们对动量的影响等效：短时大力与较长时间中等力只要面积相同，Δp 就相同。若存在阻尼或外力抵消，动量会在后续逐渐衰减。",
          formulas: [
            { name: "等效冲量", formula: "F₁·Δt₁ ≈ F₂·Δt₂ (冲量相等则动量变化相同)", symbols: "通过比较力-时间面积判断等效" }
          ]
        }
      ],
      symbols: [
        { symbol: "m", name: "质量", unit: "kg", desc: "质点的惯性参数" },
        { symbol: "F(t)", name: "外力随时间变化", unit: "N", desc: "作用在质点上的力随时间的函数" },
        { symbol: "F₀", name: "脉冲峰值", unit: "N", desc: "半正弦脉冲的最大力" },
        { symbol: "T", name: "脉冲宽度", unit: "s", desc: "力作用的时间长度" },
        { symbol: "J", name: "冲量", unit: "N·s", desc: "力-时间面积，决定动量增量" },
        { symbol: "p", name: "动量", unit: "kg·m/s", desc: "运动状态的度量，p = m·v" },
        { symbol: "Δv", name: "速度增量", unit: "m/s", desc: "冲量作用后速度的变化" }
      ]
    },
    "point-kinematics-curve": {
      title: "质点曲线运动 · v 与 a 的几何关系",
      relations: [
        {
          concepts: ["曲线运动", "速度", "切向加速度"],
          relation: "质点沿平面曲线运动时，速度矢量始终沿轨迹切线方向，大小为 v = 弧长对时间的导数；若速度大小随时间变化，则沿切线方向存在切向加速度 aₜ = 速度对时间的导数。",
          formulas: [
            { name: "速度定义", formula: "v = 弧长对时间的导数", symbols: "s 为沿曲线的弧长坐标" },
            { name: "切向加速度", formula: "aₜ = 速度对时间的导数", symbols: "aₜ 与速度同线，描述“快慢”变化" }
          ]
        },
        {
          concepts: ["曲率半径", "法向加速度"],
          relation: "由于质点运动方向不断改变，速度方向的变化需要一个指向曲率圆圆心的法向加速度 aₙ，其大小与速度平方成正比、与曲率半径成反比：aₙ = v²/R。",
          formulas: [
            { name: "法向加速度", formula: "aₙ = v²/R", symbols: "R 为当前点处曲率半径" }
          ]
        }
      ],
      symbols: [
        { symbol: "v", name: "质点速度大小", unit: "m/s", desc: "沿曲线切线方向的速度" },
        { symbol: "aₜ", name: "切向加速度", unit: "m/s²", desc: "描述速度大小变化的加速度分量" },
        { symbol: "aₙ", name: "法向加速度", unit: "m/s²", desc: "指向曲率中心，描述转弯剧烈程度" },
        { symbol: "R", name: "曲率半径", unit: "m", desc: "当前点处等效圆轨迹的半径" }
      ]
    },
    "axial-bar": {
      title: "拉压杆 · 概念关系与公式",
      relations: [
        {
          concepts: ["轴力", "正应力", "正应变", "胡克定律", "变形"],
          relation: "拉压杆受轴向力P作用，产生轴力N = P，正应力σ = N/A，正应变ε = σ/E（胡克定律），轴向变形ΔL = NL/(EA)。",
          formulas: [
            { name: "轴力", formula: "N = P", symbols: "N: 轴力 (N), P: 轴向荷载 (N)" },
            { name: "正应力", formula: "σ = N/A", symbols: "σ: 正应力 (Pa), A: 横截面积 (m²)" },
            { name: "正应变", formula: "ε = σ/E = N/(EA)", symbols: "ε: 正应变, E: 弹性模量 (Pa)" },
            { name: "轴向变形", formula: "ΔL = NL/(EA)", symbols: "ΔL: 轴向变形 (m), L: 杆长 (m)" }
          ]
        }
      ],
      symbols: [
        { symbol: "P", name: "轴向力", unit: "N", desc: "作用在杆端的轴向荷载" },
        { symbol: "N", name: "轴力", unit: "N", desc: "杆内任意截面的轴力" },
        { symbol: "σ", name: "正应力", unit: "Pa 或 MPa", desc: "单位面积上的正应力" },
        { symbol: "ε", name: "正应变", unit: "—", desc: "单位长度的变形量" },
        { symbol: "E", name: "弹性模量", unit: "Pa", desc: "材料的弹性模量" },
        { symbol: "A", name: "横截面积", unit: "m²", desc: "杆的横截面积" },
        { symbol: "ΔL", name: "轴向变形", unit: "m", desc: "杆的轴向伸长或缩短" }
      ]
    },
    "rotating-collision": {
      title: "转动碰撞 · 概念关系与公式",
      relations: [
        {
          concepts: ["转动碰撞", "角动量守恒", "转动惯量", "恢复系数"],
          relation: "转动刚体碰撞时，角动量守恒：I₁ω₁ + I₂ω₂ = I₁ω₁' + I₂ω₂'。恢复系数e = (ω₂' - ω₁')/(ω₁ - ω₂)描述碰撞的弹性程度。当e=1时为完全弹性碰撞，e=0时为完全非弹性碰撞。",
          formulas: [
            { name: "角动量守恒", formula: "I₁ω₁ + I₂ω₂ = I₁ω₁' + I₂ω₂'", symbols: "I: 转动惯量 (kg·m²), ω: 角速度 (rad/s), 碰撞前后角动量守恒" },
            { name: "恢复系数", formula: "e = (ω₂' - ω₁')/(ω₁ - ω₂)", symbols: "e: 恢复系数 (0≤e≤1), 描述碰撞的弹性程度" },
            { name: "转动惯量", formula: "I = Σmr²", symbols: "I: 转动惯量, m: 质量, r: 到转轴的距离" }
          ]
        },
        {
          concepts: ["碰撞冲量", "角动量变化", "力矩"],
          relation: "碰撞时，碰撞冲量对转轴产生的力矩冲量等于角动量的变化：M·Δt = ΔL = I(ω' - ω)。碰撞冲量越大，角动量变化越大。",
          formulas: [
            { name: "角动量变化", formula: "ΔL = I(ω' - ω)", symbols: "ΔL: 角动量变化, I: 转动惯量, ω: 角速度" },
            { name: "力矩冲量", formula: "M·Δt = ΔL", symbols: "M: 力矩, Δt: 碰撞时间, 等于角动量变化" }
          ]
        }
      ],
      symbols: [
        { symbol: "I", name: "转动惯量", unit: "kg·m²", desc: "刚体绕转轴转动的惯性量度" },
        { symbol: "ω", name: "角速度", unit: "rad/s", desc: "刚体转动的角速度" },
        { symbol: "L", name: "角动量", unit: "kg·m²/s", desc: "L = Iω, 转动刚体的角动量" },
        { symbol: "e", name: "恢复系数", unit: "—", desc: "0≤e≤1, 描述碰撞的弹性程度" },
        { symbol: "M", name: "力矩", unit: "N·m", desc: "碰撞时产生的力矩" },
        { symbol: "Δt", name: "碰撞时间", unit: "s", desc: "碰撞持续的时间" }
      ]
    },
    "oblique-collision": {
      title: "斜碰撞 · 概念关系与公式",
      relations: [
        {
          concepts: ["斜碰撞", "动量分解", "切向/法向", "恢复系数"],
          relation: "斜碰撞时，将动量分解为切向和法向分量。法向分量决定碰撞的恢复系数e = (v₂n' - v₁n')/(v₁n - v₂n)，切向分量可能受摩擦力影响。动量在法向和切向分别守恒。",
          formulas: [
            { name: "恢复系数", formula: "e = (v₂n' - v₁n')/(v₁n - v₂n)", symbols: "e: 恢复系数, vn: 法向速度分量, 下标n表示法向" },
            { name: "法向动量守恒", formula: "m₁v₁n + m₂v₂n = m₁v₁n' + m₂v₂n'", symbols: "法向动量在碰撞前后守恒" },
            { name: "切向动量", formula: "切向动量可能受摩擦力影响", symbols: "如果无摩擦，切向动量也守恒；有摩擦时，切向动量会变化" }
          ]
        },
        {
          concepts: ["碰撞分析", "速度分解", "动量守恒"],
          relation: "斜碰撞分析的关键是将速度分解为切向和法向分量。法向分量垂直于碰撞面，决定碰撞的恢复系数；切向分量平行于碰撞面，可能受摩擦力影响。通过分别分析法向和切向的动量守恒，可以求解碰撞后的速度。",
          formulas: [
            { name: "速度分解", formula: "v = vn + vt", symbols: "v: 总速度, vn: 法向分量, vt: 切向分量" },
            { name: "法向速度", formula: "vn = v·n", symbols: "n: 碰撞面法向单位矢量" },
            { name: "切向速度", formula: "vt = v - vn", symbols: "切向速度 = 总速度 - 法向速度" }
          ]
        }
      ],
      symbols: [
        { symbol: "v", name: "速度", unit: "m/s", desc: "质点的速度矢量" },
        { symbol: "vn", name: "法向速度", unit: "m/s", desc: "速度在碰撞面法向的分量" },
        { symbol: "vt", name: "切向速度", unit: "m/s", desc: "速度在碰撞面切向的分量" },
        { symbol: "e", name: "恢复系数", unit: "—", desc: "0≤e≤1, 由法向速度分量决定" },
        { symbol: "m", name: "质量", unit: "kg", desc: "质点的质量" },
        { symbol: "p", name: "动量", unit: "kg·m/s", desc: "p = mv, 质点的动量" }
      ]
    },
    "simple-harmonic-oscillator": {
      title: "简谐振动 · 概念关系与公式",
      relations: [
        {
          concepts: ["简谐振动", "固有频率", "弹簧振子", "周期"],
          relation: "简谐振动是最基本的振动形式，位移 x(t) = A·cos(ωt + φ)，其中ω = √(k/m)是固有频率，T = 2π/ω是周期。简谐振动的特点是加速度与位移成正比且方向相反。",
          formulas: [
            { name: "位移", formula: "x(t) = A·cos(ωt + φ)", symbols: "A: 振幅, ω: 角频率, φ: 初相位" },
            { name: "固有频率", formula: "ω = √(k/m)", symbols: "k: 弹簧常数, m: 质量" },
            { name: "周期", formula: "T = 2π/ω = 2π√(m/k)", symbols: "T: 振动周期" },
            { name: "速度", formula: "v(t) = -Aω·sin(ωt + φ)", symbols: "速度的相位比位移超前π/2" },
            { name: "加速度", formula: "a(t) = -Aω²·cos(ωt + φ) = -ω²x", symbols: "加速度与位移成正比，方向相反" }
          ]
        }
      ],
      symbols: [
        { symbol: "m", name: "质量", unit: "kg", desc: "振子的质量" },
        { symbol: "k", name: "弹簧常数", unit: "N/m", desc: "弹簧的劲度系数" },
        { symbol: "ω", name: "固有频率", unit: "rad/s", desc: "ω = √(k/m)" },
        { symbol: "A", name: "振幅", unit: "m", desc: "振动的最大位移" },
        { symbol: "T", name: "周期", unit: "s", desc: "完成一次振动的时间" }
      ]
    },
    "damped-vibration": {
      title: "阻尼振动 · 概念关系与公式",
      relations: [
        {
          concepts: ["阻尼振动", "阻尼比", "衰减", "临界阻尼"],
          relation: "阻尼振动中，位移 x(t) = A·e^(-ζω₀t)·cos(ωdt + φ)，其中ζ是阻尼比，ωd = ω₀√(1-ζ²)是阻尼固有频率。当ζ<1时为欠阻尼（衰减振动），ζ=1时为临界阻尼，ζ>1时为过阻尼。",
          formulas: [
            { name: "阻尼比", formula: "ζ = c/(2√(mk))", symbols: "c: 阻尼系数, m: 质量, k: 弹簧常数" },
            { name: "阻尼固有频率", formula: "ωd = ω₀√(1-ζ²)", symbols: "ω₀: 无阻尼固有频率" },
            { name: "欠阻尼位移", formula: "x(t) = A·e^(-ζω₀t)·cos(ωdt + φ)", symbols: "ζ<1时的振动表达式" },
            { name: "临界阻尼", formula: "ζ = 1", symbols: "临界阻尼时系统最快回到平衡位置" }
          ]
        }
      ],
      symbols: [
        { symbol: "c", name: "阻尼系数", unit: "N·s/m", desc: "阻尼力与速度的比值" },
        { symbol: "ζ", name: "阻尼比", unit: "—", desc: "ζ = c/(2√(mk))" },
        { symbol: "ωd", name: "阻尼固有频率", unit: "rad/s", desc: "ωd = ω₀√(1-ζ²)" }
      ]
    },
    "forced-vibration": {
      title: "受迫振动 · 概念关系与公式",
      relations: [
        {
          concepts: ["受迫振动", "共振", "振幅响应", "频率比"],
          relation: "受迫振动中，系统在激振力F(t) = F₀cos(ωt)作用下振动。振幅A(ω) = F₀/(m√((ω₀²-ω²)²+(2ζω₀ω)²))，当ω = ω₀时发生共振，振幅最大。",
          formulas: [
            { name: "振幅响应", formula: "A(ω) = F₀/(m√((ω₀²-ω²)²+(2ζω₀ω)²))", symbols: "A: 振幅, F₀: 激振力幅值, ω: 激振频率" },
            { name: "共振频率", formula: "ω = ω₀", symbols: "当激振频率等于固有频率时发生共振" },
            { name: "频率比", formula: "r = ω/ω₀", symbols: "r: 频率比" },
            { name: "相位", formula: "φ = arctan(2ζω₀ω/(ω₀²-ω²))", symbols: "响应与激振力的相位差" }
          ]
        }
      ],
      symbols: [
        { symbol: "F₀", name: "激振力幅值", unit: "N", desc: "激振力的最大值" },
        { symbol: "ω", name: "激振频率", unit: "rad/s", desc: "激振力的角频率" },
        { symbol: "r", name: "频率比", unit: "—", desc: "r = ω/ω₀" }
      ]
    },
    "gyroscope-precession": {
      title: "陀螺进动 · 概念关系与公式",
      relations: [
        {
          concepts: ["陀螺进动", "角动量", "力矩", "进动角速度"],
          relation: "当力矩M垂直于角动量L时，产生进动。进动角速度Ω = M/L，进动方向使得角动量L的端点沿力矩M的方向运动。",
          formulas: [
            { name: "进动角速度", formula: "Ω = M/L", symbols: "M: 重力矩, L: 角动量" },
            { name: "角动量", formula: "L = Iω", symbols: "I: 转动惯量, ω: 自转角速度" },
            { name: "力矩", formula: "M = r × mg", symbols: "r: 质心到支点的矢量, mg: 重力" }
          ]
        }
      ],
      symbols: [
        { symbol: "I", name: "转动惯量", unit: "kg·m²", desc: "刚体绕转轴的转动惯量" },
        { symbol: "Ω", name: "进动角速度", unit: "rad/s", desc: "进动的角速度" },
        { symbol: "M", name: "重力矩", unit: "N·m", desc: "重力产生的力矩" }
      ]
    },
    "euler-angles": {
      title: "欧拉角 · 概念关系与公式",
      relations: [
        {
          concepts: ["欧拉角", "进动角", "章动角", "自转角"],
          relation: "欧拉角(φ, θ, ψ)通过三次旋转确定刚体在空间中的姿态：先绕Z轴转φ（进动），再绕新X轴转θ（章动），最后绕新Z轴转ψ（自转）。",
          formulas: [
            { name: "欧拉角", formula: "(φ, θ, ψ)", symbols: "φ: 进动角, θ: 章动角, ψ: 自转角" },
            { name: "角速度分量", formula: "ωx = φ̇sinθsinψ + θ̇cosψ, ωy = φ̇sinθcosψ - θ̇sinψ, ωz = φ̇cosθ + ψ̇", symbols: "体坐标系中的角速度分量" }
          ]
        }
      ],
      symbols: [
        { symbol: "φ", name: "进动角", unit: "rad", desc: "绕固定Z轴的旋转角" },
        { symbol: "θ", name: "章动角", unit: "rad", desc: "绕中间X轴的旋转角" },
        { symbol: "ψ", name: "自转角", unit: "rad", desc: "绕体Z轴的旋转角" }
      ]
    },
    "rocket-motion": {
      title: "火箭运动 · 概念关系与公式",
      relations: [
        {
          concepts: ["火箭方程", "变质量", "推力", "质量流"],
          relation: "火箭运动是典型的变质量系统。火箭方程 m·dv/dt = -u·dm/dt，其中u是喷流相对速度。推力F = u·ṁ，速度v = u·ln(m₀/m)。",
          formulas: [
            { name: "火箭方程", formula: "m·dv/dt = -u·dm/dt", symbols: "m: 当前质量, u: 喷流速度, ṁ: 质量流率" },
            { name: "速度", formula: "v = u·ln(m₀/m)", symbols: "m₀: 初始质量, m: 当前质量" },
            { name: "推力", formula: "F = u·ṁ", symbols: "F: 推力, ṁ: 质量流率" }
          ]
        }
      ],
      symbols: [
        { symbol: "m₀", name: "初始质量", unit: "kg", desc: "火箭的初始总质量" },
        { symbol: "u", name: "喷流速度", unit: "m/s", desc: "喷流相对火箭的速度" },
        { symbol: "ṁ", name: "质量流率", unit: "kg/s", desc: "单位时间喷出的质量" }
      ]
    },
    "variable-mass-system": {
      title: "变质量系统 · 概念关系与公式",
      relations: [
        {
          concepts: ["变质量系统", "附加力", "质量流", "动量定理"],
          relation: "变质量系统的动力学方程 F = m·dv/dt + (v - u)·dm/dt，其中(v - u)·dm/dt是附加力。当质量流入时，附加力与相对速度方向相同；流出时相反。",
          formulas: [
            { name: "变质量方程", formula: "F = m·dv/dt + (v - u)·dm/dt", symbols: "F: 外力, v: 系统速度, u: 质量流相对速度" },
            { name: "附加力", formula: "F附加 = (v - u)·ṁ", symbols: "质量流产生的附加力" }
          ]
        }
      ],
      symbols: [
        { symbol: "ṁ", name: "质量流率", unit: "kg/s", desc: "单位时间流入或流出的质量" },
        { symbol: "u", name: "相对速度", unit: "m/s", desc: "质量流相对系统的速度" },
        { symbol: "F附加", name: "附加力", unit: "N", desc: "质量流产生的附加力" }
      ]
    }
  };

// 更新概念关系、公式与符号说明
function updateConceptRelations(modelId, conceptIds) {
  const relationsBody = document.getElementById("concept-relations-body");
  if (!relationsBody) return;

  const data = relationsData[modelId];
  if (!data) {
    relationsBody.innerHTML = '<div class="relations-placeholder">该模型的概念关系说明正在完善中...</div>';
    return;
  }

  let html = `<div class="relations-title">${data.title}</div>`;
  
  data.relations.forEach(rel => {
    html += `<div class="relation-item">`;
    
    // 改进概念关系的可视化：用流程图样式展示
    if (rel.concepts && rel.concepts.length > 1) {
      html += `<div class="relation-concepts-flow">`;
      rel.concepts.forEach((concept, i) => {
        html += `<span class="concept-badge">${concept}</span>`;
        if (i < rel.concepts.length - 1) {
          html += `<span class="flow-arrow">→</span>`;
        }
      });
      html += `</div>`;
    } else {
    html += `<div class="relation-concepts">涉及概念：${rel.concepts.join(" → ")}</div>`;
    }
    
    html += `<div class="relation-desc">${rel.relation}</div>`;
    html += `<div class="relation-formulas">`;
    rel.formulas.forEach(f => {
      html += `<div class="formula-item">`;
      html += `<div class="formula-name">${f.name}：</div>`;
      html += `<div class="formula-expr">${f.formula}</div>`;
      html += `<div class="formula-symbols">${f.symbols}</div>`;
      html += `</div>`;
    });
    html += `</div></div>`;
  });

  html += `<div class="symbols-section">`;
  html += `<div class="symbols-title">物理符号说明：</div>`;
  html += `<div class="symbols-list">`;
  data.symbols.forEach(s => {
    html += `<div class="symbol-item">`;
    html += `<span class="symbol-name">${s.symbol}</span>：${s.name} (${s.unit}) — ${s.desc}`;
    html += `</div>`;
  });
  html += `</div></div>`;

  relationsBody.innerHTML = html;
}

// 一键总结功能：直观展示当前模型的所有信息
function updateSummary(modelId, conceptIds) {
  const summaryBody = document.getElementById("summary-body");
  if (!summaryBody) return;

  // 获取模型详细信息
  const detailInfo = detailMap[modelId];
  const relationsInfo = relationsData[modelId];
  
  if (!detailInfo && !relationsInfo) {
    summaryBody.innerHTML = '<div class="summary-placeholder">该模型暂无总结信息。</div>';
    return;
  }

  let html = '';

  // ========== 模型标题卡片 ==========
  if (detailInfo) {
    html += `<div class="summary-header-card">`;
    html += `<div class="summary-header-title">${detailInfo.title || '模型总结'}</div>`;
    if (detailInfo.body) {
      html += `<div class="summary-header-desc">${detailInfo.body}</div>`;
    }
    html += `</div>`;
  }

  // ========== 核心概念卡片 ==========
  if (conceptIds && conceptIds.length > 0) {
    html += `<div class="summary-card">`;
    html += `<div class="summary-card-header">`;
    html += `<span class="summary-card-icon">📚</span>`;
    html += `<span class="summary-card-title">核心概念</span>`;
    html += `<span class="summary-card-count">${conceptIds.length}个</span>`;
    html += `</div>`;
    html += `<div class="summary-card-content">`;
    html += `<div class="summary-concepts-grid">`;
    conceptIds.forEach(conceptId => {
      const conceptCard = document.querySelector(`.concept-card[data-concept-id="${conceptId}"]`);
      const conceptName = conceptCard ? conceptCard.querySelector('h3')?.textContent || conceptId : conceptId;
      html += `<div class="summary-concept-card">${conceptName}</div>`;
    });
    html += `</div>`;
    html += `</div>`;
    html += `</div>`;
  }

  // ========== 概念使用顺序卡片 ==========
  if (detailInfo && detailInfo.concepts && detailInfo.concepts.length > 0) {
    html += `<div class="summary-card">`;
    html += `<div class="summary-card-header">`;
    html += `<span class="summary-card-icon">🔢</span>`;
    html += `<span class="summary-card-title">概念使用顺序</span>`;
    html += `</div>`;
    html += `<div class="summary-card-content">`;
    html += `<div class="summary-steps-list">`;
    detailInfo.concepts.forEach((concept, index) => {
      html += `<div class="summary-step-item">`;
      html += `<div class="summary-step-number">${index + 1}</div>`;
      html += `<div class="summary-step-text">${concept}</div>`;
      html += `</div>`;
    });
    html += `</div>`;
    html += `</div>`;
    html += `</div>`;
  }

  // ========== 所有公式卡片 ==========
  if (relationsInfo && relationsInfo.relations) {
    // 收集所有公式
    const allFormulas = [];
    relationsInfo.relations.forEach(rel => {
      if (rel.formulas && rel.formulas.length > 0) {
        rel.formulas.forEach(f => {
          allFormulas.push(f);
        });
      }
    });

    if (allFormulas.length > 0) {
      html += `<div class="summary-card">`;
      html += `<div class="summary-card-header">`;
      html += `<span class="summary-card-icon">📐</span>`;
      html += `<span class="summary-card-title">核心公式</span>`;
      html += `<span class="summary-card-count">${allFormulas.length}个</span>`;
      html += `</div>`;
      html += `<div class="summary-card-content">`;
      html += `<div class="summary-formulas-grid">`;
      allFormulas.forEach((f, index) => {
        html += `<div class="summary-formula-card">`;
        html += `<div class="summary-formula-card-header">`;
        html += `<span class="summary-formula-index">${index + 1}</span>`;
        html += `<span class="summary-formula-card-name">${f.name}</span>`;
        html += `</div>`;
        html += `<div class="summary-formula-card-expr">${f.formula}</div>`;
        if (f.symbols) {
          html += `<div class="summary-formula-card-symbols">${f.symbols}</div>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
      html += `</div>`;
      html += `</div>`;
    }
  }

  // ========== 概念关系流程图 ==========
  if (relationsInfo && relationsInfo.relations) {
    html += `<div class="summary-card">`;
    html += `<div class="summary-card-header">`;
    html += `<span class="summary-card-icon">🔗</span>`;
    html += `<span class="summary-card-title">概念关系</span>`;
    html += `</div>`;
    html += `<div class="summary-card-content">`;
    relationsInfo.relations.forEach((rel, relIndex) => {
      html += `<div class="summary-relation-block">`;
      
      // 关系描述
      if (rel.relation) {
        html += `<div class="summary-relation-desc">${rel.relation}</div>`;
      }
      
      // 概念流程图
      if (rel.concepts && rel.concepts.length > 0) {
        html += `<div class="summary-relation-flow">`;
        rel.concepts.forEach((concept, i) => {
          html += `<div class="summary-relation-node">${concept}</div>`;
          if (i < rel.concepts.length - 1) {
            html += `<div class="summary-relation-arrow">→</div>`;
          }
        });
        html += `</div>`;
      }
      
      html += `</div>`;
    });
    html += `</div>`;
    html += `</div>`;
  }

  // ========== 物理符号表 ==========
  if (relationsInfo && relationsInfo.symbols && relationsInfo.symbols.length > 0) {
    html += `<div class="summary-card">`;
    html += `<div class="summary-card-header">`;
    html += `<span class="summary-card-icon">🔣</span>`;
    html += `<span class="summary-card-title">物理符号表</span>`;
    html += `<span class="summary-card-count">${relationsInfo.symbols.length}个</span>`;
    html += `</div>`;
    html += `<div class="summary-card-content">`;
    html += `<div class="summary-symbols-table">`;
    html += `<div class="summary-symbols-table-header">`;
    html += `<div class="summary-symbols-table-col">符号</div>`;
    html += `<div class="summary-symbols-table-col">名称</div>`;
    html += `<div class="summary-symbols-table-col">单位</div>`;
    html += `<div class="summary-symbols-table-col">说明</div>`;
    html += `</div>`;
    relationsInfo.symbols.forEach(s => {
      html += `<div class="summary-symbols-table-row">`;
      html += `<div class="summary-symbols-table-col summary-symbol-code">${s.symbol}</div>`;
      html += `<div class="summary-symbols-table-col">${s.name}</div>`;
      html += `<div class="summary-symbols-table-col summary-symbol-unit">${s.unit}</div>`;
      html += `<div class="summary-symbols-table-col summary-symbol-desc">${s.desc}</div>`;
      html += `</div>`;
    });
    html += `</div>`;
    html += `</div>`;
    html += `</div>`;
  }

  summaryBody.innerHTML = html;
}

// 一键总结按钮展开/折叠
document.addEventListener("DOMContentLoaded", () => {
  const summaryBtn = document.getElementById("btn-toggle-summary");
  const summaryBody = document.getElementById("summary-body");
  if (summaryBtn && summaryBody) {
    summaryBtn.addEventListener("click", () => {
      const isHidden = summaryBody.style.display === "none";
      summaryBody.style.display = isHidden ? "block" : "none";
      summaryBtn.textContent = isHidden ? "收起总结" : "展开总结";
      
      if (isHidden) {
        // 展开时滚动到总结区域
        setTimeout(() => {
          summaryBody.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
      }
    });
  }
});

// 学科按钮驱动右侧模型库（三套独立列表的过滤）
function initSubjectModelSwitching() {
  if (!subjectButtons || !subjectButtons.length) return;
  
  // 章节信息配置
  const chapterConfig = {
    "tl-ch1": { name: "第1章 静力学公理与受力分析", subject: "tl" },
    "tl-ch2": { name: "第2章 平面力系", subject: "tl" },
    "tl-ch3": { name: "第3章 空间力系", subject: "tl" },
    "tl-ch4": { name: "第4章 摩擦", subject: "tl" },
    "tl-ch5": { name: "第5章 点的运动学", subject: "tl" },
    "tl-ch6": { name: "第6章 刚体的简单运动", subject: "tl" },
    "tl-ch7": { name: "第7章 点的合成运动", subject: "tl" },
    "tl-ch8": { name: "第8章 刚体的平面运动", subject: "tl" },
    "tl-ch9": { name: "第9章 质点动力学基本方程", subject: "tl" },
    "tl-ch10": { name: "第10章 动量定理", subject: "tl" },
    "tl-ch11": { name: "第11章 动量矩定理", subject: "tl" },
    "tl-ch12": { name: "第12章 动能定理", subject: "tl" },
    "tl-ch13": { name: "第13章 达朗贝尔原理", subject: "tl" },
    "tl-ch14": { name: "第14章 虚位移原理", subject: "tl" },
    "tl-ch15": { name: "分析力学基础", subject: "tl" },
    "tl-ch16": { name: "非惯性系中的质点动力学", subject: "tl" },
    "tl-ch17": { name: "碰撞", subject: "tl" },
    "tl-ch18": { name: "机械振动基础", subject: "tl" },
    "tl-ch19": { name: "刚体定点/自由运动与陀螺理论", subject: "tl" },
    "tl-ch20": { name: "变质量动力学", subject: "tl" },
    "jl-ch1": { name: "第一章：静定结构", subject: "jl" },
    "jl-ch2": { name: "第二章：桁架与刚架", subject: "jl" },
    "jl-ch3": { name: "第三章：超静定结构与影响线", subject: "jl" },
    "cl-ch1": { name: "第一章：拉压与扭转", subject: "cl" },
    "cl-ch2": { name: "第二章：弯曲与剪切", subject: "cl" },
    "cl-ch3": { name: "第三章：组合应力与强度理论", subject: "cl" },
    "cl-ch4": { name: "第四章：能量法与温度应力", subject: "cl" },
  };
  
  // 初始化章节选择器
  const chapterSelector = document.getElementById("chapter-selector");
  const chapterSelectorButtons = document.getElementById("chapter-selector-buttons");
  const chapterSelectorBody = document.getElementById("chapter-selector-body");
  const chapterSelectorHint = document.getElementById("chapter-selector-hint");
  const chapterSelectorToggle = document.getElementById("chapter-selector-toggle");
  const chapterSelectorHeader = document.querySelector(".chapter-selector-header");
  const selectedChapters = new Set();
  let currentSubject = null;

  const setChapterSelectorCollapsed = (collapsed) => {
    if (!chapterSelector) return;
    chapterSelector.classList.toggle("collapsed", collapsed);
    if (chapterSelectorBody) {
      chapterSelectorBody.style.display = collapsed ? "none" : "";
    }
    if (chapterSelectorToggle) {
      chapterSelectorToggle.textContent = collapsed ? "展开" : "收起";
      chapterSelectorToggle.setAttribute("aria-expanded", String(!collapsed));
    }
  };

  const updateChapterHint = () => {
    if (!chapterSelectorHint) return;
    if (!selectedChapters.size) {
      chapterSelectorHint.textContent = "当前未选择任何章节，点击下方章节按钮开始学习。";
    } else {
      chapterSelectorHint.textContent = `已选择 ${selectedChapters.size} 个章节，可继续多选。`;
    }
  };

  const initChapterSelector = (subject) => {
    if (!chapterSelector || !chapterSelectorButtons) return;
    currentSubject = subject;

    chapterSelectorButtons.innerHTML = "";
    selectedChapters.clear();
    setChapterSelectorCollapsed(false);

    let hasChapter = false;
    Object.entries(chapterConfig).forEach(([chapterId, config]) => {
      if (config.subject === subject) {
        hasChapter = true;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chapter-selector-btn";
        btn.textContent = config.name;
        btn.setAttribute("data-chapter-id", chapterId);
        btn.setAttribute("aria-pressed", "false");
        btn.addEventListener("click", () => {
          const isActive = btn.classList.toggle("active");
          btn.setAttribute("aria-pressed", String(isActive));
          if (isActive) {
            selectedChapters.add(chapterId);
          } else {
            selectedChapters.delete(chapterId);
          }
          updateChapterHint();
          updateChapterVisibility();
        });
        chapterSelectorButtons.appendChild(btn);
      }
    });

    if (!hasChapter) {
      chapterSelector.style.display = "none";
      currentSubject = null;
      return;
    }

    chapterSelector.style.display = "";
    updateChapterHint();
    updateChapterVisibility();
  };

  const updateChapterVisibility = () => {
    if (!chapterSelector || chapterSelector.style.display === "none" || !currentSubject) return;
    const chapterGroups = document.querySelectorAll(".model-chapter-group");
    const hasSelection = selectedChapters.size > 0;
    chapterGroups.forEach((group) => {
      const chapterId = group.getAttribute("data-chapter");
      const subject = group.getAttribute("data-subject");
      if (subject !== currentSubject) {
        group.style.display = "none";
        return;
      }
      if (!hasSelection) {
        group.style.display = "none";
        return;
      }
      group.style.display = selectedChapters.has(chapterId) ? "" : "none";
    });
  };
  
  // 初始化模型过滤按钮事件
  const filterButtons = document.querySelectorAll(".model-filters .tag-btn[data-model-filter]");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("tag-btn-active"));
      btn.classList.add("tag-btn-active");
      const filter = btn.getAttribute("data-model-filter");
      applyModelFilter(filter);
      
      // 更新章节选择器
      if (filter === "all") {
        chapterSelector.style.display = "none";
        currentSubject = null;
        selectedChapters.clear();
        // 显示所有章节
        const chapterGroups = document.querySelectorAll(".model-chapter-group");
        chapterGroups.forEach(group => {
          group.style.display = "";
          group.classList.add("collapsed");
        });
      } else {
        initChapterSelector(filter);
      }
    });
  });
  
  // 初始化章节折叠/展开功能
  const chapterHeaders = document.querySelectorAll(".chapter-header");
  chapterHeaders.forEach((header) => {
    header.addEventListener("click", (e) => {
      e.stopPropagation();
      const group = header.closest(".model-chapter-group");
      if (group) {
        group.classList.toggle("collapsed");
      }
    });
  });
  
  const applyModelFilter = (filter) => {
    // applyModelFilter 现在由章节选择器控制，这里只处理"全部"的情况
    if (filter === "all") {
      setChapterSelectorCollapsed(true);
      const chapterGroups = document.querySelectorAll(".model-chapter-group");
      chapterGroups.forEach((group) => {
        group.style.display = "";
        group.classList.add("collapsed");
      });
    }
  };
  
  const applySubject = (subject) => {
    const chapterGroups = document.querySelectorAll(".model-chapter-group");
    const qmSelect = document.getElementById("question-model");
    const qmOptions = qmSelect ? Array.from(qmSelect.options) : [];
    let firstOfSubject = null;
    let firstModelId = null;

    // 初始化章节选择器（这会自动更新章节可见性）
    initChapterSelector(subject);
    
    // 更新过滤按钮状态
    const activeFilter = document.querySelector(`.model-filters .tag-btn[data-model-filter="${subject}"]`);
    if (activeFilter) {
      filterButtons.forEach((b) => b.classList.remove("tag-btn-active"));
      activeFilter.classList.add("tag-btn-active");
    }
    
    // 过滤参数输入里的模型下拉
    qmOptions.forEach((opt) => {
      const s = opt.getAttribute("data-subject");
      const match = s === subject;
      opt.hidden = !match;
      opt.disabled = !match;
      if (match && !firstModelId) {
        firstModelId = opt.value;
      }
    });

    if (qmSelect && firstModelId) {
      qmSelect.value = firstModelId;
    }

    // 延迟查找第一个可见的模型按钮，确保章节可见性已更新
    requestAnimationFrame(() => {
      chapterGroups.forEach((group) => {
        const isHidden = group.style.display === "none";
        if (!isHidden) {
          const firstItem = group.querySelector(".model-item");
          if (firstItem && !firstOfSubject) {
            firstOfSubject = firstItem;
          }
        }
      });

      // 右侧模型卡片与可视化联动
      if (firstOfSubject) {
        firstOfSubject.click();
      } else if (firstModelId) {
        switchVisualByModel(firstModelId);
      }
    });
  };

  // 章节选择器折叠按钮
  if (chapterSelector && chapterSelectorToggle) {
    const handleToggle = () => {
      const collapsed = chapterSelector.classList.contains("collapsed");
      setChapterSelectorCollapsed(!collapsed);
    };
    chapterSelectorToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      handleToggle();
    });
    if (chapterSelectorHeader) {
      chapterSelectorHeader.addEventListener("click", (e) => {
        if (e.target === chapterSelectorToggle) return;
        handleToggle();
      });
    }
  }

  subjectButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const subject = btn.getAttribute("data-subject");
      subjectButtons.forEach((b) => b.classList.remove("nav-btn-active"));
      btn.classList.add("nav-btn-active");
      applySubject(subject);
    });
  });

  // 初始化时按已激活学科过滤一次（延迟执行，确保DOM完全加载）
  setTimeout(() => {
    const active = document.querySelector(".top-nav .nav-btn[data-subject].nav-btn-active");
    const initialSubject = active?.getAttribute("data-subject") || "tl";
    
    // 先设置过滤按钮状态
    const initialFilterBtn = document.querySelector(`.model-filters .tag-btn[data-model-filter="${initialSubject}"]`);
    if (initialFilterBtn) {
      filterButtons.forEach((b) => b.classList.remove("tag-btn-active"));
      initialFilterBtn.classList.add("tag-btn-active");
    }
    
    // 然后应用学科过滤
    applySubject(initialSubject);
  }, 100);
  
  // 导出applySubject供外部使用
  window.applySubjectFilter = applySubject;
}

// 动画管理：存储每个场景的动画ID，用于停止动画
const sceneAnimationIds = new Map();
const sceneAnimationRunning = new Map();

// 停止所有场景动画
function stopAllSceneAnimations() {
  sceneAnimationIds.forEach((id, sceneId) => {
    if (id) {
      cancelAnimationFrame(id);
      sceneAnimationIds.delete(sceneId);
      sceneAnimationRunning.set(sceneId, false);
    }
  });
}

// 检查场景是否可见
function isSceneVisible(sceneId) {
  const scene = document.querySelector(`.scene-2d[data-scene-id="${sceneId}"]`);
  return scene && scene.classList.contains("scene-2d-active");
}

// 根据选中的模型切换 2D 可视化场景
function switchVisualByModel(modelId) {
  // 停止所有当前运行的动画
  stopAllSceneAnimations();
  
  const scenes = document.querySelectorAll(".scene-2d");
  scenes.forEach((s) => s.classList.remove("scene-2d-active"));

  const modelToSceneMap = {
    "door-lever": "door-lever",
    "constraint-types": "constraint-types",
    "rigid-body-2d": "rigid-body-2d",
    "crank-slider": "crank-slider",
    "three-force-equilibrium": "three-force-equilibrium",
    "force-couple-simplification": "force-couple-simplification",
    "disk-couple": "disk-couple",
    "multi-force-panel": "multi-force-panel",
    "point-kinematics-curve": "point-kinematics-curve",
    "point-kinematics-coordinates": "point-kinematics-coordinates",
    "rigid-fixed-rotation": "rigid-fixed-rotation",
    "rigid-body-translation": "rigid-body-translation",
    "instantaneous-center-velocity": "instantaneous-center-velocity",
    "composite-point-motion": "composite-point-motion",
    "particle-newton-2d": "particle-newton-2d",
    "polar-dynamics": "polar-dynamics",
    "noninertial-dynamics": "noninertial-dynamics",
    "impulse-momentum": "impulse-momentum",
    "two-body-collision": "two-body-collision",
    "system-momentum-center": "system-momentum-center",
    "angular-momentum-theorem": "angular-momentum-theorem",
    "angular-momentum-conservation": "angular-momentum-conservation",
    "work-energy": "work-energy",
    "d-alembert-principle": "d-alembert-principle",
    "virtual-displacement-principle": "virtual-displacement-principle",
    "conservative-force-potential": "conservative-force-potential",
    "virtual-work-constraint-reaction": "virtual-work-constraint-reaction",
    "lagrange-pendulum": "lagrange-pendulum",
    "hamilton-principle": "hamilton-principle",
    "generalized-coordinates": "generalized-coordinates",
    "rotating-reference-frame": "rotating-reference-frame",
    "accelerating-platform": "accelerating-platform",
    "spatial-force-system": "spatial-force-system",
    "friction-slope": "friction-slope",
    "friction-mechanisms": "friction-mechanisms",
    "plane-force-system-simplification": "plane-force-system-simplification",
    "simple-beam": "simple-beam",
    "cantilever-beam": "simple-beam",
    "axial-bar": "simple-beam",
    "torsion-shaft": "simple-beam",
    "truss-basic": "truss-basic",
    "frame-basic": "frame-basic",
    "indeterminate-beam": "indeterminate-beam",
    "influence-line-beam": "influence-line-beam",
    "bending-beam": "bending-beam",
    "combined-strength": "combined-strength",
    "energy-methods-ml": "energy-methods-ml",
    "rotating-collision": "rotating-collision",
    "oblique-collision": "oblique-collision",
    "simple-harmonic-oscillator": "simple-harmonic-oscillator",
    "damped-vibration": "damped-vibration",
    "forced-vibration": "forced-vibration",
    "gyroscope-precession": "gyroscope-precession",
    "euler-angles": "euler-angles",
    "rocket-motion": "rocket-motion",
    "variable-mass-system": "variable-mass-system",
  };

  const targetSceneId = modelToSceneMap[modelId] || "crank-slider";

  const target = document.querySelector(`.scene-2d[data-scene-id="${targetSceneId}"]`);
  if (target) {
    target.classList.add("scene-2d-active");
    // 按需初始化新添加的动画场景（避免同时运行太多动画导致卡顿）
    setTimeout(() => {
      if (targetSceneId === "point-kinematics-coordinates" && typeof initPointKinematicsCoordinatesScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initPointKinematicsCoordinatesScene();
      } else if (targetSceneId === "rigid-body-translation" && typeof initRigidBodyTranslationScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initRigidBodyTranslationScene();
      } else if (targetSceneId === "instantaneous-center-velocity" && typeof initInstantaneousCenterVelocityScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initInstantaneousCenterVelocityScene();
      } else if (targetSceneId === "conservative-force-potential" && typeof initConservativeForcePotentialScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initConservativeForcePotentialScene();
      } else if (targetSceneId === "virtual-work-constraint-reaction" && typeof initVirtualWorkConstraintReactionScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initVirtualWorkConstraintReactionScene();
      } else if (targetSceneId === "lagrange-pendulum" && typeof initLagrangePendulumScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initLagrangePendulumScene();
      } else if (targetSceneId === "hamilton-principle" && typeof initHamiltonPrincipleScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initHamiltonPrincipleScene();
      } else if (targetSceneId === "generalized-coordinates" && typeof initGeneralizedCoordinatesScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initGeneralizedCoordinatesScene();
      } else if (targetSceneId === "rotating-reference-frame" && typeof initRotatingReferenceFrameScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initRotatingReferenceFrameScene();
      } else if (targetSceneId === "accelerating-platform" && typeof initAcceleratingPlatformScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initAcceleratingPlatformScene();
      } else if (targetSceneId === "friction-mechanisms" && typeof initFrictionMechanismsScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initFrictionMechanismsScene();
      } else if (targetSceneId === "rotating-collision" && typeof initRotatingCollisionScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initRotatingCollisionScene();
      } else if (targetSceneId === "oblique-collision" && typeof initObliqueCollisionScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initObliqueCollisionScene();
      } else if (targetSceneId === "simple-harmonic-oscillator" && typeof initSimpleHarmonicOscillatorScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initSimpleHarmonicOscillatorScene();
      } else if (targetSceneId === "damped-vibration" && typeof initDampedVibrationScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initDampedVibrationScene();
      } else if (targetSceneId === "forced-vibration" && typeof initForcedVibrationScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initForcedVibrationScene();
      } else if (targetSceneId === "gyroscope-precession" && typeof initGyroscopePrecessionScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initGyroscopePrecessionScene();
      } else if (targetSceneId === "euler-angles" && typeof initEulerAnglesScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initEulerAnglesScene();
      } else if (targetSceneId === "rocket-motion" && typeof initRocketMotionScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initRocketMotionScene();
      } else if (targetSceneId === "variable-mass-system" && typeof initVariableMassSystemScene === "function" && !sceneAnimationRunning.get(targetSceneId)) {
        initVariableMassSystemScene();
      }
    }, 100);
  }

  // 切换参数区展示与文案
  applyModelParamPreset(modelId);

  // 确保 2D 模式被激活
  const mode2dButton = document.querySelector('.panel-tabs .tab-btn[data-mode="2d"]');
  if (mode2dButton) {
    modeButtons.forEach((b) => b.classList.remove("tab-btn-active"));
    mode2dButton.classList.add("tab-btn-active");
    visual2D.classList.add("active");
    visual3D.classList.remove("active");
  }

  // 切换后刷新对应场景的参数显示
  if (targetSceneId === "crank-slider" && typeof updateCrankSlider === "function") {
    updateCrankSlider(Math.PI / 6);
  } else if (targetSceneId === "simple-beam" && typeof updateBeamScene === "function") {
    updateBeamScene();
  } else if (targetSceneId === "friction-slope") {
    // 目前用固定示例参数演示自锁判定，后续可与参数输入联动
    updateFrictionSlopeHUD(30, 0.4);
  }
}

// 按模型类型调整参数输入区的显示和含义
function applyModelParamPreset(modelId) {
  const show = (el, visible) => {
    if (!el) return;
    el.style.display = visible ? "" : "none";
  };

  // 默认：梁/轴类（作为兜底）
  let cfg = {
    showL: true,
    showLoad: true,
    showE: true,
    showCrank: false,
    showOmega: false,
    labelL: "跨度 / 长度 L",
    unitL: "m",
    labelLoad: "荷载大小 P / q",
    unitLoad: "kN",
    labelE: "材料弹性模量 E",
    unitE: "MPa",
  };

  if (modelId === "door-lever") {
    cfg = {
      showL: false,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "",
      unitL: "",
      labelLoad: "作用力 F",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "rigid-body-2d") {
    cfg = {
      showL: false,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "",
      unitL: "",
      labelLoad: "典型外力 F",
      unitLoad: "kN",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "crank-slider") {
    cfg = {
      showL: false,
      showLoad: false,
      showE: false,
      showCrank: true,
      showOmega: true,
      labelL: "",
      unitL: "",
      labelLoad: "",
      unitLoad: "",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "three-force-equilibrium") {
    cfg = {
      showL: false,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "",
      unitL: "",
      labelLoad: "典型力 F",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "force-couple-simplification") {
    cfg = {
      showL: false,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "",
      unitL: "",
      labelLoad: "力偶中力的大小 F",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "disk-couple") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "圆盘半径 R",
      unitL: "m",
      labelLoad: "切向力 F",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "multi-force-panel") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "门宽 L",
      unitL: "m",
      labelLoad: "典型外力 F",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "point-kinematics-curve") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "曲线等效半径 R",
      unitL: "m",
      labelLoad: "质点速度 v",
      unitLoad: "m/s",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "rigid-fixed-rotation") {
    cfg = {
      showL: false,
      showLoad: false,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "",
      unitL: "",
      labelLoad: "",
      unitLoad: "",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "composite-point-motion") {
    cfg = {
      showL: false,
      showLoad: false,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "",
      unitL: "",
      labelLoad: "",
      unitLoad: "",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "particle-newton-2d") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "质点质量 m",
      unitL: "kg",
      labelLoad: "外力幅值 F0",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "polar-dynamics") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "质点质量 m",
      unitL: "kg",
      labelLoad: "径向力幅值 Fr0",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "noninertial-dynamics") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "质点质量 m",
      unitL: "kg",
      labelLoad: "真实力幅值 F0",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "impulse-momentum") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "质点质量 m",
      unitL: "kg",
      labelLoad: "脉冲力峰值 F0",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "two-body-collision") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "小球1质量 m₁",
      unitL: "kg",
      labelLoad: "恢复系数 e×10",
      unitLoad: "—",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "system-momentum-center") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "质点1质量 m₁",
      unitL: "kg",
      labelLoad: "质点2质量 m₂",
      unitLoad: "kg",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "rotating-collision") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: true,
      showOmega: true,
      labelL: "转动惯量 I₁",
      unitL: "kg·m²",
      labelLoad: "转动惯量 I₂",
      unitLoad: "kg·m²",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "oblique-collision") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: true,
      showOmega: true,
      labelL: "质量 m₁",
      unitL: "kg",
      labelLoad: "质量 m₂",
      unitLoad: "kg",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "simple-harmonic-oscillator") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "质量 m",
      unitL: "kg",
      labelLoad: "弹簧常数 k",
      unitLoad: "N/m",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "damped-vibration") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: true,
      labelL: "质量 m",
      unitL: "kg",
      labelLoad: "弹簧常数 k",
      unitLoad: "N/m",
      labelE: "",
      unitE: "",
      labelOmega: "阻尼系数 c",
      unitOmega: "N·s/m",
    };
  } else if (modelId === "forced-vibration") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: true,
      labelL: "质量 m",
      unitL: "kg",
      labelLoad: "弹簧常数 k",
      unitLoad: "N/m",
      labelE: "",
      unitE: "",
      labelOmega: "激振频率 ω",
      unitOmega: "rad/s",
    };
  } else if (modelId === "gyroscope-precession") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: true,
      labelL: "转动惯量 I",
      unitL: "kg·m²",
      labelLoad: "自转角速度 ω",
      unitLoad: "rad/s",
      labelE: "",
      unitE: "",
      labelOmega: "重力矩 M",
      unitOmega: "N·m",
    };
  } else if (modelId === "euler-angles") {
    cfg = {
      showL: false,
      showLoad: false,
      showE: false,
      showCrank: false,
      showOmega: true,
      labelL: "",
      unitL: "",
      labelLoad: "",
      unitLoad: "",
      labelE: "",
      unitE: "",
      labelOmega: "角速度 ω",
      unitOmega: "rad/s",
    };
  } else if (modelId === "rocket-motion") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: true,
      labelL: "初始质量 m₀",
      unitL: "kg",
      labelLoad: "喷流速度 u",
      unitLoad: "m/s",
      labelE: "",
      unitE: "",
      labelOmega: "质量流率 ṁ",
      unitOmega: "kg/s",
    };
  } else if (modelId === "variable-mass-system") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: true,
      labelL: "初始质量 m₀",
      unitL: "kg",
      labelLoad: "速度 v",
      unitLoad: "m/s",
      labelE: "",
      unitE: "",
      labelOmega: "质量流率 ṁ",
      unitOmega: "kg/s",
    };
  } else if (modelId === "angular-momentum-theorem") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "转动惯量 I",
      unitL: "kg·m²",
      labelLoad: "力矩幅值 M0",
      unitLoad: "N·m",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "angular-momentum-conservation") {
    cfg = {
      showL: true,
      showLoad: false,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "质量块质量 m",
      unitL: "kg",
      labelLoad: "",
      unitLoad: "",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "spatial-force-system") {
    cfg = {
      showL: false,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "",
      unitL: "",
      labelLoad: "代表性外力 F",
      unitLoad: "kN",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "friction-slope") {
    cfg = {
      showL: true,
      showLoad: false,
      showE: true,
      showCrank: false,
      showOmega: false,
      labelL: "斜面角 α",
      unitL: "°",
      labelLoad: "",
      unitLoad: "",
      labelE: "摩擦系数 μ",
      unitE: "—",
    };
  } else if (modelId === "plane-force-system-simplification") {
    cfg = {
      showL: false,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "",
      unitL: "",
      labelLoad: "典型力 F",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "simple-beam" || modelId === "cantilever-beam") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: true,
      showCrank: false,
      showOmega: false,
      labelL: "跨度 L",
      unitL: "m",
      labelLoad: "均布荷载 q",
      unitLoad: "kN/m",
      labelE: "弹性模量 E",
      unitE: "MPa",
    };
  } else if (modelId === "axial-bar") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: true,
      showCrank: false,
      showOmega: false,
      labelL: "杆长 L",
      unitL: "m",
      labelLoad: "轴向力 P",
      unitLoad: "kN",
      labelE: "弹性模量 E",
      unitE: "MPa",
    };
  } else if (modelId === "torsion-shaft") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: true,
      showCrank: false,
      showOmega: false,
      labelL: "轴长 L",
      unitL: "m",
      labelLoad: "扭矩 T",
      unitLoad: "kN·m",
      labelE: "剪切模量 G / 弹性模量 E",
      unitE: "MPa",
    };
  } else if (modelId === "truss-basic") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "跨度 L",
      unitL: "m",
      labelLoad: "荷载 P",
      unitLoad: "kN",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "frame-basic") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "跨度 L",
      unitL: "m",
      labelLoad: "荷载 P",
      unitLoad: "kN",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "indeterminate-beam") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: true,
      showCrank: false,
      showOmega: false,
      labelL: "跨度 L",
      unitL: "m",
      labelLoad: "均布荷载 q",
      unitLoad: "kN/m",
      labelE: "弹性模量 E",
      unitE: "MPa",
    };
  } else if (modelId === "influence-line-beam") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "跨度 L",
      unitL: "m",
      labelLoad: "移动荷载 P",
      unitLoad: "kN",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "bending-beam") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: true,
      showCrank: false,
      showOmega: false,
      labelL: "跨度 L",
      unitL: "m",
      labelLoad: "荷载 P",
      unitLoad: "kN",
      labelE: "弹性模量 E",
      unitE: "MPa",
    };
  } else if (modelId === "combined-strength") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "跨度 L",
      unitL: "m",
      labelLoad: "荷载 P",
      unitLoad: "kN",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "energy-methods-ml") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: true,
      showCrank: false,
      showOmega: false,
      labelL: "跨度 L",
      unitL: "m",
      labelLoad: "荷载 P",
      unitLoad: "kN",
      labelE: "弹性模量 E",
      unitE: "MPa",
    };
  } else if (modelId === "work-energy") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "质量 m",
      unitL: "kg",
      labelLoad: "推力 F",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "d-alembert-principle") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "质量 m",
      unitL: "kg",
      labelLoad: "真实力 F",
      unitLoad: "N",
      labelE: "",
      unitE: "",
    };
  } else if (modelId === "virtual-displacement-principle") {
    cfg = {
      showL: true,
      showLoad: true,
      showE: false,
      showCrank: false,
      showOmega: false,
      labelL: "质量 m₁",
      unitL: "kg",
      labelLoad: "质量 m₂",
      unitLoad: "kg",
      labelE: "",
      unitE: "",
    };
  }

  show(fgL, cfg.showL);
  show(fgLoad, cfg.showLoad);
  show(fgE, cfg.showE);
  show(fgCrankR, cfg.showCrank);
  show(fgRodL, cfg.showCrank);
  show(fgOmega, cfg.showOmega);

  if (labelL) labelL.textContent = cfg.labelL || "";
  if (unitL) unitL.textContent = cfg.unitL || "";
  if (labelLoad) labelLoad.textContent = cfg.labelLoad || "";
  if (unitLoad) unitLoad.textContent = cfg.unitLoad || "";
  if (labelE) labelE.textContent = cfg.labelE || "";
  if (unitE) unitE.textContent = cfg.unitE || "";

  // 曲柄相关标签根据模型类型动态设置
  if (modelId === "rotating-collision") {
    if (labelCrankR) labelCrankR.textContent = "初始角速度 ω₁";
    if (labelRodL) labelRodL.textContent = "恢复系数 e";
    if (labelOmega) labelOmega.textContent = "初始角速度 ω₂";
  } else if (modelId === "oblique-collision") {
    if (labelCrankR) labelCrankR.textContent = "速度 v₂";
    if (labelRodL) labelRodL.textContent = "恢复系数 e";
    if (labelOmega) labelOmega.textContent = "速度 v₁";
  } else {
    // 默认：曲柄滑块机构
    // 曲柄相关标签根据模型类型动态设置
    if (modelId === "rotating-collision") {
      if (labelCrankR) labelCrankR.textContent = "初始角速度 ω₁";
      if (labelRodL) labelRodL.textContent = "恢复系数 e";
      if (labelOmega) labelOmega.textContent = "初始角速度 ω₂";
      // 更新单位标签
      const unitCrankR = document.getElementById("unit-crank-r");
      const unitRodL = document.getElementById("unit-rod-l");
      const unitOmega = document.getElementById("unit-omega");
      if (unitCrankR) unitCrankR.textContent = "rad/s";
      if (unitRodL) unitRodL.textContent = "";
      if (unitOmega) unitOmega.textContent = "rad/s";
    } else if (modelId === "oblique-collision") {
      if (labelCrankR) labelCrankR.textContent = "速度 v₂";
      if (labelRodL) labelRodL.textContent = "恢复系数 e";
      if (labelOmega) labelOmega.textContent = "速度 v₁";
      // 更新单位标签
      const unitCrankR = document.getElementById("unit-crank-r");
      const unitRodL = document.getElementById("unit-rod-l");
      const unitOmega = document.getElementById("unit-omega");
      if (unitCrankR) unitCrankR.textContent = "m/s";
      if (unitRodL) unitRodL.textContent = "";
      if (unitOmega) unitOmega.textContent = "m/s";
    } else {
      // 默认：曲柄滑块机构
  if (labelCrankR) labelCrankR.textContent = "曲柄长度 r";
  if (labelRodL) labelRodL.textContent = "连杆长度 l";
  if (labelOmega) labelOmega.textContent = "角速度 ω";
      // 恢复默认单位
      const unitCrankR = document.getElementById("unit-crank-r");
      const unitRodL = document.getElementById("unit-rod-l");
      const unitOmega = document.getElementById("unit-omega");
      if (unitCrankR) unitCrankR.textContent = "m";
      if (unitRodL) unitRodL.textContent = "m";
      if (unitOmega) unitOmega.textContent = "rad/s";
    }
  }
}


