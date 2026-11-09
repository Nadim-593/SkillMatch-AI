const statusColors = {
  matched: 'bg-green-100 text-green-800 border-green-200',
  partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  missing: 'bg-red-100 text-red-800 border-red-200',
  neutral: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default function SkillBadge({ skill, status = 'neutral', size = 'sm', category = '' }) {
  const color = statusColors[status] || statusColors.neutral;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${textSize} font-medium border ${color}`}>
      <span>{skill}</span>
      {category && <span className="opacity-60 text-[10px]">({category})</span>}
    </span>
  );
}
