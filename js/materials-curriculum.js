/* 材料力学第一章：轴向杆课程包。
 * 保持与现有 curriculum.js 相同的 { units, levels } 形状；不修改旧课程。
 * 同时以 AXIAL_CURRICULUM 名称导出，供浏览器和 CommonJS 使用。
 */
(function (root) {
  'use strict';

  const units = ['轴向杆基本量', '轴向杆综合应用'];
  const H = (direction, method, key, full) => [direction, method, key, full];
  const L = (id, unit, title, intro, question, answer, unitLabel, solution, conceptId, hints, formulaLatex) => ({
    id, unit, title, scene: 'axial-bar', intro, question, answer, unitLabel,
    tolerance: typeof answer === 'number' ? 0.01 : undefined,
    solution, concept: conceptId, conceptId, conceptIds: [conceptId], hints,
    formula: formulaLatex, formulaLatex, setup: null, operation: null
  });

  const levels = [
    L('axial-ch1-l1', 0, '应力定义',
      '轴向杆横截面上的平均正应力等于轴力除以截面积。',
      '杆承受轴向拉力 N=20 kN，截面积 A=200 mm²。平均正应力 σ 为多少 MPa？',
      100, 'MPa',
      'σ=N/A=20 000/(200×10⁻⁶) Pa=100×10⁶ Pa=100 MPa。拉力取正，故 σ=+100 MPa。',
      'axial-stress-definition',
      H('辨认应力的定义及其正负号。', '使用 σ=N/A，并统一 N 与 m²。', '20 kN=20 000 N，200 mm²=200×10⁻⁶ m²。', 'σ=20 000/(200×10⁻⁶)=100×10⁶ Pa，因此最终答案为 100 MPa（拉应力）。'),
      '\\sigma=\\frac{N}{A}'
    ),
    L('axial-ch1-l2', 0, '单位换算',
      '轴向计算常混用 kN、mm²、GPa；换算必须保持量纲一致。',
      '将 2.5 kN 换算为 N，答案只填数值。',
      2500, 'N',
      '1 kN=10³ N，所以 2.5 kN=2.5×10³ N=2500 N。',
      'unit-conversion-force',
      H('先找出 kN 与 N 的倍率。', '将数值乘以 10³。', '2.5×10³=2500。', '因此最终答案为 2500 N；不能把 kN 数值原样代入以 N 为单位的公式。'),
      '1\\,\\mathrm{kN}=10^3\\,\\mathrm{N}'
    ),
    L('axial-ch1-l3', 0, '胡克定律',
      '在线弹性范围内，正应力与正应变成正比，比例系数为弹性模量 E。',
      '钢杆 E=200 GPa，轴向应变 ε=0.0015。按胡克定律，σ 为多少 MPa？',
      300, 'MPa',
      'σ=Eε=200 GPa×0.0015=0.300 GPa=300 MPa。应变无量纲。',
      'hooke-law',
      H('寻找应力、弹性模量、应变之间的线性关系。', '使用 σ=Eε。', '把 0.0015 直接作为无量纲应变，并将 GPa 换成 MPa。', 'σ=200×0.0015 GPa=0.3 GPa=300 MPa，所以最终答案为 300 MPa。'),
      '\\sigma=E\\varepsilon'
    ),
    L('axial-ch1-l4', 0, '轴向伸长量',
      '均匀等截面直杆在轴力恒定时，伸长量由材料和几何尺寸共同决定。',
      '杆 N=20 kN、L=2 m、A=100 mm²、E=200 GPa。求伸长量 δ（mm）。',
      2, 'mm',
      'δ=NL/(AE)=20 000×2/(100×10⁻⁶×200×10⁹) m=0.002 m=2 mm。',
      'axial-elongation',
      H('区分应变 ε 与总伸长量 δ。', '使用 δ=NL/(AE)。', '将 A=100 mm² 换成 100×10⁻⁶ m²，并统一 N、m、Pa。', '代入得 δ=0.002 m；换算为毫米后，最终答案为 2 mm。'),
      '\\delta=\\frac{NL}{AE}'
    ),
    L('axial-ch1-l5', 1, '屈服与安全系数',
      '许用应力通常取屈服应力除以安全系数，以限制工作应力。',
      '材料屈服应力 σᵧ=240 MPa，安全系数 n=1.5。许用应力 [σ] 为多少 MPa？',
      160, 'MPa',
      '[σ]=σᵧ/n=240/1.5=160 MPa。工作应力不得超过该许用值。',
      'yield-safety-factor',
      H('先区分屈服应力与许用应力。', '许用应力等于屈服应力除以安全系数。', '代入 [σ]=240/1.5。', '计算得 [σ]=160 MPa；安全系数大于 1，因此许用应力低于屈服应力。'),
      '\\left[\\sigma\\right]=\\frac{\\sigma_y}{n}'
    ),
    L('axial-ch1-l6', 1, '拉压符号约定',
      '本课程采用拉应力为正、压应力为负的符号约定。',
      '若杆的轴力使其受压，按本课程符号约定，正应力应记为“正”还是“负”？',
      '负', '文本',
      '受压时截面两侧相互挤压，轴向正应力取负；因此答案为“负”。',
      'axial-sign-convention',
      H('判断杆的变形趋势，而不是只看力的箭头。', '采用“拉正压负”约定。', '受压对应压应力，符号为 −。', '所以最终答案是“负”（可写作 σ<0）；若改用相反约定，必须在整题中保持一致。'),
      '\\sigma>0\\;\\text{拉伸},\\quad \\sigma<0\\;\\text{压缩}'
    ),
    L('axial-ch1-l7', 1, '截面变化迁移题',
      '迁移到另一根均匀杆时，仍应从 δ=NL/(AE) 出发，而不能只套用上一题数值。',
      '另一杆 N=30 kN、L=1.2 m、A=150 mm²、E=200 GPa。求伸长量 δ（mm）。',
      1.2, 'mm',
      'δ=NL/(AE)=30 000×1.2/(150×10⁻⁶×200×10⁹) m=0.0012 m=1.2 mm。',
      'axial-elongation-transfer',
      H('识别这是同一伸长公式的参数迁移。', '重新代入 δ=NL/(AE)，不要沿用上一题的 A 或 N。', '统一单位后计算：30 000×1.2/(150×10⁻⁶×200×10⁹)。', '结果为 0.0012 m，换算后最终答案为 1.2 mm；参数改变时必须重新计算。'),
      '\\delta=\\frac{NL}{AE}'
    ),
    L('axial-ch1-l8', 1, '第一章章节测验',
      '综合检验应力、屈服和安全系数：先求实际应力，再与许用应力比较。',
      '杆受拉力 N=18 kN，A=120 mm²；σᵧ=250 MPa，n=2。实际应力超过许用应力，是否安全？请填“安全”或“不安全”。',
      '不安全', '文本',
      '实际应力 σ=N/A=18 000/(120×10⁻⁶)=150 MPa；许用应力 [σ]=250/2=125 MPa。因 150>125，超过许用值，故不安全。',
      'axial-chapter-quiz',
      H('先计算实际应力，再计算许用应力并比较。', '分别使用 σ=N/A 与 [σ]=σᵧ/n。', 'σ=150 MPa，[σ]=125 MPa；安全要求 σ≤[σ]。', '由于 150 MPa>125 MPa，实际应力超过许用应力，最终答案为“不安全”。'),
      '\\sigma=\\frac{N}{A},\\quad \\left[\\sigma\\right]=\\frac{\\sigma_y}{n},\\quad \\sigma\\leq\\left[\\sigma\\right]'
    )
  ];

  const curriculum = { units, levels };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = curriculum;
    module.exports.AXIAL_CURRICULUM = curriculum;
  }
  if (root) root.AXIAL_CURRICULUM = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
