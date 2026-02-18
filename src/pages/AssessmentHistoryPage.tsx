import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Patient, Assessment } from '../lib/types';
import { getPatientById, getAssessmentsByPatient } from '../lib/supabase';
import { calculateEq5dUtility } from '../lib/scoring';
import { showError } from '../lib/toast';
import TrendChart from '../components/ui/TrendChart';
import { formatThaiDate, formatShortDate } from '../lib/dateUtils';

export default function AssessmentHistoryPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      setLoading(true);
      try {
        const [p, a] = await Promise.all([
          getPatientById(patientId),
          getAssessmentsByPatient(patientId),
        ]);
        setPatient(p);
        setAssessments(a);
      } catch (err) {
        console.error(err);
        showError('ไม่สามารถโหลดประวัติการประเมินได้');
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  const visitLabel: Record<string, string> = {
    new_consult: 'New Consult',
    follow_up: 'F/U',
    pre_procedure: 'Pre-Proc',
    post_procedure: 'Post-Proc',
  };

  // Sorted oldest → newest for chart
  const sorted = [...assessments].reverse();

  const makeLabel = (a: Assessment) => formatShortDate(a.assessment_date);

  // ── Trend data ──
  const painTrendLines = [
    { name: 'Pain Max', color: '#ef4444', data: sorted.map(a => ({ label: makeLabel(a), value: a.pain_score_max })) },
    { name: 'Pain Now', color: '#f97316', data: sorted.map(a => ({ label: makeLabel(a), value: a.pain_score_now })) },
    { name: 'Pain Avg', color: '#3b82f6', data: sorted.map(a => ({ label: makeLabel(a), value: a.pain_score_avg })) },
  ];

  const intKeys = [
    'interference_general_activity', 'interference_mood', 'interference_walking',
    'interference_normal_work', 'interference_relationship', 'interference_sleep', 'interference_enjoyment',
  ] as const;

  const interferenceMeanData = sorted.map(a => {
    const sum = intKeys.reduce((s, k) => s + (a[k] as number), 0);
    return { label: makeLabel(a), value: Math.round((sum / 7) * 100) / 100 };
  });

  const utilityData = sorted.map(a => ({
    label: makeLabel(a),
    value: calculateEq5dUtility(a.eq5d_mobility, a.eq5d_self_care, a.eq5d_usual_activities, a.eq5d_pain_discomfort, a.eq5d_anxiety_depression),
  }));

  const vasData = sorted.map(a => ({ label: makeLabel(a), value: a.eq5d_vas }));

  const dassTrendLines = [
    { name: 'Depression', color: '#6366f1', data: sorted.map(a => ({ label: makeLabel(a), value: a.dass21_depression })) },
    { name: 'Anxiety', color: '#ec4899', data: sorted.map(a => ({ label: makeLabel(a), value: a.dass21_anxiety })) },
    { name: 'Stress', color: '#f59e0b', data: sorted.map(a => ({ label: makeLabel(a), value: a.dass21_stress })) },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/" className="text-blue-600 hover:underline text-sm">&larr; กลับหน้าหลัก</Link>
          <h1 className="text-xl font-bold text-primary mt-1">
            ประวัติการประเมิน - {patient?.full_name || 'N/A'}
          </h1>
          <p className="text-sm text-gray-500">HN: {patient?.hn}</p>
        </div>
        <Link
          to="/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light text-sm font-medium"
        >
          + ประเมินใหม่
        </Link>
      </div>

      {/* ── Trend Charts ── */}
      {assessments.length >= 2 && (
        <div className="mb-6">
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-sm font-medium text-blue-600 hover:underline mb-2"
          >
            {showChart ? 'ซ่อนกราฟ' : 'แสดงกราฟแนวโน้ม'}
          </button>

          {showChart && (
            <div className="space-y-4">
              {/* Pain Scores */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Pain Scores</h3>
                <TrendChart lines={painTrendLines} yMin={0} yMax={10} yLabel="Score" />
              </div>

              {/* Interference Mean + EQ-5D Utility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Pain Interference Mean</h3>
                  <TrendChart lines={[{ name: 'Interference Mean', color: '#8b5cf6', data: interferenceMeanData }]} yMin={0} yMax={10} height={180} />
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">EQ-5D Utility (Thai Tariff)</h3>
                  <TrendChart lines={[{ name: 'Utility', color: '#059669', data: utilityData }]} yMin={0} yMax={1} height={180} />
                </div>
              </div>

              {/* VAS + DASS-21 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">EQ-VAS (Health Today)</h3>
                  <TrendChart lines={[{ name: 'VAS', color: '#0ea5e9', data: vasData }]} yMin={0} yMax={100} height={180} />
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">DASS-21</h3>
                  <TrendChart lines={dassTrendLines} yMin={0} yMax={21} height={180} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Assessment List ── */}
      {assessments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">ยังไม่มีประวัติการประเมิน</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((a, index) => (
            <Link
              key={a.id}
              to={`/summary/${a.id}`}
              className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                    {assessments.length - index}
                  </span>
                  <div>
                    <span className="font-medium">{formatThaiDate(a.assessment_date)}</span>
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {visitLabel[a.visit_type] || a.visit_type}
                    </span>
                  </div>
                </div>
                <span className="text-blue-600 text-sm">ดู Summary &rarr;</span>
              </div>
              <div className="mt-2 ml-11 flex gap-6 text-xs text-gray-500">
                <span>Pain: Max <strong>{a.pain_score_max}</strong>, Now <strong>{a.pain_score_now}</strong></span>
                <span>VAS: <strong>{a.eq5d_vas}</strong>/100</span>
                <span>DASS: D=<strong>{a.dass21_depression}</strong> A=<strong>{a.dass21_anxiety}</strong> S=<strong>{a.dass21_stress}</strong></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
