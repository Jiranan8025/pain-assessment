import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEmptyAssessment } from '../lib/types';
import type { Assessment } from '../lib/types';
import { findOrCreatePatient, createAssessment, findPatientByHN } from '../lib/supabase';
import { showError, showSuccess } from '../lib/toast';
import { patientSchema, assessmentSubmitSchema, formatValidationError } from '../lib/validation';
import { useDraft } from '../lib/useDraft';
import { useUnsavedWarning } from '../lib/useUnsavedWarning';
import PainScaleSlider from '../components/ui/PainScaleSlider';
import BodyMap from '../components/ui/BodyMap';
import RadioScale from '../components/ui/RadioScale';
import { EQ5D_LABELS, DASS21_QUESTIONS, DASS21_OPTIONS, calculateDass21 } from '../lib/scoring';

const steps = [
  'ข้อมูลเบื้องต้น',
  'ประเมินความปวด',
  'ผลกระทบจากความปวด',
  'คุณภาพชีวิต',
  'สุขภาพจิต',
];

interface DraftData {
  assessment: Assessment;
  hn: string;
  name: string;
}

export default function PatientFormPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Assessment>(createEmptyAssessment());
  const [patientName, setPatientName] = useState('');
  const [patientHN, setPatientHN] = useState('');
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const onRestore = useCallback((draft: DraftData) => {
    setData(draft.assessment);
    setPatientHN(draft.hn);
    setPatientName(draft.name);
    setDraftRestored(true);
  }, []);

  const { clearDraft } = useDraft<DraftData>(
    'patient_form',
    { assessment: data, hn: patientHN, name: patientName },
    onRestore,
  );

  const hasUnsavedChanges = !submitted && (patientHN !== '' || patientName !== '' || step > 0);
  const blocker = useUnsavedWarning(hasUnsavedChanges);

  const [hnLookupStatus, setHnLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [autoFilled, setAutoFilled] = useState(false);

  const handleHNChange = (value: string) => {
    setPatientHN(value);
    setHnLookupStatus('idle');
    if (autoFilled) {
      setPatientName('');
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
        setPatientName(patient.full_name);
        setAutoFilled(true);
        setHnLookupStatus('found');
      } else {
        setHnLookupStatus('not_found');
      }
    } catch {
      setHnLookupStatus('not_found');
    }
    setTimeout(() => setHnLookupStatus('idle'), 3000);
  };

  const update = (partial: Partial<Assessment>) => setData(prev => ({ ...prev, ...partial }));

  const handleDass21Change = (index: number, value: number) => {
    const newAnswers = [...data.dass21_answers];
    newAnswers[index] = value;
    const scores = calculateDass21(newAnswers);
    update({
      dass21_answers: newAnswers,
      dass21_depression: scores.depression,
      dass21_anxiety: scores.anxiety,
      dass21_stress: scores.stress,
    });
  };

  const handleSubmit = async () => {
    // Validate patient info (HN required — ผู้ป่วยต้องมี HN จากแผนกที่ส่งตัวมา)
    const patientResult = patientSchema.safeParse({ hn: patientHN, full_name: patientName });
    if (!patientResult.success) {
      showError(formatValidationError(patientResult.error));
      return;
    }

    // Validate assessment data
    const assessmentResult = assessmentSubmitSchema.safeParse(data);
    if (!assessmentResult.success) {
      showError(formatValidationError(assessmentResult.error));
      return;
    }

    setIsSubmitting(true);
    try {
      const patient = await findOrCreatePatient(patientHN, patientName);
      const assessment = await createAssessment({ ...data, patient_id: patient.id });
      clearDraft();
      setSubmitted(true);
      showSuccess('ส่งแบบประเมินสำเร็จ');
      navigate(`/form/complete/${assessment.id}`, { state: { assessment, patient } });
    } catch (err) {
      console.error(err);
      showError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastStep = step === steps.length - 1;

  // EQ-5D domains
  const eq5dDomains: { key: keyof Assessment; title: string; labelsKey: keyof typeof EQ5D_LABELS }[] = [
    { key: 'eq5d_mobility', title: 'การเคลื่อนไหว', labelsKey: 'mobility' },
    { key: 'eq5d_self_care', title: 'การดูแลตนเอง', labelsKey: 'selfCare' },
    { key: 'eq5d_usual_activities', title: 'กิจกรรมที่ทำเป็นประจำ (เช่น ทำงาน เรียนหนังสือ ทำงานบ้าน กิจกรรมยามว่าง)', labelsKey: 'usualActivities' },
    { key: 'eq5d_pain_discomfort', title: 'อาการเจ็บปวด / อาการไม่สบายตัว', labelsKey: 'painDiscomfort' },
    { key: 'eq5d_anxiety_depression', title: 'ความวิตกกังวล / ความซึมเศร้า', labelsKey: 'anxietyDepression' },
  ];

  // Pain interference items
  const interferenceItems: { key: keyof Assessment; label: string }[] = [
    { key: 'interference_general_activity', label: 'กิจกรรมโดยทั่วไป' },
    { key: 'interference_mood', label: 'อารมณ์' },
    { key: 'interference_walking', label: 'ความสามารถในการเดิน' },
    { key: 'interference_normal_work', label: 'งานประจำวัน (ทั้งงานนอกบ้านและงานบ้าน)' },
    { key: 'interference_relationship', label: 'ความสัมพันธ์กับผู้อื่น' },
    { key: 'interference_sleep', label: 'การนอนหลับ' },
    { key: 'interference_enjoyment', label: 'ความสุขในการใช้ชีวิตประจำวัน' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header สำหรับคนไข้ */}
      <div className="bg-primary text-white py-4 px-6 shadow-md">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-bold text-lg">แบบประเมินความปวด</h1>
          <p className="text-blue-200 text-xs mt-0.5">แผนกระงับปวด โรงพยาบาลศิริราช</p>
        </div>
      </div>

      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">ออกจากแบบประเมิน?</h3>
            <p className="text-sm text-gray-600 mb-4">ข้อมูลที่กรอกไว้จะถูกบันทึกเป็นฉบับร่าง สามารถกลับมากรอกต่อได้</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => blocker.reset()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                กรอกต่อ
              </button>
              <button onClick={() => blocker.proceed()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                ออกจากหน้านี้
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 md:p-6">
        {draftRestored && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <p className="text-sm text-amber-800">กู้คืนข้อมูลที่กรอกค้างไว้แล้ว</p>
            <button onClick={() => { clearDraft(); setData(createEmptyAssessment()); setPatientHN(''); setPatientName(''); setDraftRestored(false); }}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium">เริ่มใหม่</button>
          </div>
        )}
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                  i === step ? 'bg-primary text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-[10px] text-gray-500 text-center hidden sm:block">{s}</span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        {/* ===== Step 0: ข้อมูลเบื้องต้น ===== */}
        {step === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-primary">ข้อมูลเบื้องต้น</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-สกุล <span className="text-red-500">*</span></label>
              <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ชื่อ นามสกุล" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HN <span className="text-red-500">*</span></label>
              <input type="text" value={patientHN}
                onChange={e => handleHNChange(e.target.value)}
                onBlur={lookupHN}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookupHN(); } }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="เลข HN เช่น 66XXXXXX" />
              {hnLookupStatus === 'loading' && <p className="text-xs text-blue-500 mt-1">กำลังค้นหา...</p>}
              {hnLookupStatus === 'found' && <p className="text-xs text-green-600 mt-1">พบข้อมูล - เติมชื่อให้แล้ว</p>}
              {hnLookupStatus === 'not_found' && <p className="text-xs text-gray-400 mt-1">กรุณากรอกเลข HN</p>}
              {hnLookupStatus === 'idle' && <p className="text-xs text-gray-400 mt-1">กรุณากรอกเลข HN</p>}
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-3">
                ในขณะนี้ ท่านมีอาการปวดในลักษณะอื่นๆ ที่พิเศษ นอกเหนือจากอาการปวดทั่วไปหรือไม่?
              </p>
              <div className="flex gap-3">
                {[true, false].map(val => (
                  <button key={String(val)} type="button" onClick={() => update({ has_other_pain: val })}
                    className={`flex-1 py-3 rounded-xl font-medium text-base border-2 transition-all ${
                      data.has_other_pain === val
                        ? val ? 'border-red-400 bg-red-50 text-red-700' : 'border-green-400 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}>
                    {val ? 'มี' : 'ไม่มี'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== Step 1: BPI - ประเมินความปวด ===== */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-primary">ประเมินความปวด</h2>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-3">ระบุตำแหน่งที่ปวด (คลิกบนร่างกาย)</p>
              <BodyMap locations={data.pain_location_data} onChange={locs => update({ pain_location_data: locs })} />
              {data.pain_location_data.length > 0 && (
                <p className="text-xs text-gray-400 mt-2 text-center">คลิกที่ X เพื่อลบ ({data.pain_location_data.length} จุด)</p>
              )}
            </div>

            <PainScaleSlider label="ระดับปวดมากที่สุดในรอบ 24 ชั่วโมง" value={data.pain_score_max}
              onChange={v => { const u: Partial<Assessment> = { pain_score_max: v }; if (v < data.pain_score_min) u.pain_score_min = v; update(u); }} />
            <PainScaleSlider label="ระดับปวดน้อยที่สุดในรอบ 24 ชั่วโมง" value={data.pain_score_min}
              onChange={v => { const u: Partial<Assessment> = { pain_score_min: v }; if (v > data.pain_score_max) u.pain_score_max = v; update(u); }} />
            <PainScaleSlider label="ระดับปวดโดยเฉลี่ย" value={data.pain_score_avg} onChange={v => update({ pain_score_avg: v })} />
            <PainScaleSlider label="ระดับปวดในขณะนี้" value={data.pain_score_now} onChange={v => update({ pain_score_now: v })} />
            <PainScaleSlider label="วิธีบำบัดที่ใช้ช่วยบรรเทาปวดได้แค่ไหน" value={data.treatment_relief_score} onChange={v => update({ treatment_relief_score: v })}
              leftLabel="ไม่ช่วยเลย" rightLabel="ช่วยได้มากที่สุด" />
          </div>
        )}

        {/* ===== Step 2: Pain Interference ===== */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-primary">ผลกระทบจากความปวด</h2>
            <p className="text-sm text-gray-600">
              ใน 24 ชั่วโมงที่ผ่านมา อาการปวดรบกวนชีวิตประจำวันในด้านต่างๆ มากน้อยแค่ไหน
            </p>
            {interferenceItems.map(item => (
              <PainScaleSlider key={item.key} label={item.label}
                value={data[item.key] as number} onChange={v => update({ [item.key]: v })}
                leftLabel="ไม่กระทบเลย" rightLabel="กระทบมากที่สุด" />
            ))}
          </div>
        )}

        {/* ===== Step 3: EQ-5D-5L ===== */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-primary">คุณภาพชีวิต</h2>
            <p className="text-sm text-gray-600">กรุณาเลือกข้อที่ตรงกับสุขภาพของท่าน <strong>ในวันนี้</strong> มากที่สุด</p>

            {eq5dDomains.map(domain => {
              const labels = EQ5D_LABELS[domain.labelsKey];
              return (
                <div key={domain.key} className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-bold text-gray-800 mb-2 text-sm">{domain.title}</h3>
                  <RadioScale name={domain.key}
                    options={[1, 2, 3, 4, 5].map(v => ({ value: v, label: labels[v] }))}
                    value={data[domain.key] as number}
                    onChange={v => update({ [domain.key]: v })} />
                </div>
              );
            })}

            {/* VAS */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-bold text-gray-800 mb-2">สุขภาพของท่านในวันนี้ (0 = แย่ที่สุด, 100 = ดีที่สุด)</h3>
              <input type="range" min={0} max={100} value={data.eq5d_vas}
                onChange={e => update({ eq5d_vas: Number(e.target.value) })}
                className="w-full h-4 rounded-lg appearance-none cursor-pointer"
                style={{ background: data.eq5d_vas === 0 ? '#e5e7eb' : `linear-gradient(to right, #ef4444 0%, #eab308 ${Math.min(30, data.eq5d_vas)}%, #22c55e ${Math.min(70, data.eq5d_vas)}%, #22c55e ${data.eq5d_vas}%, #e5e7eb ${data.eq5d_vas}%)` }} />
              <div className="text-center mt-2">
                <span key={data.eq5d_vas} className="inline-block text-3xl animate-bounce-once mr-1">
                  {data.eq5d_vas <= 20 ? '😰' : data.eq5d_vas <= 40 ? '😟' : data.eq5d_vas <= 60 ? '😐' : data.eq5d_vas <= 80 ? '🙂' : '😊'}
                </span>
                <span className="text-4xl font-bold text-primary">{data.eq5d_vas}</span>
                <span className="text-gray-500"> / 100</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== Step 4: DASS-21 ===== */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-primary">แบบประเมินสุขภาพจิต</h2>
            <p className="text-sm text-gray-600">
              กรุณาเลือกข้อที่ตรงกับท่านมากที่สุด <strong>ในช่วงสัปดาห์ที่ผ่านมา</strong>
            </p>
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-0.5">
              <p><strong>0</strong> = ไม่ตรงกับข้าพเจ้าเลย</p>
              <p><strong>1</strong> = ตรงบ้าง / เกิดขึ้นบางครั้ง</p>
              <p><strong>2</strong> = ตรง / เกิดขึ้นบ่อย</p>
              <p><strong>3</strong> = ตรงมาก / เกิดขึ้นบ่อยมากที่สุด</p>
            </div>

            {DASS21_QUESTIONS.map((q, i) => (
              <div key={i} className={`p-3 rounded-xl border ${data.dass21_answers[i] > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                <p className="text-sm font-medium text-gray-700 mb-2">{i + 1}. {q}</p>
                <div className="flex gap-2">
                  {DASS21_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => handleDass21Change(i, opt.value)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        data.dass21_answers[i] === opt.value
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="px-6 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-30 bg-gray-100 text-gray-700 hover:bg-gray-200">
            ← ย้อนกลับ
          </button>

          {isLastStep ? (
            <button type="button" onClick={handleSubmit}
              disabled={isSubmitting || !patientName || !patientHN}
              className="px-8 py-3 rounded-xl font-bold text-sm bg-green-600 text-white hover:bg-green-700 shadow-lg disabled:opacity-50 transition-all">
              {isSubmitting ? 'กำลังส่ง...' : '✓ ส่งแบบประเมิน'}
            </button>
          ) : (
            <button type="button" onClick={() => setStep(s => s + 1)}
              className="px-8 py-3 rounded-xl font-medium text-sm bg-primary text-white hover:bg-primary-light shadow-lg transition-all">
              ถัดไป →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
