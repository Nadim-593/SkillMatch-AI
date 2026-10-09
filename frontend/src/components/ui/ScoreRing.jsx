export default function ScoreRing({ score = 0, size = 96, strokeWidth = 8, label = "Match" }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const validScore = Math.max(0, Math.min(100, Number(score) || 0));
  const offset = circumference - (validScore / 100) * circumference;

  const color =
    validScore >= 75 ? '#22c55e' :
    validScore >= 50 ? '#3b82f6' :
    validScore >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-gray-900 leading-tight">{Math.round(validScore)}%</span>
        {label && <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>}
      </div>
    </div>
  );
}
