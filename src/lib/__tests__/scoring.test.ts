import { describe, it, expect } from 'vitest';
import {
  calculateDass21,
  getDepressionSeverity,
  getAnxietySeverity,
  getStressSeverity,
  getSeverityColor,
  calculateEq5dUtility,
} from '../scoring';

// ============================================================
// DASS-21 Scoring Tests
// ============================================================

describe('calculateDass21', () => {
  it('should return zero scores for all-zero answers', () => {
    const answers = Array(21).fill(0);
    const result = calculateDass21(answers);
    expect(result.depression).toBe(0);
    expect(result.anxiety).toBe(0);
    expect(result.stress).toBe(0);
  });

  it('should calculate correct depression score (indices 2,4,9,12,15,16,20)', () => {
    const answers = Array(21).fill(0);
    // Set all depression items to 3
    [2, 4, 9, 12, 15, 16, 20].forEach(i => { answers[i] = 3; });
    const result = calculateDass21(answers);
    expect(result.depression).toBe(21); // 7 * 3
    expect(result.anxiety).toBe(0);
    expect(result.stress).toBe(0);
  });

  it('should calculate correct anxiety score (indices 1,3,6,8,14,18,19)', () => {
    const answers = Array(21).fill(0);
    // Set all anxiety items to 2
    [1, 3, 6, 8, 14, 18, 19].forEach(i => { answers[i] = 2; });
    const result = calculateDass21(answers);
    expect(result.depression).toBe(0);
    expect(result.anxiety).toBe(14); // 7 * 2
    expect(result.stress).toBe(0);
  });

  it('should calculate correct stress score (indices 0,5,7,10,11,13,17)', () => {
    const answers = Array(21).fill(0);
    // Set all stress items to 1
    [0, 5, 7, 10, 11, 13, 17].forEach(i => { answers[i] = 1; });
    const result = calculateDass21(answers);
    expect(result.depression).toBe(0);
    expect(result.anxiety).toBe(0);
    expect(result.stress).toBe(7); // 7 * 1
  });

  it('should calculate correct mixed scores', () => {
    // Every item set to its max (3)
    const answers = Array(21).fill(3);
    const result = calculateDass21(answers);
    expect(result.depression).toBe(21); // 7 * 3
    expect(result.anxiety).toBe(21);    // 7 * 3
    expect(result.stress).toBe(21);     // 7 * 3
  });

  it('should handle specific mixed values', () => {
    const answers = [
      1, // Q1 (stress)
      2, // Q2 (anxiety)
      3, // Q3 (depression)
      1, // Q4 (anxiety)
      2, // Q5 (depression)
      0, // Q6 (stress)
      1, // Q7 (anxiety)
      2, // Q8 (stress)
      0, // Q9 (anxiety)
      1, // Q10 (depression)
      3, // Q11 (stress)
      2, // Q12 (stress)
      1, // Q13 (depression)
      0, // Q14 (stress)
      1, // Q15 (anxiety)
      2, // Q16 (depression)
      3, // Q17 (depression)
      1, // Q18 (stress)
      0, // Q19 (anxiety)
      2, // Q20 (anxiety)
      1, // Q21 (depression)
    ];
    const result = calculateDass21(answers);
    // Depression (indices 2,4,9,12,15,16,20): 3+2+1+1+2+3+1 = 13
    expect(result.depression).toBe(13);
    // Anxiety (indices 1,3,6,8,14,18,19): 2+1+1+0+1+0+2 = 7
    expect(result.anxiety).toBe(7);
    // Stress (indices 0,5,7,10,11,13,17): 1+0+2+3+2+0+1 = 9
    expect(result.stress).toBe(9);
  });

  it('should handle empty/short array gracefully', () => {
    const result = calculateDass21([]);
    expect(result.depression).toBe(0);
    expect(result.anxiety).toBe(0);
    expect(result.stress).toBe(0);
  });
});

// ============================================================
// Severity Classification Tests
// ============================================================

describe('getDepressionSeverity', () => {
  it('should classify Normal (0-4)', () => {
    expect(getDepressionSeverity(0)).toBe('Normal');
    expect(getDepressionSeverity(4)).toBe('Normal');
  });

  it('should classify Mild (5-6)', () => {
    expect(getDepressionSeverity(5)).toBe('Mild');
    expect(getDepressionSeverity(6)).toBe('Mild');
  });

  it('should classify Moderate (7-10)', () => {
    expect(getDepressionSeverity(7)).toBe('Moderate');
    expect(getDepressionSeverity(10)).toBe('Moderate');
  });

  it('should classify Severe (11-13)', () => {
    expect(getDepressionSeverity(11)).toBe('Severe');
    expect(getDepressionSeverity(13)).toBe('Severe');
  });

  it('should classify Extremely Severe (14+)', () => {
    expect(getDepressionSeverity(14)).toBe('Extremely Severe');
    expect(getDepressionSeverity(21)).toBe('Extremely Severe');
  });
});

describe('getAnxietySeverity', () => {
  it('should classify Normal (0-3)', () => {
    expect(getAnxietySeverity(0)).toBe('Normal');
    expect(getAnxietySeverity(3)).toBe('Normal');
  });

  it('should classify Mild (4-5)', () => {
    expect(getAnxietySeverity(4)).toBe('Mild');
    expect(getAnxietySeverity(5)).toBe('Mild');
  });

  it('should classify Moderate (6-7)', () => {
    expect(getAnxietySeverity(6)).toBe('Moderate');
    expect(getAnxietySeverity(7)).toBe('Moderate');
  });

  it('should classify Severe (8-9)', () => {
    expect(getAnxietySeverity(8)).toBe('Severe');
    expect(getAnxietySeverity(9)).toBe('Severe');
  });

  it('should classify Extremely Severe (10+)', () => {
    expect(getAnxietySeverity(10)).toBe('Extremely Severe');
    expect(getAnxietySeverity(21)).toBe('Extremely Severe');
  });
});

describe('getStressSeverity', () => {
  it('should classify Normal (0-7)', () => {
    expect(getStressSeverity(0)).toBe('Normal');
    expect(getStressSeverity(7)).toBe('Normal');
  });

  it('should classify Mild (8-9)', () => {
    expect(getStressSeverity(8)).toBe('Mild');
    expect(getStressSeverity(9)).toBe('Mild');
  });

  it('should classify Moderate (10-12)', () => {
    expect(getStressSeverity(10)).toBe('Moderate');
    expect(getStressSeverity(12)).toBe('Moderate');
  });

  it('should classify Severe (13-16)', () => {
    expect(getStressSeverity(13)).toBe('Severe');
    expect(getStressSeverity(16)).toBe('Severe');
  });

  it('should classify Extremely Severe (17+)', () => {
    expect(getStressSeverity(17)).toBe('Extremely Severe');
    expect(getStressSeverity(21)).toBe('Extremely Severe');
  });
});

describe('getSeverityColor', () => {
  it('should return correct Tailwind classes for each severity', () => {
    expect(getSeverityColor('Normal')).toContain('bg-severity-normal');
    expect(getSeverityColor('Mild')).toContain('bg-severity-mild');
    expect(getSeverityColor('Moderate')).toContain('bg-severity-moderate');
    expect(getSeverityColor('Severe')).toContain('bg-severity-severe');
    expect(getSeverityColor('Extremely Severe')).toContain('bg-severity-extreme');
  });
});

// ============================================================
// EQ-5D-5L Utility Calculation Tests
// ============================================================

describe('calculateEq5dUtility', () => {
  it('should return 1.000 for perfect health (all level 1)', () => {
    const utility = calculateEq5dUtility(1, 1, 1, 1, 1);
    expect(utility).toBe(1.000);
  });

  it('should calculate correct utility for all level 2 (slight problems)', () => {
    const utility = calculateEq5dUtility(2, 2, 2, 2, 2);
    // 1 - (0.056 + 0.033 + 0.043 + 0.040 + 0.032) = 1 - 0.204 = 0.796
    expect(utility).toBe(0.796);
  });

  it('should calculate correct utility for all level 3 (moderate problems)', () => {
    const utility = calculateEq5dUtility(3, 3, 3, 3, 3);
    // 1 - (0.114 + 0.108 + 0.075 + 0.068 + 0.097) = 1 - 0.462 = 0.538
    expect(utility).toBe(0.538);
  });

  it('should calculate correct utility for all level 4 (severe problems)', () => {
    const utility = calculateEq5dUtility(4, 4, 4, 4, 4);
    // 1 - (0.231 + 0.225 + 0.165 + 0.233 + 0.202) = 1 - 1.056 = -0.056
    expect(utility).toBe(-0.056);
  });

  it('should calculate correct utility for all level 5 (extreme problems)', () => {
    const utility = calculateEq5dUtility(5, 5, 5, 5, 5);
    // 1 - (0.307 + 0.254 + 0.207 + 0.266 + 0.249) = 1 - 1.283 = -0.283
    expect(utility).toBe(-0.283);
  });

  it('should calculate correct utility for mixed health state', () => {
    // mobility=2, selfCare=1, usualActivities=3, pain=2, anxiety=1
    const utility = calculateEq5dUtility(2, 1, 3, 2, 1);
    // 1 - (0.056 + 0 + 0.075 + 0.040 + 0) = 1 - 0.171 = 0.829
    expect(utility).toBe(0.829);
  });

  it('should handle mixed severe/perfect state', () => {
    // mobility=5, selfCare=1, usualActivities=1, pain=5, anxiety=3
    const utility = calculateEq5dUtility(5, 1, 1, 5, 3);
    // 1 - (0.307 + 0 + 0 + 0.266 + 0.097) = 1 - 0.670 = 0.330
    expect(utility).toBe(0.330);
  });

  it('should round to 3 decimal places', () => {
    const utility = calculateEq5dUtility(2, 3, 4, 2, 3);
    const decimalPart = utility.toString().split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(3);
  });
});
