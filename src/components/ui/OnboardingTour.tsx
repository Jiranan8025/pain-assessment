import { useState, useEffect, useCallback } from 'react';

interface TourStep {
  target: string | null; // data-tour attribute value, null = center modal
  title: string;
  description: string;
  position?: 'bottom' | 'top';
}

const STEPS: TourStep[] = [
  {
    target: 'share-buttons',
    title: '\ud83d\udcf2 \u0e41\u0e0a\u0e23\u0e4c\u0e25\u0e34\u0e07\u0e01\u0e4c\u0e43\u0e2b\u0e49\u0e04\u0e19\u0e44\u0e02\u0e49',
    description: '\u0e01\u0e14 QR \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e41\u0e2a\u0e14\u0e07 QR Code \u0e43\u0e2b\u0e49\u0e04\u0e19\u0e44\u0e02\u0e49\u0e2a\u0e41\u0e01\u0e19 \u0e2b\u0e23\u0e37\u0e2d\u0e01\u0e14 \u0e04\u0e31\u0e14\u0e25\u0e2d\u0e01\u0e25\u0e34\u0e07\u0e04\u0e4c \u0e41\u0e25\u0e49\u0e27\u0e2a\u0e48\u0e07\u0e17\u0e32\u0e07 LINE \u0e43\u0e2b\u0e49\u0e04\u0e19\u0e44\u0e02\u0e49\u0e01\u0e23\u0e2d\u0e01\u0e41\u0e1a\u0e1a\u0e1f\u0e2d\u0e23\u0e4c\u0e21\u0e40\u0e2d\u0e07',
    position: 'bottom',
  },
  {
    target: 'new-assessment',
    title: '\u270f\ufe0f \u0e2a\u0e23\u0e49\u0e32\u0e07\u0e41\u0e1a\u0e1a\u0e1b\u0e23\u0e30\u0e40\u0e21\u0e34\u0e19',
    description: '\u0e01\u0e14\u0e17\u0e35\u0e48\u0e19\u0e35\u0e48\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e01\u0e23\u0e2d\u0e01\u0e41\u0e1a\u0e1a\u0e1b\u0e23\u0e30\u0e40\u0e21\u0e34\u0e19\u0e43\u0e2b\u0e49\u0e04\u0e19\u0e44\u0e02\u0e49 \u0e40\u0e25\u0e37\u0e2d\u0e01\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17\u0e01\u0e32\u0e23\u0e21\u0e32\u0e44\u0e14\u0e49',
    position: 'bottom',
  },
  {
    target: 'tabs',
    title: '\ud83d\udcca \u0e40\u0e21\u0e19\u0e39\u0e2b\u0e25\u0e31\u0e01 3 \u0e41\u0e17\u0e47\u0e1a',
    description: 'Dashboard = \u0e14\u0e39\u0e2a\u0e16\u0e34\u0e15\u0e34\u0e23\u0e27\u0e21\u0e41\u0e25\u0e30\u0e41\u0e08\u0e49\u0e07\u0e40\u0e15\u0e37\u0e2d\u0e19\n\u0e1b\u0e23\u0e30\u0e40\u0e21\u0e34\u0e19\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14 = \u0e04\u0e49\u0e19\u0e2b\u0e32\u0e1c\u0e25\u0e1b\u0e23\u0e30\u0e40\u0e21\u0e34\u0e19\u0e15\u0e32\u0e21\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\n\u0e1c\u0e39\u0e49\u0e1b\u0e48\u0e27\u0e22 = \u0e08\u0e31\u0e14\u0e01\u0e32\u0e23\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d',
    position: 'bottom',
  },
  {
    target: 'search',
    title: '\ud83d\udd0d \u0e04\u0e49\u0e19\u0e2b\u0e32\u0e1c\u0e39\u0e49\u0e1b\u0e48\u0e27\u0e22',
    description: '\u0e1e\u0e34\u0e21\u0e1e\u0e4c HN \u0e2b\u0e23\u0e37\u0e2d\u0e0a\u0e37\u0e48\u0e2d\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e04\u0e49\u0e19\u0e2b\u0e32\u0e1c\u0e39\u0e49\u0e1b\u0e48\u0e27\u0e22\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22',
    position: 'bottom',
  },
  {
    target: 'stats',
    title: '\ud83d\udcc8 \u0e2a\u0e16\u0e34\u0e15\u0e34\u0e20\u0e32\u0e1e\u0e23\u0e27\u0e21',
    description: '\u0e14\u0e39\u0e08\u0e33\u0e19\u0e27\u0e19\u0e1c\u0e39\u0e49\u0e1b\u0e48\u0e27\u0e22 \u0e1b\u0e23\u0e30\u0e40\u0e21\u0e34\u0e19\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49 \u0e41\u0e25\u0e30\u0e04\u0e48\u0e32\u0e40\u0e09\u0e25\u0e35\u0e48\u0e22\u0e15\u0e48\u0e32\u0e07\u0e46\n\u0e14\u0e49\u0e32\u0e19\u0e25\u0e48\u0e32\u0e07\u0e21\u0e35\u0e41\u0e08\u0e49\u0e07\u0e40\u0e15\u0e37\u0e2d\u0e19\u0e1c\u0e39\u0e49\u0e1b\u0e48\u0e27\u0e22\u0e17\u0e35\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e14\u0e39\u0e41\u0e25',
    position: 'bottom',
  },
  {
    target: 'patient-link',
    title: '\ud83d\udccb \u0e14\u0e39\u0e1b\u0e23\u0e30\u0e27\u0e31\u0e15\u0e34 \u0e01\u0e23\u0e32\u0e1f \u0e40\u0e1b\u0e23\u0e35\u0e22\u0e1a\u0e40\u0e17\u0e35\u0e22\u0e1a',
    description: '\u0e01\u0e14\u0e17\u0e35\u0e48\u0e0a\u0e37\u0e48\u0e2d\u0e1c\u0e39\u0e49\u0e1b\u0e48\u0e27\u0e22\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e40\u0e02\u0e49\u0e32\u0e14\u0e39\u0e1b\u0e23\u0e30\u0e27\u0e31\u0e15\u0e34\u0e01\u0e32\u0e23\u0e1b\u0e23\u0e30\u0e40\u0e21\u0e34\u0e19\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14\n\u0e01\u0e23\u0e32\u0e1f\u0e41\u0e19\u0e27\u0e42\u0e19\u0e49\u0e21\u0e04\u0e27\u0e32\u0e21\u0e1b\u0e27\u0e14 \u0e41\u0e25\u0e30\u0e40\u0e1b\u0e23\u0e35\u0e22\u0e1a\u0e40\u0e17\u0e35\u0e22\u0e1a\u0e1c\u0e25\u0e23\u0e30\u0e2b\u0e27\u0e48\u0e32\u0e07\u0e04\u0e23\u0e31\u0e49\u0e07',
    position: 'bottom',
  },
  {
    target: null, // center modal
    title: '\ud83d\udca1 \u0e2a\u0e34\u0e48\u0e07\u0e17\u0e35\u0e48\u0e04\u0e27\u0e23\u0e23\u0e39\u0e49',
    description: '\u2022 \u0e01\u0e14 Export CSV \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e14\u0e32\u0e27\u0e19\u0e4c\u0e42\u0e2b\u0e25\u0e14\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\n\u2022 \u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e40\u0e01\u0e48\u0e32\u0e01\u0e27\u0e48\u0e32 30 \u0e27\u0e31\u0e19\u0e08\u0e30\u0e16\u0e39\u0e01\u0e25\u0e1a\u0e2d\u0e31\u0e15\u0e42\u0e19\u0e21\u0e31\u0e15\u0e34\n\u2022 \u0e2d\u0e22\u0e32\u0e01\u0e14\u0e39\u0e04\u0e33\u0e41\u0e19\u0e30\u0e19\u0e33\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07 \u0e01\u0e14\u0e1b\u0e38\u0e48\u0e21 "\ud83d\udcd6 \u0e04\u0e39\u0e48\u0e21\u0e37\u0e2d" \u0e14\u0e49\u0e32\u0e19\u0e1a\u0e19\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22',
    position: 'bottom',
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: Props) {
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
    }
  }, [currentStep.target]);

  useEffect(() => {
    updateSpotlight();

    // Scroll target into view
    if (currentStep.target) {
      const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Re-measure after scroll
        setTimeout(updateSpotlight, 400);
      }
    }

    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [step, currentStep.target, updateSpotlight]);

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

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect) {
      // Center modal
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

    // Default: below the target
    let top = spotlightRect.bottom + padding;
    let left = spotlightRect.left + spotlightRect.width / 2 - tooltipWidth / 2;

    // If tooltip would go below viewport, show above
    if (top + 200 > viewportHeight) {
      top = spotlightRect.top - padding - 200;
    }

    // Keep within horizontal bounds
    if (left < 12) left = 12;
    if (left + tooltipWidth > viewportWidth - 12) left = viewportWidth - 12 - tooltipWidth;

    // Make sure top is not negative
    if (top < 12) top = 12;

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: `${tooltipWidth}px`,
      width: '90vw',
    };
  };

  // Spotlight cutout style
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
      {/* Overlay - only shown when no spotlight target (center modal) */}
      {!spotlightRect && (
        <div className="fixed inset-0 bg-black/55 z-[9998]" />
      )}

      {/* Spotlight cutout */}
      {spotlightRect && <div style={getSpotlightStyle()} />}

      {/* Click blocker (transparent, covers everything except tooltip) */}
      {spotlightRect && (
        <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: 'auto' }} onClick={e => e.stopPropagation()} />
      )}

      {/* Tooltip */}
      <div
        style={{ ...getTooltipStyle(), zIndex: 9999 }}
        className="bg-white rounded-xl shadow-2xl p-5 animate-fade-in"
      >
        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-2">{currentStep.title}</h3>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{currentStep.description}</p>

        {/* Progress + Buttons */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          {/* Progress dots */}
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

          {/* Buttons */}
          <div className="flex gap-2">
            {step < STEPS.length - 1 && (
              <button
                onClick={handleSkip}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                \u0e02\u0e49\u0e32\u0e21 \u2715
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-light shadow-sm transition-all"
            >
              {step < STEPS.length - 1 ? '\u0e16\u0e31\u0e14\u0e44\u0e1b \u2192' : '\u0e40\u0e23\u0e34\u0e48\u0e21\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19 \u2713'}
            </button>
          </div>
        </div>

        {/* Step counter */}
        <p className="text-[10px] text-gray-300 text-center mt-2">{step + 1} / {STEPS.length}</p>
      </div>
    </div>
  );
}
