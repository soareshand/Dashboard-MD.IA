'use client';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between text-xs text-[#A0A0B0] mb-2 font-mono">
        <span>Etapa {current} de {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #4A90E2, #6EC6FF)',
            boxShadow: '0 0 8px rgba(74, 144, 226, 0.5)',
          }}
        />
      </div>
    </div>
  );
}
