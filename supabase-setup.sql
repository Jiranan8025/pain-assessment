-- ============================================================
-- Supabase Setup SQL สำหรับ Pain Assessment System
-- Copy ทั้งหมดนี้ไปวางใน Supabase SQL Editor แล้วกด Run
-- ============================================================

-- 1. สร้างตาราง patients
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hn TEXT NOT NULL,
  full_name TEXT NOT NULL,
  discharged BOOLEAN DEFAULT FALSE,
  discharged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. สร้างตาราง assessments
CREATE TABLE assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  visit_type TEXT NOT NULL DEFAULT 'new_consult',
  consult_from TEXT DEFAULT '',
  note TEXT DEFAULT '',
  psychologist_recorded BOOLEAN DEFAULT FALSE,

  -- BPI
  has_other_pain BOOLEAN,
  pain_location_data JSONB DEFAULT '[]',
  pain_score_max INTEGER DEFAULT 0,
  pain_score_min INTEGER DEFAULT 0,
  pain_score_avg INTEGER DEFAULT 0,
  pain_score_now INTEGER DEFAULT 0,
  treatment_relief_score INTEGER DEFAULT 0,

  -- Psychological Screening
  psych_screening_na BOOLEAN DEFAULT FALSE,
  depression_risk_1 BOOLEAN DEFAULT FALSE,
  depression_risk_2 BOOLEAN DEFAULT FALSE,
  suicide_risk BOOLEAN DEFAULT FALSE,
  psych_others TEXT DEFAULT '',

  -- Pain Interference (0-10)
  interference_general_activity INTEGER DEFAULT 0,
  interference_mood INTEGER DEFAULT 0,
  interference_walking INTEGER DEFAULT 0,
  interference_normal_work INTEGER DEFAULT 0,
  interference_relationship INTEGER DEFAULT 0,
  interference_sleep INTEGER DEFAULT 0,
  interference_enjoyment INTEGER DEFAULT 0,

  -- EQ-5D-5L (1-5)
  eq5d_mobility INTEGER DEFAULT 1,
  eq5d_self_care INTEGER DEFAULT 1,
  eq5d_usual_activities INTEGER DEFAULT 1,
  eq5d_pain_discomfort INTEGER DEFAULT 1,
  eq5d_anxiety_depression INTEGER DEFAULT 1,
  eq5d_vas INTEGER DEFAULT 50,

  -- DASS-21
  dass21_answers JSONB DEFAULT '[]',
  dass21_depression INTEGER DEFAULT 0,
  dass21_anxiety INTEGER DEFAULT 0,
  dass21_stress INTEGER DEFAULT 0,

  -- Others
  others_9q TEXT DEFAULT '',
  others_8q TEXT DEFAULT '',
  other_notes TEXT DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. สร้าง Index เพื่อความเร็ว
CREATE INDEX idx_patients_hn ON patients(hn);
CREATE INDEX idx_patients_discharged ON patients(discharged);
CREATE INDEX idx_assessments_patient_id ON assessments(patient_id);
CREATE INDEX idx_assessments_date ON assessments(assessment_date);

-- 4. เปิด Row Level Security (RLS) — อนุญาตให้ทุกคนอ่าน/เขียนผ่าน anon key
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Policy: อนุญาตทุกอย่างผ่าน anon key (เพราะ app จัดการ auth เอง)
CREATE POLICY "Allow all for patients" ON patients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for assessments" ON assessments
  FOR ALL USING (true) WITH CHECK (true);

-- เสร็จ! ✅
