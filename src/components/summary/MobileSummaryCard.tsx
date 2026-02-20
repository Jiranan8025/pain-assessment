import type { Assessment, Patient } from '../../lib/types';
import {
  calculateEq5dUtility,
  getDepressionSeverity,
  getAnxietySeverity,
  getStressSeverity,
  getSeverityColor,
} from '../../lib/scoring';
import { formatThaiDate } from '../../lib/dateUtils';

interface Props {
  assessment: Assessment;
  patient: Patient;
  onEditProcedure?: () => void;
}

const visitLabel: Record<string, string> = {
  new_consult: 'New Consult',
  follow_up: 'Follow-up',
  pre_procedure: 'Pre-procedure',
  post_procedure: 'Post-procedure',
};

export default function MobileSummaryCard({ assessment, patient, onEditProcedure }: Props) {
  const utility = calculateEq5dUtility(
    assessment.eq5d_mobility, assessment.eq5d_self_care,
    assessment.eq5d_usual_activities, assessment.eq5d_pain_discomfort,
    assessment.eq5d_anxiety_depression,
  );
  const depSev = getDepressionSeverity(assessment.dass21_depression);
  const anxSev = getAnxietySeverity(assessment.dass21_anxiety);
  const strSev = getStressSeverity(assessment.dass21_stress);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-5">
      {/* Header */}
      <div className="text-center border-b pb-4">
        <h2 className="text-lg font-bold text-primary">สรุปผลประเมินความปวด</h2>
        <p className="text-sm text-gray-500 mt-1">{patient.full_name} (HN: {patient.hn})</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatThaiDate(assessment.assessment_date)} — {visitLabel[assessment.visit_type] || assessment.visit_type}
          {assessment.consult_from && ` (From: ${assessment.consult_from})`}
        </p>
      </div>

      {/* Procedure Info */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm text-gray-800">ข้อมูลหัตถการ</h3>
          {onEditProcedure && (
            <button onClick={onEditProcedure} className="text-xs text-teal-600 font-medium hover:underline">แก้ไข</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">ผู้ป่วยใหม่:</span>{' '}
            <span className="font-medium">{assessment.is_new_case === true ? 'ใช่' : assessment.is_new_case === false ? 'ไม่ใช่' : '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">ตอบแบบสอบถาม:</span>{' '}
            <span className="font-medium">{assessment.assessment_timing === 'pre_procedure' ? 'ก่อนหัตถการ' : assessment.assessment_timing === 'post_procedure' ? 'หลังหัตถการ' : '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">หัตถการเพื่อ:</span>{' '}
            <span className="font-medium">{assessment.procedure_purpose === 'diagnostic' ? 'วินิจฉัย' : assessment.procedure_purpose === 'therapeutic' ? 'รักษา' : '—'}</span>
          </div>
          {assessment.procedure_name && (
            <div>
              <span className="text-gray-500">หัตถการ:</span>{' '}
              <span className="font-medium">{assessment.procedure_name}</span>
            </div>
          )}
          {assessment.procedure_date && (
            <div>
              <span className="text-gray-500">วันนัด:</span>{' '}
              <span className="font-medium">{formatThaiDate(assessment.procedure_date)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pain Scores */}
      <div>
        <h3 className="font-bold text-sm text-gray-800 mb-2">คะแนนความปวด (0-10)</h3>
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
        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">Treatment Relief</p>
          <p className="text-2xl font-bold text-blue-600">{assessment.treatment_relief_score}<span className="text-sm text-gray-400">%</span></p>
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
            <p className={`text-2xl font-bold ${utility >= 0.8 ? 'text-green-600' : utility >= 0.5 ? 'text-orange-500' : 'text-red-600'}`}>
              {utility.toFixed(3)}
            </p>
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

      {/* Psychological Screening */}
      <div>
        <h3 className="font-bold text-sm text-gray-800 mb-2">การคัดกรองทางจิตวิทยา</h3>
        {assessment.psych_screening_na ? (
          <p className="text-sm text-gray-400 italic">N/A - ไม่ได้ประเมิน</p>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${assessment.depression_risk_1 ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'border-gray-300 text-gray-300'}`}>
                {assessment.depression_risk_1 ? '✓' : ''}
              </span>
              <span className={assessment.depression_risk_1 ? 'text-gray-800' : 'text-gray-400'}>ไม่สบายใจ เซ็ง ทุกข์ใจ เศร้า</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${assessment.depression_risk_2 ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'border-gray-300 text-gray-300'}`}>
                {assessment.depression_risk_2 ? '✓' : ''}
              </span>
              <span className={assessment.depression_risk_2 ? 'text-gray-800' : 'text-gray-400'}>เบื่อ ไม่อยากทำอะไร</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${assessment.suicide_risk ? 'bg-red-100 border-red-400 text-red-800' : 'border-gray-300 text-gray-300'}`}>
                {assessment.suicide_risk ? '✓' : ''}
              </span>
              <span className={assessment.suicide_risk ? 'font-bold text-red-700' : 'text-gray-400'}>Suicide Risk: ทุกข์ใจจนไม่อยากมีชีวิตอยู่</span>
            </div>
            {assessment.psych_others && (
              <p className="text-gray-600 ml-7">Others: {assessment.psych_others}</p>
            )}
          </div>
        )}
      </div>

      {/* Additional Info */}
      {(assessment.others_9q || assessment.others_8q || assessment.other_notes || assessment.note) && (
        <div>
          <h3 className="font-bold text-sm text-gray-800 mb-2">ข้อมูลเพิ่มเติม</h3>
          <div className="space-y-1 text-sm">
            {assessment.others_9q && <p><span className="text-gray-500">9Q:</span> {assessment.others_9q}</p>}
            {assessment.others_8q && <p><span className="text-gray-500">8Q:</span> {assessment.others_8q}</p>}
            {assessment.other_notes && <p><span className="text-gray-500">Notes:</span> {assessment.other_notes}</p>}
            {assessment.note && <p><span className="text-gray-500">Remark:</span> {assessment.note}</p>}
          </div>
        </div>
      )}

      {/* Recording */}
      <div className="flex items-center gap-2 text-sm pt-2 border-t">
        <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${assessment.psychologist_recorded ? 'bg-blue-100 border-blue-400 text-blue-800' : 'border-gray-300 text-gray-300'}`}>
          {assessment.psychologist_recorded ? '✓' : ''}
        </span>
        <span className={assessment.psychologist_recorded ? 'text-gray-800' : 'text-gray-400'}>
          ส่งพบนักจิตวิทยาแล้ว
        </span>
      </div>
    </div>
  );
}
