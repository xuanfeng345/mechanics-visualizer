"""Independent Basquin/Goodman oracle; reads Node results from stdin."""
import json, math, sys
rows = json.load(sys.stdin)
for row in rows:
    p = row['input']
    effective = p['safetyFactor'] * p['stressAmplitude'] / (1 - p['meanStress']/p['ultimateStrength'])
    expected = math.inf if effective == 0 or (p['enduranceLimit'] > 0 and effective <= p['enduranceLimit']) else p['referenceCycles'] * (p['referenceStress']/effective)**(1/p['exponent'])
    actual = row['cycles']
    if math.isinf(expected):
        assert actual is None, row
    else:
        assert math.isclose(actual, expected, rel_tol=1e-10), row
print(f'PASS: Python independent fatigue reference ({len(rows)} cases)')
