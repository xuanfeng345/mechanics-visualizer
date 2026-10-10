/* 屈曲课程包：8 关覆盖概念、Euler 临界力、边界与综合迁移。 */
(function (root) {
  'use strict';

  const units = ['屈曲基本概念与 Euler 理论', '稳定性设计与综合迁移'];
  const H = (direction, method, key, full) => [direction, method, key, full];
  const L = (id, unit, title, question, answer, unitLabel, solution, conceptId, hints, formulaLatex) => ({
    id, unit, title, scene: 'buckling',
    intro: '理想受压杆在失稳前的临界行为与稳定性设计。',
    question, answer, unitLabel,
    tolerance: typeof answer === 'number' ? 0.01 : undefined,
    solution, concept: conceptId, conceptId, conceptIds: [conceptId],
    hints, formula: formulaLatex, formulaLatex, setup: null, operation: null
  });

  const levels = [
    L('buckling-ch1-l1', 0, '屈曲概念',
      '细长受压杆的轴向压力逐渐增大，杆会突然产生侧向弯曲并失去原有直线平衡。这种失稳现象称为什么？',
      '失稳屈曲', '文本',
      '受压杆在达到临界承载力后由直线平衡转为弯曲平衡，这种突然的侧向变形和承载能力变化称为失稳屈曲。',
      'buckling-concept',
      H('识别题目描述的是直线平衡状态的突然丧失。', '区分材料屈服与整体稳定失效。', '细长受压杆出现显著侧向弯曲，关键是“临界”与“失稳”。', '因此现象称为“失稳屈曲”，不是单纯的压缩变形或拉伸。'),
      '\text{buckling}:\;P\to P_{cr}\;\Longrightarrow\;\text{lateral instability}'
    ),
    L('buckling-ch1-l2', 0, 'Euler 临界力',
      '两端铰支细长柱，弹性模量 E=200 GPa，截面惯性矩 I=8×10⁻⁶ m⁴，长度 L=2 m。按 Euler 公式求临界力 Pcr（kN，π²≈9.87）。',
      3948, 'kN',
      '两端铰支的有效长度系数 K=1，Pcr=π²EI/(KL)²=9.87×200×10⁹×8×10⁻⁶/2²=3.948×10⁶ N=3948 kN。',
      'euler-critical-load',
      H('先确认是两端铰支柱并使用 Euler 临界力。', '有效长度为 KL，铰—铰时 K=1。', '代入 Pcr=π²EI/L²，并统一 E、I、L 的 SI 单位。', 'Pcr=9.87×200×10⁹×8×10⁻⁶/4=3.948×10⁶ N，换算为 3948 kN。'),
      'P_{cr}=\frac{\pi^2EI}{(KL)^2}'
    ),
    L('buckling-ch1-l3', 0, '有效长度',
      '一端固支、一端铰支的柱长 L=3 m。采用近似有效长度系数 K=0.70，求有效长度 Le（m）。',
      2.1, 'm',
      '有效长度定义为 Le=KL。代入 K=0.70、L=3 m，得 Le=0.70×3=2.10 m。',
      'effective-length',
      H('有效长度是实际长度乘以边界系数。', '使用 Le=KL，而不是把 K 加到 L 上。', '将 K=0.70 与 L=3 m 相乘。', 'Le=0.70×3=2.10 m，因此填写 2.1。'),
      'L_e=KL'
    ),
    L('buckling-ch1-l4', 0, '边界系数',
      '理想悬臂柱（一端固支、另一端自由）的 Euler 有效长度系数 K 为多少？',
      2, '无量纲',
      '悬臂柱的弯曲屈曲模态相当于长度为 2L 的两端铰支柱，因此有效长度 Le=2L，边界系数 K=2。',
      'boundary-factor',
      H('回忆四类常见端部约束对应的有效长度。', '自由端使柱的有效屈曲长度大于实际长度。', '固—自由柱的有效长度是实际长度的两倍。', '由 Le=KL=2L 可知 K=2；它是无量纲系数。'),
      'K=\frac{L_e}{L}=2\quad(\text{fixed-free})'
    ),
    L('buckling-ch1-l5', 0, '长细比',
      '柱的有效长度 Le=2 m，截面积 A=0.002 m²，截面惯性矩 I=4×10⁻⁶ m⁴。求长细比 λ=Le/i（保留两位小数）。',
      44.72, '无量纲',
      '回转半径 i=√(I/A)=√(4×10⁻⁶/0.002)=√0.002=0.04472 m。因此 λ=Le/i=2/0.04472=44.72。',
      'slenderness-ratio',
      H('长细比比较的是有效长度与截面回转半径。', '先求 i=√(I/A)，再求 λ=Le/i。', 'I/A=0.002 m²，故 i≈0.04472 m。', 'λ=2/0.04472≈44.72；长细比越大，整体屈曲越需重视。'),
      '\lambda=\frac{L_e}{i},\qquad i=\sqrt{\frac{I}{A}}'
    ),
    L('buckling-ch1-l6', 1, '稳定安全系数',
      '某柱 Euler 临界力 Pcr=120 kN，实际轴压力 P=30 kN。按 n=Pcr/P 求稳定安全系数 n。',
      4, '无量纲',
      '稳定安全系数定义为临界力与实际工作力之比：n=Pcr/P=120/30=4。',
      'stability-safety-factor',
      H('安全系数应比较临界承载力和实际压力。', '使用 n=Pcr/P，而不是 P/Pcr。', '将 120 kN 除以 30 kN，单位相消。', 'n=120/30=4，表示临界力是实际压力的 4 倍。'),
      'n=\frac{P_{cr}}{P}'
    ),
    L('buckling-ch1-l7', 1, 'Euler 适用条件',
      '一根理想、均匀、细长、轴心受压的直杆，材料处于线弹性范围且变形较小。对这种杆，是否可用 Euler 公式估算弹性屈曲临界力？请填“是”或“否”。',
      '是', '文本',
      'Euler 理论适用于理想直杆、轴心受压、均匀截面、细长构件，并假设材料线弹性和小变形。题设满足这些条件，因此可以使用。',
      'euler-applicability',
      H('逐项检查题设是否满足 Euler 理想化假设。', '关注细长、轴心受压和线弹性三个关键词。', '题目明确排除了偏心、塑性和大变形影响。', '所有必要条件均满足，所以答案为“是”；短粗柱或塑性屈曲时不能直接套用。'),
      'P_{cr}=\frac{\pi^2EI}{(KL)^2}\quad\text{(elastic, slender, axially loaded column)}'
    ),
    L('buckling-ch1-l8', 1, '综合迁移',
      '两端铰支柱 E=200 GPa、I=6×10⁻⁶ m⁴、L=2.5 m。取 K=1、π²≈9.87，按 Euler 公式求临界力 Pcr（kN，取整数）。',
      1895, 'kN',
      '两端铰支 K=1，所以 Pcr=π²EI/L²=9.87×200×10⁹×6×10⁻⁶/(2.5)²=1.895×10⁶ N≈1895 kN。',
      'buckling-transfer',
      H('综合使用边界系数、有效长度和 Euler 公式。', '先取 Le=KL=1×2.5=2.5 m，再代入 Pcr=π²EI/Le²。', '计算 EI=200×10⁹×6×10⁻⁶=1.2×10⁶ N·m²，Le²=6.25 m²。', 'Pcr=9.87×1.2×10⁶/6.25≈1.895×10⁶ N=1895 kN，注意最后换算单位。'),
      'P_{cr}=\frac{\pi^2EI}{(KL)^2},\qquad K=1'
    )
  ];

  const curriculum = { units, levels };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = curriculum;
    module.exports.BUCKLING_CURRICULUM = curriculum;
  }
  if (root) root.BUCKLING_CURRICULUM = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
