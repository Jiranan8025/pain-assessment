import type { Assessment } from '../../lib/types';
import {
  calculateEq5dUtility,
  getDepressionSeverity,
  getAnxietySeverity,
  getStressSeverity,
} from '../../lib/scoring';
import { formatThaiDate } from '../../lib/dateUtils';

interface Props {
  a: Assessment;
  b: Assessment;
  onClose: () => void;
}

function Delta({ val, inverted = false }: { val: number; inverted?: boolean }) {
  if (val === 0) return <span className="text-gray-400">—</span>;
  const isGood = inverted ? val > 0 : val < 0;
  const color = isGood ? 'text-green-600' : 'text-red-600';
  const arrow = val > 0 ? '▲' : '▼';
  return <span className={`text-xs font-bold ${color}`}>{arrow} {Math.abs(val)}</span>;
}

function DeltaDecimal({ val, inverted = false }: { val: number; inverted?: boolean }) {
  if (Math.abs(val) < 0.001) return <span className="text-gray-400">—</span>;
  const isGood = inverted ? val < 0 : val > 0;
  const color = isGood ? 'text-green-600' : 'text-red-600';
  const arrow = val > 0 ? '▲' : '▼';
  return <span className={`text-xs font-bold ${color}`}>{arrow} {Math.abs(val).toFixed(3)}</span>;
}

const interferenceLabels = [
  { key: 'interference_general_activity', label: 'General Activity' },
  { key: 'interference_mood', label: 'Mood' },
  { key: 'interference_walking', label: 'Walking' },
  { key: 'interference_normal_work', label: 'Normal Work' },
  { key: 'interference_relationship', label: 'Relationships' },
  { key: 'interference_sleep', label: 'Sleep' },
  { key: 'interference_enjoyment', label: 'Enjoyment' },
] as const;

const eq5dLabels = [
  { key: 'eq5d_mobility', label: 'Mobility' },
  { key: 'eq5d_self_care', label: 'Self-Care' },
  { key: 'eq5d_usual_activities', label: 'Usual Activities' },
  { key: 'eq5d_pain_discomfort', label: 'Pain/Discomfort' },
  { key: 'eq5d_anxiety_depression', label: 'Anxiety/Depression' },
] as const;

export default function AssessmentCompare({ a, b, onClose }: Props) {
  const utilA = calculateEq5dUtility(a.eq5d_mobility, a.eq5d_self_care, a.eq5d_usual_activities, a.eq5d_pain_discomfort, a.eq5d_anxiety_depression);
  const utilB = calculateEq5dUtility(b.eq5d_mobility, b.eq5d_self_care, b.eq5d_usual_activities, b.eq5d_pain_discomfort, b.eq5d_anxiety_depression);

  const visitLabel: Record<string, string> = {
    new_consult: 'New', follow_up: 'F/U', pre_procedure: 'Pre', post_procedure: 'Post',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
          <h2 className="font-bold text-lg text-gray-800">เปรียบเทียบผลประเมิน</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <div className="p-4 text-sm">
          {/* Header */}
          <table className="w-full mb-4">
            <thead>
              <tr className="text-xs text-gray-500">
                <th className="text-left w-1/3"></th>
                <th className="text-center w-1/4 pb-1">{formatThaiDate(a.assessment_date)}<br /><span className="text-[10px]">{visitLabel[a.visit_type]}</span></th>
                <th className="text-center w-1/4 pb-1">{formatThaiDate(b.assessment_date)}<br /><span className="text-[10px]">{visitLabel[b.visit_type]}</span></th>
                <th className="text-center w-1/6 pb-1">เปลี่ยนแปลง</th>
              </tr>
            </thead>
          </table>

          {/* Pain Scores */}
          <h3 className="font-bold text-xs text-gray-600 uppercase tracking-wide mb-1 border-b pb-1">Pain Score</h3>
          <table className="w-full mb-4">
            <tbody>
              {([
                ['Worst (Max)', 'pain_score_max'],
                ['Least (Min)', 'pain_score_min'],
                ['Average', 'pain_score_avg'],
                ['Current (Now)', 'pain_score_now'],
                ['Treatment Relief', 'treatment_relief_score'],
              ] as const).map(([label, key]) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-1 w-1/3 text-gray-600">{label}</td>
                  <td className="text-center font-bold">{a[key]}</td>
                  <td className="text-center font-bold">{b[key]}</td>
                  <td className="text-center">
                    <Delta val={(b[key] as number) - (a[key] as number)} inverted={key === 'treatment_relief_score'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pain Interference */}
          <h3 className="font-bold text-xs text-gray-600 uppercase tracking-wide mb-1 border-b pb-1">Pain Interference</h3>
          <table className="w-full mb-4">
            <tbody>
              {interferenceLabels.map(({ key, label }) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-1 w-1/3 text-gray-600">{label}</td>
                  <td className="text-center font-bold">{a[key]}</td>
                  <td className="text-center font-bold">{b[key]}</td>
                  <td className="text-center"><Delta val={(b[key] as number) - (a[key] as number)} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* EQ-5D-5L */}
          <h3 className="font-bold text-xs text-gray-600 uppercase tracking-wide mb-1 border-b pb-1">EQ-5D-5L</h3>
          <table className="w-full mb-2">
            <tbody>
              {eq5dLabels.map(({ key, label }) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-1 w-1/3 text-gray-600">{label}</td>
                  <td className="text-center font-bold">{a[key]}</td>
                  <td className="text-center font-bold">{b[key]}</td>
                  <td className="text-center"><Delta val={(b[key] as number) - (a[key] as number)} /></td>
                </tr>
              ))}
              <tr className="border-b border-gray-100">
                <td className="py-1 w-1/3 text-gray-600">VAS</td>
                <td className="text-center font-bold">{a.eq5d_vas}</td>
                <td className="text-center font-bold">{b.eq5d_vas}</td>
                <td className="text-center"><Delta val={b.eq5d_vas - a.eq5d_vas} inverted /></td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="py-1 w-1/3 font-semibold text-gray-700">Utility</td>
                <td className="text-center font-bold">{utilA.toFixed(3)}</td>
                <td className="text-center font-bold">{utilB.toFixed(3)}</td>
                <td className="text-center"><DeltaDecimal val={utilB - utilA} /></td>
              </tr>
            </tbody>
          </table>

          {/* DASS-21 */}
          <h3 className="font-bold text-xs text-gray-600 uppercase tracking-wide mb-1 border-b pb-1 mt-4">DASS-21</h3>
          <table className="w-full">
            <tbody>
              {([
                ['Depression', 'dass21_depression', getDepressionSeverity],
                ['Anxiety', 'dass21_anxiety', getAnxietySeverity],
                ['Stress', 'dass21_stress', getStressSeverity],
              ] as const).map(([label, key, getSev]) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-1 w-1/3 text-gray-600">{label}</td>
                  <td className="text-center">
                    <span className="font-bold">{a[key]}</span>
                    <span className="text-[10px] text-gray-400 ml-1">({getSev(a[key] as number)})</span>
                  </td>
                  <td className="text-center">
                    <span className="font-bold">{b[key]}</span>
                    <span className="text-[10px] text-gray-400 ml-1">({getSev(b[key] as number)})</span>
                  </td>
                  <td className="text-center"><Delta val={(b[key] as number) - (a[key] as number)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t px-4 py-3 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
