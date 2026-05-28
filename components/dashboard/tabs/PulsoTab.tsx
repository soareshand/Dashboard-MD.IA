'use client';

import { useCallback, useEffect, useState } from 'react';

interface DueItem {
  nome?: string;
  clinica: string;
  diasSemEnvio: number | null;
  ultimoEnvio: string | null;
}

export interface ModalPrefill {
  quizType: 'mensal_medico' | 'mensal_equipe';
  nome?: string;
  clinica?: string;
}

interface RecentResponse {
  nome: string;
  clinica: string;
  nps: number;
  timestamp: string;
}

interface PulsoData {
  dueMedico: DueItem[];
  dueEquipe: DueItem[];
  recentMedico: RecentResponse[];
  recentEquipe: RecentResponse[];
}

function npsColor(n: number) {
  return n <= 6 ? '#F59E0B' : n <= 8 ? '#8B5CF6' : '#3B9EF5';
}

function npsCategory(n: number) {
  return n >= 9 ? 'Promotor' : n >= 7 ? 'Neutro' : 'Detrator';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function diasLabel(dias: number | null) {
  if (dias === null) return 'Nunca enviado';
  if (dias === 0) return 'Hoje';
  return `Há ${dias} dia${dias === 1 ? '' : 's'}`;
}

function DueCard({
  title, subtitle, accentColor, items, quizType, onGerarLink,
}: {
  title: string;
  subtitle: string;
  accentColor: string;
  items: DueItem[];
  quizType: 'mensal_medico' | 'mensal_equipe';
  onGerarLink: (data: ModalPrefill) => void;
}) {
  return (
    <div className="card-gradient-border flex flex-col gap-4">
      <div className="px-5 pt-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-orbitron text-sm font-bold text-white">{title}</h3>
          <p className="text-[10px] text-white mt-0.5 uppercase tracking-wider">{subtitle}</p>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-xs font-orbitron font-bold"
          style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
        >
          {items.length} pendente{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-5 pb-5 text-center text-[#3B9EF5] text-sm">
          ✅ Todas em dia!
        </div>
      ) : (
        <div className="px-5 pb-5 space-y-2 max-h-64 overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-sora font-semibold truncate">
                  {item.nome ?? item.clinica}
                </p>
                {item.nome && item.clinica && (
                  <p className="text-[#a2a2b2] text-[10px] truncate">{item.clinica}</p>
                )}
                <p
                  className="text-[10px] mt-0.5 font-medium"
                  style={{ color: item.diasSemEnvio === null ? '#F59E0B' : item.diasSemEnvio > 90 ? '#F59E0B' : accentColor }}
                >
                  {diasLabel(item.diasSemEnvio)}
                </p>
              </div>
              <button
                onClick={() => onGerarLink({ quizType, nome: item.nome, clinica: item.clinica })}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-sora font-semibold text-white transition-all"
                style={{ background: `${accentColor}25`, border: `1px solid ${accentColor}40` }}
              >
                Gerar Link
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NpsBar({ value }: { value: number }) {
  const color = npsColor(value);
  return (
    <div className="flex items-center gap-2">
      <div
        className="font-orbitron font-bold text-sm w-6 text-center"
        style={{ color }}
      >
        {value}
      </div>
      <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.05)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(value / 10) * 100}%`, background: color }}
        />
      </div>
      <span className="text-[10px] text-[#50507A]">{npsCategory(value)}</span>
    </div>
  );
}

function RecentList({ items, emptyText }: { items: RecentResponse[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-[#404060] text-sm text-center py-4">{emptyText}</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((r, i) => (
        <div key={i} className="py-3 px-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-sora font-semibold truncate">{r.nome}</p>
              {r.clinica && <p className="text-[#6060A0] text-[10px] truncate">{r.clinica}</p>}
            </div>
            <span className="text-[10px] text-[#404060] whitespace-nowrap">{formatDate(r.timestamp)}</span>
          </div>
          <NpsBar value={r.nps} />
        </div>
      ))}
    </div>
  );
}

export default function PulsoTab({ onOpenModal }: { onOpenModal: (data?: ModalPrefill) => void }) {
  const [data, setData] = useState<PulsoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRecent, setActiveRecent] = useState<'medico' | 'equipe'>('medico');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pulso-data');
      if (!res.ok) throw new Error('Erro ao carregar dados.');
      setData(await res.json());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPendentes = (data?.dueMedico.length ?? 0) + (data?.dueEquipe.length ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron text-xl font-bold text-white">Pulso Mensal</h2>
          {!loading && data && totalPendentes > 0 && (
            <p className="text-[#F59E0B] text-xs mt-1">
              ⚠️ {totalPendentes} clínica{totalPendentes !== 1 ? 's' : ''} aguardando envio de quiz
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenModal()}
            className="btn-glow px-4 py-2 rounded-xl text-white font-sora font-semibold text-xs"
          >
            + Gerar Link
          </button>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-[rgba(74,144,226,0.2)] text-[#404060] hover:text-white hover:border-[#4A90E2] transition-all"
            title="Atualizar"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#3B9EF5] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-[#F59E0B] text-sm mb-3">{error}</p>
          <button onClick={fetchData} className="text-[#3B9EF5] text-sm hover:underline">Tentar novamente</button>
        </div>
      )}

      {data && (
        <>
          {/* Pendências */}
          <div>
            <h3 className="text-xs font-sora font-semibold text-white uppercase tracking-widest mb-3">
              Pendências de Envio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DueCard
                title="Quiz Médico"
                subtitle="Frequência trimestral"
                accentColor="#3B9EF5"
                items={data.dueMedico}
                quizType="mensal_medico"
                onGerarLink={onOpenModal}
              />
              <DueCard
                title="Quiz Equipe"
                subtitle="Frequência mensal"
                accentColor="#8B5CF6"
                items={data.dueEquipe}
                quizType="mensal_equipe"
                onGerarLink={onOpenModal}
              />
            </div>
          </div>

          {/* Respostas Recentes */}
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-xs font-sora font-semibold text-white uppercase tracking-widest">
                Respostas Recentes
              </h3>
              <div className="card-gradient-border p-0.5 flex gap-0.5 rounded-lg">
                {(['medico', 'equipe'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveRecent(t)}
                    className={`px-3 py-1 rounded-md text-xs font-sora transition-all ${
                      activeRecent === t ? 'bg-[#4A90E2] text-white' : 'text-[#A0A0B0] hover:text-white'
                    }`}
                  >
                    {t === 'medico' ? '👨‍⚕️ Médico' : '👥 Equipe'}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-gradient-border p-5">
              {activeRecent === 'medico' ? (
                <RecentList items={data.recentMedico} emptyText="Nenhuma resposta de médicos ainda." />
              ) : (
                <RecentList items={data.recentEquipe} emptyText="Nenhuma resposta de equipes ainda." />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
