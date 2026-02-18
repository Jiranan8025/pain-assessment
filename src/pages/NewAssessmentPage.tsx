import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEmptyAssessment } from '../lib/types';
import type { Assessment } from '../lib/types';
import { findOrCreatePatient, createAssessment } from '../lib/supabase';
import { showError, showSuccess } from '../lib/toast';
import { patientSchema, assessmentSubmitSchema, formatValidationError } from '../lib/validation';
import { useDraft } from '../lib/useDraft';
import { useUnsavedWarning } from '../lib/useUnsavedWarning';
import AssessmentWizard from '../components/assessment/AssessmentWizard';

interface DraftData {
  assessment: Assessment;
  hn: string;
  name: string;
}

export default function NewAssessmentPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Assessment>(createEmptyAssessment());
  const [patientHN, setPatientHN] = useState('');
  const [patientName, setPatientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const onRestore = useCallback((draft: DraftData) => {
    setData(draft.assessment);
    setPatientHN(draft.hn);
    setPatientName(draft.name);
    setDraftRestored(true);
  }, []);

  const { clearDraft } = useDraft<DraftData>(
    'new_assessment',
    { assessment: data, hn: patientHN, name: patientName },
    onRestore,
  );

  const hasUnsavedChanges = !submitted && (patientHN !== '' || patientName !== '');
  const blocker = useUnsavedWarning(hasUnsavedChanges);

  const handleChange = (partial: Partial<Assessment>) => {
    setData(prev => ({ ...prev, ...partial }));
  };

  const handleSubmit = async () => {
    // Validate patient info
    const patientResult = patientSchema.safeParse({ hn: patientHN, full_name: patientName });
    if (!patientResult.success) {
      showError(formatValidationError(patientResult.error));
      return;
    }

    // Validate assessment data
    const assessmentResult = assessmentSubmitSchema.safeParse(data);
    if (!assessmentResult.success) {
      showError(formatValidationError(assessmentResult.error));
      return;
    }

    setIsSubmitting(true);
    try {
      const patient = await findOrCreatePatient(patientHN, patientName);
      const assessment = await createAssessment({
        ...data,
        patient_id: patient.id,
      });
      clearDraft();
      setSubmitted(true);
      showSuccess('บันทึกผลประเมินสำเร็จ');
      navigate(`/summary/${assessment.id}`, { state: { assessment, patient } });
    } catch (err) {
      console.error(err);
      showError('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">ออกจากหน้านี้?</h3>
            <p className="text-sm text-gray-600 mb-4">ข้อมูลที่กรอกไว้จะถูกบันทึกเป็นฉบับร่าง สามารถกลับมากรอกต่อได้</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => blocker.reset?.()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                กรอกต่อ
              </button>
              <button onClick={() => blocker.proceed?.()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                ออกจากหน้านี้
              </button>
            </div>
          </div>
        </div>
      )}
      {draftRestored && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-amber-800">กู้คืนข้อมูลที่กรอกค้างไว้แล้ว</p>
          <button onClick={() => { clearDraft(); setData(createEmptyAssessment()); setPatientHN(''); setPatientName(''); setDraftRestored(false); }}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium">เริ่มใหม่</button>
        </div>
      )}
      <AssessmentWizard
        data={data}
        patientHN={patientHN}
        patientName={patientName}
        onPatientHNChange={setPatientHN}
        onPatientNameChange={setPatientName}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
