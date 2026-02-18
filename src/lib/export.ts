import type { Assessment, Patient } from './types';
import { calculateEq5dUtility, getDepressionSeverity, getAnxietySeverity, getStressSeverity } from './scoring';

const visitLabels: Record<string, string> = {
  new_consult: 'New Consult',
  follow_up: 'Follow Up',
  pre_procedure: 'Pre-Procedure',
  post_procedure: 'Post-Procedure',
};

function escCsv(val: string | number | boolean | null | undefined): string {
  const s = String(val ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function exportAssessmentsToCSV(
  assessments: (Assessment & { patient?: Patient })[],
): void {
  const headers = [
    'HN', 'Full Name', 'Date', 'Visit Type', 'Consult From',
    'Pain Max', 'Pain Min', 'Pain Avg', 'Pain Now', 'Pain Severity Mean',
    'Treatment Relief',
    'Interference: General', 'Interference: Mood', 'Interference: Walking',
    'Interference: Work', 'Interference: Relationship', 'Interference: Sleep',
    'Interference: Enjoyment', 'Interference Mean',
    'EQ5D Mobility', 'EQ5D Self-Care', 'EQ5D Usual Activities',
    'EQ5D Pain/Discomfort', 'EQ5D Anxiety/Depression',
    'EQ5D VAS', 'EQ5D Health State', 'EQ5D Utility (Thai Tariff)',
    'DASS Depression', 'DASS Depression Severity',
    'DASS Anxiety', 'DASS Anxiety Severity',
    'DASS Stress', 'DASS Stress Severity',
    'Depression Risk 1', 'Depression Risk 2', 'Suicide Risk',
    'Note',
  ];

  const rows = assessments.map(a => {
    const painMean = ((a.pain_score_max + a.pain_score_min + a.pain_score_avg + a.pain_score_now) / 4).toFixed(2);

    const intValues = [
      a.interference_general_activity, a.interference_mood, a.interference_walking,
      a.interference_normal_work, a.interference_relationship, a.interference_sleep,
      a.interference_enjoyment,
    ];
    const intMean = (intValues.reduce((s, v) => s + v, 0) / 7).toFixed(2);

    const utility = calculateEq5dUtility(
      a.eq5d_mobility, a.eq5d_self_care, a.eq5d_usual_activities,
      a.eq5d_pain_discomfort, a.eq5d_anxiety_depression,
    );
    const healthState = `${a.eq5d_mobility}${a.eq5d_self_care}${a.eq5d_usual_activities}${a.eq5d_pain_discomfort}${a.eq5d_anxiety_depression}`;

    return [
      a.patient?.hn ?? '', a.patient?.full_name ?? '',
      a.assessment_date, visitLabels[a.visit_type] || a.visit_type, a.consult_from,
      a.pain_score_max, a.pain_score_min, a.pain_score_avg, a.pain_score_now, painMean,
      a.treatment_relief_score,
      ...intValues, intMean,
      a.eq5d_mobility, a.eq5d_self_care, a.eq5d_usual_activities,
      a.eq5d_pain_discomfort, a.eq5d_anxiety_depression,
      a.eq5d_vas, healthState, utility.toFixed(3),
      a.dass21_depression, getDepressionSeverity(a.dass21_depression),
      a.dass21_anxiety, getAnxietySeverity(a.dass21_anxiety),
      a.dass21_stress, getStressSeverity(a.dass21_stress),
      a.depression_risk_1 ? 'Yes' : 'No',
      a.depression_risk_2 ? 'Yes' : 'No',
      a.suicide_risk ? 'Yes' : 'No',
      a.note,
    ].map(escCsv).join(',');
  });

  // BOM for Thai characters in Excel
  const bom = '\uFEFF';
  const csv = bom + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pain_assessments_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
