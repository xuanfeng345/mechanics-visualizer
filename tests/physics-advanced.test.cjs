const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/main.js'), 'utf8');
// Extract the actual production calculation functions; no duplicated formulas.
const names = ['physicsDampedDisplacement','physicsForcedAmplitude','physicsGyroPrecessionRate','physicsRocketVelocity','physicsVariableMassForce'];
const block = names.map((name) => {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`missing ${name}`);
  let depth = 0, end = start, opened = false;
  for (; end < source.length; end++) {
    if (source[end] === '{') { depth++; opened = true; }
    else if (source[end] === '}' && opened && --depth === 0) { end++; break; }
  }
  return source.slice(start, end);
}).join('\n');
const context = {}; vm.runInNewContext(`${block}\nthis.api={${names.join(',')}};`, context);
const p = context.api;
const close = (a,b,t=1e-9) => assert.ok(Math.abs(a-b) <= t*Math.max(1,Math.abs(b)), `${a} != ${b}`);
// Damped solution checks initial conditions and critical/overdamped branches.
close(p.physicsDampedDisplacement(1, 4, 0, 0, 0.1, 0), 0.1);
close(p.physicsDampedDisplacement(1, 4, 4, 0, 0.1, 0), 0.1);
close(p.physicsDampedDisplacement(1, 4, 6, 0, 0.1, 0), 0.1);
assert.ok(p.physicsDampedDisplacement(1,4,1,1,0.1,0) < 0.1);
// Forced response is finite at resonance when damping is nonzero.
close(p.physicsForcedAmplitude(1, 4, 0.1, 2, 2), 2/(1*Math.hypot(0,0.8)));
close(p.physicsGyroPrecessionRate(2, 5, 3), 0.3);
close(p.physicsRocketVelocity(100, 50, 2000), 2000*Math.log(2));
close(p.physicsVariableMassForce(-0.5, 10, 2, 0, 8), -4);
close(p.physicsVariableMassForce(0.5, 10, 2, 3, 8), 28);
console.log('physics-advanced: all tests passed');
