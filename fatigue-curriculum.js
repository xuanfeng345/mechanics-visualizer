/* 疲劳强度课程包：8 关覆盖循环、应力幅、S-N 曲线、Basquin、Goodman、疲劳极限与安全系数。 */
(function (root) {
  'use strict';

  const units = ['疲劳载荷与 S-N 曲线', '平均应力修正与设计校核'];
  const H = (direction, method, key, full) => [direction, method, key, full];
  const L = (id, unit, title, question, answer, unitLabel, solution, conceptId, hints, formulaLatex) => ({
    id, unit, title, scene: 'fatigue', question, answer, unitLabel,
    tolerance: typeof answer === 'number' ? 0.01 : undefined,
    solution, concept: conceptId, conceptId, conceptIds: [conceptId], hints,
    formula: formulaLatex, formulaLatex, setup: null, operation: null
  });

  const levels = [
    L('fatigue-ch1-l1', 0, '疲劳循环计数',
      '试件承受频率 f=5 Hz 的周期载荷，持续 t=120 s。共经历多少个疲劳循环？',
      600, 'cycles',
      '每秒发生 f 个循环，因此循环数 N=ft=5×120=600 cycles。',
      'fatigue-cycle-count',
      H('把频率理解为每秒的循环次数。', '使用 N=ft，将频率乘以持续时间。', '代入 f=5 Hz、t=120 s，单位 Hz 等于 s⁻¹。', 'N=5×120=600，所以试件经历 600 个循环。'),
      'N=ft'
    ),
    L('fatigue-ch1-l2', 0, '应力幅',
      '循环应力的最大值为 σ_max=180 MPa，最小值为 σ_min=−60 MPa。求应力幅 σ_a。',
      120, 'MPa',
      '应力幅是最大、最小应力之差的一半：σ_a=(σ_max−σ_min)/2=(180−(−60))/2=120 MPa。',
      'stress-amplitude',
      H('应力幅不是最大应力本身，而是循环范围的一半。', '使用 σ_a=(σ_max−σ_min)/2。', '注意 σ_min 为负值，减去负数会变成加法。', 'σ_a=(180+60)/2=120 MPa。'),
      '\\sigma_a=\\frac{\\sigma_{\\max}-\\sigma_{\\min}}{2}'
    ),
    L('fatigue-ch1-l3', 0, 'S-N 曲线读数',
      '一条线性化 S-N 曲线在 log N 轴上给出：N=10⁴ 次时 σ_a=400 MPa，N=10⁶ 次时 σ_a=200 MPa。按两点线性插值，N=10⁵ 次时的应力幅是多少？',
      300, 'MPa',
      'log N 从 4 到 6，10⁵ 位于中点；应力幅也在线性化曲线上取中点：(400+200)/2=300 MPa。',
      'sn-curve-interpolation',
      H('S-N 图的横轴是 log N，不是 N 的算术间距。', '10⁵ 是 log N=5，位于 10⁴ 与 10⁶ 的中点。', '在线性化曲线上对应的纵坐标取两端平均值。', 'σ_a=(400+200)/2=300 MPa；寿命增加时允许应力幅下降。'),
      '\\sigma_a\\ \\text{vs.}\\ \\log_{10}N:\\quad \\sigma_a(10^5)=\\frac{400+200}{2}\\ \\mathrm{MPa}'
    ),
    L('fatigue-ch1-l4', 0, 'Basquin 指数',
      'Basquin 关系 σ_a=C N^b。已知 (N₁,σ₁)=(10⁴,400 MPa)、(N₂,σ₂)=(10⁶,200 MPa)，求指数 b（保留三位小数）。',
      -0.150, '无量纲',
      '本题采用教材负指数 b；场景/内核使用正指数 β=−b，即 σ_a=S_r(N/N_r)^(−β)。两点相除得 σ₂/σ₁=(N₂/N₁)^b，即 0.5=100^b。因此 b=ln(0.5)/ln(100)=−0.1505，保留三位为 −0.150。',
      'basquin-exponent',
      H('先消去材料常数 C，再求幂指数。', '使用 b=ln(σ₂/σ₁)/ln(N₂/N₁)。', 'σ₂/σ₁=200/400=0.5，N₂/N₁=10⁶/10⁴=100。', 'b=ln(0.5)/ln(100)=−0.1505，答案按三位小数填 −0.150。'),
      'b=\\frac{\\ln(\\sigma_2/\\sigma_1)}{\\ln(N_2/N_1)}'
    ),
    L('fatigue-ch1-l5', 1, 'Goodman 均值修正',
      '某循环载荷 σ_a=120 MPa、σ_m=80 MPa，材料抗拉强度 S_ut=600 MPa。按 Goodman 修正，等效全反复应力幅 σ_ar 为多少（保留一位小数）？',
      138.5, 'MPa',
      'Goodman 关系为 σ_ar=σ_a/(1−σ_m/S_ut)=120/(1−80/600)=120/0.8667≈138.5 MPa。注意：若按常用线性 Goodman 定义，等效应力应为约 138.5 MPa。',
      'goodman-mean-correction',
      H('均值为正会降低疲劳强度，因此修正后的等效幅值应大于原应力幅。', '使用 σ_ar=σ_a/(1−σ_m/S_ut)。', '先算 1−80/600=0.8667，再用 120 除以它。', '计算得 σ_ar≈138.5 MPa。'),
      '\\sigma_{ar}=\\frac{\\sigma_a}{1-\\sigma_m/S_{ut}}'
    ),
    L('fatigue-ch1-l6', 1, '疲劳极限',
      '材料在目标寿命区间的疲劳极限为 S_e=200 MPa。若完全反复载荷的应力幅为 200 MPa，允许的最大应力幅是多少？',
      200, 'MPa',
      '疲劳极限 S_e 就是该寿命区间允许的最大完全反复应力幅，因此 σ_a,max=S_e=200 MPa。实际设计通常还需考虑表面、尺寸和载荷修正。',
      'fatigue-limit',
      H('疲劳极限是给定寿命下的应力幅上限。', '完全反复载荷均值为零，可直接与 S_e 比较。', '题目已给 S_e=200 MPa。', '所以最大允许应力幅为 200 MPa，超过它将不满足该疲劳准则。'),
      '\\\\sigma_{a,\\\\max}=S_e'
    ),
    L('fatigue-ch1-l7', 1, '疲劳安全系数',
      '修正后的等效应力幅为 σ_ar=160 MPa，材料疲劳极限为 S_e=240 MPa。按应力比定义，疲劳安全系数 n 为多少？',
      1.5, '无量纲',
      '疲劳安全系数 n=S_e/σ_ar=240/160=1.5。n>1 表示在该简化准则下具有裕度。',
      'fatigue-safety-factor',
      H('安全系数是允许强度与工作需求的比值。', '使用 n=S_e/σ_ar。', '把 240 MPa 作为分子，把 160 MPa 作为分母。', 'n=240/160=1.5，无量纲。'),
      'n=\\frac{S_e}{\\sigma_{ar}}'
    ),
    L('fatigue-ch1-l8', 1, '综合迁移校核',
      '新构件 σ_max=300 MPa、σ_min=−100 MPa，S_ut=800 MPa，疲劳极限 S_e=240 MPa。先用 Goodman 修正，再求疲劳安全系数 n（保留两位小数）。',
      1.05, '无量纲',
      'σ_a=(300−(−100))/2=200 MPa，σ_m=(300+(−100))/2=100 MPa。Goodman 修正 σ_ar=200/(1−100/800)=228.57 MPa，故 n=240/228.57=1.05。',
      'fatigue-integrated-transfer',
      H('综合题必须先由最大、最小应力求幅值和均值。', '分别使用 σ_a=(σ_max−σ_min)/2、σ_m=(σ_max+σ_min)/2，再代入 Goodman。', 'σ_a=200 MPa、σ_m=100 MPa，修正分母为 1−100/800=0.875。', 'σ_ar=228.57 MPa，n=240/228.57=1.05；结果略大于 1，满足此简化校核。'),
      '\\sigma_a=\\frac{\\sigma_{\\max}-\\sigma_{\\min}}{2},\\quad \\sigma_m=\\frac{\\sigma_{\\max}+\\sigma_{\\min}}{2},\\quad n=\\frac{S_e(1-\\sigma_m/S_{ut})}{\\sigma_a}'
    )
  ];

  const curriculum = { units, levels };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = curriculum;
    module.exports.FATIGUE_CURRICULUM = curriculum;
  }
  if (root) root.FATIGUE_CURRICULUM = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
