'use client';

interface BarItem {
  id: string;
  label: string;
  emoji: string;
  avg: number;
}

interface BarChartProps {
  data: BarItem[];
}

export default function BarChart({ data }: BarChartProps) {
  const max = 5;

  return (
    <div className="card-gradient-border p-6">
      <h3 className="font-orbitron text-sm font-bold text-white mb-6 uppercase tracking-wider">
        Média por Ferramenta
      </h3>
      <div className="space-y-3">
        {data.map(item => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-8 text-center text-base flex-shrink-0">
              {item.emoji || '⚙️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#A0A0B0] mb-1 truncate">{item.label}</p>
              <div className="w-full h-6 bg-[#12122A] rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                  style={{
                    width: `${(item.avg / max) * 100}%`,
                    background: 'linear-gradient(90deg, #4A90E2, #C9A84C)',
                    boxShadow: '0 0 8px rgba(74,144,226,0.4)',
                    minWidth: item.avg > 0 ? '2.5rem' : '0',
                  }}
                >
                  <span className="text-white text-xs font-mono font-bold">{item.avg}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
