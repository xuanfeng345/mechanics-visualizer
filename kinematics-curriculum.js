/* 运动学课程包：SI 单位、明确参考系；独立导出，不修改旧课程。 */
(function (root) {
  'use strict';

  const units = ['直线与抛体运动', '相对运动与圆周运动'];
  const H = (direction, method, key, full) => [direction, method, key, full];
  const L = (id, unit, title, intro, question, answer, unitLabel, solution, conceptId, hints, formulaLatex) => ({
    id, unit, title, scene: 'kinematics', intro, question, answer, unitLabel,
    tolerance: 0.01,
    solution, concept: conceptId, conceptId, conceptIds: [conceptId], hints,
    formula: formulaLatex, formulaLatex, setup: null, operation: null
  });

  const levels = [
    L('kinematics-ch1-l1', 0, '位移速度',
      '平均速度由有向位移与经历时间决定，不等同于平均速率。',
      '沿直线取向东为正。物体在 4 s 内从 x₀=−3 m 移动到 x₁=9 m。求这段时间的平均速度（向东为正）。',
      3, 'm/s',
      '位移 Δx=x₁−x₀=9−(−3)=12 m，平均速度 v̄=Δx/Δt=12/4=+3 m/s，方向向东。无需知道中途的路径。',
      'kinematics-average-velocity',
      H('先辨别位移与路程。', '用终位置减初位置，再除以经历时间。', 'Δx=9−(−3)=12 m，Δt=4 s。', 'v̄=12/4=+3 m/s，故填写 3。'),
      '\\bar{v}=\\frac{\\Delta x}{\\Delta t}=\\frac{x_1-x_0}{\\Delta t}'
    ),
    L('kinematics-ch1-l2', 0, '匀加速',
      '恒定加速度下，位移包含初速度贡献与加速贡献。',
      '小车沿 x 轴运动，初速度 v₀=2 m/s，恒定加速度 a=3 m/s²。求接下来 4 s 内的位移。',
      32, 'm',
      'Δx=v₀t+½at²=2×4+½×3×4²=8+24=32 m。末速度为 14 m/s，而非本题所求位移。',
      'kinematics-constant-acceleration',
      H('所求是位移，不是末速度。', '使用 Δx=v₀t+½at²。', '初速度贡献为 8 m，加速贡献为 24 m。', '两项相加得 Δx=8+24=32 m。'),
      '\\Delta x=v_0t+\\frac{1}{2}at^2'
    ),
    L('kinematics-ch1-l3', 0, '抛体水平位移',
      '忽略空气阻力时，抛体的水平速度保持不变。',
      '从离水平地面 45 m 高处水平抛出小球，初速度为 8 m/s。忽略空气阻力，取 g=10 m/s²。求落地前的水平位移大小。',
      24, 'm',
      '竖直初速度为零，由 h=½gt² 得落地时间 t=√(2h/g)=√(90/10)=3 s。水平位移 Δx=v₀ₓt=8×3=24 m。',
      'kinematics-projectile-horizontal',
      H('先由竖直下落求飞行时间。', '用 t=√(2h/g)，再用 Δx=v₀ₓt。', 'h=45 m、g=10 m/s²，故 t=3 s。', '水平速度恒为 8 m/s，Δx=8×3=24 m。'),
      't=\\sqrt{\\frac{2h}{g}},\\quad \\Delta x=v_{0x}t'
    ),
    L('kinematics-ch1-l4', 0, '抛体最高点',
      '最高点的竖直速度为零，但水平速度通常不为零。',
      '小球斜向上抛出，初速度分量为 v₀ₓ=12 m/s、v₀ᵧ=20 m/s。忽略空气阻力，取 g=10 m/s²。求最高点相对抛出点的上升高度。',
      20, 'm',
      '取向上为正，竖直加速度为 −g。最高点 vᵧ=0，由 vᵧ²=v₀ᵧ²−2gΔy 得 Δy=20²/(2×10)=20 m。此时水平速度仍为 12 m/s。',
      'kinematics-projectile-apex',
      H('最高点为零的是竖直速度，而非总速度。', '在竖直方向使用 vᵧ²=v₀ᵧ²−2gΔy。', '代入 vᵧ=0，得到 Δy=v₀ᵧ²/(2g)。', 'Δy=400/20=20 m，这是相对抛出点的高度。'),
      'v_y=0,\\quad \\Delta y_{\\max}=\\frac{v_{0y}^2}{2g}'
    ),
    L('kinematics-ch1-l5', 1, '相对运动',
      '相对速度是同一惯性参考系中两个速度的矢量差。',
      '两车沿东西直线行驶，取向东为正。地面测得 A 车速度为 +12 m/s，B 车速度为 −8 m/s。求 A 相对 B 的速度（仍以向东为正）。',
      20, 'm/s',
      'vA/B=vA−vB=12−(−8)=+20 m/s，方向向东。必须保留 B 车速度的负号。',
      'kinematics-relative-velocity',
      H('明确观察者是 B，所观察的物体是 A。', '使用 vA/B=vA−vB。', 'B 向西行驶，所以 vB=−8 m/s。', 'vA/B=12−(−8)=+20 m/s，故填写 20。'),
      'v_{A/B}=v_A-v_B'
    ),
    L('kinematics-ch1-l6', 1, '圆周速度',
      '圆周运动的线速度大小等于角速度大小乘以半径。',
      '质点做匀速圆周运动，半径 r=0.5 m，角速度大小 ω=6 rad/s。求线速度大小。',
      3, 'm/s',
      'v=ωr=6×0.5=3 m/s。弧度为无量纲，线速度方向沿圆周切线。',
      'kinematics-circular-speed',
      H('不要把角速度直接当作线速度。', '使用 v=ωr，其中 ω 以 rad/s 表示。', '代入 ω=6 rad/s、r=0.5 m。', 'v=6×0.5=3 m/s。'),
      'v=\\omega r'
    ),
    L('kinematics-ch1-l7', 1, '向心加速度',
      '匀速圆周运动虽速率不变，速度方向却持续改变。',
      '质点以 6 m/s 的恒定速率沿半径 3 m 的圆周运动。求向心加速度大小。',
      12, 'm/s²',
      'aₙ=v²/r=6²/3=12 m/s²，方向始终指向圆心。匀速圆周运动的切向加速度为零，向心加速度不为零。',
      'kinematics-centripetal-acceleration',
      H('速率不变不意味着加速度为零。', '使用向心加速度公式 aₙ=v²/r。', '先将速率平方：6²=36。', 'aₙ=36/3=12 m/s²，方向指向圆心。'),
      'a_n=\\frac{v^2}{r}=\\omega^2r'
    ),
    L('kinematics-ch1-l8', 1, '章节迁移测验',
      '将抛体飞行时间与水平相对运动结合，判断移动目标的初始位置。',
      '从离水平地面 20 m 高处向东水平抛出小球，地面参考系中初速度为 10 m/s。一辆小车在地面上以 4 m/s 匀速向东行驶；将小车视为地面上的质点。忽略空气阻力，取 g=10 m/s²。要使小球落地时恰与小车相遇，抛出瞬间小车应在抛出点正下方以东多少米？',
      12, 'm',
      '小球飞行时间 t=√(2h/g)=√(40/10)=2 s。落地时小球水平位移为 10×2=20 m，小车同期前进 4×2=8 m，故小车初始位置应为 x車,0=20−8=12 m，即正下方以东 12 m。等价地，初始间距=(10−4)×2=12 m。',
      'kinematics-chapter-transfer',
      H('先用竖直运动确定相遇时间，再比较水平位置。', '设初始间距为 d，则 v球t=d+v車t。', 't=√(2×20/10)=2 s，水平相对速度为 10−4=6 m/s。', 'd=(10−4)×2=12 m，因此小车初始应在正下方以东 12 m。'),
      't=\\sqrt{\\frac{2h}{g}},\\quad d=(v_{0x}-v_c)t'
    )
  ];

  const curriculum = { units, levels };
  if (typeof module !== 'undefined' && module.exports) module.exports = curriculum;
  if (root) root.KINEMATICS_CURRICULUM = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
