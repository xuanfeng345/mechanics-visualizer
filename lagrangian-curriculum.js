/* 拉格朗日力学课程包：八关循序建立从广义坐标到综合迁移的变分力学框架。 */
(function (root) {
  'use strict';

  const units = ['拉格朗日量与运动方程', '守恒量、约束与综合迁移'];
  const H = (direction, method, key, full) => [direction, method, key, full];
  const L = (id, unit, title, intro, question, answer, unitLabel, solution, conceptId, hints, formulaLatex) => ({
    id, unit, title, scene: 'lagrangian', intro, question, answer, unitLabel,
    tolerance: typeof answer === 'number' ? 0.01 : undefined,
    solution, concept: conceptId, conceptId, conceptIds: [conceptId], hints,
    formula: formulaLatex, formulaLatex, setup: null, operation: null
  });

  const levels = [
    L('lagrangian-l1', 0, '广义坐标',
      '广义坐标用最少的独立变量描述系统构型；选坐标时要同时留意几何约束。',
      '理想单摆的摆长固定为 l，摆锤只能在竖直平面内摆动。描述其构型至少需要几个独立的广义坐标？',
      1, '个',
      '固定悬点和摆长后，摆锤的位置只由摆角 θ 决定，因此系统只有 1 个自由度，也就需要 1 个独立广义坐标。',
      'generalized-coordinate',
      H('先数系统的独立自由度，而不是列出 x、y 等冗余坐标。', '固定摆长给出一个几何约束。', '平面内的 x、y 受到 x²+y²=l² 约束，只剩一个独立变量。', '用摆角 θ 描述构型即可，所以答案是 1。'),
      'N_{\\mathrm{dof}}=1,\\quad q=\\theta'
    ),
    L('lagrangian-l2', 0, '动能与势能',
      '拉格朗日力学先分别写出动能 T 和势能 V，再由它们构成动力学函数。',
      '质量 m=2 kg 的质点以 v=3 m/s 运动，并处于高度 h=4 m。取 g=10 m/s²、零势能面在地面。求 T+V 的数值。',
      89, 'J',
      '动能 T=½mv²=½×2×3²=9 J；重力势能 V=mgh=2×10×4=80 J。因此 T+V=9+80=89 J。',
      'kinetic-potential-energy',
      H('先把动能和势能分开计算。', '分别使用 T=½mv² 与 V=mgh。', 'T=9 J，V=80 J。', '相加得到 T+V=9+80=89 J。'),
      'T=\\frac12mv^2,\\quad V=mgh'
    ),
    L('lagrangian-l3', 0, '拉格朗日量',
      '拉格朗日量定义为动能减势能：L=T−V；它不是机械能总和。',
      '质点的动能为 T=9 J，弹簧势能为 V=1 J。按定义求拉格朗日量 L。',
      8, 'J',
      '直接使用 L=T−V=9−1=8 J。注意这里是相减，而机械能 T+V 才是总能量。',
      'lagrangian-definition',
      H('辨认题目要的是 L，而不是机械能。', '使用定义 L=T−V。', '代入 T=9 J、V=1 J。', 'L=9−1=8 J。'),
      'L=T-V'
    ),
    L('lagrangian-l4', 0, '欧拉—拉格朗日方程',
      '对无耗散的一维弹簧振子，欧拉—拉格朗日方程会还原出胡克力导致的二阶运动方程。',
      '一维弹簧振子的质量 m=2 kg、劲度系数 k=8 N/m。在位移 q=0.5 m 处，按欧拉—拉格朗日方程求瞬时加速度 q̈。',
      -2, 'm/s²',
      'L=½m q̇²−½kq²。代入 d/dt(∂L/∂q̇)−∂L/∂q=0 得 m q̈+kq=0，所以 q̈=−kq/m=−8×0.5/2=−2 m/s²。',
      'euler-lagrange-equation',
      H('先写出弹簧振子的 L=T−V。', '对 q 使用 d/dt(∂L/∂q̇)−∂L/∂q=0。', '得到 m q̈+kq=0，再解出 q̈。', 'q̈=−kq/m=−8×0.5/2=−2 m/s²，负号表示指向平衡位置。'),
      '\\frac{d}{dt}\\frac{\\partial L}{\\partial \\dot q}-\\frac{\\partial L}{\\partial q}=0,\\quad m\\ddot q+kq=0'
    ),
    L('lagrangian-l5', 0, '简谐运动解',
      '简谐振子的通解是正弦与余弦的线性组合，角频率由 k/m 决定。',
      '振幅 A=0.20 m、角频率 ω=5 rad/s 的简谐振子，求其最大速度大小。',
      1, 'm/s',
      '可写成 q=A cos(ωt+φ)，速度幅值为 Aω。因此 v_max=0.20×5=1 m/s。',
      'simple-harmonic-solution',
      H('最大速度对应位移经过平衡位置的时刻。', '对 q=A cos(ωt+φ) 求导，速度幅值为 Aω。', '把 A=0.20 m、ω=5 rad/s 代入。', 'v_max=Aω=0.20×5=1 m/s。'),
      'q(t)=A\\cos(\\omega t+\\phi),\\quad v_{\\max}=A\\omega'
    ),
    L('lagrangian-l6', 1, '守恒能量',
      '若拉格朗日量不显含时间，系统的机械能 E=T+V 守恒。',
      '无阻尼弹簧振子的劲度系数 k=8 N/m，振幅 A=0.5 m。求其守恒机械能。',
      1, 'J',
      '在最大位移处速度为零，全部能量是弹簧势能：E=½kA²=½×8×0.5²=1 J。',
      'energy-conservation',
      H('选取最容易计算能量的时刻：最大位移处。', '此时 T=0，E=V_max=½kA²。', 'A²=0.25，½kA²=4×0.25。', '所以守恒机械能 E=1 J，运动中 T 与 V 互相转化但总和不变。'),
      'E=T+V=\\frac12kA^2=1\\ \\mathrm{J}'
    ),
    L('lagrangian-l7', 1, '约束概念',
      '约束把坐标限制在允许构型上；完整的几何约束可用坐标和时间的方程表达。',
      '平面质点被限制在半径 2 m 的圆周上。若圆心在原点，写出其一个完整的几何约束式右端常数（即 x²+y²=？）。',
      4, 'm²',
      '圆周半径固定为 R=2 m，因此 x²+y²=R²=2²=4。这个方程是完整（定常）的几何约束。',
      'holonomic-constraint',
      H('把“距离圆心恒定”翻译成笛卡尔坐标。', '圆周约束满足 x²+y²=R²。', '半径 R=2 m，所以 R²=4 m²。', '完整约束式是 x²+y²=4，因此所求右端常数为 4。'),
      'f(x,y)=x^2+y^2-R^2=0,\\quad R=2\\ \\mathrm{m}'
    ),
    L('lagrangian-l8', 1, '综合迁移：小角摆',
      '把广义坐标、近似拉格朗日量、简谐解与能量观点结合，可快速处理小角单摆。',
      '长 l=1 m 的单摆在小角近似下从最大角位移 θ₀=0.10 rad 由静止释放。取 g=10 m/s²，求经过最低点时的最大角速度大小。',
      0.316, 'rad/s',
      '小角近似下 ω₀=√(g/l)=√10 rad/s。由能量守恒或简谐解，最低点角速度 θ̇_max=θ₀ω₀=0.10√10≈0.316 rad/s。',
      'lagrangian-transfer',
      H('先用小角近似把单摆视为简谐振子。', '计算固有角频率 ω₀=√(g/l)。', '最大角速度等于 θ₀ω₀。', 'θ̇_max=0.10×√(10/1)≈0.316 rad/s。'),
      '\\omega_0=\\sqrt{\\frac{g}{l}},\\quad |\\dot\\theta|_{\\max}=\\theta_0\\sqrt{\\frac{g}{l}}'
    )
  ];

  const curriculum = { units, levels };
  if (typeof module !== 'undefined' && module.exports) module.exports = curriculum;
  if (root) root.LAGRANGIAN_CURRICULUM = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
