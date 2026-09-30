interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export function DonutChart({
  data,
  size = 160,
  thickness = 24,
  centerLabel,
  centerValue,
}: {
  data: ChartData[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="flex-shrink-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e4de"
            strokeWidth={thickness}
          />
          {data.map((d, i) => {
            const len = (d.value / total) * circumference;
            const seg = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color || '#3d7068'}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.16,1,0.3,1)' }}
              />
            );
            offset += len;
            return seg;
          })}
        </g>
        {centerValue && (
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            fill="#1c1c1c"
            style={{ font: '600 28px "Playfair Display", serif' }}
          >
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text
            x="50%"
            y="62%"
            textAnchor="middle"
            fill="#b4b4b4"
            style={{ font: '400 9px "Space Mono", monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}
          >
            {centerLabel}
          </text>
        )}
      </svg>
      <div className="space-y-2 flex-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: d.color || '#3d7068' }} />
              <span className="text-[#1c1c1c]">{d.label}</span>
            </div>
            <span className="mono-data text-[#6b7280]">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 200,
  formatValue,
}: {
  data: ChartData[];
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3" style={{ minHeight: height }}>
      {data.map((d, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#1c1c1c]">{d.label}</span>
            <span className="mono-data text-[#6b7280]">{formatValue ? formatValue(d.value) : d.value}</span>
          </div>
          <div className="h-2 bg-[#e5e4de] relative overflow-hidden">
            <div
              className="h-full editorial-ease"
              style={{
                width: `${(d.value / max) * 100}%`,
                backgroundColor: d.color || '#3d7068',
                transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)',
                transitionDelay: `${i * 80}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LineChart({
  data,
  height = 180,
  color = '#3d7068',
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;
  const width = 100;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * width;
      const y = height - ((d.value - min) / (max - min || 1)) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <polygon points={areaPoints} fill={color} opacity={0.08} />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          style={{ transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)' }}
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * width;
          const y = height - ((d.value - min) / (max - min || 1)) * (height - 20) - 10;
          return <circle key={i} cx={x} cy={y} r={1.5} fill={color} vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] mono-data text-[#b4b4b4] uppercase">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProgressBar({ value, color = '#3d7068' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 bg-[#e5e4de] relative overflow-hidden">
      <div
        className="h-full editorial-ease"
        style={{
          width: `${value}%`,
          backgroundColor: color,
          transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)',
        }}
      />
    </div>
  );
}

export function ScanLineProgress() {
  return (
    <div className="h-0.5 bg-[#e5e4de] relative overflow-hidden">
      <div className="h-full w-1/3 bg-[#3b82f6] scan-line" />
    </div>
  );
}
