import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Assessment } from '../../lib/types';
import { FormErrorBoundary } from '../ErrorBoundary';
import PatientInfoForm from './PatientInfoForm';
import BpiForm from './BpiForm';
import PainInterferenceForm from './PainInterferenceForm';
import Eq5d5lForm from './Eq5d5lForm';
import Dass21Form from './Dass21Form';

interface Props {
  data: Assessment;
  patientHN: string;
  patientName: string;
  onPatientHNChange: (v: string) => void;
  onPatientNameChange: (v: string) => void;
  onChange: (data: Partial<Assessment>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const steps = [
  { title: 'ข้อมูลผู้ป่วย', short: 'ผู้ป่วย' },
  { title: 'BPI - ประเมินความปวด', short: 'BPI' },
  { title: 'Pain Interference', short: 'Interference' },
  { title: 'EQ-5D-5L', short: 'EQ-5D' },
  { title: 'DASS-21', short: 'DASS-21' },
];

export default function AssessmentWizard({
  data, patientHN, patientName,
  onPatientHNChange, onPatientNameChange,
  onChange, onSubmit, isSubmitting,
}: Props) {
  const [step, setStep] = useState(0);

  const canGoNext = step < steps.length - 1;
  const canGoPrev = step > 0;
  const isLastStep = step === steps.length - 1;

  return (
    <div>
      <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 mb-3 inline-block">&larr; กลับหน้าหลัก</Link>

      {/* Stepper Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
                i === step
                  ? 'text-primary'
                  : i < step
                    ? 'text-green-600'
                    : 'text-gray-400'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i === step
                  ? 'bg-primary text-white'
                  : i < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden md:inline">{s.short}</span>
            </button>
          ))}
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          ขั้นตอน {step + 1}/{steps.length}: {steps[step].title}
        </p>
      </div>

      {/* Form Content */}
      <FormErrorBoundary>
        <div className="min-h-[400px]">
          {step === 0 && (
            <PatientInfoForm
              data={data}
              patientHN={patientHN}
              patientName={patientName}
              onPatientHNChange={onPatientHNChange}
              onPatientNameChange={onPatientNameChange}
              onChange={onChange}
            />
          )}
          {step === 1 && <BpiForm data={data} onChange={onChange} />}
          {step === 2 && <PainInterferenceForm data={data} onChange={onChange} />}
          {step === 3 && <Eq5d5lForm data={data} onChange={onChange} />}
          {step === 4 && <Dass21Form data={data} onChange={onChange} />}
        </div>
      </FormErrorBoundary>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-4 border-t">
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={!canGoPrev}
          className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          ← ย้อนกลับ
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !patientHN || !patientName}
            className="px-8 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700 shadow-md"
          >
            {isSubmitting ? 'กำลังบันทึก...' : '✓ บันทึกผลประเมิน'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={!canGoNext}
            className="px-6 py-2.5 rounded-lg font-medium text-sm transition-all bg-primary text-white hover:bg-primary-light shadow-md"
          >
            ถัดไป →
          </button>
        )}
      </div>
    </div>
  );
}
