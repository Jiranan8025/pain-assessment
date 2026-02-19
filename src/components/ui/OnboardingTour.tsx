import { useState, useEffect, useCallback } from 'react';

interface TourStep {
  target: string | null;
  title: string;
  description: string;
  switchTab?: 'dashboard' | 'recent' | 'patients';
}

const STEPS: TourStep[] = [
  {
    target: 'share-buttons',
    title: '\📲 \แ\ช\ร\์\ล\ิ\ง\ก\์\ใ\ห\้\ค\น\ไ\ข\้',
    description: '\ก\ด QR \เ\พ\ื\่\อ\แ\ส\ด\ง QR Code \ใ\ห\้\ค\น\ไ\ข\้\ส\แ\ก\น\ด\้\ว\ย\ม\ื\อ\ถ\ื\อ\n\ห\ร\ื\อ\ก\ด \ค\ั\ด\ล\อ\ก\ล\ิ\ง\ค\์ \แ\ล\้\ว\ส\่\ง\ท\า\ง LINE \ใ\ห\้\ค\น\ไ\ข\้\ก\ร\อ\ก\แ\บ\บ\ฟ\อ\ร\์\ม\เ\อ\ง\ไ\ด\้\เ\ล\ย',
  },
  {
    target: 'new-assessment',
    title: '\✏\️ \ส\ร\้\า\ง\แ\บ\บ\ป\ร\ะ\เ\ม\ิ\น\ใ\ห\ม\่',
    description: '\ก\ด\ท\ี\่\น\ี\่\เ\พ\ื\่\อ\เ\ร\ิ\่\ม\ก\ร\อ\ก\แ\บ\บ\ป\ร\ะ\เ\ม\ิ\น\ใ\ห\้\ค\น\ไ\ข\้\n\เ\ล\ื\อ\ก\ป\ร\ะ\เ\ภ\ท\ก\า\ร\ม\า: New Consult, Follow-up,\nPre-procedure \ห\ร\ื\อ Post-procedure',
  },
  {
    target: 'tabs',
    title: '\📊 \เ\ม\น\ู\ห\ล\ั\ก 3 \แ\ท\็\บ',
    description: '\• Dashboard = \ด\ู\ส\ถ\ิ\ต\ิ\ร\ว\ม \ก\ร\า\ฟ \แ\ล\ะ\แ\จ\้\ง\เ\ต\ื\อ\น\n\• \ป\ร\ะ\เ\ม\ิ\น\ล\่\า\ส\ุ\ด = \ค\้\น\ห\า\ผ\ล\ป\ร\ะ\เ\ม\ิ\น\ต\า\ม\ว\ั\น\ท\ี\่\n\• \ผ\ู\้\ป\่\ว\ย = \ด\ู\ร\า\ย\ช\ื\่\อ \แ\ก\้\ไ\ข \ย\ุ\ต\ิ\ก\า\ร\ร\ั\ก\ษ\า \ห\ร\ื\อ\ล\บ',
  },
  {
    target: 'search',
    title: '\🔍 \ค\้\น\ห\า\ผ\ู\้\ป\่\ว\ย',
    description: '\พ\ิ\ม\พ\์ HN \ห\ร\ื\อ\ช\ื\่\อ-\ส\ก\ุ\ล\เ\พ\ื\่\อ\ค\้\น\ห\า\ผ\ู\้\ป\่\ว\ย\ไ\ด\้\เ\ล\ย\n\ใ\ช\้\ไ\ด\้\ท\ุ\ก\แ\ท\็\บ',
  },
  {
    target: 'stats',
    title: '\📈 \ส\ถ\ิ\ต\ิ\ภ\า\พ\ร\ว\ม',
    description: '\ด\ู\จ\ำ\น\ว\น\ผ\ู\้\ป\่\ว\ย \ป\ร\ะ\เ\ม\ิ\น\ว\ั\น\น\ี\้ Pain Now \เ\ฉ\ล\ี\่\ย\n\แ\ล\ะ EQ-VAS \เ\ฉ\ล\ี\่\ย\n\ด\้\า\น\ล\่\า\ง\ม\ี\แ\จ\้\ง\เ\ต\ื\อ\น Suicide Risk \แ\ล\ะ\ผ\ู\้\ป\่\ว\ย\ท\ี\่\ต\้\อ\ง\ด\ู\แ\ล',
    switchTab: 'dashboard',
  },
  {
    target: 'patient-link',
    title: '\📋 \ด\ู\ป\ร\ะ\ว\ั\ต\ิ \ก\ร\า\ฟ \เ\ป\ร\ี\ย\บ\เ\ท\ี\ย\บ',
    description: '\ก\ด\ท\ี\่\ช\ื\่\อ\ผ\ู\้\ป\่\ว\ย\เ\พ\ื\่\อ\เ\ข\้\า\ด\ู:\n\• \ป\ร\ะ\ว\ั\ต\ิ\ก\า\ร\ป\ร\ะ\เ\ม\ิ\น\ท\ั\้\ง\ห\ม\ด\n\• \ก\ร\า\ฟ\แ\น\ว\โ\น\้\ม\ค\ว\า\ม\ป\ว\ด\n\• \เ\ป\ร\ี\ย\บ\เ\ท\ี\ย\บ\ผ\ล\ร\ะ\ห\ว\่\า\ง\ค\ร\ั\้\ง\ไ\ด\้',
    switchTab: 'patients',
  },
  {
    target: null,
    title: '\💡 \ส\ิ\่\ง\ท\ี\่\ค\ว\ร\ร\ู\้',
    description: '\• \ก\ด Export CSV \เ\พ\ื\่\อ\ด\า\ว\น\์\โ\ห\ล\ด\ข\้\อ\ม\ู\ล\ท\ั\้\ง\ห\ม\ด\เ\ป\็\น\ไ\ฟ\ล\์ Excel\n\• \ข\้\อ\ม\ู\ล\เ\ก\่\า\ก\ว\่\า 30 \ว\ั\น\จ\ะ\ถ\ู\ก\ล\บ\อ\ั\ต\โ\น\ม\ั\ต\ิ\n\• \อ\ย\า\ก\ด\ู\ค\ำ\แ\น\ะ\น\ำ\อ\ี\ก\ค\ร\ั\้\ง \ก\ด\ป\ุ\่\ม "\📖 \ค\ู\่\ม\ื\อ" \ด\้\า\น\บ\น\ไ\ด\้\เ\ล\ย',
    switchTab: 'dashboard',
  },
];

interface Props {
  onComplete: () => void;
  onSwitchTab?: (tab: 'dashboard' | 'recent' | 'patients') => void;
}

export default function OnboardingTour({ onComplete, onSwitchTab }: Props) {
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const currentStep = STEPS[step];

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
    // Switch tab if needed for this step
    if (currentStep.switchTab && onSwitchTab) {
      onSwitchTab(currentStep.switchTab);
    }

    // Small delay to let tab switch render, then measure
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

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '340px',
        width: '90vw',
      };
    }

    const padding = 12;
    const tooltipWidth = 320;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = spotlightRect.bottom + padding;
    let left = spotlightRect.left + spotlightRect.width / 2 - tooltipWidth / 2;

    if (top + 220 > viewportHeight) {
      top = spotlightRect.top - padding - 220;
    }

    if (left < 12) left = 12;
    if (left + tooltipWidth > viewportWidth - 12) left = viewportWidth - 12 - tooltipWidth;
    if (top < 12) top = 12;

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: `${tooltipWidth}px`,
      width: '90vw',
    };
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
      {!spotlightRect && (
        <div className="fixed inset-0 bg-black/55 z-[9998]" />
      )}

      {spotlightRect && <div style={getSpotlightStyle()} />}

      {spotlightRect && (
        <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: 'auto' }} onClick={e => e.stopPropagation()} />
      )}

      <div
        style={{ ...getTooltipStyle(), zIndex: 9999 }}
        className="bg-white rounded-xl shadow-2xl p-5 animate-fade-in"
      >
        <h3 className="text-base font-bold text-gray-900 mb-2">{currentStep.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{currentStep.description}</p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? 'bg-primary scale-125' : i < step ? 'bg-primary/40' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step < STEPS.length - 1 && (
              <button
                onClick={handleSkip}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {'\ข\้\า\ม \✕'}
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-light shadow-sm transition-all"
            >
              {step < STEPS.length - 1
                ? '\ถ\ั\ด\ไ\ป \→'
                : '\เ\ร\ิ\่\ม\ใ\ช\้\ง\า\น \✓'}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-gray-300 text-center mt-2">{step + 1} / {STEPS.length}</p>
      </div>
    </div>
  );
}
