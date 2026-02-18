import type { Assessment } from '../../lib/types';
import PainScaleSlider from '../ui/PainScaleSlider';
import BodyMap from '../ui/BodyMap';

interface Props {
  data: Assessment;
  onChange: (updates: Partial<Assessment>) => void;
}

export default function BpiForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-primary">
        Brief Pain Inventory (BPI) - แบบสอบถามอย่างสั้นที่ใช้ประเมินผู้ป่วยที่มีอาการปวด
      </h2>

      {/* Question 1 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-3">
          1. ในขณะนี้ ท่านมีอาการปวดในลักษณะอื่นๆ ที่พิเศษ นอกเหนือไปจากอาการปวดโดยทั่วไป
        </p>
        <div className="flex gap-4">
          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ${
            data.has_other_pain === true ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:bg-gray-100'
          }`}>
            <input type="radio" name="hasOtherPain" checked={data.has_other_pain === true}
              onChange={() => onChange({ has_other_pain: true })} className="hidden" />
            <span className="font-medium">มี</span>
          </label>
          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ${
            data.has_other_pain === false ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:bg-gray-100'
          }`}>
            <input type="radio" name="hasOtherPain" checked={data.has_other_pain === false}
              onChange={() => onChange({ has_other_pain: false })} className="hidden" />
            <span className="font-medium">ไม่มี</span>
          </label>
        </div>
      </div>

      {/* Question 2 - Body Map */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-3">
          2. กรุณาระบุตำแหน่งบนร่างกายที่ท่านรู้สึกปวด (คลิกบนร่างเพื่อทำเครื่องหมาย X)
        </p>
        <BodyMap
          locations={data.pain_location_data}
          onChange={locs => onChange({ pain_location_data: locs })}
        />
        {data.pain_location_data.length > 0 && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            คลิกที่เครื่องหมาย X เพื่อลบ ({data.pain_location_data.length} จุด)
          </p>
        )}
      </div>

      {/* Questions 3-6 Pain Scores */}
      <div className="space-y-2">
        <PainScaleSlider
          label="3. ระดับอาการปวดที่รุนแรงมากที่สุดในระยะเวลา 24 ชม. ที่ผ่านมา"
          value={data.pain_score_max}
          onChange={v => {
            const updates: Partial<Assessment> = { pain_score_max: v };
            if (v < data.pain_score_min) updates.pain_score_min = v;
            onChange(updates);
          }}
        />
        <PainScaleSlider
          label="4. ระดับอาการปวดที่รุนแรงน้อยที่สุดในระยะเวลา 24 ชม. ที่ผ่านมา"
          value={data.pain_score_min}
          onChange={v => {
            const updates: Partial<Assessment> = { pain_score_min: v };
            if (v > data.pain_score_max) updates.pain_score_max = v;
            onChange(updates);
          }}
        />
        <PainScaleSlider
          label="5. ระดับอาการปวดโดยเฉลี่ย"
          value={data.pain_score_avg}
          onChange={v => onChange({ pain_score_avg: v })}
        />
        <PainScaleSlider
          label="6. ระดับอาการปวดที่ท่านรู้สึกอยู่ในขณะนี้"
          value={data.pain_score_now}
          onChange={v => onChange({ pain_score_now: v })}
        />

        {/* ── Real-time Pain Severity Summary ── */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-bold text-blue-800 mb-2">สรุปคะแนนความปวด</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ปวดมากสุด (Max)</span>
              <span className="font-bold text-gray-800">{data.pain_score_max}/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ปวดน้อยสุด (Min)</span>
              <span className="font-bold text-gray-800">{data.pain_score_min}/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ปวดเฉลี่ย (Avg)</span>
              <span className="font-bold text-gray-800">{data.pain_score_avg}/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ปวดขณะนี้ (Now)</span>
              <span className="font-bold text-gray-800">{data.pain_score_now}/10</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200 flex justify-between items-center">
            <span className="text-sm font-semibold text-blue-700">Pain Severity Mean</span>
            <span className={`text-xl font-bold ${
              ((data.pain_score_max + data.pain_score_min + data.pain_score_avg + data.pain_score_now) / 4) >= 7
                ? 'text-red-600'
                : ((data.pain_score_max + data.pain_score_min + data.pain_score_avg + data.pain_score_now) / 4) >= 4
                  ? 'text-orange-500'
                  : 'text-green-600'
            }`}>
              {((data.pain_score_max + data.pain_score_min + data.pain_score_avg + data.pain_score_now) / 4).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Psychological Screening */}
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-bold text-gray-800 mb-3">Psychological Screening</h3>

        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input type="checkbox" checked={data.psych_screening_na}
            onChange={e => onChange({ psych_screening_na: e.target.checked })}
            className="w-4 h-4 rounded" />
          <span className="text-sm font-medium">N/A</span>
        </label>

        {!data.psych_screening_na && (
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">Depression Risk</p>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input type="checkbox" checked={data.depression_risk_1}
                  onChange={e => onChange({ depression_risk_1: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <span className="text-sm">มีความไม่สบายใจ เซ็ง ทุกข์ใจ เศร้า ท้อแท้ซึม หงอย</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.depression_risk_2}
                  onChange={e => onChange({ depression_risk_2: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <span className="text-sm">มีความเบื่อ ไม่อยากพูดไม่อยากทำอะไร หรือทำอะไรก็ไม่สนุกเพลิดเพลิน</span>
              </label>
            </div>

            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm font-semibold text-red-700 mb-2">Suicide Risk</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.suicide_risk}
                  onChange={e => onChange({ suicide_risk: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600" />
                <span className="text-sm">มีความรู้สึกทุกข์ใจจนไม่อยากมีชีวิตอยู่</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Others (ถ้ามี)</label>
              <input type="text" value={data.psych_others}
                onChange={e => onChange({ psych_others: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="อื่นๆ..." />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
