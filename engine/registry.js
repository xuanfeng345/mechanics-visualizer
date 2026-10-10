'use strict';
const scenes=new Map();
function register(scene){if(!scene||typeof scene.id!=='string'||typeof scene.calculate!=='function')throw new TypeError('Scene requires id and calculate');if(scenes.has(scene.id))throw new Error(`Duplicate scene: ${scene.id}`);scenes.set(scene.id,Object.freeze({...scene}));return scene;}
function get(id){const scene=scenes.get(id);if(!scene)throw new RangeError(`Unknown scene: ${id}`);return scene;}
function list(){return [...scenes.values()];}
module.exports={register,get,list};
