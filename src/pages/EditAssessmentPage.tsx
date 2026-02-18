import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import type { Assessment, Patient } from '../lib/types';
import { getAssessmentById, getPatientById, updateAssessment } from '../lib/supabase';
import { showError, showSuccess } from '../lib/toast';
import { assessmentSubmitSchema, formatValidationError } from '../lib/validation';
import AssessmentWizard from '../components/assessment/AssessmentWizard';
import { formatThaiDate } from '../lib/dateUtils';

export default function EditAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState<Assessment | null>(
    (location.state as any)?.assessment || null
  );
  const [patient, setPatient] = useState<Patient | null>(
    (location.state as any)?.patient || null
  );
  const [patientHN, setPatientHN] = useState(patient?.hn || '');
  const [patientName, setPatientName] = useState(patient?.full_name || '');
  const [loading, setLoading] = useState(!data);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (data && patient) return;
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        const a = await getAssessmentById(id);
        if (a) {
          setData(a);
          if (a.patient_id) {
            const p = await getPatientById(a.patient_id);
            if (p) {
              setPatient(p);
              setPatientHN(p.hn);
              setPatientName(p.full_name);
            }
          }
        }
      } catch (err) {
        console.error(err);
        showError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, data, patient]);

  const handleChange = (partial: Partial<Assessment>) => {
    setData(prev => prev ? { ...prev, ...partial } : prev);
  };

  const handleSubmit = async () => {
    if (!id || !data) return;

    const result = assessmentSubmitSchema.safeParse(data);
    if (!result.success) {
      showError(formatValidationError(result.error));
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAssessment(id, data);
      showSuccess('บันทึกการแก้ไขสำเร็จ');
      navigate(`/summary/${id}`, { state: { assessment: data, patient }, replace: true });
    } catch (err) {
      console.error(err);
      showError('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-500">กำลังโหลด...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ไม่พบข้อมูลการประเมิน</p>
        <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">กลับหน้าหลัก</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
        <p className="text-sm text-amber-800">
          กำลังแก้ไขแบบประเมิน: <strong>{patientHN}</strong> - {patientName} ({formatThaiDate(data.assessment_date)})
        </p>
        <Link to={`/summary/${id}`} className="text-xs text-amber-600 hover:text-amber-800 font-medium">ยกเลิก</Link>
      </div>
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
