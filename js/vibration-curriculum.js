/* 振动课程包：8 关覆盖固有频率、周期、简谐运动、阻尼与共振。 */
(function (root) {
  'use strict';

  const units = ['简谐振动基础', '阻尼与受迫振动'];
  const H = (direction, method, key, full) => [direction, method, key, full];
  const L = (id, unit, title, question, answer, unitLabel, solution, conceptId, hints, formulaLatex) => ({
    id, unit, title, scene: 'vibration',
    intro: '用质量、刚度和运动学量描述单自由度振动。',
    question, answer, unitLabel,
    tolerance: typeof answer === 'number' ? 0.01 : undefined,
    solution, concept: conceptId, conceptId, conceptIds: [conceptId],
    hints, formula: formulaLatex, formulaLatex, setup: null, operation: null
  });

  const levels = [
    L('vibration-ch1-l1', 0, '固有角频率',
      '无阻尼弹簧-质量系统的质量 m=2 kg、刚度 k=200 N/m。求固有角频率 ωₙ。',
      10, 'rad/s',
      '无阻尼单自由度系统的固有角频率为 ωₙ=√(k/m)=√(200/2)=√100=10 rad/s。',
      'natural-frequency',
      H('先辨认这是弹簧-质量系统的固有角频率。', '使用 ωₙ=√(k/m)，而不是 k/m。', '代入 k=200 N/m、m=2 kg，先算 k/m=100 s⁻²。', '开平方得 ωₙ=10 rad/s，因此填写 10。'),
      '\\omega_n=\\sqrt{\\frac{k}{m}}'
    ),
    L('vibration-ch1-l2', 0, '固有周期',
      '无阻尼系统质量 m=1 kg、刚度 k=100 N/m。求固有周期 T，取 π=3.14，答案保留三位小数。',
      0.628, 's',
      '先求 ωₙ=√(k/m)=10 rad/s，再由 T=2π/ωₙ=2×3.14/10=0.628 s。',
      'natural-period',
      H('周期是完成一次振动所需的时间。', '先求 ωₙ，再使用 T=2π/ωₙ。', 'ωₙ=√(100/1)=10 rad/s。', 'T=2×3.14/10=0.628 s，注意不要把频率与周期倒置。'),
      'T=\\frac{2\\pi}{\\omega_n}=2\\pi\\sqrt{\\frac{m}{k}}'
    ),
    L('vibration-ch1-l3', 0, '简谐位移',
      '位移为 x(t)=A cos(ωt)，其中 A=0.08 m、ω=5 rad/s。在 t=π/10 s 时，位移 x 为多少？',
      0, 'm',
      '相位 ωt=5×(π/10)=π/2，因此 x=0.08 cos(π/2)=0 m。',
      'harmonic-displacement',
      H('先计算当前相位 ωt。', '将相位代入 x=A cos(ωt)。', 'ωt=5×π/10=π/2，且 cos(π/2)=0。', '所以 x=0.08×0=0 m，质点此刻经过平衡位置。'),
      'x(t)=A\\cos(\\omega t)'
    ),
    L('vibration-ch1-l4', 0, '简谐速度',
      '位移为 x(t)=A cos(ωt)，A=0.20 m、ω=3 rad/s。在 t=π/6 s 时，速度 v 为多少？',
      -0.6, 'm/s',
      '对位移求导得 v(t)=−Aω sin(ωt)。此时 ωt=3×π/6=π/2，故 v=−0.20×3×1=−0.60 m/s。',
      'harmonic-velocity',
      H('速度是位移对时间的导数，符号表示运动方向。', '使用 v=−Aω sin(ωt)。', '相位为 π/2，sin(π/2)=1。', 'v=−0.20×3×1=−0.60 m/s；负号表示沿负方向运动。'),
      'v(t)=\\dot{x}(t)=-A\\omega\\sin(\\omega t)'
    ),
    L('vibration-ch1-l5', 0, '简谐加速度',
      '位移为 x(t)=A cos(ωt)，A=0.10 m、ω=4 rad/s。在 t=0 时，加速度 a 为多少？',
      -1.6, 'm/s²',
      '简谐运动满足 a(t)=−ω²x(t)。t=0 时 x=A=0.10 m，因此 a=−4²×0.10=−1.60 m/s²。',
      'harmonic-acceleration',
      H('加速度方向总是指向平衡位置。', '使用 a=−ω²x，或对位移二次求导。', 't=0 时 x(0)=A=0.10 m，ω²=16 s⁻²。', 'a=−16×0.10=−1.60 m/s²，负号与正向最大位移相反。'),
      'a(t)=\\ddot{x}(t)=-\\omega^2x(t)'
    ),
    L('vibration-ch1-l6', 1, '振动总能量',
      '无阻尼简谐振动的质量 m=2 kg、固有角频率 ω=3 rad/s、振幅 A=0.10 m。求系统总机械能 E。',
      0.09, 'J',
      '无阻尼简谐振动总能量 E=½mω²A²=½×2×3²×0.10²=0.09 J，动能与势能随时间交换但总和不变。',
      'vibration-energy',
      H('总能量不是某一时刻的动能，而是动能与势能之和。', '使用 E=½mω²A²。', '代入 m=2、ω=3、A=0.10，注意振幅要平方。', 'E=0.5×2×9×0.01=0.09 J。'),
      'E=\\frac{1}{2}m\\omega^2A^2=\\frac{1}{2}kA^2'
    ),
    L('vibration-ch1-l7', 1, '阻尼比',
      '黏性阻尼系统参数为 m=2 kg、k=8 N/m、阻尼系数 c=4 N·s/m。求阻尼比 ζ。',
      0.5, '无量纲',
      '临界阻尼系数 c_c=2√(mk)=2√(2×8)=8 N·s/m，阻尼比 ζ=c/c_c=4/8=0.5。',
      'damping-ratio',
      H('阻尼比要用实际阻尼与临界阻尼比较。', '先求 c_c=2√(mk)，再求 ζ=c/c_c。', '√(mk)=√16=4，所以 c_c=8 N·s/m。', 'ζ=4/8=0.5；它小于 1，属于欠阻尼系统。'),
      '\\zeta=\\frac{c}{c_c}=\\frac{c}{2\\sqrt{mk}}'
    ),
    L('vibration-ch1-l8', 1, '共振识别',
      '受迫振动的激励频率逐渐调节到接近系统固有频率，稳态振幅出现显著峰值。此现象称为什么？',
      '共振', '文本',
      '当外部激励频率接近系统固有频率并使稳态响应振幅显著放大时，称为共振（resonance）。阻尼会降低并展宽共振峰，但不改变该现象的识别。',
      'resonance-identification',
      H('关注激励频率与固有频率的关系。', '振幅在频率接近固有频率时达到峰值。', '这种大响应现象有专门名称，而不是“阻尼”或“周期”。', '现象称为“共振”，答案填写共振。'),
      '\\omega_{exc}\\approx\\omega_n\\;\\Longrightarrow\\;\\text{resonance}'
    )
  ];

  const curriculum = { units, levels };
  if (typeof module !== 'undefined' && module.exports) module.exports = curriculum;
  if (root) root.VIBRATION_CURRICULUM = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
