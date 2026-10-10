'use strict';

/**
 * Constant-amplitude Basquin life with a simple Goodman mean-stress correction.
 * All stresses must use the same units. exponent is the positive decay magnitude b.
 * The safety factor multiplies the Goodman-corrected stress amplitude before both
 * the Basquin calculation and the endurance-limit comparison.
 * A positive enduranceLimit gives infinite life at or below that limit; zero
 * disables that branch. Zero alternating stress always gives infinite life.
 * This is an idealized fatigue estimate, not a static-strength or spectrum check.
 */
function basquinLife(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('basquinLife options must be an object');
  }
  const {
    stressAmplitude, referenceStress, referenceCycles, exponent,
    enduranceLimit = 0, meanStress = 0, ultimateStrength = Infinity, safetyFactor = 1
  } = options;
  nonnegative('stressAmplitude', stressAmplitude);
  positive('referenceStress', referenceStress);
  positive('referenceCycles', referenceCycles);
  positive('exponent', exponent);
  nonnegative('enduranceLimit', enduranceLimit);
  finite('meanStress', meanStress);
  positive('safetyFactor', safetyFactor);
  if (ultimateStrength !== Infinity) positive('ultimateStrength', ultimateStrength);
  if (meanStress >= ultimateStrength) {
    throw new RangeError('meanStress must be less than ultimateStrength for Goodman correction');
  }

  const goodmanDenominator = 1 - meanStress / ultimateStrength;
  if (!Number.isFinite(goodmanDenominator) || goodmanDenominator <= 0) {
    throw new RangeError('Goodman denominator must be finite and greater than zero');
  }
  const correctedStress = stressAmplitude / goodmanDenominator;
  const effectiveStress = correctedStress * safetyFactor;
  if (!Number.isFinite(correctedStress) || !Number.isFinite(effectiveStress) ||
      (stressAmplitude > 0 && effectiveStress === 0)) {
    throw new RangeError('effectiveStress is outside the representable positive finite range');
  }

  let cycles, regime;
  if (stressAmplitude === 0) {
    cycles = Infinity;
    regime = 'zero-amplitude';
  } else if (enduranceLimit > 0 && effectiveStress <= enduranceLimit) {
    cycles = Infinity;
    regime = 'endurance-limit';
  } else {
    // Log space avoids an overflowing intermediate Sref / Seff ratio.
    cycles = effectiveStress === referenceStress ? referenceCycles : Math.exp(
      Math.log(referenceCycles) + (Math.log(referenceStress) - Math.log(effectiveStress)) / exponent
    );
    regime = cycles === Infinity ? 'numerical-overflow' : cycles === 0 ? 'numerical-underflow' : 'basquin';
  }
  return Object.freeze({
    cycles,
    safeAtReference: regime === 'zero-amplitude' || regime === 'endurance-limit' || effectiveStress <= referenceStress,
    diagnostics: Object.freeze({
      method: 'basquin-goodman',
      equation: 'N = Nr * (Sref / Seff)^(1/b)',
      goodmanEquation: 'Seff = safetyFactor * Sa / (1 - Sm/Sut)',
      correctedStress,
      effectiveStress,
      goodmanDenominator,
      safetyFactor,
      enduranceLimit,
      enduranceLimitEnabled: enduranceLimit > 0,
      regime,
      assumptions: Object.freeze([
        'constant-amplitude loading; no cumulative damage or load-spectrum effects',
        'positive Basquin exponent magnitude; stresses in consistent units',
        'simple linear Goodman correction, including compressive mean-stress benefit',
        'infinite ultimateStrength disables mean-stress correction',
        'safety factor scales corrected amplitude; no separate static-strength check',
        'infinite life at or below a positive endurance limit is an idealization'
      ])
    })
  });
}

function finite(name, value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}
function positive(name, value) {
  finite(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than zero`);
}
function nonnegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} must be non-negative`);
}

module.exports = { basquinLife };
