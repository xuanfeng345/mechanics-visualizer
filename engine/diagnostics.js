'use strict';
function diagnostics({residualForce={x:0,y:0},residualMoment=0,energyInitial,energyFinal,dt}={}){const d={residualForce,residualMoment};if(Number.isFinite(energyInitial)&&Number.isFinite(energyFinal))d.energyError=energyFinal-energyInitial;if(Number.isFinite(dt))d.step=dt;d.ok=Math.hypot(residualForce.x,residualForce.y)<1e-8&&Math.abs(residualMoment)<1e-8;return Object.freeze(d)}
module.exports={diagnostics};
