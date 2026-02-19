import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Patient, Assessment } from '../lib/types';
import { getPatients, getAllAssessments, cleanupOldAssessments, dischargePatient, undischargePatient, deletePatient, updatePatient } from '../lib/supabase';
import { showError, showSuccess } from '../lib/toast';
import { exportAssessmentsToCSV } from '../lib/export';
import { getDepressionSeverity, getAnxietySeverity, getStressSeverity } from '../lib/scoring';
import QRCode from '../components/ui/QRCode';
import OnboardingTour from '../components/ui/OnboardingTour';
import { formatThaiDate } from '../lib/dateUtils';

export default function PatientListPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] = useState<(Assessment & { patient?: Patient })[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'dashboard' | 'recent' | 'patients'>('dashboard');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [cleanedUp, setCleanedUp] = useState<number | null>(null);
  const [dischargedPatients, setDischargedPatients] = useState<Patient[]>([]);
  const [patientFilter, setPatientFilter] = useState<'active' | 'discharged'>('active');
  const [confirmAction, setConfirmAction] = useState<{ type: 'discharge' | 'delete' | 'undischarge'; patient: Patient } | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editHN, setEditHN] = useState('');
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('pain_tour_done'));

  const formLink = `${window.location.origin}/form`;

  const copyFormLink = () => {
    navigator.clipboard.writeText(formLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const deleted = await cleanupOldAssessments();
      if (deleted > 0) {
        setCleanedUp(deleted);
        setTimeout(() => setCleanedUp(null), 5000);
      }
      const [p, a, dp] = await Promise.all([getPatients(), getAllAssessments(), getPatients(undefined, true)]);
      setPatients(p);
      setAssessments(a);
      setDischargedPatients(dp.filter(pt => pt.discharged));
    } catch (err) {
      console.error(err);
      showError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = search
    ? patients.filter(p =>
        p.hn.toLowerCase().includes(search.toLowerCase()) ||
        p.full_name.toLowerCase().includes(search.toLowerCase())
      )
    : patients;

  const filteredDischarged = search
    ? dischargedPatients.filter(p =>
        p.hn.toLowerCase().includes(search.toLowerCase()) ||
        p.full_name.toLowerCase().includes(search.toLowerCase())
      )
    : dischargedPatients;

  const handleDischarge = async (patient: Patient) => {
    try {
      await dischargePatient(patient.id!);
      setConfirmAction(null);
      loadData();
    } catch {
      showError('ไม่สามารถยุติการรักษาได้');
    }
  };

  const handleUndischarge = async (patient: Patient) => {
    try {
      await undischargePatient(patient.id!);
      setConfirmAction(null);
      loadData();
    } catch {
      showError('ไม่สามารถรับกลับเข้าการรักษาได้');
    }
  };

  const handleDelete = async (patient: Patient) => {
    try {
      await deletePatient(patient.id!);
      setConfirmAction(null);
      loadData();
    } catch {
      showError('ไม่สามารถลบคนไข้ได้');
    }
  };

  const openEditPatient = (patient: Patient) => {
    setEditPatient(patient);
    setEditHN(patient.hn);
    setEditName(patient.full_name);
  };

  const handleSaveEdit = async () => {
    if (!editPatient) return;
    if (!editHN.trim() || !editName.trim()) {
      showError('กรุณากรอก HN และชื่อ-สกุล');
      return;
    }
    setEditSaving(true);
    try {
      await updatePatient(editPatient.id!, { hn: editHN.trim(), full_name: editName.trim() });
      setEditPatient(null);
      showSuccess('แก้ไขข้อมูลสำเร็จ');
      loadData();
    } catch {
      showError('ไม่สามารถแก้ไขข้อมูลได้');
    } finally {
      setEditSaving(false);
    }
  };

  const filteredAssessments = assessments.filter(a => {
    if (dateFrom && a.assessment_date < dateFrom) return false;
    if (dateTo && a.assessment_date > dateTo) return false;
    if (search) {
      const s = search.toLowerCase();
      const matchHN = a.patient?.hn?.toLowerCase().includes(s);
      const matchName = a.patient?.full_name?.toLowerCase().includes(s);
      if (!matchHN && !matchName) return false;
    }
    return true;
  });

  const visitLabel: Record<string, string> = {
    new_consult: 'New Consult',
    follow_up: 'F/U',
    pre_procedure: 'Pre-Proc',
    post_procedure: 'Post-Proc',
  };

  // ── Dashboard Stats ──
  const today = new Date().toISOString().split('T')[0];
  const todayAssessments = assessments.filter(a => a.assessment_date === today);
  const suicideRiskPatients = assessments.filter(a => a.suicide_risk);
  const severePatients = assessments.filter(a =>
    getDepressionSeverity(a.dass21_depression) === 'Severe' ||
    getDepressionSeverity(a.dass21_depression) === 'Extremely Severe' ||
    getAnxietySeverity(a.dass21_anxiety) === 'Severe' ||
    getAnxietySeverity(a.dass21_anxiety) === 'Extremely Severe' ||
    getStressSeverity(a.dass21_stress) === 'Severe' ||
    getStressSeverity(a.dass21_stress) === 'Extremely Severe'
  );

  const highPainPatients = assessments.filter(a => a.pain_score_now >= 7);

  const avgPainNow = assessments.length > 0
    ? (assessments.reduce((s, a) => s + a.pain_score_now, 0) / assessments.length).toFixed(1)
    : '-';
  const avgVAS = assessments.length > 0
    ? (assessments.reduce((s, a) => s + a.eq5d_vas, 0) / assessments.length).toFixed(1)
    : '-';

  // Pain score distribution for mini chart
  const painDistribution = [0, 0, 0, 0]; // 0-3, 4-6, 7-8, 9-10
  assessments.forEach(a => {
    if (a.pain_score_now <= 3) painDistribution[0]++;
    else if (a.pain_score_now <= 6) painDistribution[1]++;
    else if (a.pain_score_now <= 8) painDistribution[2]++;
    else painDistribution[3]++;
  });
  const painMax = Math.max(...painDistribution, 1);

  // Recent 7 days trend
  const last7Days: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last7Days.push({
      date: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      count: assessments.filter(a => a.assessment_date === dateStr).length,
    });
  }
  const trendMax = Math.max(...last7Days.map(d => d.count), 1);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Pain Assessment</h1>
        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={() => { setShowTour(true); }}
            className="px-2.5 sm:px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 text-xs sm:text-sm font-medium"
            title="คู่มือการใช้งาน"
          >
            📖 คู่มือ
          </button>
          <div data-tour="share-buttons" className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-2.5 sm:px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 text-xs sm:text-sm font-medium"
              title="แสดง QR Code"
            >
              QR
            </button>
            <button
              onClick={copyFormLink}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all shadow-sm ${
                linkCopied
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
              }`}
            >
              {linkCopied ? '✓ คัดลอกแล้ว!' : 'คัดลอกลิงค์'}
            </button>
          </div>
          <Link
            to="/new"
            data-tour="new-assessment"
            className="px-3 sm:px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-light font-semibold text-xs sm:text-sm shadow-md"
          >
            + ประเมินใหม่
          </Link>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="mb-4 p-4 bg-white border border-purple-200 rounded-lg shadow-sm flex flex-col items-center">
          <p className="text-sm font-semibold text-purple-800 mb-3">QR Code สำหรับผู้ป่วย</p>
          <QRCode url={formLink} size={180} />
          <button onClick={() => setShowQR(false)} className="mt-3 text-xs text-gray-500 hover:text-gray-700">ปิด</button>
        </div>
      )}

      {/* Form Link */}
      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-orange-800">ลิงค์แบบฟอร์มสำหรับผู้ป่วย</p>
          <p className="text-[10px] sm:text-xs text-orange-600 mt-0.5 font-mono truncate">{formLink}</p>
        </div>
        <button onClick={copyFormLink}
          className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 shrink-0">
          {linkCopied ? '✓' : 'คัดลอก'}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4" data-tour="search">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหา HN หรือชื่อผู้ป่วย..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg" data-tour="tabs">
        {[
          { key: 'dashboard' as const, label: 'Dashboard' },
          { key: 'recent' as const, label: `ประเมินล่าสุด (${filteredAssessments.length})` },
          { key: 'patients' as const, label: `ผู้ป่วย (${patients.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500 text-sm">กำลังโหลด...</p>
        </div>
      ) : tab === 'dashboard' ? (
        /* ══════ DASHBOARD ══════ */
        <div className="space-y-4">
          {cleanedUp !== null && cleanedUp > 0 && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center justify-between">
              <span>ลบผลประเมินเก่ากว่า 30 วันอัตโนมัติ</span>
              <span className="ml-2 px-2 py-0.5 bg-blue-100 rounded font-medium">ลบไป {cleanedUp} รายการ</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-tour="stats">
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 text-center shadow-sm">
              <p className="text-2xl sm:text-3xl font-bold text-primary">{patients.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">ผู้ป่วยทั้งหมด</p>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 text-center shadow-sm">
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{todayAssessments.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">ประเมินวันนี้</p>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 text-center shadow-sm">
              <p className="text-2xl sm:text-3xl font-bold text-orange-600">{avgPainNow}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Pain Now เฉลี่ย</p>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 text-center shadow-sm">
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{avgVAS}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">EQ-VAS เฉลี่ย</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Pain Distribution */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Pain Score Distribution</h3>
              <div className="flex items-end gap-2 h-24">
                {[
                  { label: '0-3', count: painDistribution[0], color: 'bg-green-400' },
                  { label: '4-6', count: painDistribution[1], color: 'bg-yellow-400' },
                  { label: '7-8', count: painDistribution[2], color: 'bg-orange-400' },
                  { label: '9-10', count: painDistribution[3], color: 'bg-red-400' },
                ].map(bar => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-gray-600">{bar.count}</span>
                    <div
                      className={`w-full rounded-t ${bar.color} transition-all`}
                      style={{ height: `${(bar.count / painMax) * 70}px`, minHeight: bar.count > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-gray-500">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7-Day Trend */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Assessment 7 วันล่าสุด</h3>
              <div className="flex items-end gap-1.5 h-24">
                {last7Days.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-gray-600">{d.count || ''}</span>
                    <div
                      className="w-full bg-blue-400 rounded-t transition-all"
                      style={{ height: `${(d.count / trendMax) * 70}px`, minHeight: d.count > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[9px] text-gray-400">{d.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(suicideRiskPatients.length > 0 || severePatients.length > 0 || highPainPatients.length > 0) && (
            <div className="space-y-2">
              {suicideRiskPatients.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl">
                  <p className="text-sm font-bold text-red-700 mb-1">Suicide Risk ({suicideRiskPatients.length})</p>
                  <div className="space-y-1">
                    {suicideRiskPatients.map(a => (
                      <Link key={a.id} to={`/summary/${a.id}`} className="block text-xs text-red-600 hover:underline">
                        {a.patient?.hn} - {a.patient?.full_name} ({formatThaiDate(a.assessment_date)})
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {highPainPatients.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-300 rounded-xl">
                  <p className="text-sm font-bold text-orange-700 mb-1">High Pain (7+) ({highPainPatients.length})</p>
                  <div className="space-y-1">
                    {highPainPatients.slice(0, 5).map(a => (
                      <Link key={a.id} to={`/summary/${a.id}`} className="block text-xs text-orange-600 hover:underline">
                        {a.patient?.hn} - {a.patient?.full_name} (Pain Now: {a.pain_score_now})
                      </Link>
                    ))}
                    {highPainPatients.length > 5 && (
                      <p className="text-xs text-orange-500">... และอีก {highPainPatients.length - 5} ราย</p>
                    )}
                  </div>
                </div>
              )}
              {severePatients.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-xl">
                  <p className="text-sm font-bold text-yellow-700 mb-1">DASS-21 Severe ({severePatients.length})</p>
                  <div className="space-y-1">
                    {severePatients.slice(0, 5).map(a => (
                      <Link key={a.id} to={`/summary/${a.id}`} className="block text-xs text-yellow-700 hover:underline">
                        {a.patient?.hn} - {a.patient?.full_name} (D={a.dass21_depression} A={a.dass21_anxiety} S={a.dass21_stress})
                      </Link>
                    ))}
                    {severePatients.length > 5 && (
                      <p className="text-xs text-yellow-600">... และอีก {severePatients.length - 5} ราย</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export + Today */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-gray-400">ข้อมูลทั้งหมด {assessments.length} รายการ จาก {patients.length} ผู้ป่วย</p>
            <button
              onClick={() => exportAssessmentsToCSV(assessments)}
              disabled={assessments.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          </div>

          {/* Today's Assessments */}
          {todayAssessments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">ประเมินวันนี้</h3>
              <div className="space-y-2">
                {todayAssessments.map(a => (
                  <Link
                    key={a.id}
                    to={`/summary/${a.id}`}
                    className="block p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-bold text-primary text-sm">{a.patient?.hn || 'N/A'}</span>
                        <span className="ml-2 text-gray-700 text-sm truncate">{a.patient?.full_name || 'N/A'}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium shrink-0">
                        {visitLabel[a.visit_type] || a.visit_type}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      <span>Pain Now: <strong>{a.pain_score_now}</strong></span>
                      <span>VAS: <strong>{a.eq5d_vas}</strong></span>
                      <span>D={a.dass21_depression} A={a.dass21_anxiety} S={a.dass21_stress}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : tab === 'recent' ? (
        /* ══════ RECENT ASSESSMENTS ══════ */
        <div className="space-y-2">
          {/* Date Range Filter + Export */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              <label className="text-gray-500 text-xs">จาก:</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs" />
              <label className="text-gray-500 text-xs ml-1">ถึง:</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs" />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-red-600">ล้าง</button>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-400">{filteredAssessments.length} รายการ</span>
              <button
                onClick={() => exportAssessmentsToCSV(filteredAssessments)}
                disabled={filteredAssessments.length === 0}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
          </div>
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">
                {assessments.length === 0 ? 'ยังไม่มีข้อมูลการประเมิน' : 'ไม่พบผลประเมินในช่วงที่เลือก'}
              </p>
              {assessments.length === 0 && (
                <Link to="/new" className="text-blue-600 hover:underline text-sm">เริ่มประเมินผู้ป่วยคนแรก</Link>
              )}
            </div>
          ) : (
            filteredAssessments.map(a => (
              <Link
                key={a.id}
                to={`/summary/${a.id}`}
                className="block p-3 sm:p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-primary text-sm">{a.patient?.hn || 'N/A'}</span>
                    <span className="ml-2 text-gray-700 text-sm truncate">{a.patient?.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {visitLabel[a.visit_type] || a.visit_type}
                    </span>
                    <span className="text-gray-400 text-xs hidden sm:inline">{formatThaiDate(a.assessment_date)}</span>
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                  <span>Pain: Max={a.pain_score_max} Now={a.pain_score_now}</span>
                  <span>VAS: {a.eq5d_vas}/100</span>
                  <span>D={a.dass21_depression} A={a.dass21_anxiety} S={a.dass21_stress}</span>
                </div>
                <div className="mt-0.5 text-xs text-gray-400 sm:hidden">{formatThaiDate(a.assessment_date)}</div>
              </Link>
            ))
          )}
        </div>
      ) : (
        /* ══════ PATIENT LIST ══════ */
        <div className="space-y-3">
          {/* Active / Discharged sub-tabs */}
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setPatientFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                patientFilter === 'active'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              กำลังรักษา ({patients.length})
            </button>
            <button
              onClick={() => setPatientFilter('discharged')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                patientFilter === 'discharged'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              ยุติการรักษา ({dischargedPatients.length})
            </button>
          </div>

          {patientFilter === 'active' ? (
            filteredPatients.length === 0 ? (
              <p className="text-center py-8 text-gray-500">ไม่พบข้อมูล</p>
            ) : (
              filteredPatients.map((p, idx) => (
                <div key={p.id} className="p-3 sm:p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/patient/${p.id}`} className="flex-1 min-w-0" {...(idx === 0 ? { 'data-tour': 'patient-link' } : {})}>
                      <span className="font-bold text-primary text-sm">{p.hn}</span>
                      <span className="ml-2 text-gray-700 text-sm truncate">{p.full_name}</span>
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditPatient(p)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-300 transition-all"
                        title="แก้ไขข้อมูล"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'discharge', patient: p })}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-yellow-50 hover:text-yellow-700 border border-gray-200 hover:border-yellow-300 transition-all"
                        title="ยุติการรักษา"
                      >
                        ยุติ
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'delete', patient: p })}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-red-50 hover:text-red-700 border border-gray-200 hover:border-red-300 transition-all"
                        title="ลบคนไข้"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            filteredDischarged.length === 0 ? (
              <p className="text-center py-8 text-gray-500">ไม่มีคนไข้ที่ยุติการรักษา</p>
            ) : (
              filteredDischarged.map(p => (
                <div key={p.id} className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/patient/${p.id}`} className="flex-1 min-w-0">
                      <span className="font-bold text-gray-500 text-sm">{p.hn}</span>
                      <span className="ml-2 text-gray-500 text-sm truncate">{p.full_name}</span>
                      {p.discharged_at && (
                        <span className="ml-2 text-[10px] text-gray-400">
                          ยุติเมื่อ {new Date(p.discharged_at).toLocaleDateString('th-TH')}
                        </span>
                      )}
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setConfirmAction({ type: 'undischarge', patient: p })}
                        className="px-2 py-1 text-xs bg-white text-blue-600 rounded hover:bg-blue-50 border border-blue-200 hover:border-blue-400 transition-all"
                        title="รับกลับเข้ารักษา"
                      >
                        รับกลับ
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'delete', patient: p })}
                        className="px-2 py-1 text-xs bg-white text-gray-600 rounded hover:bg-red-50 hover:text-red-700 border border-gray-200 hover:border-red-300 transition-all"
                        title="ลบคนไข้ถาวร"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5">
            <h3 className="font-bold text-lg mb-2">
              {confirmAction.type === 'discharge' && 'ยุติการรักษา'}
              {confirmAction.type === 'undischarge' && 'รับกลับเข้ารักษา'}
              {confirmAction.type === 'delete' && 'ลบคนไข้'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              <strong>{confirmAction.patient.hn}</strong> — {confirmAction.patient.full_name}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {confirmAction.type === 'discharge' && 'คนไข้จะถูกย้ายไปรายการ "ยุติการรักษา" (ข้อมูลยังอยู่)'}
              {confirmAction.type === 'undischarge' && 'คนไข้จะกลับมาอยู่ในรายการกำลังรักษา'}
              {confirmAction.type === 'delete' && 'คนไข้และผลประเมินทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้'}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'discharge') handleDischarge(confirmAction.patient);
                  else if (confirmAction.type === 'undischarge') handleUndischarge(confirmAction.patient);
                  else handleDelete(confirmAction.patient);
                }}
                className={`px-4 py-2 text-sm text-white rounded-lg font-medium ${
                  confirmAction.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmAction.type === 'discharge'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmAction.type === 'discharge' && 'ยุติการรักษา'}
                {confirmAction.type === 'undischarge' && 'รับกลับ'}
                {confirmAction.type === 'delete' && 'ลบถาวร'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tour */}
      {showTour && !loading && (
        <OnboardingTour
          onComplete={() => {
            setShowTour(false);
            setTab('dashboard');
            localStorage.setItem('pain_tour_done', 'true');
          }}
          onSwitchTab={(t) => setTab(t)}
          firstPatientId={patients.length > 0 ? patients[0].id ?? null : null}
          onNavigateToPatient={(patientId) => {
            setShowTour(false);
            navigate(`/patient/${patientId}`);
          }}
          totalSteps={9}
        />
      )}

      {/* Edit Patient Dialog */}
      {editPatient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5">
            <h3 className="font-bold text-lg mb-4">แก้ไขข้อมูลผู้ป่วย</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HN</label>
                <input
                  type="text"
                  value={editHN}
                  onChange={e => setEditHN(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-สกุล</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setEditPatient(null)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light font-medium disabled:opacity-50"
              >
                {editSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
