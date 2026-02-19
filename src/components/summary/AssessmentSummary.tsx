import { forwardRef } from 'react';
import type { Assessment, Patient } from '../../lib/types';
import {
  calculateEq5dUtility,
  getDepressionSeverity,
  getAnxietySeverity,
  getStressSeverity,
} from '../../lib/scoring';
import BodyMap from '../ui/BodyMap';
import { formatThaiDate } from '../../lib/dateUtils';

interface Props {
  assessment: Assessment;
  patient: Patient;
}

const interferenceLabels: { key: keyof Assessment; label: string }[] = [
  { key: 'interference_general_activity', label: 'General Activity' },
  { key: 'interference_mood', label: 'Mood' },
  { key: 'interference_walking', label: 'Walking Ability' },
  { key: 'interference_normal_work', label: 'Normal Work' },
  { key: 'interference_relationship', label: 'Relationships' },
  { key: 'interference_sleep', label: 'Sleep' },
  { key: 'interference_enjoyment', label: 'Enjoyment of Life' },
];

const eq5dDomains: { key: keyof Assessment; label: string; tariffKey: string }[] = [
  { key: 'eq5d_mobility', label: 'Mobility', tariffKey: 'mobility' },
  { key: 'eq5d_self_care', label: 'Self-Care', tariffKey: 'selfCare' },
  { key: 'eq5d_usual_activities', label: 'Usual Activities', tariffKey: 'usualActivities' },
  { key: 'eq5d_pain_discomfort', label: 'Pain/Discomfort', tariffKey: 'painDiscomfort' },
  { key: 'eq5d_anxiety_depression', label: 'Anxiety/Depression', tariffKey: 'anxietyDepression' },
];

const eq5dLevelLabels = ['', 'No Problems', 'Slight', 'Moderate', 'Severe', 'Unable/Extreme'];

const visitLabel: Record<string, string> = {
  new_consult: 'New Consult',
  follow_up: 'Follow-up',
  pre_procedure: 'Pre-procedure',
  post_procedure: 'Post-procedure',
};

type SeverityLevel = 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Extremely Severe';

function SeverityBadge({ level }: { level: SeverityLevel }) {
  const styles: Record<SeverityLevel, string> = {
    'Normal': 'bg-green-100 text-green-800 border-green-300',
    'Mild': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Moderate': 'bg-orange-100 text-orange-800 border-orange-300',
    'Severe': 'bg-red-100 text-red-800 border-red-300',
    'Extremely Severe': 'bg-red-200 text-red-900 border-red-400',
  };
  return (
    <span className={`px-1.5 py-0.5 text-[8px] font-semibold border rounded ${styles[level]}`}>
      {level}
    </span>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 border-b border-gray-400 px-2 py-[3px] text-[10px] font-bold tracking-wide uppercase text-gray-700">
      {children}
    </div>
  );
}

const AssessmentSummary = forwardRef<HTMLDivElement, Props>(({ assessment, patient }, ref) => {
  const utility = calculateEq5dUtility(
    assessment.eq5d_mobility,
    assessment.eq5d_self_care,
    assessment.eq5d_usual_activities,
    assessment.eq5d_pain_discomfort,
    assessment.eq5d_anxiety_depression,
  );

  const depSev = getDepressionSeverity(assessment.dass21_depression);
  const anxSev = getAnxietySeverity(assessment.dass21_anxiety);
  const strSev = getStressSeverity(assessment.dass21_stress);

  const interferenceAvg = (
    interferenceLabels.reduce((sum, item) => sum + (assessment[item.key] as number), 0) / interferenceLabels.length
  ).toFixed(1);

  return (
    <div ref={ref} className="bg-white text-[10px] leading-snug w-full print:w-[210mm] print:min-h-[297mm] print:max-h-[297mm] font-[Sarabun,sans-serif]">
      {/* ===== DOCUMENT HEADER ===== */}
      <div className="border-b-2 border-gray-800 pb-2 mb-3 px-4 pt-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[15px] font-bold text-gray-900 tracking-wide">
              PAIN ASSESSMENT REPORT
            </h1>
            <p className="text-[10px] text-gray-600 mt-0.5">
              แผนกระงับปวด โรงพยาบาลศิริราช
            </p>
          </div>
          <div className="text-right text-[9px] text-gray-600">
            <p>เลขที่เอกสาร: <span className="font-mono text-gray-800">{assessment.id?.slice(0, 8).toUpperCase() || '—'}</span></p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        {/* ===== PATIENT INFORMATION ===== */}
        <div className="border border-gray-400 mb-3">
          <SectionHeader>Patient Information</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2">
            <div className="px-2 py-1.5 border-b border-r border-gray-300">
              <span className="text-gray-500">HN:</span>{' '}
              <span className="font-bold text-gray-900">{patient.hn}</span>
            </div>
            <div className="px-2 py-1.5 border-b border-gray-300">
              <span className="text-gray-500">ชื่อ-สกุล:</span>{' '}
              <span className="font-bold text-gray-900">{patient.full_name}</span>
            </div>
            <div className="px-2 py-1.5 border-r border-gray-300">
              <span className="text-gray-500">วันที่ประเมิน:</span>{' '}
              <span className="font-bold text-gray-900">{formatThaiDate(assessment.assessment_date)}</span>
            </div>
            <div className="px-2 py-1.5 border-gray-300">
              <span className="text-gray-500">ประเภท:</span>{' '}
              <span className="font-bold text-gray-900">{visitLabel[assessment.visit_type] || assessment.visit_type}</span>
              {assessment.consult_from && (
                <span className="text-gray-600 ml-2">(From: {assessment.consult_from})</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3">
          {/* ===== LEFT COLUMN ===== */}
          <div className="space-y-3">
            {/* BPI Section */}
            <div className="border border-gray-400">
              <SectionHeader>Brief Pain Inventory (BPI)</SectionHeader>
              <div className="p-2 flex flex-col sm:flex-row gap-3">
                <div className="shrink-0">
                  <BodyMap locations={assessment.pain_location_data} onChange={() => {}} readonly compact />
                </div>
                <div className="flex-1">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Worst Pain (Max)</td>
                        <td className="py-1 text-right font-bold text-red-700 text-xs">{assessment.pain_score_max}/10</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Least Pain (Min)</td>
                        <td className="py-1 text-right font-bold text-green-700 text-xs">{assessment.pain_score_min}/10</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Average Pain</td>
                        <td className="py-1 text-right font-bold text-xs">{assessment.pain_score_avg}/10</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Current Pain (Now)</td>
                        <td className="py-1 text-right font-bold text-orange-700 text-xs">{assessment.pain_score_now}/10</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-600">Treatment Relief</td>
                        <td className="py-1 text-right font-bold text-xs">{assessment.treatment_relief_score}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pain Interference */}
            <div className="border border-gray-400">
              <SectionHeader>Pain Interference</SectionHeader>
              <div className="p-2">
                <table className="w-full">
                  <thead>
                    <tr className="text-[8px] text-gray-500 uppercase tracking-wide">
                      <th className="text-left font-semibold pb-1 border-b border-gray-300">Domain</th>
                      <th className="text-center font-semibold pb-1 border-b border-gray-300 w-12">Score</th>
                      <th className="text-left font-semibold pb-1 border-b border-gray-300 w-20">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interferenceLabels.map(item => {
                      const val = assessment[item.key] as number;
                      const barWidth = (val / 10) * 100;
                      const barColor = val <= 3 ? '#22c55e' : val <= 6 ? '#eab308' : '#ef4444';
                      return (
                        <tr key={item.key} className="border-b border-gray-100">
                          <td className="py-[3px]">{item.label}</td>
                          <td className="text-center font-bold">{val}</td>
                          <td className="py-[3px]">
                            <div className="w-full h-1.5 bg-gray-200 rounded-full">
                              <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-400">
                      <td className="py-1 font-bold text-gray-700">Average</td>
                      <td className="text-center font-bold text-gray-900">{interferenceAvg}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Psychological Screening */}
            <div className="border border-gray-400">
              <SectionHeader>Psychological Screening</SectionHeader>
              <div className="p-2">
                {assessment.psych_screening_na ? (
                  <p className="text-gray-500 italic">N/A - ไม่ได้ประเมิน</p>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-sm flex items-center justify-center text-[8px] border ${assessment.depression_risk_1 ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'border-gray-300 text-gray-300'}`}>
                        {assessment.depression_risk_1 ? '✓' : ''}
                      </span>
                      <span className={assessment.depression_risk_1 ? '' : 'text-gray-400'}>ไม่สบายใจ เซ็ง ทุกข์ใจ เศร้า</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-sm flex items-center justify-center text-[8px] border ${assessment.depression_risk_2 ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'border-gray-300 text-gray-300'}`}>
                        {assessment.depression_risk_2 ? '✓' : ''}
                      </span>
                      <span className={assessment.depression_risk_2 ? '' : 'text-gray-400'}>เบื่อ ไม่อยากทำอะไร</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-sm flex items-center justify-center text-[8px] border ${assessment.suicide_risk ? 'bg-red-100 border-red-400 text-red-800' : 'border-gray-300 text-gray-300'}`}>
                        {assessment.suicide_risk ? '✓' : ''}
                      </span>
                      <span className={assessment.suicide_risk ? 'font-bold text-red-700' : 'text-gray-400'}>
                        Suicide Risk: ทุกข์ใจจนไม่อยากมีชีวิตอยู่
                      </span>
                    </div>
                    {assessment.psych_others && (
                      <p className="mt-1 pl-5 text-gray-700">Others: {assessment.psych_others}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-3">
            {/* EQ-5D-5L */}
            <div className="border border-gray-400">
              <SectionHeader>EQ-5D-5L Health State</SectionHeader>
              <div className="p-2">
                <table className="w-full">
                  <thead>
                    <tr className="text-[8px] text-gray-500 uppercase tracking-wide">
                      <th className="text-left font-semibold pb-1 border-b border-gray-300">Domain</th>
                      <th className="text-center font-semibold pb-1 border-b border-gray-300 w-10">Level</th>
                      <th className="text-left font-semibold pb-1 border-b border-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eq5dDomains.map(d => {
                      const val = assessment[d.key] as number;
                      return (
                        <tr key={d.key} className="border-b border-gray-100">
                          <td className="py-[3px]">{d.label}</td>
                          <td className="text-center font-bold">{val}</td>
                          <td className="text-[9px] text-gray-600">{eq5dLevelLabels[val]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="mt-2 pt-2 border-t border-gray-400 grid grid-cols-2 gap-2">
                  <div className="text-center p-1.5 bg-gray-50 border border-gray-200">
                    <p className="text-[8px] text-gray-500 uppercase tracking-wide">EQ-VAS</p>
                    <p className="text-sm font-bold text-gray-900">{assessment.eq5d_vas}<span className="text-[9px] text-gray-500 font-normal"> /100</span></p>
                  </div>
                  <div className="text-center p-1.5 bg-gray-50 border border-gray-200">
                    <p className="text-[8px] text-gray-500 uppercase tracking-wide">Utility Index</p>
                    <p className="text-sm font-bold text-gray-900">{utility.toFixed(3)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* DASS-21 */}
            <div className="border border-gray-400">
              <SectionHeader>DASS-21</SectionHeader>
              <div className="p-2">
                <table className="w-full">
                  <thead>
                    <tr className="text-[8px] text-gray-500 uppercase tracking-wide">
                      <th className="text-left font-semibold pb-1 border-b border-gray-300">Subscale</th>
                      <th className="text-center font-semibold pb-1 border-b border-gray-300 w-10">Score</th>
                      <th className="text-left font-semibold pb-1 border-b border-gray-300">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-1">Depression</td>
                      <td className="text-center font-bold">{assessment.dass21_depression}</td>
                      <td className="py-1"><SeverityBadge level={depSev} /></td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1">Anxiety</td>
                      <td className="text-center font-bold">{assessment.dass21_anxiety}</td>
                      <td className="py-1"><SeverityBadge level={anxSev} /></td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1">Stress</td>
                      <td className="text-center font-bold">{assessment.dass21_stress}</td>
                      <td className="py-1"><SeverityBadge level={strSev} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="border border-gray-400">
              <SectionHeader>Additional Information</SectionHeader>
              <div className="p-2 space-y-1">
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                  {assessment.others_9q && (
                    <>
                      <span className="font-bold text-gray-600">9Q Score:</span>
                      <span>{assessment.others_9q}</span>
                    </>
                  )}
                  {assessment.others_8q && (
                    <>
                      <span className="font-bold text-gray-600">8Q Score:</span>
                      <span>{assessment.others_8q}</span>
                    </>
                  )}
                  {assessment.other_notes && (
                    <>
                      <span className="font-bold text-gray-600">Notes:</span>
                      <span>{assessment.other_notes}</span>
                    </>
                  )}
                  {assessment.note && (
                    <>
                      <span className="font-bold text-gray-600">Remark:</span>
                      <span>{assessment.note}</span>
                    </>
                  )}
                </div>
                {!assessment.others_9q && !assessment.others_8q && !assessment.other_notes && !assessment.note && (
                  <p className="text-gray-400 italic">— ไม่มีข้อมูลเพิ่มเติม —</p>
                )}
              </div>
            </div>

            {/* Psychologist */}
            <div className="border border-gray-400">
              <SectionHeader>Recording</SectionHeader>
              <div className="p-2 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-sm flex items-center justify-center text-[8px] border ${assessment.psychologist_recorded ? 'bg-blue-100 border-blue-400 text-blue-800' : 'border-gray-300 text-gray-300'}`}>
                  {assessment.psychologist_recorded ? '✓' : ''}
                </span>
                <span className={assessment.psychologist_recorded ? 'text-gray-800' : 'text-gray-400'}>
                  ส่งพบนักจิตวิทยาแล้ว
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== DOCUMENT FOOTER ===== */}
        <div className="mt-3 pt-1.5 border-t border-gray-300 flex justify-between text-[8px] text-gray-400">
          <span>Pain Assessment Report — แผนกระงับปวด ศิริราช</span>
          <span>พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
});

AssessmentSummary.displayName = 'AssessmentSummary';

export default AssessmentSummary;
