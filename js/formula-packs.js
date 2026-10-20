/* Scene-specific teaching steps. TeX is explicit; equations follow the scene's model. */
(function(root){
  'use strict';
  const packs={
    'axial-bar':[
      ['求平均应力',String.raw`\sigma=\frac{N}{A}`,'等截面杆轴向受力时，应力在截面上按平均值处理。拉为正、压为负；N/mm² 等于 MPa。','#alternateScene rect'],
      ['建立本构',String.raw`\varepsilon=\frac{\sigma}{E}`,'线弹性、小应变条件下，应变与应力成正比；超过材料屈服范围后不能继续把这个关系当作真实塑性响应。','#alternateScene path,#alternateScene rect'],
      ['计算伸长',String.raw`\Delta L=\varepsilon L=\frac{NL}{EA}`,'当前使用 N、mm、MPa 单位制，计算得到的伸长也是 mm。图中变形放大显示。','#alternateScene rect,#alternateScene line'],
      ['检查许用值',String.raw`\begin{aligned}[\sigma]&=\frac{\sigma_y}{n}\\\eta&=\frac{|\sigma|}{[\sigma]}\leq1\end{aligned}`,'许用应力包含安全系数；超过许用值不等于已经屈服。分别检查工程许用界限与屈服强度。','#alternateScene rect']
    ],
    'particle-dynamics':[
      ['从力求加速度',String.raw`\mathbf a=\frac{\sum\mathbf F}{m}`,'使用合外力的矢量和，分别计算水平与竖直分量。当前场景假设合力在观察时段内恒定。','#alternateScene .force,#alternateScene .acceleration'],
      ['保留初速度',String.raw`\begin{aligned}\mathbf v&=\mathbf v_0+\mathbf a t\\\Delta\mathbf r&=\mathbf v_0t+\tfrac12\mathbf a t^2\end{aligned}`,'加速度是速度的变化率，不是速度本身。蓝色表示速度，紫色表示加速度。','#alternateScene .velocity,#alternateScene .acceleration'],
      ['检查冲量',String.raw`\mathbf J=\mathbf F t=\Delta\mathbf p=m(\mathbf v-\mathbf v_0)`,'恒力冲量等于动量变化；注意这是矢量关系，不能仅将力的大小相加。','#alternateScene .force,#alternateScene .velocity'],
      ['检查功能关系',String.raw`W=\mathbf F\cdot\Delta\mathbf r=\tfrac12m(v^2-v_0^2)`,'恒力的功等于动能增量。力与位移不平行时必须取点积。','#alternateScene .force,#alternateScene .velocity']
    ],
    'rigid-body':[
      ['质心平动',String.raw`\sum\mathbf F=m\mathbf a_C`,'合外力决定质心加速度。画面是初始静止、恒定水平合力的简化平面运动，位移经过压缩显示。','#alternateScene rect'],
      ['绕质心转动',String.raw`\sum M_C=I_C\alpha`,'一般平面运动可绕质心列转动方程；力矩与转动惯量必须关于同一条质心轴。','#alternateScene rect'],
      ['积分到观察时刻',String.raw`\begin{aligned}v_C&=a_Ct,\quad x_C=\tfrac12a_Ct^2\\\omega&=\alpha t,\quad\varphi=\tfrac12\alpha t^2\end{aligned}`,'当前场景初始速度与初始角速度均为零，且合力、合力矩恒定；这些公式不能直接套到任意变载荷。','#alternateScene rect,#alternateScene line'],
      ['合计动能',String.raw`T=\tfrac12mv_C^2+\tfrac12I_C\omega^2`,'刚体动能分为质心平动与绕质心转动两部分，不能漏掉其中一项。','#alternateScene rect']
    ],
    lagrangian:[
      ['选择广义坐标',String.raw`q=x,\qquad\dot q=\frac{\mathrm dq}{\mathrm dt}`,'当前模型是一个自由度的弹簧质量系统，用一个位移坐标描述构型。这里不是单摆模型。','#alternateScene rect,#alternateScene circle'],
      ['建立能量',String.raw`T=\tfrac12m\dot q^2,\qquad V=\tfrac12kq^2`,'动能取决于广义速度，势能取决于离平衡位置的位移；注意两者单位都为 J。','#alternateScene path,#alternateScene circle'],
      ['列拉格朗日方程',String.raw`\begin{aligned}\mathcal L&=T-V\\\frac{\mathrm d}{\mathrm dt}\frac{\partial\mathcal L}{\partial\dot q}-\frac{\partial\mathcal L}{\partial q}&=0\end{aligned}`,'当前无阻尼、无外部广义力。对广义坐标和广义速度分别求偏导，再对时间求导。','#alternateScene path,#alternateScene rect'],
      ['求运动并验证',String.raw`\begin{aligned}m\ddot q+kq&=0,\quad\omega_n=\sqrt{k/m}\\q(t)&=q_0\cos\omega_nt+\frac{\dot q_0}{\omega_n}\sin\omega_nt\end{aligned}`,'解中保留两个初始条件。无外力、无阻尼时，T+V 守恒，而拉格朗日量 T−V 一般并不守恒。','#alternateScene circle,#alternateScene path']
    ],
    torsion:[
      ['计算截面惯性矩',String.raw`J=\frac{\pi r^4}{2}=\frac{\pi d^4}{32}`,'当前是均匀实心圆轴。注意控件输入半径 r，不是直径 d；J 的单位为 m⁴。','#alternateScene circle'],
      ['观察剪应力分布',String.raw`\tau(\rho)=\frac{T\rho}{J},\qquad|\tau|_{\max}=\frac{|T|r}{J}`,'剪应力沿半径线性变化：中心为零，表面最大。扭矩改变符号时剪应力方向改变。','#alternateScene circle,#alternateScene line'],
      ['计算扭转角',String.raw`\varphi=\frac{TL}{GJ}`,'线弹性 Saint-Venant 圆轴扭转，G 与应力使用 Pa，长度用 m，扭转角为 rad；显示成角度时乘 180/π。','#alternateScene path,#alternateScene line'],
      ['检查强度与刚度',String.raw`|\tau|_{\max}\leq[\tau],\qquad|\varphi|\leq[\varphi]`,'强度校核控制剪应力，刚度校核控制扭转角。只有明确许用值后才能判断是否满足。','#alternateScene circle,#alternateScene path']
    ],
    'stress-transform':[
      ['确定应力状态',String.raw`[\sigma]=\begin{bmatrix}\sigma_x&\tau_{xy}\\\tau_{xy}&\sigma_y\end{bmatrix}`,'当前是平面应力。先看清正应力、剪应力及旋转角的约定，再比较旋转后分量。','#alternateScene rect,#alternateScene line'],
      ['旋转截面',String.raw`\begin{aligned}\sigma_{x'}&=\tfrac{\sigma_x+\sigma_y}{2}+\tfrac{\sigma_x-\sigma_y}{2}\cos2\theta+\tau_{xy}\sin2\theta\\\tau_{x'y'}&=-\tfrac{\sigma_x-\sigma_y}{2}\sin2\theta+\tau_{xy}\cos2\theta\end{aligned}`,'莫尔圆的转角是实际截面角的两倍。转动坐标不改变实际应力状态。','#alternateScene rect,#alternateScene circle'],
      ['求主应力',String.raw`\begin{aligned}C&=\frac{\sigma_x+\sigma_y}{2}\\R&=\sqrt{\left(\frac{\sigma_x-\sigma_y}{2}\right)^2+\tau_{xy}^2}\\\sigma_{1,2}&=C\pm R\end{aligned}`,'主平面上剪应力为零，面内最大剪应力为莫尔圆半径 R；三维最大剪应力还要计入第三主应力零。','#alternateScene circle'],
      ['计算等效应力',String.raw`\sigma_{\mathrm{vM}}=\sqrt{\sigma_x^2-\sigma_x\sigma_y+\sigma_y^2+3\tau_{xy}^2}`,'这是平面应力的 von Mises 等效应力。它在坐标旋转后不变，常用于延性材料的屈服比较。','#alternateScene circle,#alternateScene rect']
    ],
    'beam-material':[
      ['求支反力',String.raw`R_A=\frac{P(L-a)}{L},\qquad R_B=\frac{Pa}{L}`,'当前为简支梁、单个向下集中力。载荷必须在梁跨内；反力由整体平衡决定，与 EI 无关。','#alternateScene line'],
      ['从剪力到弯矩',String.raw`\begin{aligned}V(x)&=\begin{cases}R_A&x<a\\R_A-P&x>a\end{cases}\\M(x)&=\begin{cases}R_Ax&x\leq a\\R_Ax-P(x-a)&x\geq a\end{cases}\end{aligned}`,'集中力处剪力发生跳跃，弯矩保持连续。当前单点载荷下最大弯矩位于载荷位置。','#alternateScene path'],
      ['求弯曲应力',String.raw`|\sigma|_{\max}=\frac{|M|_{\max}c}{I}`,'c 为所考察最外缘到中性轴的距离。采用平截面与线弹性假设；Pa 换 MPa 时除以 10⁶。','#alternateScene path'],
      ['理解挠度',String.raw`EI\,v''(x)=-M(x),\qquad v(0)=v(L)=0`,'这里挠度向下取正，正弯矩采用下缘受拉的约定，因此曲率关系含负号。提高 EI 会减小挠度，但不改变静定梁的反力。','#alternateScene path']
    ],
    buckling:[
      ['确定有效长度',String.raw`L_e=KL`,'端部约束通过有效长度系数 K 进入模型。不要把不同端条件的柱直接按同一个长度比较。','#alternateScene path,#alternateScene line'],
      ['计算 Euler 临界力',String.raw`P_{\mathrm{cr}}=\frac{\pi^2EI}{(KL)^2}`,'只适用于理想细长、线弹性、轴心受压柱。长度加倍时临界力变为四分之一。','#alternateScene path'],
      ['检查长细比',String.raw`i=\sqrt{\frac IA},\qquad\lambda=\frac{KL}{i}`,'截面回转半径 i 与长细比描述柱的细长程度。短柱、材料屈服与初始缺陷需要另外的模型。','#alternateScene path,#alternateScene line'],
      ['比较工作载荷',String.raw`\eta=\frac{P}{P_{\mathrm{cr}}},\qquad n=\frac{P_{\mathrm{cr}}}{P}`,'P 达到临界力时已处于理想稳定边界，不能当作具有安全裕量。零载荷时安全系数为无穷大。','#alternateScene path']
    ],
    fatigue:[
      ['区分应力幅与均值',String.raw`\sigma_a=\frac{\sigma_{\max}-\sigma_{\min}}2,\qquad\sigma_m=\frac{\sigma_{\max}+\sigma_{\min}}2`,'疲劳需要描述循环载荷。应力幅不是最大应力；相同应力幅也可能对应不同平均应力。','#alternateScene path,#alternateScene circle'],
      ['修正平均应力',String.raw`\sigma_{a,\mathrm{eq}}=\frac{n\sigma_a}{1-\sigma_m/\sigma_u}`,'当前 Goodman 修正后再乘安全系数 n，且只乘一次。平均应力必须小于抗拉强度；这是简化经验模型。','#alternateScene path,#alternateScene circle'],
      ['由 S–N 曲线求寿命',String.raw`\begin{aligned}\sigma_{a,\mathrm{eq}}&=\sigma_{\mathrm{ref}}\left(\frac{N}{N_{\mathrm{ref}}}\right)^{-\beta}\\N&=N_{\mathrm{ref}}\left(\frac{\sigma_{\mathrm{ref}}}{\sigma_{a,\mathrm{eq}}}\right)^{1/\beta}\end{aligned}`,'控件采用正指数 β，等价于教材中常见的负斜率 b=−β。寿命对幅值和指数十分敏感。','#alternateScene path'],
      ['识别模型边界',String.raw`\sigma_{a,\mathrm{eq}}\leq S_e\ \Longrightarrow\ N=\infty\quad\text{(模型内)}`,'只有设置了正疲劳极限 Se 才启用此分支；零应力幅也返回无限寿命。模型内无限不代表真实结构永久不会失效。','#alternateScene path,#alternateScene circle']
    ]
  };
  function create(scene,p={}){
    if(scene==='materials-lab')return (typeof module!=='undefined'&&module.exports?require('./materials-lab'):root.MaterialsLab).steps(p);
    if(scene==='beam-material'){
      const cant=p.support==='cantilever',uniform=p.loadType==='uniform';
      const reaction=cant?(uniform?String.raw`R_A=qL,\quad M_A=\frac{qL^2}{2}`:String.raw`R_A=P,\quad M_A=Pa`):(uniform?String.raw`R_A=R_B=\frac{qL}{2}`:String.raw`R_A=\frac{P(L-a)}{L},\quad R_B=\frac{Pa}{L}`);
      const internal=uniform?String.raw`\begin{aligned}V(x)&=R_A-qx\\M(x)&=R_Ax-`+(cant?String.raw`M_A-`:'')+String.raw`\frac{qx^2}{2}\end{aligned}`:String.raw`\begin{aligned}V(x)&=R_A-PH(x-a)\\M(x)&=R_Ax-`+(cant?String.raw`M_A-`:'')+String.raw`P\langle x-a\rangle\end{aligned}`;
      return [
        ['整体平衡',reaction,(cant?'左端固定，反力矩 MA 以逆时针为正；它与梁内负弯矩不同。':'简支支座只提供力，端部弯矩为零。')+'反力不依赖 EI。','#alternateScene [data-guide="beam"]'],
        ['截面内力',internal,uniform?'均布强度 q 的单位是 N/m；dV/dx=−q，dM/dx=V。':'H 为阶跃函数，尖括号表示正部；x=a 处左右剪力相差 P，弯矩连续。','#alternateScene [data-guide="shear"],#alternateScene [data-guide="moment"]'],
        ['弯曲正应力',String.raw`\sigma_{\mathrm{lower}}(x)=\frac{M(x)c}{I},\quad |\sigma|_{\max}=\frac{|M|_{\max}c}{I}`,'图中截面应力指距中性轴 c 的下缘，正值受拉；上缘符号相反。此处只计算弯曲正应力。','#alternateScene [data-guide="moment"]'],
        ['变形与边界',String.raw`EI\,v''(x)=-M(x),\quad `+(cant?String.raw`v(0)=v'(0)=0`:String.raw`v(0)=v(L)=0`),'挠度向下为正，曲率关系含负号。曲线仅放大展示，实际值看截面读数；小挠度、等 EI，忽略剪切变形。','#alternateScene [data-guide="deflection"]']
      ];
    }
    if(scene==='vibration'){
      const z=(p.damping??0)/(2*Math.sqrt((p.mass??1)*(p.stiffness??100)));
      const response=z===0?[String.raw`x(t)=x_0\cos\omega_nt+\frac{v_0}{\omega_n}\sin\omega_nt`,'无阻尼自由振动，保留初位移与初速度。相位由初始状态决定。']:
        Math.abs(z-1)<1e-10?[String.raw`x(t)=\bigl[x_0+(v_0+\omega_nx_0)t\bigr]e^{-\omega_nt}`,'临界阻尼不发生往复振荡；重根解中必须保留乘 t 的项。']:
        z<1?[String.raw`\begin{aligned}\omega_d&=\omega_n\sqrt{1-\zeta^2}\\x(t)&=e^{-\zeta\omega_nt}\left[x_0\cos\omega_dt+\frac{v_0+\zeta\omega_nx_0}{\omega_d}\sin\omega_dt\right]\end{aligned}`,'欠阻尼的包络指数衰减，实际振动角频率 ωd 低于固有角频率 ωn。']:
        [String.raw`\begin{aligned}r_{1,2}&=-\zeta\omega_n\pm\omega_n\sqrt{\zeta^2-1}\\x(t)&=C_1e^{r_1t}+C_2e^{r_2t}\end{aligned}`,'过阻尼响应为两个衰减指数之和，C₁、C₂由初位移和初速度确定，不应套用欠阻尼正弦公式。'];
      return [
        ['建立运动方程',String.raw`m\ddot x+c\dot x+kx=0`,'弹簧恢复力为 −kx，黏性阻尼力为 −cẋ。当前是自由振动，没有外部周期激励。','#alternateScene polyline,#alternateScene rect'],
        ['区分角频率与频率',String.raw`\begin{aligned}\omega_n&=\sqrt{\frac{k}{m}}\quad[\mathrm{rad/s}]\\f_n&=\frac{\omega_n}{2\pi}\quad[\mathrm{Hz}]\\T_n&=\frac{2\pi}{\omega_n}\quad[\mathrm s]\end{aligned}`,'ωn 是固有角频率，fn 是固有频率，两者相差 2π。Tn 是无阻尼固有周期，有阻尼时不一定等于实际振动周期。','#alternateScene path,#alternateScene circle'],
        ['判断阻尼类型',String.raw`\zeta=\frac{c}{2\sqrt{km}}=\frac{c}{2m\omega_n}`,'ζ=0 为无阻尼；0<ζ<1 为欠阻尼；ζ=1 为临界阻尼；ζ>1 为过阻尼。改变阻尼后，下一个步骤会同步切换响应公式。','#alternateScene polyline,#alternateScene path'],
        ['代入初始条件',response[0],response[1],'#alternateScene path,#alternateScene circle'],
        ['检查能量变化',String.raw`\begin{aligned}E&=\tfrac12m\dot x^2+\tfrac12kx^2\\\frac{\mathrm dE}{\mathrm dt}&=-c\dot x^2\leq0\end{aligned}`,'无阻尼时机械能守恒，有正阻尼时机械能通过耗散减少。不能把能量减少误判为计算错误。','#alternateScene rect,#alternateScene path']
      ];
    }
    if(scene==='kinematics'){
      if(p.mode==='circular')return [
        ['确定位置',String.raw`\mathbf r=R\begin{bmatrix}\cos\omega t\\\sin\omega t\end{bmatrix}`,'半径与角速度固定，运动轨迹为圆；角度使用 rad。','#alternateScene .traj,#alternateScene circle'],
        ['沿切向求速度',String.raw`\mathbf v=R\omega\begin{bmatrix}-\sin\omega t\\\cos\omega t\end{bmatrix},\quad|v|=R|\omega|`,'速度沿圆周切线；负角速度会改变运动方向，但不改变速率的大小。','#alternateScene .vec'],
        ['沿法向求加速度',String.raw`\mathbf a=-\omega^2\mathbf r,\qquad a_n=\frac{v^2}{R}`,'匀速圆周运动的速率不变，但速度方向不断改变，因此向心加速度不为零。','#alternateScene .vec']
      ];
      if(p.mode==='relative')return [
        ['指定参考系',String.raw`\mathbf r_{\mathrm{rel}}=\mathbf r-\mathbf r_O`,'当前参考原点做圆周平移，坐标轴方向保持不变；这不是旋转坐标系。','#alternateScene .traj'],
        ['相对速度',String.raw`\mathbf v_{\mathrm{rel}}=\mathbf v-\mathbf v_O`,'在方向不变的平移参考系中，对相对位置直接求时间导数。','#alternateScene .vec'],
        ['相对加速度',String.raw`\mathbf a_{\mathrm{rel}}=\mathbf a-\mathbf a_O`,'这里坐标轴不转动，因而没有科里奥利项。旋转参考系需要另列完整加速度变换。','#alternateScene .vec']
      ];
      return [
        ['分解运动',String.raw`a_x=0,\qquad a_y=-g`,'取竖直向上为正，忽略空气阻力。当前抛体从坐标原点出发。','#alternateScene .vec'],
        ['由时间求位置',String.raw`x=v_{0x}t,\qquad y=v_{0y}t-\tfrac12gt^2`,'水平为匀速运动、竖直为恒加速度运动；两方向共用同一个时间。','#alternateScene .traj,#alternateScene circle'],
        ['求速度与方向',String.raw`v_x=v_{0x},\quad v_y=v_{0y}-gt,\quad|v|=\sqrt{v_x^2+v_y^2}`,'最高点只有竖直速度分量为零，水平速度和重力加速度仍然存在。当前模型未处理地面碰撞。','#alternateScene .vec']
      ];
    }
    return packs[scene]||null;
  }
  const api={create,scenes:[...Object.keys(packs),'vibration','kinematics','materials-lab']};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.MechanicsFormulaPacks=api;
})(typeof window!=='undefined'?window:null);
