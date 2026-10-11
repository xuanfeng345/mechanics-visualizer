/* 扭转课程包：8 关覆盖扭矩、极惯性矩、剪应力、扭转角、剪切模量、强度校核、刚度校核、综合迁移。 */
(function (root) {
  'use strict';
  const units = ['圆轴扭转基础', '扭转设计与综合应用'];
  const H = (a,b,c,d) => [a,b,c,d];
  const L = (id, unit, title, question, answer, unitLabel, solution, conceptId, hints, formulaLatex) => ({
    id, unit, title, scene: 'torsion', intro: '用扭矩、截面几何和材料参数描述圆轴扭转。', question, answer, unitLabel,
    tolerance: typeof answer === 'number' ? 0.01 : undefined, solution, concept: conceptId, conceptId,
    conceptIds: [conceptId], hints, formula: formulaLatex, formulaLatex, setup: null, operation: null
  });
  const levels = [
    L('torsion-ch1-l1',0,'扭矩定义','切向力 F=100 N 作用在力臂 r=0.30 m 的圆轴上。求扭矩 T。',30,'N·m','T=Fr=100×0.30=30 N·m。','torque-definition',H('辨认力矩由力和力臂决定。','使用 T=Fr。','代入 F=100、r=0.30。','T=100×0.30=30 N·m。'),'T=Fr'),
    L('torsion-ch1-l2',0,'极惯性矩','实心圆轴直径 d=20 mm。求极惯性矩 J（mm⁴），取 π=3.1415926。',15707.963,'mm⁴','J=πd⁴/32=3.1415926×20⁴/32=15707.963 mm⁴。','polar-moment',H('极惯性矩描述截面抗扭几何特性。','实心圆用 J=πd⁴/32。','先算 20⁴=160000。','J=15707.963 mm⁴。'),'J=\\frac{\\pi d^4}{32}'),
    L('torsion-ch1-l3',0,'剪应力','实心圆轴 T=100 N·m、d=40 mm。求外缘最大剪应力 τ_max（MPa）。',7.958,'MPa','J=πd⁴/32=251327.4 mm⁴，c=20 mm；τ=Tc/J=(100000×20)/251327.4=7.958 MPa。','torsional-shear-stress',H('最大剪应力在外表面。','使用 τ=Tc/J。','T 换成 100000 N·mm，c=20 mm。','τ=7.958 N/mm²=7.958 MPa。'),'\\tau=\\frac{Tc}{J}'),
    L('torsion-ch1-l4',0,'扭转角','均匀圆轴 T=500 N·m、L=1 m、G=80 GPa、J=1.0×10⁻⁶ m⁴。求扭转角 θ（rad）。',0.00625,'rad','θ=TL/(GJ)=500/(80×10⁹×10⁻⁶)=0.00625 rad。','angle-of-twist',H('扭转角由载荷、长度、材料和截面共同决定。','使用 θ=TL/(GJ)。','GJ=80000 N·m²。','θ=500/80000=0.00625 rad。'),'\\theta=\\frac{TL}{GJ}'),
    L('torsion-ch1-l5',0,'剪切模量','各向同性材料 E=200 GPa、ν=0.25。求剪切模量 G（GPa）。',80,'GPa','G=E/[2(1+ν)]=200/[2(1.25)]=80 GPa。','shear-modulus',H('剪切模量与 E、ν 相关。','使用 G=E/[2(1+ν)]。','分母 2(1+0.25)=2.5。','G=200/2.5=80 GPa。'),'G=\\frac{E}{2(1+\\nu)}'),
    L('torsion-ch1-l6',1,'强度校核','实心圆轴 T=120 N·m、d=30 mm，许用剪应力 [τ]=40 MPa。强度是否满足？填“满足”或“不满足”。','满足','文本','J=79521.6 mm⁴、c=15 mm；τ_max=120000×15/79521.6=22.64 MPa≤40 MPa，满足。','torsion-strength-check',H('比较实际最大剪应力和许用值。','先用 τ=Tc/J。','算得 τ_max≈22.64 MPa。','22.64≤40，所以满足。'),'\\tau_{\\max}=\\frac{Tc}{J}\\leq[\\tau]'),
    L('torsion-ch1-l7',1,'刚度校核','实心圆轴 T=200 N·m、L=1.5 m、d=25 mm、G=80 GPa，许用扭转角 2°。刚度是否满足？填“满足”或“不满足”。','不满足','文本','J=πd⁴/32≈3.835×10⁻⁸ m⁴；θ=TL/(GJ)≈0.0978 rad=5.60°>2°，不满足。','torsion-stiffness-check',H('刚度校核比较扭转角。','使用 θ=TL/(GJ)。','d=0.025 m，J≈3.835×10⁻⁸ m⁴。','θ≈5.60°超过 2°，故不满足。'),'\\theta=\\frac{TL}{GJ}\\leq[\\theta]'),
    L('torsion-ch1-l8',1,'综合迁移','空心圆轴 d_o=50 mm、d_i=30 mm，T=800 N·m。求外表面最大剪应力（MPa）。',37.45,'MPa','J=π(d_o⁴−d_i⁴)/32=5.341×10⁻⁷ m⁴，c=0.025 m；τ=Tc/J=37.45 MPa。','torsion-transfer',H('空心轴需扣除内孔的惯性贡献。','先用空心圆 J，再用 τ=Tc/J。','统一 d_o=0.05、d_i=0.03、c=0.025 m。','J=5.341×10⁻⁷ m⁴，τ=37.45 MPa。'),'J=\\frac{\\pi(d_o^4-d_i^4)}{32},\\quad \\tau_{\\max}=\\frac{Tc}{J}')
  ];
  const curriculum = { units, levels };
  if (typeof module !== 'undefined' && module.exports) { module.exports = curriculum; module.exports.TORSION_CURRICULUM = curriculum; }
  if (root) root.TORSION_CURRICULUM = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
