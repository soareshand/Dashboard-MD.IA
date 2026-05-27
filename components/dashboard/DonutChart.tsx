'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DonutChartProps {
  title: string;
  data: { name: string; value: number; color: string }[];
}

export default function DonutChart({ title, data }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="card-gradient-border p-6">
      <h3 className="font-orbitron text-xs font-bold text-[#4B5E72] mb-4 uppercase tracking-[0.15em]">{title}</h3>
      {total === 0 ? (
        <div className="flex items-center justify-center h-40 text-[#A0A0B0] text-sm">Sem dados</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, color: '#111827', fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value} (${total > 0 ? Math.round(value / total * 100) : 0}%)`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-1">
            {data.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                <span className="text-[11px] text-[#555570] font-sora whitespace-nowrap">{d.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
