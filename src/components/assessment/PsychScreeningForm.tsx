import type { Assessment } from '../../lib/types';

interface Props {
  data: Assessment;
  onChange: (updates: Partial<Assessment>) => void;
}

function YNRadio({ label, value, onChange, highlight }: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  highlight?: 'danger';
}) {
  const yesStyle = value
    ? (highlight === 'danger' ? 'border-red-500 bg-red-50 text-red-700' : 'border-yellow-500 bg-yellow-50 text-yellow-700')
    : 'border-gray-200 hover:bg-gray-50';
  const noStyle = !value
    ? 'border-green-500 bg-green-50 text-green-700'
    : 'border-gray-200 hover:bg-gray-50';

  return (
    <div className="p-3 bg-white rounded-lg border border-gray-100">
      <p className={`text-sm mb-2 ${highlight === 'danger' ? 'font-bold text-red-700' : 'text-gray-800'}`}>{label}</p>
      <div className="flex gap-3">
        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ${yesStyle}`}>
          <input type="radio" checked={value === true} onChange={() => onChange(true)} className="hidden" />
          <span className="text-sm font-medium">มี (Y)</span>
        </label>
        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ${noStyle}`}>
          <input type="radio" checked={value === false} onChange={() => onChange(false)} className="hidden" />
          <span className="text-sm font-medium">ไม่มี (N)</span>
        </label>
      </div>
    </div>
  );
}

export default function PsychScreeningForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-primary">Psychological Screening</h2>

      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 space-y-4">
        <div>
          <p className="text-sm font-bold text-gray-800 mb-1">ใน 2 สัปดาห์ที่ผ่านมา รวมถึงวันนี้</p>
          <p className="text-sm text-gray-600 mb-3">ท่านมีอาการเหล่านี้หรือไม่?</p>
        </div>

        <YNRadio
          label="1. ไม่สบายใจ เซ็ง ทุกข์ใจ เศร้า ท้อแท้ ซึม หงอย"
          value={data.depression_risk_1}
          onChange={v => onChange({ depression_risk_1: v })}
        />

        <YNRadio
          label="2. เบื่อ ไม่อยากพูดไม่อยากทำอะไร หรือทำอะไรก็ไม่สนุกเพลิดเพลิน"
          value={data.depression_risk_2}
          onChange={v => onChange({ depression_risk_2: v })}
        />

        <div className="mt-2">
          <p className="text-sm font-bold text-gray-800 mb-1">ใน 1 เดือนที่ผ่านมา รวมถึงวันนี้</p>
        </div>

        <YNRadio
          label="3. ท่านมีความรู้สึกทุกข์ใจจนไม่อยากมีชีวิตอยู่?"
          value={data.suicide_risk}
          onChange={v => onChange({ suicide_risk: v })}
          highlight="danger"
        />

        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Others (ถ้ามี)</label>
          <input
            type="text"
            value={data.psych_others}
            onChange={e => onChange({ psych_others: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="อื่นๆ..."
          />
        </div>
      </div>
    </div>
  );
}
