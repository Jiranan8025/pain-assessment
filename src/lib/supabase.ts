import { createClient } from '@supabase/supabase-js';
import type { Patient, Assessment } from './types';
import { env } from './env';

// Create Supabase client only if properly configured
export const supabase = env.isSupabaseConfigured && env.supabaseUrl && env.supabaseAnonKey
  ? createClient(env.supabaseUrl, env.supabaseAnonKey)
  : null;

if (supabase) {
  console.info('%c☁️ Connected to Supabase', 'color: #22c55e; font-weight: bold');
} else {
  console.info('%c💾 Running in localStorage mode', 'color: #3b82f6; font-weight: bold');
}

// ============================================================
// Local Storage fallback (ใช้เมื่อยังไม่ได้ setup Supabase)
// ============================================================

function getLocalData<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setLocalData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ============================================================
// Patient CRUD
// ============================================================

export async function getPatients(search?: string, includeDischarged = false): Promise<Patient[]> {
  if (supabase) {
    let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (!includeDischarged) {
      query = query.or('discharged.is.null,discharged.eq.false');
    }
    if (search) {
      query = query.or(`hn.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  // LocalStorage fallback
  let patients = getLocalData<Patient>('patients');
  if (!includeDischarged) {
    patients = patients.filter(p => !p.discharged);
  }
  if (search) {
    const s = search.toLowerCase();
    patients = patients.filter(p => p.hn.toLowerCase().includes(s) || p.full_name.toLowerCase().includes(s));
  }
  return patients;
}

export async function getPatientById(id: string): Promise<Patient | null> {
  if (supabase) {
    const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }
  const patients = getLocalData<Patient>('patients');
  return patients.find(p => p.id === id) || null;
}

export async function createPatient(patient: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
  if (supabase) {
    const { data, error } = await supabase.from('patients').insert(patient).select().single();
    if (error) throw error;
    return data;
  }
  const patients = getLocalData<Patient>('patients');
  const newPatient: Patient = {
    ...patient,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  patients.unshift(newPatient);
  setLocalData('patients', patients);
  return newPatient;
}

export async function updatePatient(id: string, updates: { hn?: string; full_name?: string }): Promise<Patient | null> {
  if (supabase) {
    const { data, error } = await supabase.from('patients').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const patients = getLocalData<Patient>('patients');
  const idx = patients.findIndex(p => p.id === id);
  if (idx === -1) return null;
  patients[idx] = { ...patients[idx], ...updates };
  setLocalData('patients', patients);
  return patients[idx];
}

export async function findOrCreatePatient(hn: string, fullName: string): Promise<Patient> {
  if (supabase) {
    const { data } = await supabase.from('patients').select('*').eq('hn', hn).single();
    if (data) return data;
    return createPatient({ hn, full_name: fullName });
  }
  const patients = getLocalData<Patient>('patients');
  const existing = patients.find(p => p.hn === hn);
  if (existing) return existing;
  return createPatient({ hn, full_name: fullName });
}

// ============================================================
// Assessment CRUD
// ============================================================

export async function getAssessmentsByPatient(patientId: string): Promise<Assessment[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('patient_id', patientId)
      .order('assessment_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  const assessments = getLocalData<Assessment>('assessments');
  return assessments.filter(a => a.patient_id === patientId);
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  if (supabase) {
    const { data, error } = await supabase.from('assessments').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }
  const assessments = getLocalData<Assessment>('assessments');
  return assessments.find(a => a.id === id) || null;
}

export async function createAssessment(assessment: Assessment): Promise<Assessment> {
  if (supabase) {
    const { data, error } = await supabase.from('assessments').insert(assessment).select().single();
    if (error) throw error;
    return data;
  }
  const assessments = getLocalData<Assessment>('assessments');
  const newAssessment: Assessment = {
    ...assessment,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  assessments.unshift(newAssessment);
  setLocalData('assessments', assessments);
  return newAssessment;
}

export async function dischargePatient(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('patients')
      .update({ discharged: true, discharged_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return;
  }
  const patients = getLocalData<Patient>('patients');
  const idx = patients.findIndex(p => p.id === id);
  if (idx !== -1) {
    patients[idx].discharged = true;
    patients[idx].discharged_at = new Date().toISOString();
    setLocalData('patients', patients);
  }
}

export async function undischargePatient(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('patients')
      .update({ discharged: false, discharged_at: null })
      .eq('id', id);
    if (error) throw error;
    return;
  }
  const patients = getLocalData<Patient>('patients');
  const idx = patients.findIndex(p => p.id === id);
  if (idx !== -1) {
    patients[idx].discharged = false;
    patients[idx].discharged_at = undefined;
    setLocalData('patients', patients);
  }
}

export async function deletePatient(id: string): Promise<void> {
  if (supabase) {
    // ลบ assessments ของคนไข้ก่อน แล้วค่อยลบคนไข้
    const { error: aErr } = await supabase.from('assessments').delete().eq('patient_id', id);
    if (aErr) throw aErr;
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const patients = getLocalData<Patient>('patients');
  setLocalData('patients', patients.filter(p => p.id !== id));
  const assessments = getLocalData<Assessment>('assessments');
  setLocalData('assessments', assessments.filter(a => a.patient_id !== id));
}

export async function findPatientByHN(hn: string): Promise<Patient | null> {
  if (supabase) {
    const { data } = await supabase.from('patients').select('*').eq('hn', hn).single();
    return data || null;
  }
  const patients = getLocalData<Patient>('patients');
  return patients.find(p => p.hn === hn) || null;
}

export async function updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment | null> {
  if (supabase) {
    const { data, error } = await supabase.from('assessments').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const assessments = getLocalData<Assessment>('assessments');
  const idx = assessments.findIndex(a => a.id === id);
  if (idx === -1) return null;
  assessments[idx] = { ...assessments[idx], ...updates };
  setLocalData('assessments', assessments);
  return assessments[idx];
}

export async function deleteAssessment(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('assessments').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const assessments = getLocalData<Assessment>('assessments');
  setLocalData('assessments', assessments.filter(a => a.id !== id));
}

// ============================================================
// Auto-cleanup: ลบผลประเมินเก่ากว่า N วัน
// ============================================================

const RETENTION_DAYS = 30;

export async function cleanupOldAssessments(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  const cutoff = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD

  if (supabase) {
    // Get count first, then delete
    const { data: oldRecords } = await supabase
      .from('assessments')
      .select('id')
      .lt('assessment_date', cutoff);
    const count = oldRecords?.length || 0;
    if (count > 0) {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .lt('assessment_date', cutoff);
      if (error) throw error;
    }
    return count;
  }

  // LocalStorage fallback
  const assessments = getLocalData<Assessment>('assessments');
  const kept = assessments.filter(a => a.assessment_date >= cutoff);
  const deleted = assessments.length - kept.length;
  if (deleted > 0) {
    setLocalData('assessments', kept);
  }
  return deleted;
}

// ============================================================
// Get all assessments
// ============================================================

export async function getAllAssessments(): Promise<(Assessment & { patient?: Patient })[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*, patient:patients(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  const assessments = getLocalData<Assessment>('assessments');
  const patients = getLocalData<Patient>('patients');
  return assessments.map(a => ({
    ...a,
    patient: patients.find(p => p.id === a.patient_id),
  }));
}
