import { useRef, useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import type { Assessment, Patient } from '../lib/types';
import { getAssessmentById, getPatientById } from '../lib/supabase';
import { showError } from '../lib/toast';
import {
  calculateEq5dUtility,
  getDepressionSeverity,
  getAnxietySeverity,
  getStressSeverity,
  getSeverityColor,
} from '../lib/scoring';
import { formatThaiDate } from '../lib/dateUtils';

export default function PatientCompletePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const printRef = useRef<HTMLDivElement>(null);

  const [assessment, setAssessment] = useState<Assessment | null>(
    (location.state as any)?.assessment || null
  );
  const [patient, setPatient] = useState<Patient | null>(
    (location.state as any)?.patient || null
  );
  const [loading, setLoading] = useState(!assessment);

  useEffect(() => {
    if (assessment && patient) return;
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const a = await getAssessmentById(id);
        if (a) {
          setAssessment(a);
          if (a.patient_id) setPatient(await getPatientById(a.patient_id));
        }
      } catch (err) {
        console.error(err);
        showError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, assessment, patient]);

  const handlePrint = useReactToPrint({ contentRef: printRef });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assessment || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <p className="text-gray-500">ไม่พบข้อมูล</p>
      </div>
    );
  }

  const utility = calculateEq5dUtility(
    assessment.eq5d_mobility, assessment.eq5d_self_care,
    assessment.eq5d_usual_activities, assessment.eq5d_pain_discomfort,
    assessment.eq5d_anxiety_depression,
  );
  const depSev = getDepressionSeverity(assessment.dass21_depression);
  const anxSev = getAnxietySeverity(assessment.dass21_anxiety);
  const strSev = getStressSeverity(assessment.dass21_stress);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-green-600 text-white py-6 px-6 text-center">
        <div className="text-4xl mb-2">✓</div>
        <h1 className="text-xl font-bold">ส่งแบบประเมินเรียบร้อยแล้ว</h1>
        <p className="text-green-200 text-sm mt-1">ขอบคุณที่ตอบแบบสอบถาม</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-6">
        {/* Summary Card */}
        <div ref={printRef} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div className="text-center border-b pb-4">
            <h2 className="text-lg font-bold text-primary">สรุปผลประเมินความปวด</h2>
            <p className="text-sm text-gray-500 mt-1">{patient.full_name} - {formatThaiDate(assessment.assessment_date)}</p>
          </div>

          {/* Pain Scores */}
          <div>
            <h3 className="font-bold text-sm text-gray-800 mb-2">คะแนนความปวด (0 = ไม่ปวด, 10 = ปวดมากที่สุด)</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'มากที่สุด (24 ชม.)', value: assessment.pain_score_max, color: 'text-red-600' },
                { label: 'น้อยที่สุด (24 ชม.)', value: assessment.pain_score_min, color: 'text-green-600' },
                { label: 'โดยเฉลี่ย', value: assessment.pain_score_avg, color: 'text-yellow-600' },
                { label: 'ขณะนี้', value: assessment.pain_score_now, color: 'text-orange-600' },
              ].map(item => (
                <div key={item.label} className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pain Interference */}
          <div>
            <h3 className="font-bold text-sm text-gray-800 mb-2">ผลกระทบจากความปวด</h3>
            <div className="space-y-1.5">
              {[
                { label: 'กิจกรรมทั่วไป', value: assessment.interference_general_activity },
                { label: 'อารมณ์', value: assessment.interference_mood },
                { label: 'การเดิน', value: assessment.interference_walking },
                { label: 'งานประจำวัน', value: assessment.interference_normal_work },
                { label: 'ความสัมพันธ์', value: assessment.interference_relationship },
                { label: 'การนอนหลับ', value: assessment.interference_sleep },
                { label: 'ความสุข', value: assessment.interference_enjoyment },
              ].map(item => {
                const pct = (item.value / 10) * 100;
                const color = pct <= 30 ? '#22c55e' : pct <= 60 ? '#eab308' : pct <= 80 ? '#f97316' : '#ef4444';
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-24 shrink-0">{item.label}</span>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs font-bold w-5 text-right">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EQ-5D-5L + VAS */}
          <div>
            <h3 className="font-bold text-sm text-gray-800 mb-2">คุณภาพชีวิต (EQ-5D-5L)</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500">VAS</p>
                <p className="text-2xl font-bold text-primary">{assessment.eq5d_vas}<span className="text-sm text-gray-400">/100</span></p>
              </div>
              <div className="flex-1 text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500">Utility</p>
                <p className="text-2xl font-bold text-primary">{utility.toFixed(3)}</p>
              </div>
            </div>
          </div>

          {/* DASS-21 */}
          <div>
            <h3 className="font-bold text-sm text-gray-800 mb-2">สุขภาพจิต (DASS-21)</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Depression', score: assessment.dass21_depression, severity: depSev },
                { label: 'Anxiety', score: assessment.dass21_anxiety, severity: anxSev },
                { label: 'Stress', score: assessment.dass21_stress, severity: strSev },
              ].map(item => (
                <div key={item.label} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold">{item.score}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${getSeverityColor(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-gray-400 text-center pt-3 border-t">
            หมายเหตุ: แบบประเมินนี้ไม่ได้มีวัตถุประสงค์ในการวินิจฉัยโรค แต่เป็นการคัดกรองเบื้องต้น
          </div>
        </div>

        {/* Actions */}
        <div className="no-print mt-4 flex justify-center gap-3">
          <button onClick={() => handlePrint()}
            className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-light font-medium text-sm shadow-md">
            🖨 พิมพ์สรุป
          </button>
          <a href="/form"
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm">
            ทำแบบประเมินใหม่
          </a>
        </div>
      </div>
    </div>
  );
}
