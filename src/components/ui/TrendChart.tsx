interface DataPoint {
  label: string;
  value: number;
}

interface TrendLine {
  name: string;
  data: DataPoint[];
  color: string;
}

interface TrendChartProps {
  lines: TrendLine[];
  yMin?: number;
  yMax?: number;
  height?: number;
  yLabel?: string;
}

export default function TrendChart({ lines, yMin = 0, yMax = 10, height = 200, yLabel }: TrendChartProps) {
  if (lines.length === 0 || lines[0].data.length === 0) {
    return <p className="text-center text-gray-400 py-8 text-sm">ไม่มีข้อมูลเพียงพอสำหรับแสดงกราฟ</p>;
  }

  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 40;
  const labels = lines[0].data.map(d => d.label);
  const count = labels.length;
  const width = Math.max(300, count * 80 + paddingLeft + paddingRight);
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;
  const yRange = yMax - yMin || 1;

  function toX(i: number) {
    return paddingLeft + (count === 1 ? chartW / 2 : (i / (count - 1)) * chartW);
  }
  function toY(v: number) {
    return paddingTop + chartH - ((v - yMin) / yRange) * chartH;
  }

  // Y-axis ticks
  const yTicks: number[] = [];
  const tickStep = yRange <= 5 ? 1 : yRange <= 20 ? 2 : Math.ceil(yRange / 5);
  for (let v = yMin; v <= yMax; v += tickStep) yTicks.push(v);
  if (yTicks[yTicks.length - 1] !== yMax) yTicks.push(yMax);

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="text-[10px]">
        {/* Grid lines */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={paddingLeft} y1={toY(v)} x2={width - paddingRight} y2={toY(v)}
              stroke="#e5e7eb" strokeWidth="1" />
            <text x={paddingLeft - 6} y={toY(v) + 3} textAnchor="end" fill="#9ca3af" fontSize="10">
              {Number.isInteger(v) ? v : v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Y label */}
        {yLabel && (
          <text x={10} y={paddingTop + chartH / 2} textAnchor="middle" fill="#6b7280" fontSize="10"
            transform={`rotate(-90, 10, ${paddingTop + chartH / 2})`}>
            {yLabel}
          </text>
        )}

        {/* Lines */}
        {lines.map(line => {
          const points = line.data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');
          return (
            <g key={line.name}>
              <polyline points={points} fill="none" stroke={line.color} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" />
              {line.data.map((d, i) => (
                <g key={i}>
                  <circle cx={toX(i)} cy={toY(d.value)} r="4" fill="white" stroke={line.color} strokeWidth="2" />
                  <text x={toX(i)} y={toY(d.value) - 8} textAnchor="middle"
                    fill={line.color} fontSize="10" fontWeight="bold">
                    {Number.isInteger(d.value) ? d.value : d.value.toFixed(2)}
                  </text>
                </g>
              ))}
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.map((label, i) => (
          <text key={i} x={toX(i)} y={height - 8} textAnchor="middle" fill="#6b7280" fontSize="9">
            {label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      {lines.length > 1 && (
        <div className="flex flex-wrap gap-3 mt-2 px-2">
          {lines.map(line => (
            <div key={line.name} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
              <span>{line.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
