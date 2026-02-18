interface RadioScaleProps {
  name: string;
  options: { value: number; label: string }[];
  value: number;
  onChange: (value: number) => void;
}

export default function RadioScale({ name, options, value, onChange }: RadioScaleProps) {
  return (
    <div className="space-y-1">
      {options.map(opt => (
        <label
          key={opt.value}
          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
            value === opt.value
              ? 'bg-blue-50 border border-blue-300'
              : 'hover:bg-gray-50 border border-transparent'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
