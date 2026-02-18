import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Patient, Assessment } from '../lib/types';
import { getPatients, getAllAssessments, cleanupOldAssessments, dischargePatient, undischargePatient, deletePatient } from '../lib/supabase';
import { showError } from '../lib/toast';
import { exportAssessmentsToCSV } from '../lib/export';
import { getDepressionSeverity, getAnxietySeverity, getStressSeverity } from '../lib/scoring';
import QRCode from '../components/ui/QRCode';
import { formatThaiDate } from '../lib/dateUtils';

export default function PatientListPage() {
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
      // ลบผลประเมินเก่ากว่า 30 วันอัตโนมัติ
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

  const avgPainNow = assessments.length > 0
    ? (assessments.reduce((s, a) => s + a.pain_score_now, 0) / assessments.length).toFixed(1)
    : '-';
  const avgVAS = assessments.length > 0
    ? (assessments.reduce((s, a) => s + a.eq5d_vas, 0) / assessments.length).toFixed(1)
    : '-';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h1 className="text-2xl font-bold text-primary">Pain Assessment System</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-3 py-2.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 text-sm font-medium"
            title="แสดง QR Code"
          >
            QR
          </button>
          <button
            onClick={copyFormLink}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm ${
              linkCopied
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
            }`}
          >
            {linkCopied ? '✓ คัดลอกแล้ว!' : 'คัดลอกลิงค์'}
          </button>
          <Link
            to="/new"
            className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light font-semibold text-sm shadow-md"
          >
            + ประเมินใหม่
          </Link>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="mb-4 p-4 bg-white border border-purple-200 rounded-lg shadow-sm flex flex-col items-center">
          <p className="text-sm font-semibold text-purple-800 mb-3">QR Code สำหรับผู้ป่วย สแกนเพื่อกรอกแบบฟอร์ม</p>
          <QRCode url={formLink} size={180} />
          <button onClick={() => setShowQR(false)} className="mt-3 text-xs text-gray-500 hover:text-gray-700">ปิด</button>
        </div>
      )}

      {/* Form Link Info */}
      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-orange-800">ลิงค์แบบฟอร์มสำหรับผู้ป่วย</p>
          <p className="text-xs text-orange-600 mt-0.5 font-mono">{formLink}</p>
        </div>
        <button onClick={copyFormLink}
          className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 shrink-0">
          {linkCopied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหา HN หรือชื่อผู้ป่วย..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setTab('dashboard')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'dashboard' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setTab('recent')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'recent' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ประเมินล่าสุด ({assessments.length})
        </button>
        <button
          onClick={() => setTab('patients')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'patients' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ผู้ป่วย ({patients.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">กำลังโหลด...</p>
        </div>
      ) : tab === 'dashboard' ? (
        /* ══════ DASHBOARD ══════ */
        <div className="space-y-4">
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center justify-between">
            <span>ระบบลบผลประเมินเก่ากว่า 30 วันอัตโนมัติ</span>
            {cleanedUp !== null && cleanedUp > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 rounded font-medium">ลบไป {cleanedUp} รายการ</span>
            )}
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-2xl font-bold text-primary">{todayAssessments.length}</p>
              <p className="text-xs text-gray-500 mt-1">ประเมินวันนี้</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-2xl font-bold text-blue-600">{assessments.length}</p>
              <p className="text-xs text-gray-500 mt-1">ประเมินทั้งหมด</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-2xl font-bold text-orange-600">{avgPainNow}</p>
              <p className="text-xs text-gray-500 mt-1">Pain Now เฉลี่ย</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-2xl font-bold text-green-600">{avgVAS}</p>
              <p className="text-xs text-gray-500 mt-1">EQ-VAS เฉลี่ย</p>
            </div>
          </div>

          {/* Alerts */}
          {(suicideRiskPatients.length > 0 || severePatients.length > 0) && (
            <div className="space-y-2">
              {suicideRiskPatients.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
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
              {severePatients.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="text-sm font-bold text-yellow-700 mb-1">DASS-21 Severe/Extremely Severe ({severePatients.length})</p>
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

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={() => exportAssessmentsToCSV(assessments)}
              disabled={assessments.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV ({assessments.length} รายการ)
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
                    className="block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-primary">{a.patient?.hn || 'N/A'}</span>
                        <span className="ml-2 text-gray-700 text-sm">{a.patient?.full_name || 'N/A'}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {visitLabel[a.visit_type] || a.visit_type}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-4 text-xs text-gray-500">
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
          {/* Export button */}
          {assessments.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={() => exportAssessmentsToCSV(assessments)}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
              >
                Export CSV
              </button>
            </div>
          )}
          {assessments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg mb-2">ยังไม่มีข้อมูลการประเมิน</p>
              <Link to="/new" className="text-blue-600 hover:underline">เริ่มประเมินผู้ป่วยคนแรก</Link>
            </div>
          ) : (
            assessments.map(a => (
              <Link
                key={a.id}
                to={`/summary/${a.id}`}
                className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-primary">{a.patient?.hn || 'N/A'}</span>
                    <span className="ml-3 text-gray-700">{a.patient?.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {visitLabel[a.visit_type] || a.visit_type}
                    </span>
                    <span className="text-gray-500">{formatThaiDate(a.assessment_date)}</span>
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>Pain: Max={a.pain_score_max} Now={a.pain_score_now}</span>
                  <span>VAS: {a.eq5d_vas}/100</span>
                  <span>D={a.dass21_depression} A={a.dass21_anxiety} S={a.dass21_stress}</span>
                </div>
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
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                patientFilter === 'active'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              กำลังรักษา ({patients.length})
            </button>
            <button
              onClick={() => setPatientFilter('discharged')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
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
              filteredPatients.map(p => (
                <div key={p.id} className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between">
                    <Link to={`/patient/${p.id}`} className="flex-1">
                      <span className="font-bold text-primary">{p.hn}</span>
                      <span className="ml-3 text-gray-700">{p.full_name}</span>
                    </Link>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => setConfirmAction({ type: 'discharge', patient: p })}
                        className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-yellow-50 hover:text-yellow-700 border border-gray-200 hover:border-yellow-300 transition-all"
                        title="ยุติการรักษา"
                      >
                        ยุติ
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'delete', patient: p })}
                        className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-red-50 hover:text-red-700 border border-gray-200 hover:border-red-300 transition-all"
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
                <div key={p.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <Link to={`/patient/${p.id}`} className="flex-1">
                      <span className="font-bold text-gray-500">{p.hn}</span>
                      <span className="ml-3 text-gray-500">{p.full_name}</span>
                      {p.discharged_at && (
                        <span className="ml-2 text-[10px] text-gray-400">
                          ยุติเมื่อ {new Date(p.discharged_at).toLocaleDateString('th-TH')}
                        </span>
                      )}
                    </Link>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => setConfirmAction({ type: 'undischarge', patient: p })}
                        className="px-2.5 py-1 text-xs bg-white text-blue-600 rounded hover:bg-blue-50 border border-blue-200 hover:border-blue-400 transition-all"
                        title="รับกลับเข้ารักษา"
                      >
                        รับกลับ
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'delete', patient: p })}
                        className="px-2.5 py-1 text-xs bg-white text-gray-600 rounded hover:bg-red-50 hover:text-red-700 border border-gray-200 hover:border-red-300 transition-all"
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
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
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
    </div>
  );
}
