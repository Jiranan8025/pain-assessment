interface PainScaleSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  leftLabel?: string;
  rightLabel?: string;
}

export default function PainScaleSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  leftLabel = 'ไม่มีอาการปวด',
  rightLabel = 'ปวดมากที่สุด',
}: PainScaleSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  function getColor(pct: number): string {
    if (pct <= 30) return '#22c55e';
    if (pct <= 60) return '#eab308';
    if (pct <= 80) return '#f97316';
    return '#ef4444';
  }

  // สร้าง gradient ไล่สีเขียว→เหลือง→ส้ม→แดง จนถึงจุดที่เลือก แล้วเป็นเทา
  function getTrackGradient(): string {
    if (percentage === 0) return '#e5e7eb';
    // color stops ตามสัดส่วนของ filled area
    const stops: string[] = ['#22c55e 0%'];
    if (percentage > 30) stops.push(`#eab308 ${(30 / percentage) * 100}%`);
    if (percentage > 60) stops.push(`#f97316 ${(60 / percentage) * 100}%`);
    if (percentage > 80) stops.push(`#ef4444 ${(80 / percentage) * 100}%`);
    stops.push(`${getColor(percentage)} 100%`);
    return `linear-gradient(to right, ${stops.join(', ')} ) 0% 0% / ${percentage}% 100% no-repeat, #e5e7eb`;
  }

  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <label className="text-sm font-semibold text-gray-700 leading-snug">{label}</label>
        <span
          className="text-lg font-bold shrink-0 min-w-[2.5rem] text-right"
          style={{ color: getColor(percentage) }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
        style={{
          background: getTrackGradient(),
          touchAction: 'manipulation',
        }}
      />
      <div className="flex justify-between mt-1">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 mx-[1px] h-8 text-xs rounded font-bold transition-all ${
              value === n
                ? 'text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            style={value === n ? { backgroundColor: getColor(((n - min) / (max - min)) * 100) } : undefined}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
