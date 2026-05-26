'use client';

interface KpiCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: string; // mantido por compatibilidade, ignorado no novo design
}

export default function KpiCard({ icon, title, value, subtitle }: KpiCardProps) {
  return (
    <div className="card-gradient-border p-5 flex flex-col gap-2 transition-all hover:-translate-y-1">
      <div
        className="h-px w-full mb-2"
        style={{ background: 'linear-gradient(90deg, #3B9EF5 0%, #8B5CF6 55%, transparent 100%)' }}
      />
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{
          background: 'rgba(59, 158, 245, 0.06)',
          border: '1px solid rgba(59, 158, 245, 0.12)',
        }}
      >
        {icon}
      </div>
      <p className="text-[11px] text-[#4B5E72] uppercase tracking-[0.12em] font-sora mt-0.5">{title}</p>
      <p className="text-3xl font-orbitron font-bold leading-none text-white">{value}</p>
      {subtitle && <p className="text-[11px] text-[#374151] mt-0.5">{subtitle}</p>}
    </div>
  );
}
