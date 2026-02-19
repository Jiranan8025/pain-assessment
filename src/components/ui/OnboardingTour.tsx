import { useState, useEffect, useCallback } from 'react';

export interface TourStep {
  target: string | null;
  title: string;
  description: string;
  switchTab?: 'dashboard' | 'recent' | 'patients';
  navigateAction?: boolean;
}

const PATIENT_LIST_STEPS: TourStep[] = [
  {
    target: 'share-buttons',
    title: '📲 แชร์ลิงก์ให้คนไข้',
    description: 'กด QR เพื่อแสดง QR Code ให้คนไข้สแกนด้วยมือถือ\nหรือกด คัดลอกลิงค์ แล้วส่งทาง LINE ให้คนไข้กรอกแบบฟอร์มเองได้เลย',
  },
  {
    target: 'new-assessment',
    title: '✏️ สร้างแบบประเมินใหม่',
    description: 'กดที่นี่เพื่อเริ่มกรอกแบบประเมินให้คนไข้\nเลือกประเภทการมา: New Consult, Follow-up,\nPre-procedure หรือ Post-procedure',
  },
  {
    target: 'tabs',
    title: '📊 เมนูหลัก 3 แท็บ',
    description: '• Dashboard = ดูสถิติรวม กราฟ และแจ้งเตือน\n• ประเมินล่าสุด = ค้นหาผลประเมินตามวันที่\n• ผู้ป่วย = ดูรายชื่อ แก้ไข ยุติการรักษา หรือลบ',
  },
  {
    target: 'search',
    title: '🔍 ค้นหาผู้ป่วย',
    description: 'พิมพ์ HN หรือชื่อ-สกุลเพื่อค้นหาผู้ป่วยได้เลย\nใช้ได้ทุกแท็บ',
  },
  {
    target: 'stats',
    title: '📈 สถิติภาพรวม',
    description: 'ดูจำนวนผู้ป่วย ประเมินวันนี้ Pain Now เฉลี่ย\nและ EQ-VAS เฉลี่ย\nด้านล่างมีแจ้งเตือน Suicide Risk และผู้ป่วยที่ต้องดูแล',
    switchTab: 'dashboard',
  },
  {
    target: 'patient-link',
    title: '📋 ดูประวัติ กราฟ เปรียบเทียบ',
    description: 'กดที่ชื่อผู้ป่วยเพื่อเข้าดู:\n• ประวัติการประเมินทั้งหมด\n• กราฟแนวโน้มความปวด\n• เปรียบเทียบผลระหว่างครั้งได้\n\n⚡ ถ้าประเมินแค่ 1 ครั้ง จะยังไม่มีกราฟ/เปรียบเทียบ\nลองเลือกคนที่ประเมินแล้ว > 1 ครั้ง',
    switchTab: 'patients',
    navigateAction: true,
  },
  {
    target: null,
    title: '💡 สิ่งที่ควรรู้',
    description: '• กด Export CSV เพื่อดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ Excel\n• ข้อมูลเก่ากว่า 30 วันจะถูกลบอัตโนมัติ\n• อยากดูคำแนะนำอีกครั้ง กดปุ่ม "📖 คู่มือ" ด้านบนได้เลย',
    switchTab: 'dashboard',
  },
];

export { PATIENT_LIST_STEPS };

export const HISTORY_TOUR_STEPS: TourStep[] = [
  {
    target: 'history-chart-toggle',
    title: '📈 กราฟแนวโน้มความปวด',
    description: 'กดที่นี่เพื่อเปิด'+'/'+'ปิดกราฟแนวโน้ม\nดู Pain Score, EQ-5D, DASS-21\nเปรียบเทียบข้ามครั้งได้ในกราฟเดียว',
  },
  {
    target: 'history-compare-btn',
    title: '⚖️ เปรียบเทียบผลประเมิน',
    description: 'กดเพื่อเข้าโหมดเปรียบเทียบ\nเลือก 2 ครั้งที่ต้องการเทียบ\nจะเห็นตารางเทียบแบบ Side-by-Side',
  },
  {
    target: null,
    title: '💡 สิ่งที่ควรรู้',
    description: '• กด Export CSV เพื่อดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ Excel\n• ข้อมูลเก่ากว่า 30 วันจะถูกลบอัตโนมัติ\n• อยากดูคำแนะนำอีกครั้ง กดปุ่ม "📖 คู่มือ" ที่หน้าหลักได้เลย',
  },
];

interface Props {
  onComplete: () => void;
  onSwitchTab?: (tab: 'dashboard' | 'recent' | 'patients') => void;
  onNavigateToPatient?: (patientId: string) => void;
  firstPatientId?: string | null;
  steps?: TourStep[];
  totalSteps?: number;
  startIndex?: number;
}

export default function OnboardingTour({
  onComplete,
  onSwitchTab,
  onNavigateToPatient,
  firstPatientId,
  steps: externalSteps,
  totalSteps: externalTotalSteps,
  startIndex = 0,
}: Props) {
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const activeSteps = externalSteps ?? PATIENT_LIST_STEPS;
  const totalSteps = externalTotalSteps ?? activeSteps.length;
  const currentStep = activeSteps[step];

  const updateSpotlight = useCallback(() => {
    if (!currentStep.target) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (el) {
      setSpotlightRect(el.getBoundingClientRect());
    } else {
      setSpotlightRect(null);
    }
  }, [currentStep.target]);

  useEffect(() => {
    if (currentStep.switchTab && onSwitchTab) {
      onSwitchTab(currentStep.switchTab);
    }
    const timer = setTimeout(() => {
      updateSpotlight();
      if (currentStep.target) {
        const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(updateSpotlight, 400);
        }
      }
    }, 100);
    window.addEventListener('resize', updateSpotlight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
    };
  }, [step, currentStep.target, currentStep.switchTab, onSwitchTab, updateSpotlight]);

  const handleNavigate = () => {
    if (onNavigateToPatient && firstPatientId) {
      localStorage.setItem('pain_tour_state', JSON.stringify({
        phase: 'history-page',
        patientId: firstPatientId,
        startedAt: Date.now(),
      }));
      onNavigateToPatient(firstPatientId);
    }
  };

  const handleNext = () => {
    if (step < activeSteps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const isNavigateStep = currentStep.navigateAction && firstPatientId && onNavigateToPatient;
  const isLastStep = step >= activeSteps.length - 1;

  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: '340px', width: '90vw' };
    }
    const padding = 12;
    const tooltipWidth = 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = spotlightRect.bottom + padding;
    let left = spotlightRect.left + spotlightRect.width / 2 - tooltipWidth / 2;
    if (top + 220 > vh) top = spotlightRect.top - padding - 220;
    if (left < 12) left = 12;
    if (left + tooltipWidth > vw - 12) left = vw - 12 - tooltipWidth;
    if (top < 12) top = 12;
    return { position: 'fixed', top: `${top}px`, left: `${left}px`, maxWidth: `${tooltipWidth}px`, width: '90vw' };
  };

  const getSpotlightStyle = (): React.CSSProperties => {
    if (!spotlightRect) return {};
    const pad = 8;
    return {
      position: 'fixed',
      top: `${spotlightRect.top - pad}px`,
      left: `${spotlightRect.left - pad}px`,
      width: `${spotlightRect.width + pad * 2}px`,
      height: `${spotlightRect.height + pad * 2}px`,
      borderRadius: '12px',
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
      zIndex: 9998,
      pointerEvents: 'none' as const,
    };
  };

  return (
    <div className="fixed inset-0 z-[9997]">
      {!spotlightRect && <div className="fixed inset-0 bg-black/55 z-[9998]" />}
      {spotlightRect && <div style={getSpotlightStyle()} />}
      {spotlightRect && (
        <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: 'auto' }} onClick={e => e.stopPropagation()} />
      )}
      <div style={{ ...getTooltipStyle(), zIndex: 9999 }} className="bg-white rounded-xl shadow-2xl p-5 animate-fade-in">
        <h3 className="text-base font-bold text-gray-900 mb-2">{currentStep.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{currentStep.description}</p>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === startIndex + step ? 'bg-primary scale-125' : i < startIndex + step ? 'bg-primary/40' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {!isLastStep && (
              <button onClick={handleSkip} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                ข้าม ✕
              </button>
            )}
            {isNavigateStep ? (
              <button onClick={handleNavigate} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 shadow-sm transition-all">
                กดที่ชื่อผู้ป่วยเลย →
              </button>
            ) : (
              <button onClick={handleNext} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-light shadow-sm transition-all">
                {isLastStep ? 'เริ่มใช้งาน ✓' : 'ถัดไป →'}
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-2">{startIndex + step + 1} / {totalSteps}</p>
      </div>
    </div>
  );
}
