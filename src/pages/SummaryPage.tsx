import { useRef, useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import type { Assessment, Patient } from '../lib/types';
import { getAssessmentById, getPatientById, deleteAssessment } from '../lib/supabase';
import { showError, showSuccess } from '../lib/toast';
import AssessmentSummary from '../components/summary/AssessmentSummary';
import MobileSummaryCard from '../components/summary/MobileSummaryCard';
import ProcedureEditModal from '../components/summary/ProcedureEditModal';
import { formatThaiDate } from '../lib/dateUtils';
import { exportToPdf } from '../lib/pdfExport';

export default function SummaryPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const summaryRef = useRef<HTMLDivElement>(null);

  const [assessment, setAssessment] = useState<Assessment | null>(
    (location.state as any)?.assessment || null
  );
  const [patient, setPatient] = useState<Patient | null>(
    (location.state as any)?.patient || null
  );
  const [loading, setLoading] = useState(!assessment);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showProcedureEdit, setShowProcedureEdit] = useState(false);

  useEffect(() => {
    if (assessment && patient) return;
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        const a = await getAssessmentById(id);
        if (a) {
          setAssessment(a);
          if (a.patient_id) {
            const p = await getPatientById(a.patient_id);
            setPatient(p);
          }
        }
      } catch (err) {
        console.error(err);
        showError('ไม่สามารถโหลดข้อมูลการประเมินได้');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, assessment, patient]);

  const handlePrint = useReactToPrint({
    contentRef: summaryRef,
    documentTitle: `Assessment_${patient?.hn || 'unknown'}_${assessment?.assessment_date || ''}`,
  });

  const handleExportPdf = async () => {
    if (!summaryRef.current) return;
    setIsExporting(true);
    try {
      const filename = `Assessment_${patient?.hn || 'unknown'}_${assessment?.assessment_date || ''}.pdf`;
      await exportToPdf(summaryRef.current, filename);
    } catch (err) {
      console.error(err);
      showError('ไม่สามารถ Export PDF ได้');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteAssessment(id);
      showSuccess('ลบแบบประเมินแล้ว');
      navigate('/');
    } catch (err) {
      console.error(err);
      showError('ไม่สามารถลบได้');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!assessment || !patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ไม่พบข้อมูลการประเมิน</p>
        <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">กลับหน้าหลัก</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Action Buttons */}
      <div className="no-print flex flex-wrap items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm gap-2">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            &larr; กลับหน้าหลัก
          </Link>
          <Link
            to="/new"
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
          >
            + ประเมินใหม่
          </Link>
          <Link
            to={`/edit/${id}`}
            state={{ assessment, patient }}
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm font-medium"
          >
            แก้ไข
          </Link>
          <button
            onClick={() => setShowProcedureEdit(true)}
            className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 text-sm font-medium"
          >
            แก้ไขหัตถการ
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
          >
            ลบ
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm shadow-md disabled:opacity-50"
          >
            {isExporting ? 'กำลัง Export...' : 'PDF'}
          </button>
          <button
            onClick={() => handlePrint()}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm shadow-md"
          >
            พิมพ์
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="no-print mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-sm font-bold text-red-700 mb-2">ยืนยันการลบแบบประเมิน?</p>
          <p className="text-xs text-red-600 mb-3">
            HN: {patient.hn} - {patient.full_name} ({formatThaiDate(assessment.assessment_date)}) — การลบไม่สามารถกู้คืนได้
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold disabled:opacity-50"
            >
              {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Summary Content — Mobile: card view, Desktop: PDF view */}
      <div className="sm:hidden">
        <MobileSummaryCard assessment={assessment} patient={patient} onEditProcedure={() => setShowProcedureEdit(true)} />
      </div>
      <div className="sm:flex sm:justify-center">
        <div className="fixed left-[-9999px] sm:static sm:shadow-lg">
          <AssessmentSummary ref={summaryRef} assessment={assessment} patient={patient} />
        </div>
      </div>

      {/* Procedure Edit Modal */}
      {showProcedureEdit && (
        <ProcedureEditModal
          assessment={assessment}
          onClose={() => setShowProcedureEdit(false)}
          onSaved={(updated) => { setAssessment(updated); setShowProcedureEdit(false); }}
        />
      )}
    </div>
  );
}
