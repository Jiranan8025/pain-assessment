import type { Assessment } from '../../lib/types';
import { EQ5D_LABELS, calculateEq5dUtility } from '../../lib/scoring';
import RadioScale from '../ui/RadioScale';

interface Props {
  data: Assessment;
  onChange: (data: Partial<Assessment>) => void;
}

const domains: {
  key: keyof Assessment;
  title: string;
  labelsKey: keyof typeof EQ5D_LABELS;
}[] = [
  { key: 'eq5d_mobility', title: 'การเคลื่อนไหว', labelsKey: 'mobility' },
  { key: 'eq5d_self_care', title: 'การดูแลตนเอง', labelsKey: 'selfCare' },
  { key: 'eq5d_usual_activities', title: 'กิจกรรมที่ทำเป็นประจำ', labelsKey: 'usualActivities' },
  { key: 'eq5d_pain_discomfort', title: 'อาการเจ็บปวด/อาการไม่สบายตัว', labelsKey: 'painDiscomfort' },
  { key: 'eq5d_anxiety_depression', title: 'ความวิตกกังวล/ความซึมเศร้า', labelsKey: 'anxietyDepression' },
];

export default function Eq5d5lForm({ data, onChange }: Props) {
  const utility = calculateEq5dUtility(
    data.eq5d_mobility,
    data.eq5d_self_care,
    data.eq5d_usual_activities,
    data.eq5d_pain_discomfort,
    data.eq5d_anxiety_depression,
  );
  const healthState = `${data.eq5d_mobility}${data.eq5d_self_care}${data.eq5d_usual_activities}${data.eq5d_pain_discomfort}${data.eq5d_anxiety_depression}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary">แบบประเมินคุณภาพชีวิต EQ-5D-5L</h2>
        <p className="text-sm text-gray-600 mt-1">
          ในแต่ละหัวข้อ กรุณาเลือกข้อที่ตรงกับสุขภาพของท่าน <strong>ในวันนี้</strong> มากที่สุด
        </p>
      </div>

      {domains.map(domain => {
        const labels = EQ5D_LABELS[domain.labelsKey];
        const options = [1, 2, 3, 4, 5].map(v => ({
          value: v,
          label: labels[v],
        }));

        return (
          <div key={domain.key} className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2">{domain.title}</h3>
            <RadioScale
              name={domain.key}
              options={options}
              value={data[domain.key] as number}
              onChange={v => onChange({ [domain.key]: v })}
            />
          </div>
        );
      })}

      {/* VAS Scale */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-bold text-gray-800 mb-2">สุขภาพของท่านในวันนี้</h3>
        <p className="text-sm text-gray-600 mb-4">
          สเกลวัดสุขภาพ 0-100 (0 = สุขภาพแย่ที่สุด, 100 = สุขภาพดีที่สุด)
        </p>

        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 w-20 text-right">แย่ที่สุด (0)</span>
          <input
            type="range"
            min={0}
            max={100}
            value={data.eq5d_vas}
            onChange={e => onChange({ eq5d_vas: Number(e.target.value) })}
            className="flex-1 h-4 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #eab308 30%, #22c55e 70%, #22c55e ${data.eq5d_vas}%, #e5e7eb ${data.eq5d_vas}%)`,
            }}
          />
          <span className="text-xs text-gray-500 w-20">ดีที่สุด (100)</span>
        </div>

        <div className="text-center mt-3">
          <span className="text-4xl font-bold text-primary">{data.eq5d_vas}</span>
          <span className="text-lg text-gray-500"> / 100</span>
        </div>
      </div>

      {/* ── Real-time EQ-5D Summary ── */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-bold text-blue-800 mb-2">สรุปคะแนนคุณภาพชีวิต EQ-5D-5L</h4>
        <div className="space-y-1 text-sm">
          {domains.map(domain => (
            <div key={domain.key} className="flex justify-between">
              <span className="text-gray-600">{domain.title}</span>
              <span className={`font-bold ${
                (data[domain.key] as number) >= 4 ? 'text-red-600' : (data[domain.key] as number) >= 3 ? 'text-orange-500' : 'text-green-700'
              }`}>
                ระดับ {data[domain.key] as number}
              </span>
            </div>
          ))}
          <div className="flex justify-between">
            <span className="text-gray-600">EQ-VAS</span>
            <span className="font-bold text-gray-800">{data.eq5d_vas}/100</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-blue-200">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-500">Health State</span>
            <span className="font-mono text-sm font-bold text-gray-700">{healthState}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-blue-700">Utility (Thai Tariff)</span>
            <span className={`text-xl font-bold ${
              utility >= 0.8 ? 'text-green-600' : utility >= 0.5 ? 'text-orange-500' : 'text-red-600'
            }`}>
              {utility.toFixed(3)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
