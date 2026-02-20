import { useState } from 'react';
import type { Assessment, AssessmentTiming, ProcedurePurpose } from '../../lib/types';
import { updateAssessment } from '../../lib/supabase';
import { showSuccess, showError } from '../../lib/toast';

interface Props {
  assessment: Assessment;
  onClose: () => void;
  onSaved: (updated: Assessment) => void;
}

export default function ProcedureEditModal({ assessment, onClose, onSaved }: Props) {
  const [isNewCase, setIsNewCase] = useState<boolean | null>(assessment.is_new_case ?? null);
  const [timing, setTiming] = useState<AssessmentTiming | null>(assessment.assessment_timing ?? null);
  const [purpose, setPurpose] = useState<ProcedurePurpose | null>(assessment.procedure_purpose ?? null);
  const [procName, setProcName] = useState(assessment.procedure_name ?? '');
  const [procDate, setProcDate] = useState(assessment.procedure_date ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isNewCase === null) { showError('กรุณาเลือกว่าเป็นผู้ป่วยใหม่หรือไม่'); return; }
    if (!timing) { showError('กรุณาเลือกตอบแบบสอบถาม'); return; }
    if (!purpose) { showError('กรุณาเลือกหัตถการเพื่ออะไร'); return; }
    if (!assessment.id) return;
    setSaving(true);
    try {
      const updates = {
        is_new_case: isNewCase,
        assessment_timing: timing,
        procedure_purpose: purpose,
        procedure_name: procName,
        procedure_date: procDate,
      };
      const result = await updateAssessment(assessment.id, updates);
      if (result) {
        showSuccess('บันทึกข้อมูลหัตถการแล้ว');
        onSaved({ ...assessment, ...updates });
      }
    } catch {
      showError('ไม่สามารถบันทึกได้');
    } finally {
      setSaving(false);
    }
  };

  const radioCls = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ${
      active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">แก้ไขข้อมูลหัตถการ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">{'\u2715'}</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ผู้ป่วยใหม่ <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              <label className={radioCls(isNewCase === true)}>
                <input type="radio" name="editNewCase" checked={isNewCase === true} onChange={() => setIsNewCase(true)} className="hidden" />
                <span className="text-sm font-medium">ใช่</span>
              </label>
              <label className={radioCls(isNewCase === false)}>
                <input type="radio" name="editNewCase" checked={isNewCase === false} onChange={() => setIsNewCase(false)} className="hidden" />
                <span className="text-sm font-medium">ไม่ใช่</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ตอบแบบสอบถาม <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              <label className={radioCls(timing === 'pre_procedure')}>
                <input type="radio" name="editTiming" checked={timing === 'pre_procedure'} onChange={() => setTiming('pre_procedure')} className="hidden" />
                <span className="text-sm font-medium">ก่อนทำหัตถการ</span>
              </label>
              <label className={radioCls(timing === 'post_procedure')}>
                <input type="radio" name="editTiming" checked={timing === 'post_procedure'} onChange={() => setTiming('post_procedure')} className="hidden" />
                <span className="text-sm font-medium">หลังทำหัตถการ</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">หัตถการเพื่อ <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              <label className={radioCls(purpose === 'diagnostic')}>
                <input type="radio" name="editPurpose" checked={purpose === 'diagnostic'} onChange={() => setPurpose('diagnostic')} className="hidden" />
                <span className="text-sm font-medium">เพื่อการวินิจฉัย</span>
              </label>
              <label className={radioCls(purpose === 'therapeutic')}>
                <input type="radio" name="editPurpose" checked={purpose === 'therapeutic'} onChange={() => setPurpose('therapeutic')} className="hidden" />
                <span className="text-sm font-medium">เพื่อการรักษา</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หัตถการ</label>
            <input type="text" value={procName} onChange={e => setProcName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ชื่อหัตถการ (ถ้ามี)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่นัดทำหัตถการ</label>
            <input type="date" value={procDate} onChange={e => setProcDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">ยกเลิก</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-light text-sm font-bold shadow-sm disabled:opacity-50">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}
