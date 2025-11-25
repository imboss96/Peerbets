import React from 'react';

// Simple SVG pie chart. Accepts `slices` = [{ label, value, color }]
export default function PieChart({ slices = [], size = 120, innerRadius = 30 }) {
  const total = slices.reduce((s, sl) => s + Math.max(0, Number(sl.value || 0)), 0);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;

  let startAngle = -90; // start at top

  const polarToCartesian = (cx2, cy2, r, angleDeg) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180.0);
    return {
      x: cx2 + (r * Math.cos(angleRad)),
      y: cy2 + (r * Math.sin(angleRad))
    };
  };

  const describeArc = (x, y, r, startAngleDeg, endAngleDeg) => {
    const start = polarToCartesian(x, y, r, endAngleDeg);
    const end = polarToCartesian(x, y, r, startAngleDeg);
    const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? '0' : '1';
    return [`M ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, `L ${x} ${y}`, 'Z'].join(' ');
  };

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-full">
        {slices.map((sl, i) => {
          const value = Math.max(0, Number(sl.value || 0));
          const angle = total === 0 ? 0 : (value / total) * 360;
          const endAngle = startAngle + angle;
          if (angle <= 0) {
            return null;
          }
          const path = describeArc(cx, cy, radius, startAngle, endAngle);
          startAngle = endAngle;
          return <path key={i} d={path} fill={sl.color} stroke="#0b1220" strokeWidth="0.5" />;
        })}

        {/* inner circle to create donut */}
        <circle cx={cx} cy={cy} r={innerRadius} fill="#0b1220" />
      </svg>

      <div className="flex flex-col text-sm">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-white">
            <span style={{ width: 12, height: 12, background: s.color, display: 'inline-block', borderRadius: 2 }} />
            <span className="text-gray-300">{s.label}:</span>
            <span className="font-bold">KSH {Number(s.value || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
