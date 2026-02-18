import { useRef } from 'react';
import type { PainLocation } from '../../lib/types';

interface BodyMapProps {
  locations: PainLocation[];
  onChange: (locations: PainLocation[]) => void;
  readonly?: boolean;
  compact?: boolean;
}

/*
 * Body Map for BPI (Brief Pain Inventory)
 * Uses anatomical images from the Siriraj pain assessment form.
 * Click positions stored as percentage (0-100) of container width/height.
 */
export default function BodyMap({ locations, onChange, readonly = false, compact = false }: BodyMapProps) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>, side: 'front' | 'back') {
    if (readonly) return;
    const el = side === 'front' ? frontRef.current : backRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onChange([...locations, { x, y, side }]);
  }

  function removeLocation(idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (readonly) return;
    onChange(locations.filter((_, i) => i !== idx));
  }

  const imgH = compact ? 'h-[10rem]' : 'h-[24rem]';
  const markerPx = compact ? 14 : 24;

  const renderBody = (
    side: 'front' | 'back',
    ref: React.RefObject<HTMLDivElement | null>,
    imgSrc: string,
  ) => (
    <div
      ref={ref}
      className={`relative ${imgH} border border-gray-300 rounded-lg bg-white overflow-hidden ${readonly ? '' : 'cursor-crosshair'}`}
      onClick={e => handleClick(e, side)}
      style={{ aspectRatio: side === 'front' ? '224/439' : '233/427' }}
    >
      <img
        src={imgSrc}
        alt={side === 'front' ? 'ร่างกายด้านหน้า' : 'ร่างกายด้านหลัง'}
        className="w-full h-full object-contain select-none pointer-events-none"
        draggable={false}
      />

      {/* Pain X markers */}
      {locations.filter(l => l.side === side).map((loc, i) => (
        <div
          key={i}
          className={`absolute ${readonly ? '' : 'cursor-pointer'}`}
          style={{
            left: `${loc.x}%`,
            top: `${loc.y}%`,
            transform: 'translate(-50%, -50%)',
            width: markerPx,
            height: markerPx,
          }}
          onClick={e => removeLocation(locations.indexOf(loc), e)}
        >
          <svg width="100%" height="100%" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill="rgba(239,68,68,0.15)" />
            <circle cx="12" cy="12" r="7" fill="rgba(239,68,68,0.25)" />
            <line x1="6" y1="6" x2="18" y2="18" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="18" y1="6" x2="6" y2="18" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`flex ${compact ? 'gap-3' : 'gap-6'} justify-center items-start`}>
      {/* Front */}
      <div className="text-center">
        <div className="flex justify-between text-xs text-gray-500 mb-1 px-1">
          <span className="font-medium">R</span>
          <span className="font-semibold text-gray-700">{compact ? '' : 'ด้านหน้า'}</span>
          <span className="font-medium">L</span>
        </div>
        {renderBody('front', frontRef, '/images/body-front.png')}
      </div>

      {/* Back */}
      <div className="text-center">
        <div className="flex justify-between text-xs text-gray-500 mb-1 px-1">
          <span className="font-medium">L</span>
          <span className="font-semibold text-gray-700">{compact ? '' : 'ด้านหลัง'}</span>
          <span className="font-medium">R</span>
        </div>
        {renderBody('back', backRef, '/images/body-back.png')}
      </div>
    </div>
  );
}
