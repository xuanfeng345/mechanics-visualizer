/* 静力学操练场扩充课程：独立于旧三关进度。 */
(function (root) {
  'use strict';
  const units = ['力矩与力臂', '约束与受力图', '平衡方程', '静摩擦', '综合迁移'];
  const H = (direction, method, key, full) => [direction, method, key, full];
  const S = (x=.8, F=20, theta=90, support=true) => ({x, F, theta, support});
  const L = (id, unit, title, scene, intro, question, answer, solution, concept, hints, setup, operation=null, unitLabel='SI') => ({
    id, unit, title, scene, intro, question, answer, unitLabel, tolerance: .01, solution, concept, hints, setup, operation
  });
  const levels = [
    L('statics-u0-l1',0,'中点力矩','lever','水平杆长2 m，重力20 N作用在中点。','在 x=1.5 m、θ=90° 处施力，平衡所需 F 为多少 N？',40/3,'取 A 点矩：1.5F−20×1=0，所以 F=13.333… N。','moment-about-point',H('先找各力到铰点的力臂。','列关于 A 的力矩和为零。','M_A=xFsinθ−20×1=0。','代入 x=1.5、θ=90°：1.5F−20=0，故最后答案 F=13.333… N（约13.33 N）。'),S(1.5,20,90,true),{kind:'balance',target:'moment-about-point'}),
    L('statics-u0-l2',0,'斜向力矩','lever','仍为长2 m、重20 N的铰杆，只有力的竖直分量产生关于 A 的矩。','x=1 m、θ=30° 时，平衡所需 F 为多少 N？',40,'分解 F 的竖直分量并取矩：xFsinθ=20。','moment-about-point',H('只保留垂直于杆的分量。','用 F_y=Fsinθ 代入力矩式。','xFsinθ−20=0。','1×F×sin30°=20，sin30°=0.5，所以最后答案 F=40 N。'),S(1,20,30,true),null),
    L('statics-u0-l3',0,'力臂与作用点','lever','外力竖直向上，重力仍为20 N且作用于中点。','F=20 N、θ=90° 时，平衡作用点 x 为多少 m？',1,'由 xF−20=0 得 x=1 m，恰为重力作用线位置。','moment-about-point',H('未知量是作用点而不是力。','令外力矩等于重力矩。','x×20=20×1。','解得最后答案 x=1 m；在允许范围0.2≤x≤2内。'),S(1,20,90,true),{kind:'balance',target:'moment-about-point'}),
    L('statics-u0-l4',0,'合矩辨析','lever','零合矩只说明转动趋势抵消，不自动说明平动平衡。','无支座时 x=2 m、θ=90°、F=10 N，合矩为零吗？答案请填“是”或“否”。','是','M_A=2×10−20×1=0，所以合矩为零；但竖直合力仍不为零。','equilibrium-equations',H('分别检查力矩和合力。','先算外力矩，不要把支座反力算入无支座情形。','M= xFsinθ−20。','代入得到20−20=0，因此最后答案是“是”；这不代表物体平衡。'),S(2,10,90,false),{kind:'noSupportCounterexample',momentZero:true}),

    L('statics-u1-l1',1,'铰支座 FBD','support','铰支座可提供两个正交反力分量，但不提供独立力偶。','对 A 铰支承的平面杆，未知支反力分量有几个？',2,'铰支座反力写成 Rx、Ry 两个未知量。','free-body-diagram',H('观察约束阻止哪些平移。','把支反力按 x、y 分解。','铰支座：Rx、Ry，共两个未知量。','因此最后答案为2个独立反力分量；它不能单独提供反力矩。'),S(),null),
    L('statics-u1-l2',1,'滚轮与固定端','support','比较三种常见约束的反力数目。','理想滚轮、平面铰、固定端的独立约束反力数目依次是多少？', '1、2、3','滚轮只给法向反力；铰给 Rx、Ry；固定端还给力矩。','constraints-reactions',H('按可阻止的自由度计数。','分别列出法向力、两个分量和约束偶矩。','滚轮=1，铰=2，固定端=3。','所以最后答案是“1、2、3”（滚轮、平面铰、固定端）。'),S(),null),
    L('statics-u1-l3',1,'反力方向','lever','铰杆平衡时，反力由外载荷的分量决定。','x=1 m、F=40 N、θ=30° 时，Rx 为多少 N？',-40*Math.cos(Math.PI/6),'Rx=−Fcosθ，负号表示实际方向与所取正方向相反。','equilibrium-equations',H('先只写水平力平衡。','铰反力与外力水平分量相反。','Rx+Fcosθ=0。','Rx=−40cos30°=−20√3≈−34.641 N，最后答案为−34.641 N。'),S(1,40,30,true),{kind:'balance',target:'reactionX'}),
    L('statics-u1-l4',1,'约束选择','support','同一外载荷换不同约束，未知反力数会改变。','要同时抵抗水平和竖直平移、但不需要约束转动，选择“滚轮/铰/固定端”中的哪一种？','铰','平面铰提供 Rx、Ry 两个分量，允许转动。','constraints-reactions',H('看题目要求抵抗的自由度。','水平、竖直都要约束，转动要放开。','需要两个力分量且没有约束偶矩。','故最后答案是“铰”。'),S(),null),

    L('statics-u2-l1',2,'铰杆平衡三式','lever','铰支座下采用 ΣFx=ΣFy=ΣMA=0。','x=1 m、F=40 N、θ=30° 时，Ry 为多少 N？',0,'Ry=20−Fsinθ=20−40×0.5=0。','equilibrium-equations',H('先取竖直方向平衡。','重力向下与外力竖直分量相加，再由 Ry 抵消。','Ry=20−Fsinθ。','代入后 Ry=20−40×0.5=0 N，最后答案为0 N。'),S(1,40,30,true),{kind:'balance',target:'reactionY'}),
    L('statics-u2-l2',2,'简支梁反力','beam','4 m 简支梁，集中载荷 P=20 kN 作用在距左支座 a=1 m 处。','左、右支座竖向反力分别是多少 kN？', '15、5','取左支座矩：R_B×4=20×1，再用竖向平衡。','equilibrium-equations',H('先对左支座取矩。','用跨长4 m和载荷位置1 m联立竖向平衡。','R_B=Pa/L，R_A=P−R_B。','R_B=20×1/4=5 kN，R_A=20−5=15 kN；最后答案（左、右）为15、5 kN。'),S(1,20,90,true),null,'kN'),
    L('statics-u2-l3',2,'梁反力迁移','beam','仍用简支梁理论，但将集中载荷位置换成 a=2 m；这是从基准题迁移的理论计算。','4 m 梁上 P=20 kN 位于距左支座2 m处，左反力是多少 kN？',10,'对左支座取矩或用 R_A=P(L−a)/L。','equilibrium-equations',H('载荷在跨中，左右对称。','取左支座矩并用竖向平衡。','R_A=P(4−2)/4。','R_A=20×2/4=10 kN，最后答案为10 kN；这是理论题，不要求控件改变梁参数。'),S(),null,'kN'),
    L('statics-u2-l4',2,'平行三力例外','beam','平行三力平衡可用合力和合矩同时为零；不能只看合矩。','两竖直向下力合计30 N，支承竖直向上30 N且作用线通过合力位置，能否平衡？填“能/不能”。','能','三力合力为零，且合力作用线重合使合矩为零。','equilibrium-equations',H('检查平动和转动两个条件。','把两向下力合成为30 N。','ΣFy=0 且 ΣM=0。','两条件均满足，故最后答案是“能”；这是平行三力的正常平衡例子。'),S(),null),

    L('statics-u3-l1',3,'摩擦上限','friction','斜面角30°、物重100 N、μ=0.4。先区分静止所需摩擦与可提供的上限。','静止所需摩擦力大小是多少 N？',50,'沿斜面分解重力：Wsin30°=50 N。','moment-about-point',H('先求沿斜面的下滑分量。','静止时摩擦力抵消该分量。','f_req=Wsinα。','f_req=100×0.5=50 N，最后答案为50 N；并需检查不超过μN。'),{alpha:30,mu:.4},null),
    L('statics-u3-l2',3,'静摩擦判据','friction','静摩擦不是总等于 μN，而是按需要取值且有上限。','本题 N=100cos30° N，μ=0.4；50 N 静摩擦需求是否可满足？填“能/不能”。','不能','f_max=μN=0.4×100cos30°≈34.641 N，小于需求50 N。','constraints-reactions',H('先算法向力，再算上限。','比较需求值与 μN，而非直接令 f=μN。','f_req≤μN 才能静止。','μN=34.641 N<50 N，故最后答案是“不能”，物体将下滑。'),{alpha:30,mu:.4},null),
    L('statics-u3-l3',3,'临界角','friction','保持 μ=0.4，先把斜面调到可以静止；再计算从静止过渡到下滑的临界角。','μ=0.4 时临界角 α_c 为多少度？（保留两位小数）',Math.atan(.4)*180/Math.PI,'临界条件 Wsinα=μWcosα，约去 W 得 tanα=μ。','constraints-reactions',H('写临界而非一般静止条件。','两边除以Wcosα。','tanα_c=μ。','α_c=arctan(0.4)=21.801°，最后答案约21.80°。'),{alpha:30,mu:.4},{kind:'frictionStatic',alpha:Math.atan(.4)*180/Math.PI,mu:.4,selectable:true}),
    L('statics-u3-l4',3,'摩擦方向','friction','物体有下滑趋势时，静摩擦沿斜面向上。','30°斜面上物体静止，摩擦力方向是“向上/向下”斜面？','向上','重力沿斜面的分量向下，因此摩擦反向，沿斜面向上。','free-body-diagram',H('判断相对运动趋势。','沿斜面只看重力分量方向。','摩擦力反向于潜在滑动。','潜在下滑方向向下，所以最后答案是“向上”斜面；大小只有所需值而不超过上限。'),{alpha:30,mu:.8},null),

    L('statics-u4-l1',4,'综合：三分量','lever','用同一铰杆模型同时检查力矩与两方向反力。','x=0.5 m、F=40 N、θ=90°，铰支座的 Ry 为多少 N？',-20,'M_A=0.5×40−20×1=0，且 Ry=20−40=−20。','equilibrium-equations',H('先验矩，再验力。','分别使用矩方程和竖直平衡。','Ry=20−Fsinθ。','M_A=0 且 Ry=20−40=−20 N，故最后答案为−20 N（负号表示向下）。'),S(0.5,40,90,true),null),
    L('statics-u4-l2',4,'综合：无支座','lever','无支座刚体必须同时满足合力与合矩为零。','无支座时，若合矩为零但水平合力为10 N，能否静止？填“能/不能”。','不能','ΣFx≠0，虽可能ΣM=0仍会平动。','equilibrium-equations',H('不要把零矩当成完整平衡。','检查三个平衡条件。','ΣFx=ΣFy=ΣM=0。','水平合力10 N不为零，所以最后答案是“不能”。'),S(2,10,90,false),{kind:'noSupportCounterexample',momentZero:true}),
    L('statics-u4-l3',4,'综合：拉索','lever','拉索张力只按其方向提供分量。','要提供30 N竖直分量，θ=30°，张力 T 为多少 N？',60,'Tsin30°=30，故 T=60 N。','moment-about-point',H('取张力的竖直分量。','令 T_y 等于所需30 N。','Tsin30°=30。','sin30°=0.5，所以最后答案 T=60 N。'),S(2/3,60,30,true),{kind:'tension',verticalComponent:30}),
    L('statics-u4-l4',4,'综合：摩擦与约束','friction','先调整画面使块体能够静止。随后独立判断另一工况，题目给定的力不等于当前画面数值。','若所需静摩擦 f_req=30 N、法向力 N=100 N、μ=0.4，能否静止？填“能/不能”。','能','f_max=μN=40 N，30≤40，故静止可行。','constraints-reactions',H('先计算摩擦上限。','比较需求而不是把摩擦固定为上限。','f_req≤μN。','μN=0.4×100=40 N，且30≤40，因此最后答案是“能”。'),{alpha:Math.atan(.3)*180/Math.PI,mu:.8},{kind:'frictionStatic',alpha:Math.atan(.3)*180/Math.PI,mu:.8,selectable:true})
  ];
  const curriculum = {units, levels};
  if (typeof module !== 'undefined' && module.exports) module.exports = curriculum;
  if (root) root.STATICS_CURRICULUM = curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
