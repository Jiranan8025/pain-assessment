export interface Patient {
  id?: string;
  hn: string;
  full_name: string;
  discharged?: boolean;
  discharged_at?: string;
  created_at?: string;
}

export type VisitType = 'new_consult' | 'follow_up' | 'pre_procedure' | 'post_procedure';
export type AssessmentTiming = 'pre_procedure' | 'post_procedure';
export type ProcedurePurpose = 'diagnostic' | 'therapeutic';

export interface PainLocation {
  x: number;
  y: number;
  side: 'front' | 'back';
}

export interface Assessment {
  id?: string;
  patient_id?: string;
  assessment_date: string;
  visit_type: VisitType;
  consult_from: string;
  note: string;
  psychologist_recorded: boolean;

  // Procedure / Medical info
  is_new_case: boolean | null;
  assessment_timing: AssessmentTiming | null;
  procedure_purpose: ProcedurePurpose | null;
  procedure_name: string;
  procedure_date: string;

  // BPI
  has_other_pain: boolean | null;
  pain_location_data: PainLocation[];
  pain_score_max: number;
  pain_score_min: number;
  pain_score_avg: number;
  pain_score_now: number;
  treatment_relief_score: number;

  // Psychological Screening
  psych_screening_na: boolean;
  depression_risk_1: boolean;
  depression_risk_2: boolean;
  suicide_risk: boolean;
  psych_others: string;

  // Pain Interference (0-10)
  interference_general_activity: number;
  interference_mood: number;
  interference_walking: number;
  interference_normal_work: number;
  interference_relationship: number;
  interference_sleep: number;
  interference_enjoyment: number;

  // EQ-5D-5L (1-5)
  eq5d_mobility: number;
  eq5d_self_care: number;
  eq5d_usual_activities: number;
  eq5d_pain_discomfort: number;
  eq5d_anxiety_depression: number;
  eq5d_vas: number;

  // DASS-21
  dass21_answers: number[];
  dass21_depression: number;
  dass21_anxiety: number;
  dass21_stress: number;

  // Others
  others_9q: string;
  others_8q: string;
  other_notes: string;

  created_at?: string;
}

export function createEmptyAssessment(): Assessment {
  return {
    assessment_date: new Date().toISOString().split('T')[0],
    visit_type: 'new_consult',
    consult_from: '',
    note: '',
    psychologist_recorded: false,
    is_new_case: null,
    assessment_timing: null,
    procedure_purpose: null,
    procedure_name: '',
    procedure_date: '',
    has_other_pain: null,
    pain_location_data: [],
    pain_score_max: 0,
    pain_score_min: 0,
    pain_score_avg: 0,
    pain_score_now: 0,
    treatment_relief_score: 0,
    psych_screening_na: false,
    depression_risk_1: false,
    depression_risk_2: false,
    suicide_risk: false,
    psych_others: '',
    interference_general_activity: 0,
    interference_mood: 0,
    interference_walking: 0,
    interference_normal_work: 0,
    interference_relationship: 0,
    interference_sleep: 0,
    interference_enjoyment: 0,
    eq5d_mobility: 1,
    eq5d_self_care: 1,
    eq5d_usual_activities: 1,
    eq5d_pain_discomfort: 1,
    eq5d_anxiety_depression: 1,
    eq5d_vas: 50,
    dass21_answers: Array(21).fill(0),
    dass21_depression: 0,
    dass21_anxiety: 0,
    dass21_stress: 0,
    others_9q: '',
    others_8q: '',
    other_notes: '',
  };
}
