import { z } from 'zod';

// ============================================================
// Patient Validation
// ============================================================

export const patientSchema = z.object({
  hn: z.string().min(1, 'กรุณากรอก HN'),
  full_name: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
});

// ============================================================
// Assessment Validation (at submission time)
// ============================================================

const painScore = z.number().min(0, 'คะแนนต้องอยู่ระหว่าง 0-10').max(10, 'คะแนนต้องอยู่ระหว่าง 0-10');
const interferenceScore = z.number().min(0).max(10);
const eq5dDomain = z.number().min(1, 'กรุณาเลือกคำตอบ').max(5);
const dass21Answer = z.number().min(0).max(3);

export const assessmentSubmitSchema = z.object({
  // Required fields
  assessment_date: z.string().min(1, 'กรุณาเลือกวันที่ประเมิน'),
  visit_type: z.enum(['new_consult', 'follow_up', 'pre_procedure', 'post_procedure']),

  // Optional text fields
  consult_from: z.string(),
  note: z.string(),

  // Boolean flags
  psychologist_recorded: z.boolean(),
  psych_screening_na: z.boolean(),

  // BPI
  has_other_pain: z.boolean().nullable(),
  pain_location_data: z.array(z.object({
    x: z.number(),
    y: z.number(),
    side: z.enum(['front', 'back']),
  })),

  // Pain scores (0-10)
  pain_score_max: painScore,
  pain_score_min: painScore,
  pain_score_avg: painScore,
  pain_score_now: painScore,
  treatment_relief_score: painScore,

  // Psychological screening
  depression_risk_1: z.boolean(),
  depression_risk_2: z.boolean(),
  suicide_risk: z.boolean(),
  psych_others: z.string(),

  // Pain interference (0-10)
  interference_general_activity: interferenceScore,
  interference_mood: interferenceScore,
  interference_walking: interferenceScore,
  interference_normal_work: interferenceScore,
  interference_relationship: interferenceScore,
  interference_sleep: interferenceScore,
  interference_enjoyment: interferenceScore,

  // EQ-5D-5L (1-5)
  eq5d_mobility: eq5dDomain,
  eq5d_self_care: eq5dDomain,
  eq5d_usual_activities: eq5dDomain,
  eq5d_pain_discomfort: eq5dDomain,
  eq5d_anxiety_depression: eq5dDomain,
  eq5d_vas: z.number().min(0, 'VAS ต้องอยู่ระหว่าง 0-100').max(100, 'VAS ต้องอยู่ระหว่าง 0-100'),

  // DASS-21
  dass21_answers: z.array(dass21Answer).length(21, 'กรุณาตอบคำถาม DASS-21 ครบทุกข้อ (21 ข้อ)'),
  dass21_depression: z.number(),
  dass21_anxiety: z.number(),
  dass21_stress: z.number(),

  // Others
  others_9q: z.string(),
  others_8q: z.string(),
  other_notes: z.string(),
});

// ============================================================
// Helper: Format validation errors to Thai message
// ============================================================

export function formatValidationError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  if (firstIssue) {
    return firstIssue.message;
  }
  return 'ข้อมูลไม่ถูกต้อง';
}

// ============================================================
// Types
// ============================================================

export type PatientInput = z.infer<typeof patientSchema>;
export type AssessmentSubmitInput = z.infer<typeof assessmentSubmitSchema>;
