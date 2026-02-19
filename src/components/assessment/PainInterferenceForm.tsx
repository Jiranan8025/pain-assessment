import type { Assessment } from '../../lib/types';
import PainScaleSlider from '../ui/PainScaleSlider';

interface Props {
  data: Assessment;
  onChange: (data: Partial<Assessment>) => void;
}

const interferenceItems: { key: keyof Assessment; label: string }[] = [
  { key: 'interference_general_activity', label: '8.1 กิจกรรมโดยทั่วไป' },
  { key: 'interference_mood', label: '8.2 อารมณ์' },
  { key: 'interference_walking', label: '8.3 ความสามารถในการเดิน' },
  { key: 'interference_normal_work', label: '8.4 งานประจำวัน (ทั้งงานนอกบ้านและงานบ้าน)' },
  { key: 'interference_relationship', label: '8.5 ความสัมพันธ์กับผู้อื่น' },
  { key: 'interference_sleep', label: '8.6 การนอนหลับ' },
  { key: 'interference_enjoyment', label: '8.7 ความสุขในการใช้ชีวิตประจำวัน' },
];

export default function PainInterferenceForm({ data, onChange }: Props) {
  const interferenceValues = interferenceItems.map(item => data[item.key] as number);
  const interferenceSum = interferenceValues.reduce((a, b) => a + b, 0);
  const interferenceMean = interferenceSum / interferenceItems.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary">Pain Interference</h2>
        <p className="text-sm text-gray-600 mt-1">
          7. วิธีการบำบัดอาการปวดช่วยบรรเทาได้มากน้อยเพียงใด (ใน 24 ชม. ที่ผ่านมา)
        </p>
      </div>

      <PainScaleSlider
        label="Treatment Relief Score"
        value={data.treatment_relief_score}
        onChange={v => onChange({ treatment_relief_score: v })}
        leftLabel="ไม่ช่วยบรรเทาเลย"
        rightLabel="บำบัดได้อย่างมีประสิทธิภาพที่สุด"
        hideEmoji
      />

      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-4">
          8. ใน 24 ชม. ที่ผ่านมา อาการปวดรบกวนการดำเนินชีวิตประจำวันในด้านต่างๆ มากน้อยแค่ไหน
        </p>

        <div className="space-y-2">
          {interferenceItems.map(item => (
            <PainScaleSlider
              key={item.key}
              label={item.label}
              value={data[item.key] as number}
              onChange={v => onChange({ [item.key]: v })}
              leftLabel="ไม่มีผลกระทบเลย"
              rightLabel="มีผลกระทบอย่างมากที่สุด"
            />
          ))}
        </div>

        {/* ── Real-time Interference Summary ── */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-bold text-blue-800 mb-2">สรุปผลกระทบจากอาการปวด</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">การบรรเทา (Relief)</span>
              <span className={`font-bold ${data.treatment_relief_score >= 7 ? 'text-green-600' : data.treatment_relief_score >= 4 ? 'text-orange-500' : 'text-red-600'}`}>
                {data.treatment_relief_score}/10 ({(data.treatment_relief_score * 10)}%)
              </span>
            </div>
            {interferenceItems.map(item => (
              <div key={item.key} className="flex justify-between">
                <span className="text-gray-600">{(item.label).replace(/^8\.\d+ /, '')}</span>
                <span className="font-bold text-gray-800">{data[item.key] as number}/10</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200 flex justify-between items-center">
            <span className="text-sm font-semibold text-blue-700">Pain Interference Mean</span>
            <span className={`text-xl font-bold ${
              interferenceMean >= 7 ? 'text-red-600' : interferenceMean >= 4 ? 'text-orange-500' : 'text-green-600'
            }`}>
              {interferenceMean.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
