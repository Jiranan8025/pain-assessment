import { useState, useEffect } from 'react';
import type { Assessment, VisitType, AssessmentTiming, ProcedurePurpose } from '../../lib/types';
import { findPatientByHN } from '../../lib/supabase';

interface Props {
  data: Assessment;
  patientHN: string;
  patientName: string;
  onPatientHNChange: (v: string) => void;
  onPatientNameChange: (v: string) => void;
  onChange: (data: Partial<Assessment>) => void;
}

const visitTypes: { value: VisitType; label: string }[] = [
  { value: 'new_consult', label: 'New Consult' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'pre_procedure', label: 'ก่อนทำหัตถการ' },
  { value: 'post_procedure', label: 'หลังทำหัตถการ' },
];

export default function PatientInfoForm({ data, patientHN, patientName, onPatientHNChange, onPatientNameChange, onChange }: Props) {
  const [hnLookupStatus, setHnLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [autoFilled, setAutoFilled] = useState(false);

  const handleHNChange = (value: string) => {
    onPatientHNChange(value);
    setHnLookupStatus('idle');
    if (autoFilled) {
      onPatientNameChange('');
      setAutoFilled(false);
    }
  };

  const lookupHN = async () => {
    const hn = patientHN.trim();
    if (!hn) return;
    setHnLookupStatus('loading');
    try {
      const patient = await findPatientByHN(hn);
      if (patient) {
        onPatientNameChange(patient.full_name);
        setAutoFilled(true);
        setHnLookupStatus('found');
      } else {
        setHnLookupStatus('not_found');
      }
    } catch {
      setHnLookupStatus('not_found');
    }
    // Reset status after 3 seconds
    setTimeout(() => setHnLookupStatus('idle'), 3000);
  };


  // Auto-set is_new_case from HN lookup
  useEffect(() => {
    if (hnLookupStatus === 'found' && data.is_new_case === null) {
      onChange({ is_new_case: false });
    } else if (hnLookupStatus === 'not_found' && data.is_new_case === null) {
      onChange({ is_new_case: true });
    }
  }, [hnLookupStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-primary">ข้อมูลผู้ป่วย</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">HN (Hospital Number)</label>
          <input
            type="text"
            value={patientHN}
            onChange={e => handleHNChange(e.target.value)}
            onBlur={lookupHN}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookupHN(); } }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="เช่น 66XXXXXX"
          />
          {hnLookupStatus === 'loading' && (
            <p className="text-xs text-blue-500 mt-1">กำลังค้นหา...</p>
          )}
          {hnLookupStatus === 'found' && (
            <p className="text-xs text-green-600 mt-1">พบข้อมูลผู้ป่วย - เติมชื่อให้แล้ว</p>
          )}
          {hnLookupStatus === 'not_found' && (
            <p className="text-xs text-gray-400 mt-1">ผู้ป่วยใหม่ - กรุณากรอกชื่อ</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
          <input
            type="text"
            value={patientName}
            onChange={e => onPatientNameChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              hnLookupStatus === 'found' ? 'border-green-300 bg-green-50' : 'border-gray-300'
            }`}
            placeholder="ชื่อ นามสกุล"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ตอบแบบสอบถาม</label>
          <input
            type="date"
            value={data.assessment_date}
            onChange={e => onChange({ assessment_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทการมาพบ</label>
          <div className="flex flex-wrap gap-2">
            {visitTypes.map(vt => (
              <label
                key={vt.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all ${
                  data.visit_type === vt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="visitType"
                  value={vt.value}
                  checked={data.visit_type === vt.value}
                  onChange={() => onChange({ visit_type: vt.value })}
                  className="hidden"
                />
                <span className="text-sm font-medium">{vt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {data.visit_type === 'new_consult' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Consult From</label>
          <input
            type="text"
            value={data.consult_from}
            onChange={e => onChange({ consult_from: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="แผนกที่ส่งมา"
          />
        </div>
      )}


      {/* ── Procedure / Medical Info ── */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">ข้อมูลหัตถการ</h3>

        {/* 1. is_new_case */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ผู้ป่วยใหม่ <span className="text-red-500">*</span></label>
          <div className="flex gap-3">
            {([{ val: true, label: 'ใช่' }, { val: false, label: 'ไม่ใช่' }] as const).map(opt => (
              <label key={String(opt.val)} className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ${
                data.is_new_case === opt.val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input type="radio" name="isNewCase" checked={data.is_new_case === opt.val}
                  onChange={() => onChange({ is_new_case: opt.val })} className="hidden" />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 2. assessment_timing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ตอบแบบสอบถาม <span className="text-red-500">*</span></label>
          <div className="flex gap-3">
            {([{ val: 'pre_procedure' as AssessmentTiming, label: 'ก่อนทำหัตถการ' }, { val: 'post_procedure' as AssessmentTiming, label: 'หลังทำหัตถการ' }]).map(opt => (
              <label key={opt.val} className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ${
                data.assessment_timing === opt.val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input type="radio" name="assessmentTiming" checked={data.assessment_timing === opt.val}
                  onChange={() => onChange({ assessment_timing: opt.val })} className="hidden" />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 3. procedure_purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">หัตถการเพื่อ <span className="text-red-500">*</span></label>
          <div className="flex gap-3">
            {([{ val: 'diagnostic' as ProcedurePurpose, label: 'เพื่อการวินิจฉัย' }, { val: 'therapeutic' as ProcedurePurpose, label: 'เพื่อการรักษา' }]).map(opt => (
              <label key={opt.val} className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ${
                data.procedure_purpose === opt.val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input type="radio" name="procedurePurpose" checked={data.procedure_purpose === opt.val}
                  onChange={() => onChange({ procedure_purpose: opt.val })} className="hidden" />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 4. procedure_name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หัตถการ</label>
          <input type="text" value={data.procedure_name}
            onChange={e => onChange({ procedure_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ชื่อหัตถการ (ถ้ามี)" />
        </div>

        {/* 5. procedure_date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่นัดทำหัตถการ</label>
          <input type="date" value={data.procedure_date}
            onChange={e => onChange({ procedure_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (ถ้ามี)</label>
        <textarea
          value={data.note}
          onChange={e => onChange({ note: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="หมายเหตุเพิ่มเติม..."
        />
      </div>

      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.psychologist_recorded}
            onChange={e => onChange({ psychologist_recorded: e.target.checked })}
            className="w-4 h-4 text-purple-600 rounded"
          />
          <span className="text-sm font-medium text-purple-800">สำหรับนักจิตวิทยา: บันทึกลง Form แล้ว</span>
        </label>
      </div>
    </div>
  );
}
