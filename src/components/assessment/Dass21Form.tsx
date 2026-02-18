import type { Assessment } from '../../lib/types';
import { DASS21_QUESTIONS, DASS21_OPTIONS, calculateDass21, getDepressionSeverity, getAnxietySeverity, getStressSeverity, getSeverityColor } from '../../lib/scoring';

interface Props {
  data: Assessment;
  onChange: (data: Partial<Assessment>) => void;
}

export default function Dass21Form({ data, onChange }: Props) {
  const handleAnswerChange = (index: number, value: number) => {
    const newAnswers = [...data.dass21_answers];
    newAnswers[index] = value;
    const scores = calculateDass21(newAnswers);
    onChange({
      dass21_answers: newAnswers,
      dass21_depression: scores.depression,
      dass21_anxiety: scores.anxiety,
      dass21_stress: scores.stress,
    });
  };

  const scores = calculateDass21(data.dass21_answers);
  const depSeverity = getDepressionSeverity(scores.depression);
  const anxSeverity = getAnxietySeverity(scores.anxiety);
  const strSeverity = getStressSeverity(scores.stress);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary">แบบประเมินสุขภาพจิต DASS-21</h2>
        <p className="text-sm text-gray-600 mt-1">
          วงกลมหมายเลข 0-3 ที่ระบุข้อความได้ตรงกับท่านมากที่สุด <strong>ในช่วงสัปดาห์ที่ผ่านมา</strong>
        </p>
      </div>

      {/* Live Score Summary */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-gray-500">Depression</p>
          <p className="text-2xl font-bold">{scores.depression}</p>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getSeverityColor(depSeverity)}`}>
            {depSeverity}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Anxiety</p>
          <p className="text-2xl font-bold">{scores.anxiety}</p>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getSeverityColor(anxSeverity)}`}>
            {anxSeverity}
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Stress</p>
          <p className="text-2xl font-bold">{scores.stress}</p>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getSeverityColor(strSeverity)}`}>
            {strSeverity}
          </span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {DASS21_QUESTIONS.map((question, index) => (
          <div key={index} className={`p-3 rounded-lg border ${
            data.dass21_answers[index] > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
          }`}>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {index + 1}. {question}
            </p>
            <div className="flex flex-wrap gap-2">
              {DASS21_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAnswerChange(index, opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    data.dass21_answers[index] === opt.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.value} - {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Others */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold text-gray-800">ข้อมูลเพิ่มเติม</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">9Q</label>
            <input type="text" value={data.others_9q}
              onChange={e => onChange({ others_9q: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">8Q</label>
            <input type="text" value={data.others_8q}
              onChange={e => onChange({ others_8q: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Others</label>
          <textarea value={data.other_notes}
            onChange={e => onChange({ other_notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>
    </div>
  );
}
