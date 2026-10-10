'use strict';
const DIMENSIONS={force:{M:1,L:1,T:-2},length:{M:0,L:1,T:0},mass:{M:1,L:0,T:0},time:{M:0,L:0,T:1},moment:{M:1,L:2,T:-2},velocity:{M:0,L:1,T:-1},acceleration:{M:0,L:1,T:-2}};
const UNITS={N:{dimension:'force',scale:1},kN:{dimension:'force',scale:1000},m:{dimension:'length',scale:1},mm:{dimension:'length',scale:.001},kg:{dimension:'mass',scale:1},g:{dimension:'mass',scale:.001},s:{dimension:'time',scale:1},ms:{dimension:'time',scale:.001},'N·m':{dimension:'moment',scale:1},'kN·m':{dimension:'moment',scale:1000},'m/s':{dimension:'velocity',scale:1},'m/s²':{dimension:'acceleration',scale:1}};
function quantity(value,unit){if(!Number.isFinite(value)||!UNITS[unit])throw new TypeError('Invalid quantity');return Object.freeze({value,unit,dimension:UNITS[unit].dimension})}
function convert(q,to){if(!q||!UNITS[q.unit]||!UNITS[to]||UNITS[q.unit].dimension!==UNITS[to].dimension)throw new TypeError('Incompatible units');return quantity(q.value*UNITS[q.unit].scale/UNITS[to].scale,to)}
function sameDimension(a,b){return !!(a&&b&&UNITS[a.unit]&&UNITS[b.unit]&&UNITS[a.unit].dimension===UNITS[b.unit].dimension)}
module.exports={DIMENSIONS,UNITS,quantity,convert,sameDimension};
