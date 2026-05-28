'use client';

import { useCallback, useEffect, useState } from 'react';

interface CardData {
  id: string;
  nome: string;
  clinica: string | null;
  grupo: string | null;
  entrada: string | null;
  produtosAtivos: number;
  npsMedia: number | null;
  presencas: number | null;
  taxaPresenca: number | null;
  contatoStatus: string | null;
  diasRenovacao: number | null;
  score: number;
  isAniversariante: boolean;
  isAniversarioHoje: boolean;
}

interface GeralData {
  cards: CardData[];
  totalProdutos: number;
}

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(score / 10, 1) * circ;
  const color = score >= 8 ? '#3B9EF5' : score >= 5 ? '#8B5CF6' : '#F59E0B';
  return (
    <div className="relative w-[88px] h-[88px] flex-shrink-0 flex items-center justify-center">
      <svg width="88" height="88" viewBox="0 0 88 88" className="absolute" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}90)` }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="font-orbitron font-bold text-lg leading-none" style={{ color }}>{score.toFixed(1)}</span>
        <span className="text-[10px] text-[#404060] font-mono leading-none mt-0.5">/10</span>
      </div>
    </div>
  );
}

function MetricChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-[#404060] uppercase tracking-wider font-medium">{label}</span>
      <span className="text-xs font-semibold leading-none" style={{ color }}>{value}</span>
    </div>
  );
}

function RenovacaoPill({ dias }: { dias: number | null }) {
  if (dias === null) return null;
  const vencida = dias < 0;
  const label = vencida ? `Vencida há ${Math.abs(dias)}d` : `${dias}d p/ renovar`;
  const color = vencida || dias <= 30 ? '#F59E0B' : dias <= 60 ? '#8B5CF6' : '#3B9EF5';
  const bg = vencida || dias <= 30 ? 'rgba(245,158,11,0.08)' : dias <= 60 ? 'rgba(139,92,246,0.08)' : 'rgba(59,158,245,0.08)';
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap"
      style={{ color, background: bg, borderColor: `${color}30` }}>
      🗓 {label}
    </span>
  );
}

function ClinicCard({ card, totalProdutos }: { card: CardData; totalProdutos: number }) {
  const score = card.score;
  const scoreColor = score >= 8 ? '#3B9EF5' : score >= 5 ? '#8B5CF6' : '#F59E0B';

  const npsColor = card.npsMedia === null ? '#404060'
    : card.npsMedia >= 4 ? '#3B9EF5' : card.npsMedia >= 2.5 ? '#8B5CF6' : '#F59E0B';
  const presColor = card.taxaPresenca === null ? '#404060'
    : card.taxaPresenca >= 75 ? '#3B9EF5' : card.taxaPresenca >= 50 ? '#8B5CF6' : '#F59E0B';
  const contColor = card.contatoStatus === 'Em dia' || card.contatoStatus === 'OK' ? '#3B9EF5'
    : card.contatoStatus === 'Atenção' ? '#8B5CF6'
    : card.contatoStatus === 'Crítico' ? '#F59E0B'
    : '#404060';
  const prodColor = totalProdutos === 0 ? '#404060'
    : card.produtosAtivos >= totalProdutos * 0.7 ? '#3B9EF5'
    : card.produtosAtivos > 0 ? '#8B5CF6' : '#404060';

  return (
    <div className="card-gradient-border p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: scoreColor, opacity: 0.65 }} />

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 pt-1">
          {card.isAniversariante && (
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-sm">🎂</span>
              <span className={`text-[10px] font-semibold ${card.isAniversarioHoje ? 'text-[#3B9EF5]' : 'text-[#8B5CF6]'}`}>
                {card.isAniversarioHoje ? '🎉 Aniversário hoje!' : 'Aniversariante do mês'}
              </span>
            </div>
          )}
          <h3 className="font-orbitron text-sm font-bold text-white leading-snug truncate">
            {card.clinica || card.nome}
          </h3>
          {card.clinica && (
            <p className="text-[#6060A0] text-xs mt-0.5 truncate">{card.nome}</p>
          )}
          {card.grupo && (
            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] text-[#404060] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] uppercase tracking-wider">
              {card.grupo}
            </span>
          )}
        </div>
        <ScoreRing score={score} />
      </div>

      <div className="h-px bg-[rgba(74,144,226,0.1)]" />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <MetricChip
          label="Produtos Ativos"
          value={totalProdutos > 0 ? `${card.produtosAtivos} / ${totalProdutos}` : '—'}
          color={prodColor}
        />
        <MetricChip
          label="NPS Renovação"
          value={card.npsMedia !== null ? `${card.npsMedia} / 5` : '—'}
          color={npsColor}
        />
        <MetricChip
          label="Presença Mentorias"
          value={card.taxaPresenca !== null ? `${card.taxaPresenca}% · ${card.presencas} sess.` : '—'}
          color={presColor}
        />
        <MetricChip
          label="Monit. de Contato"
          value={card.contatoStatus || '—'}
          color={contColor}
        />
      </div>

      {card.diasRenovacao !== null && (
        <div>
          <RenovacaoPill dias={card.diasRenovacao} />
        </div>
      )}
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(t);
  }, []);

  const W = 220, H = 126;
  const cx = W / 2, cy = H;
  const R = 88, strokeW = 13;
  const totalLen = Math.PI * R;
  const progress = Math.min(score / 10, 1);
  const offset = animated ? totalLen * (1 - progress) : totalLen;
  const color = score >= 8 ? '#3B9EF5' : score >= 5 ? '#8B5CF6' : '#F59E0B';

  const NUM_TICKS = 30;
  const ticks = Array.from({ length: NUM_TICKS + 1 }, (_, i) => {
    const t = i / NUM_TICKS;
    const angle = Math.PI * (1 - t);
    const rIn = R + strokeW / 2 + 3;
    const rOut = rIn + (i % 6 === 0 ? 11 : 6);
    return {
      x1: cx + rIn * Math.cos(angle),
      y1: cy - rIn * Math.sin(angle),
      x2: cx + rOut * Math.cos(angle),
      y2: cy - rOut * Math.sin(angle),
      active: t <= progress,
      major: i % 6 === 0,
    };
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 0 ${cx + R} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} strokeLinecap="round"
      />
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 0 ${cx + R} ${cy}`}
        fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
        strokeDasharray={totalLen} strokeDashoffset={offset}
        style={{
          transition: animated ? 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1), stroke 0.6s ease' : 'none',
          filter: `drop-shadow(0 0 10px ${color}60)`,
        }}
      />
      {ticks.map((tick, i) => (
        <line key={i}
          x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
          stroke={tick.active ? `${color}BB` : 'rgba(255,255,255,0.09)'}
          strokeWidth={tick.major ? 2 : 1.2} strokeLinecap="round"
        />
      ))}
      <text x={cx} y={cy - 32} textAnchor="middle" fill="white" fontSize="36" fontWeight="bold" fontFamily="'Orbitron', monospace">
        {score.toFixed(1)}
      </text>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#50507A" fontSize="10" letterSpacing="2" fontFamily="monospace">
        MÉDIA SCORE
      </text>
    </svg>
  );
}

function SummaryKpis({ cards }: { cards: CardData[] }) {
  const total = cards.length;
  const avgScore = total > 0 ? Math.round((cards.reduce((s, c) => s + c.score, 0) / total) * 10) / 10 : 0;
  const saudaveis = cards.filter(c => c.score >= 8).length;
  const atencao = cards.filter(c => c.score >= 5 && c.score < 8).length;
  const criticos = cards.filter(c => c.score < 5).length;

  const kpis = [
    { label: 'Total Ativos', value: String(total), sub: 'clínicas', color: '#A0A0B0' },
    { label: 'Saudáveis', value: String(saudaveis), sub: 'score ≥ 8', color: '#3B9EF5' },
    { label: 'Em Atenção', value: String(atencao), sub: 'score 5–7.9', color: '#8B5CF6' },
    { label: 'Críticos', value: String(criticos), sub: 'score < 5', color: '#F59E0B' },
  ];

  return (
    <div className="flex gap-4 items-stretch">
      <div className="card-gradient-border flex items-center justify-center px-6 py-5 flex-shrink-0">
        <ScoreGauge score={avgScore} />
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1 min-w-0">
        {kpis.map(k => (
          <div key={k.label} className="card-gradient-border p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: k.color }}>{k.label}</span>
            <div className="flex items-baseline gap-1">
              <span className="font-orbitron text-2xl font-bold text-white">{k.value}</span>
              <span className="text-[10px] text-[#404060] font-mono">{k.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GeralTab() {
  const [data, setData] = useState<GeralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'saudavel' | 'atencao' | 'critico'>('todos');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/geral-data');
      if (!res.ok) throw new Error('Erro ao carregar dados gerais.');
      setData(await res.json());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#3B9EF5] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return (
    <div className="text-center py-24">
      <p className="text-[#F59E0B] text-sm mb-3">{error}</p>
      <button onClick={fetchData} className="text-[#3B9EF5] text-sm hover:underline">Tentar novamente</button>
    </div>
  );
  if (!data) return null;

  const FILTROS = [
    { v: 'todos', label: 'Todos' },
    { v: 'saudavel', label: '🔵 Saudáveis' },
    { v: 'atencao', label: '🟣 Atenção' },
    { v: 'critico', label: '🟡 Críticos' },
  ] as const;

  const filtered = data.cards
    .filter(c => {
      if (!busca) return true;
      const q = busca.toLowerCase();
      return c.nome.toLowerCase().includes(q) || (c.clinica ?? '').toLowerCase().includes(q);
    })
    .filter(c => {
      if (filtro === 'saudavel') return c.score >= 8;
      if (filtro === 'atencao') return c.score >= 5 && c.score < 8;
      if (filtro === 'critico') return c.score < 5;
      return true;
    });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-orbitron text-xl font-bold text-white">Visão Geral das Clínicas</h2>
          <p className="text-[#404060] text-sm mt-1">Health Score · somente membros ativos · score 0–10</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-xl border border-[rgba(74,144,226,0.2)] text-[#404060] hover:text-white hover:border-[#4A90E2] transition-all flex-shrink-0"
          title="Atualizar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>

      <SummaryKpis cards={data.cards} />

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="card-gradient-border p-1 flex gap-1 rounded-xl flex-wrap">
          {FILTROS.map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-sora transition-all whitespace-nowrap ${
                filtro === v ? 'bg-[#4A90E2] text-white' : 'text-[#A0A0B0] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar clínica ou médico…"
            className="bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#4A90E2] transition-all w-56 placeholder-[#303050]"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-[#404060] hover:text-[#A0A0B0] text-xs transition-colors">✕</button>
          )}
        </div>
      </div>

      {/* Score legend */}
      <div className="flex items-center gap-4 text-[10px] text-[#404060]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3B9EF5]" /> Saudável (≥ 8)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> Atenção (5–7.9)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Crítico (&lt; 5)</span>
        <span className="text-[#303050] hidden sm:block">Score = Produtos(30%) + NPS(30%) + Presença(20%) + Contato(10%) + Renovação(10%)</span>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#404060] text-sm">Nenhuma clínica encontrada.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(card => (
            <ClinicCard key={card.id} card={card} totalProdutos={data.totalProdutos} />
          ))}
        </div>
      )}
    </div>
  );
}
