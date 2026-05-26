'use client';

interface KpiCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: 'blue' | 'gold' | 'purple' | 'green';
}

const ACCENT_MAP = {
  blue:   { glow: 'rgba(74,144,226,0.25)',   text: '#6EC6FF',  bar: 'rgba(74,144,226,0.6)' },
  gold:   { glow: 'rgba(201,168,76,0.25)',   text: '#F0D080',  bar: 'rgba(201,168,76,0.6)' },
  purple: { glow: 'rgba(123,92,227,0.3)',    text: '#A07EF0',  bar: 'rgba(123,92,227,0.7)' },
  green:  { glow: 'rgba(46,204,113,0.25)',   text: '#58D68D',  bar: 'rgba(46,204,113,0.6)' },
};

export default function KpiCard({ icon, title, value, subtitle, accent = 'blue' }: KpiCardProps) {
  const { glow, text, bar } = ACCENT_MAP[accent];
  return (
    <div
      className="card-gradient-border p-5 flex flex-col gap-2 transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{ boxShadow: `0 6px 32px ${glow}` }}
    >
      <div
        className="w-full h-0.5 rounded-full mb-1 opacity-70"
        style={{ background: `linear-gradient(90deg, ${bar}, transparent)` }}
      />
      <div className="text-2xl">{icon}</div>
      <p className="text-[11px] text-[#8080A8] uppercase tracking-widest font-sora">{title}</p>
      <p
        className="text-3xl font-orbitron font-bold leading-none"
        style={{ color: text }}
      >
        {value}
      </p>
      {subtitle && <p className="text-[11px] text-[#7070A0] mt-0.5">{subtitle}</p>}
    </div>
  );
}
