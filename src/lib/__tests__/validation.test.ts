import { describe, it, expect } from 'vitest';
import {
  patientSchema,
  assessmentSubmitSchema,
  formatValidationError,
} from '../validation';

// ============================================================
// Patient Validation Tests
// ============================================================

describe('patientSchema', () => {
  it('should accept valid patient data', () => {
    const result = patientSchema.safeParse({
      hn: '66123456',
      full_name: 'สมชาย ใจดี',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty HN', () => {
    const result = patientSchema.safeParse({
      hn: '',
      full_name: 'สมชาย ใจดี',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = patientSchema.safeParse({
      hn: '66123456',
      full_name: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing fields', () => {
    const result = patientSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Assessment Validation Tests
// ============================================================

const validAssessment = {
  assessment_date: '2024-01-15',
  visit_type: 'new_consult' as const,
  consult_from: 'Ward 5',
  note: '',
  psychologist_recorded: false,
  psych_screening_na: false,
  has_other_pain: false,
  pain_location_data: [],
  pain_score_max: 7,
  pain_score_min: 3,
  pain_score_avg: 5,
  pain_score_now: 4,
  treatment_relief_score: 6,
  depression_risk_1: false,
  depression_risk_2: false,
  suicide_risk: false,
  psych_others: '',
  interference_general_activity: 5,
  interference_mood: 4,
  interference_walking: 3,
  interference_normal_work: 6,
  interference_relationship: 2,
  interference_sleep: 7,
  interference_enjoyment: 4,
  eq5d_mobility: 2,
  eq5d_self_care: 1,
  eq5d_usual_activities: 3,
  eq5d_pain_discomfort: 2,
  eq5d_anxiety_depression: 2,
  eq5d_vas: 70,
  dass21_answers: [1, 2, 0, 1, 2, 1, 0, 1, 2, 0, 1, 1, 2, 0, 1, 2, 1, 0, 1, 2, 0],
  dass21_depression: 8,
  dass21_anxiety: 6,
  dass21_stress: 5,
  others_9q: '',
  others_8q: '',
  other_notes: '',
};

describe('assessmentSubmitSchema', () => {
  it('should accept valid assessment data', () => {
    const result = assessmentSubmitSchema.safeParse(validAssessment);
    expect(result.success).toBe(true);
  });

  it('should accept pain_score_min > pain_score_max (auto-corrected in UI)', () => {
    // Validation no longer rejects this — the UI auto-corrects min/max sliders
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      pain_score_min: 8,
      pain_score_max: 5,
    });
    expect(result.success).toBe(true);
  });

  it('should reject pain scores out of range (> 10)', () => {
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      pain_score_now: 11,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative pain scores', () => {
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      pain_score_now: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject EQ-5D values out of range (> 5)', () => {
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      eq5d_mobility: 6,
    });
    expect(result.success).toBe(false);
  });

  it('should reject EQ-5D values out of range (< 1)', () => {
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      eq5d_mobility: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject VAS out of range', () => {
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      eq5d_vas: 101,
    });
    expect(result.success).toBe(false);
  });

  it('should reject incomplete DASS-21 answers', () => {
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      dass21_answers: [1, 2, 3], // Only 3 instead of 21
    });
    expect(result.success).toBe(false);
  });

  it('should reject DASS-21 answers out of range', () => {
    const invalidAnswers = Array(21).fill(0);
    invalidAnswers[5] = 4; // Should be 0-3
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      dass21_answers: invalidAnswers,
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid visit types', () => {
    const visitTypes = ['new_consult', 'follow_up', 'pre_procedure', 'post_procedure'] as const;
    visitTypes.forEach(visit_type => {
      const result = assessmentSubmitSchema.safeParse({ ...validAssessment, visit_type });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid visit type', () => {
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      visit_type: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty assessment_date', () => {
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      assessment_date: '',
    });
    expect(result.success).toBe(false);
  });

  it('should accept null for has_other_pain', () => {
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      has_other_pain: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept pain location data with valid structure', () => {
    const result = assessmentSubmitSchema.safeParse({
      ...validAssessment,
      pain_location_data: [
        { x: 150, y: 200, side: 'front' },
        { x: 100, y: 300, side: 'back' },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// Error Formatting Tests
// ============================================================

describe('formatValidationError', () => {
  it('should return the first error message', () => {
    const result = patientSchema.safeParse({ hn: '', full_name: '' });
    if (!result.success) {
      const message = formatValidationError(result.error);
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it('should return Thai message for HN validation', () => {
    const result = patientSchema.safeParse({ hn: '', full_name: 'Test' });
    if (!result.success) {
      const message = formatValidationError(result.error);
      expect(message).toBe('กรุณากรอก HN');
    }
  });

  it('should return Thai message for name validation', () => {
    const result = patientSchema.safeParse({ hn: '123', full_name: '' });
    if (!result.success) {
      const message = formatValidationError(result.error);
      expect(message).toBe('กรุณากรอกชื่อ-นามสกุล');
    }
  });
});
