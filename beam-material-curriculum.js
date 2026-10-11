/* 材料力学：简支梁课程包。独立提供浏览器/CommonJS 的 { units, levels }。 */
(function (root) {
  'use strict';

  const units = ['简支梁内力基础', '梁的应力、变形与迁移'];
  const H = (direction, method, key, full) => [direction, method, key, full];
  const L = (id, unit, title, intro, question, answer, unitLabel, solution, conceptId, hints, formulaLatex) => ({
    id, unit, title, scene: 'beam-material', intro, question, answer, unitLabel,
    tolerance: typeof answer === 'number' ? 0.01 : undefined,
    solution, concept: conceptId, conceptId, conceptIds: [conceptId], hints,
    formula: formulaLatex, formulaLatex, setup: null, operation: null
  });

  const levels = [
    L('beam-material-ch1-l1', 0, '简支梁反力',
      '简支梁承受竖向集中力时，先由整体平衡求出两端支座反力。',
      '跨度 L=6 m 的简支梁，在距左支座 a=2 m 处受集中力 P=12 kN。求左支座竖向反力 R_A（向上为正）。',
      8, 'kN',
      '取左支座 A 点矩：R_B×6−12×2=0，得 R_B=4 kN。竖向力平衡 R_A+R_B−12=0，所以 R_A=8 kN。',
      'beam-support-reaction',
      H('把整根梁作为研究对象，先画出两个支座反力。', '分别使用合力为零和对任一支座取矩为零。', '关于 A 点取矩可先求 R_B=12×2/6=4 kN。', '再由 R_A+R_B=P，得到 R_A=12−4=8 kN；向上为正。'),
      '\\sum M_A=0,\\quad R_B=\\frac{Pa}{L},\\quad R_A=P-R_B'
    ),
    L('beam-material-ch1-l2', 0, '剪力图读数',
      '在集中力作用点之外，简支梁剪力等于左侧所有竖向外力的代数和。',
      '沿用上一题：L=6 m、P=12 kN、a=2 m。求集中力右侧 x=3 m 截面的剪力 V（左截面向上为正）。',
      -4, 'kN',
      '左支座反力 R_A=8 kN。截面 x=3 m 位于集中力右侧，因此 V=R_A−P=8−12=−4 kN。负号表示该截面左侧合力向下。',
      'beam-shear-force',
      H('先判断截面位于集中力左侧还是右侧。', '用截面左侧外力的代数和定义剪力。', 'x=3 m>a=2 m，所以左侧包含 R_A 和 P。', 'V=8−12=−4 kN，答案的负号必须保留。'),
      'V(x)=R_A-P\\,H(x-a)'
    ),
    L('beam-material-ch1-l3', 0, '弯矩图读数',
      '弯矩由截面一侧外力对截面的力矩代数和给出；集中力处弯矩连续。',
      '沿用 L=6 m、P=12 kN、a=2 m 的简支梁，求 x=3 m 截面的弯矩 M（取下凹弯矩为正）。',
      12, 'kN·m',
      'x=3 m 位于荷载右侧，截面左侧矩为 M=R_A x−P(x−a)=8×3−12×(3−2)=12 kN·m。',
      'beam-bending-moment',
      H('先确认弯矩正号约定，并判断集中力是否在截面左侧。', '对截面取左侧外力矩：M=R_Ax−P(x−a)。', '代入 R_A=8 kN、x=3 m、a=2 m。', 'M=24−12=12 kN·m；简支端弯矩为零，荷载处弯矩保持连续。'),
      'M(x)=R_Ax-P(x-a)\\quad (x\\ge a)'
    ),
    L('beam-material-ch1-l4', 0, '最大弯矩',
      '点载简支梁的弯矩极值出现在剪力变号处，也就是集中力作用截面。',
      '跨度 L=6 m、集中力 P=12 kN 位于 a=2 m 处的简支梁，求最大弯矩 M_max。',
      16, 'kN·m',
      '荷载左侧剪力为 R_A=8 kN，右侧剪力为 −4 kN，剪力在荷载处变号，故最大弯矩在 x=a。M_max=R_Aa=8×2=16 kN·m。',
      'beam-maximum-moment',
      H('用剪力符号判断弯矩是增大还是减小。', '先求反力，再检查集中力两侧剪力是否变号。', 'R_A=8 kN，荷载左侧 V=+8、右侧 V=−4。', '剪力由正变负，极值在 x=a；M_max=8×2=16 kN·m。'),
      'M_{\\max}=R_Aa=\\frac{Pa(L-a)}{L}'
    ),
    L('beam-material-ch1-l5', 1, '弯曲正应力',
      '梁截面的弯曲正应力随到中性轴距离线性变化，边缘处达到最大值。',
      '某截面弯矩 M=16 kN·m，截面惯性矩 I=8.0×10⁻⁶ m⁴，外缘距离 c=0.08 m。求外缘弯曲正应力的绝对值。',
      160, 'MPa',
      '由 σ=Mc/I，σ=16 000×0.08/(8.0×10⁻⁶) Pa=160×10⁶ Pa=160 MPa。截面上缘与下缘符号相反，题目所求为绝对值。',
      'beam-bending-stress',
      H('识别 M、I、c 分别是弯矩、惯性矩和外缘距离。', '使用弯曲正应力公式 σ=Mc/I。', '将 16 kN·m 换成 16 000 N·m，再保持 I 的 m⁴ 单位。', '代入得 160×10⁶ Pa，即外缘应力绝对值为 160 MPa；上下缘一拉一压。'),
      '\\sigma=\\frac{Mc}{I}'
    ),
    L('beam-material-ch1-l6', 1, '简支梁挠度',
      '中央集中力作用下，等截面简支梁的最大挠度位于跨中。',
      '等截面简支梁 L=4 m，跨中集中力 P=10 kN，E=200 GPa，I=8.0×10⁻⁶ m⁴。求跨中最大挠度（向下取正，单位 mm）。',
      0.8333333333, 'mm',
      '跨中点载简支梁的最大挠度为 δ_max=PL³/(48EI)。代入得 δ=10 000×4³/(48×200×10⁹×8×10⁻⁶)=8.333×10⁻⁴ m=0.833 mm。',
      'beam-deflection',
      H('确认荷载在跨中，且两端为简支边界。', '使用中央点载的挠度公式 PL³/(48EI)。', '统一 P 为 N、L 为 m、E 为 Pa、I 为 m⁴。', '计算得 8.333×10⁻⁴ m，换算为毫米后 δ_max≈0.833 mm，方向向下。'),
      '\\delta_{\\max}=\\frac{PL^3}{48EI}'
    ),
    L('beam-material-ch1-l7', 1, '边界条件',
      '简支端允许转动但不允许竖向位移，因此端部挠度为零、端部弯矩也为零。',
      '对一根理想简支梁，左、右支座处的挠度边界条件应分别写成什么？请填写“左端 y(0)=0，右端 y(L)=0”。',
      '左端 y(0)=0，右端 y(L)=0', '文本',
      '简支支座限制竖向位移而允许转动，所以边界条件是 y(0)=0 与 y(L)=0；端弯矩 M(0)=M(L)=0 是相应的自然条件。',
      'beam-boundary-conditions',
      H('区分位移约束与转角约束，简支端不是固支端。', '写出梁挠度函数在两个支座位置的值。', '左端坐标为 0，右端坐标为 L。', '因此必须满足 y(0)=0、y(L)=0；不要误写成 y′(0)=y′(L)=0。'),
      'y(0)=0,\\quad y(L)=0\\quad (\\text{and }M(0)=M(L)=0)'
    ),
    L('beam-material-ch1-l8', 1, '综合迁移：强度与变形',
      '综合题要先由静力平衡确定最大弯矩，再分别检查应力和挠度；几何与材料参数不能混用。',
      '简支梁跨度 L=4 m，跨中点载 P=8 kN，截面 I=6.0×10⁻⁶ m⁴、外缘距离 c=0.06 m。求最大弯曲正应力（单位 MPa）。',
      100, 'MPa',
      '跨中点载时 M_max=PL/4=8 000×4/4=8 000 N·m。再用 σ_max=M_max c/I=8 000×0.06/(6.0×10⁻⁶)=100×10⁶ Pa=100 MPa。',
      'beam-integrated-transfer',
      H('先把跨中点载转化为最大弯矩，再做截面应力计算。', '依次使用 M_max=PL/4 和 σ_max=M_maxc/I。', 'M_max=8 kN·m；将 kN·m 换为 N·m，并用 I=6×10⁻⁶ m⁴。', 'σ_max=8 000×0.06/(6×10⁻⁶)=100 MPa；本题考查静力、弯矩和截面性质的迁移。'),
      'M_{\\max}=\\frac{PL}{4},\\quad \\sigma_{\\max}=\\frac{M_{\\max}c}{I}'
    )
  ];

  const curriculum = { units, levels };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = curriculum;
    module.exports.BEAM_MATERIAL_CURRICULUM = curriculum;
  }
  if (root) root.BEAM_MATERIAL_CURRICULUM = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
