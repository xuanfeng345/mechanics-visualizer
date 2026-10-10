'use strict';
const {quantity,convert}=require('./units');
function requirePositive(name,v){if(!Number.isFinite(v)||v<=0)throw new RangeError(`${name} must be positive`);return v}
function axial({force,area,length,youngsModulus,yieldStress,safetyFactor=1}={}){
  requirePositive('area',area);requirePositive('length',length);requirePositive('youngsModulus',youngsModulus);requirePositive('safetyFactor',safetyFactor);
  if(!Number.isFinite(force))throw new TypeError('force must be finite');
  const stress=force/area,strain=stress/youngsModulus,elongation=strain*length,allowable=yieldStress===undefined?Infinity:yieldStress/safetyFactor,utilization=Math.abs(stress)/allowable;
  return Object.freeze({model:'axial_bar',force,area,length,youngsModulus,yieldStress,stress,strain,elongation,allowableStress:allowable,utilization,elastic:Math.abs(stress)<=allowable,assumptions:['uniaxial','linear_elastic','small_strain']});
}
function axialFromSI({forceN,areaMm2,lengthMm,youngsModulusMPa,yieldStressMPa,safetyFactor=1}={}){return axial({force:forceN,area:areaMm2,length:lengthMm,youngsModulus:youngsModulusMPa,yieldStress:yieldStressMPa,safetyFactor});}
function torsion({torque,radius,polarInertia,shearModulus,length}={}){requirePositive('radius',radius);requirePositive('polarInertia',polarInertia);requirePositive('shearModulus',shearModulus);requirePositive('length',length);if(!Number.isFinite(torque))throw new TypeError('torque must be finite');const shear=torque*radius/polarInertia,twist=torque*length/(shearModulus*polarInertia);return Object.freeze({model:'torsion',torque,radius,polarInertia,shearModulus,length,shearStress:shear,twist,assumptions:['circular_shaft','linear_elastic','Saint_Venant']});}
module.exports={axial,axialFromSI,torsion};
