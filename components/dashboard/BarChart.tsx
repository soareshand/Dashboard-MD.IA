'use client';

interface BarItem {
  id: string;
  label: string;
  emoji: string;
  avg: number;
}

export default function BarChart({ data }: { data: BarItem[] }) {
  const max = 5;
  const sorted = [...data].sort((a, b) => b.avg - a.avg);

  return (
    <div className="card-gradient-border p-6">
      <h3 className="font-orbitron text-xs font-bold text-white mb-7 uppercase tracking-[0.15em]">
        Média por Ferramenta
      </h3>
      <div className="space-y-5">
        {sorted.map(item => {
          const pct = max > 0 ? (item.avg / max) * 100 : 0;
          return (
            <div key={item.id} className="flex items-center gap-4">
              <p className="w-40 text-xs text-[#a2a2b2] shrink-0 leading-tight font-sora">
                {item.label}
              </p>
              <div
                className="flex-1 relative rounded-full"
                style={{
                  height: '6px',
                  background: 'rgba(8, 8, 20, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #F59E0B 0%, #3B9EF5 100%)',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
                  }}
                />
                {pct > 2 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: '14px',
                      height: '14px',
                      left: `calc(${pct}% - 7px)`,
                      background: 'linear-gradient(135deg, #F59E0B, #3B9EF5)',
                      boxShadow: '0 0 14px rgba(59, 158, 245, 0.9), 0 0 5px rgba(245, 158, 11, 0.7)',
                      border: '2px solid rgba(8, 8, 20, 0.95)',
                    }}
                  />
                )}
              </div>
              <div className="w-12 shrink-0 text-right">
                <span className="font-orbitron font-bold text-sm text-white">{item.avg}</span>
                <span className="text-[#a2a2b2] text-xs">/5</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
