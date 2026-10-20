/* 应力变换课程包：8 关覆盖正应力叠加、剪应力、莫尔圆、主应力、最大剪应力、von Mises、安全系数与综合迁移。 */
(function (root) {
  'use strict';
  const units = ['平面应力变换基础', '强度判据与综合应用'];
  const H = (a, b, c, d) => [a, b, c, d];
  const L = (id, unit, title, question, answer, unitLabel, solution, conceptId, hints, formulaLatex) => ({
    id, unit, title, scene: 'stress-transform', intro: '用平面应力分量与应力变换关系分析材料点的受力状态。',
    question, answer, unitLabel, tolerance: typeof answer === 'number' ? 0.01 : undefined,
    solution, concept: conceptId, conceptId, conceptIds: [conceptId], hints,
    formula: formulaLatex, formulaLatex, setup: null, operation: null
  });
  const levels = [
    L('stress-transform-ch1-l1', 0, '正应力叠加',
      '某材料点 x 方向承受拉应力 σx=80 MPa，同时 y 方向承受压应力 σy=−20 MPa。两者代数叠加后的法向应力和为多少 MPa？',
      60, 'MPa', 'σx+σy=80+(−20)=60 MPa，拉应力取正、压应力取负。', 'normal-stress-superposition',
      H('区分两个互相垂直方向的法向应力。', '按符号约定直接作代数和。', '把压应力 −20 MPa 带入 σx+σy。', 'σ=80−20=60 MPa，因此最终答案为 60 MPa。'),
      '\\sigma_{\\mathrm{sum}}=\\sigma_x+\\sigma_y'
    ),
    L('stress-transform-ch1-l2', 0, '剪应力',
      '截面受到切向力 V=12 kN，面积 A=400 mm²。按平均剪应力 τ=V/A，剪应力为多少 MPa？',
      30, 'MPa', 'τ=V/A=12000 N/400 mm²=30 N/mm²=30 MPa。', 'shear-stress-average',
      H('剪应力由切向力除以受剪面积得到。', '使用 τ=V/A，并统一力和面积单位。', '12 kN=12000 N，1 N/mm²=1 MPa。', 'τ=12000/400=30 N/mm²，所以最终答案为 30 MPa。'),
      '\\tau=\\frac{V}{A}'
    ),
    L('stress-transform-ch1-l3', 0, '莫尔圆',
      '平面应力为 σx=80 MPa、σy=−20 MPa、τxy=30 MPa。求莫尔圆半径 R（MPa），保留两位小数。',
      58.31, 'MPa', 'R=√[((σx−σy)/2)²+τxy²]=√(50²+30²)=58.3095 MPa≈58.31 MPa。', 'mohr-circle-radius',
      H('莫尔圆半径反映法向应力差与剪应力的合成效应。', '使用 R=√[((σx−σy)/2)²+τxy²]。', 'σx−σy=100 MPa，半差为 50 MPa。', 'R=√(2500+900)=√3400=58.31 MPa。'),
      'R=\\sqrt{\\left(\\frac{\\sigma_x-\\sigma_y}{2}\\right)^2+\\tau_{xy}^2}'
    ),
    L('stress-transform-ch1-l4', 0, '主应力',
      '承接 σx=80 MPa、σy=−20 MPa、τxy=30 MPa。求最大主应力 σ1（MPa），保留两位小数。',
      88.31, 'MPa', '圆心 C=(80−20)/2=30 MPa，半径 R=58.3095 MPa；σ1=C+R=88.31 MPa。', 'principal-stress',
      H('主应力是剪应力为零的两个正应力。', '用 σ1,2=C±R。', '先算 C=(σx+σy)/2=30 MPa，再加上上一关半径。', 'σ1=30+58.3095=88.31 MPa。'),
      '\\sigma_{1,2}=\\frac{\\sigma_x+\\sigma_y}{2}\\pm\\sqrt{\\left(\\frac{\\sigma_x-\\sigma_y}{2}\\right)^2+\\tau_{xy}^2}'
    ),
    L('stress-transform-ch1-l5', 1, '最大剪应力',
      '对 σx=80 MPa、σy=−20 MPa、τxy=30 MPa 的平面应力状态，最大面内剪应力 τmax 为多少 MPa？',
      58.31, 'MPa', '最大面内剪应力等于莫尔圆半径：τmax=R=58.3095 MPa≈58.31 MPa。', 'maximum-shear-stress',
      H('最大剪应力对应莫尔圆的上下端点。', '在平面应力中 τmax=(σ1−σ2)/2=R。', '使用前面算出的 R=58.31 MPa。', '因此 τmax=58.31 MPa；不要把 τxy=30 MPa 当成变换后的最大值。'),
      '\\tau_{\\max}=R=\\frac{\\sigma_1-\\sigma_2}{2}'
    ),
    L('stress-transform-ch1-l6', 1, 'von Mises 等效应力',
      '平面应力 σx=80 MPa、σy=−20 MPa、τxy=30 MPa。求 von Mises 等效应力 σvm（MPa），保留两位小数。',
      105.36, 'MPa', 'σvm=√(σx²−σxσy+σy²+3τxy²)=√11100=105.3565 MPa≈105.36 MPa。', 'von-mises-plane-stress',
      H('von Mises 判据把正应力和剪应力合成为一个等效应力。', '使用平面应力 von Mises 公式。', '代入 80、−20、30，注意 −σxσy 项变为正。', 'σvm=√(6400+1600+400+2700)=√11100=105.36 MPa。'),
      '\\sigma_{\\mathrm{vm}}=\\sqrt{\\sigma_x^2-\\sigma_x\\sigma_y+\\sigma_y^2+3\\tau_{xy}^2}'
    ),
    L('stress-transform-ch1-l7', 1, '安全系数',
      '材料屈服应力 σy=250 MPa，当前平面应力状态的 von Mises 应力为 105.36 MPa。按 n=σy/σvm，安全系数为多少？保留两位小数。',
      2.37, '无量纲', 'n=σy/σvm=250/105.3565=2.3725≈2.37。n>1 表示按 von Mises 屈服判据尚未屈服。', 'von-mises-safety-factor',
      H('安全系数是承载极限与当前等效应力之比。', '使用 n=σy/σvm。', '分子取 250 MPa，分母取 105.36 MPa。', 'n=250/105.3565=2.37；单位相除后为无量纲。'),
      'n=\\frac{\\sigma_y}{\\sigma_{\\mathrm{vm}}}'
    ),
    L('stress-transform-ch1-l8', 1, '综合迁移：任意面应力变换',
      '新应力状态 σx=100 MPa、σy=−40 MPa、τxy=25 MPa。将坐标面逆时针旋转 θ=30°，求新法向应力 σx′（MPa），保留两位小数。',
      86.65, 'MPa', 'σx′=(σx+σy)/2+(σx−σy)cos2θ/2+τxy sin2θ=30+35×0.5+25×0.866025=86.6506 MPa≈86.65 MPa。', 'stress-transformation-transfer',
      H('综合题需同时处理圆心、应力差和旋转角。', '使用平面应力变换的 σx′ 公式，角度必须进入 2θ。', 'θ=30°，所以 cos60°=0.5、sin60°≈0.8660。', 'σx′=30+35(0.5)+25(0.8660)=86.65 MPa；正号取决于题设剪应力方向约定。'),
      '\\sigma_{x\\prime}=\\frac{\\sigma_x+\\sigma_y}{2}+\\frac{\\sigma_x-\\sigma_y}{2}\\cos 2\\theta+\\tau_{xy}\\sin 2\\theta'
    )
  ];
  const extras=(typeof module!=='undefined'&&module.exports?require('./materials-lessons'):root.MaterialsLessons)?.create('stress-transform',units.length);
  if(extras){units.push(...extras.units);levels.push(...extras.levels);}
  const curriculum = { units, levels };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = curriculum;
    module.exports.STRESS_TRANSFORM_CURRICULUM = curriculum;
  }
  if (root) root.STRESS_TRANSFORM_CURRICULUM = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
