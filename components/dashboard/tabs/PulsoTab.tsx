'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

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

interface MedicoResponse {
  nome: string;
  clinica: string;
  nps: number;
  nps_resposta: string;
  resultado_percebido: string;
  resultado_percebido_outro: string;
  pergunta_rotativa: number | null;
  pergunta_rotativa_resposta: string;
  timestamp: string;
}

interface EquipeResponse {
  nome: string;
  clinica: string;
  nps: number;
  nps_resposta: string;
  nota_crm: number | null;
  nota_automacoes: number | null;
  nota_suporte: number | null;
  pergunta_rotativa: number | null;
  pergunta_rotativa_resposta: string;
  timestamp: string;
}

interface PulsoData {
  dueMedico: DueItem[];
  dueEquipe: DueItem[];
  recentMedico: MedicoResponse[];
  recentEquipe: EquipeResponse[];
}

const ROTATING_MEDICO = [
  'Qual problema da sua clínica ainda tira seu sono?',
  'Se pudéssemos criar uma nova automação pra você, qual seria?',
  'Qual conteúdo ou treinamento faria diferença para o time da sua clínica?',
  'O que seu time de recepção mais precisa de apoio hoje?',
];

const ROTATING_EQUIPE = [
  'O que mais travou o trabalho de vocês este mês?',
  'Se pudéssemos automatizar uma tarefa do dia a dia, qual seria?',
  'Qual treinamento faria diferença para a equipe hoje?',
  'Como está a comunicação entre vocês e a equipe MD.IA?',
];

const PILLAR_SCALE = ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];

function getRotatingQuestion(questions: string[], month: number | null): string {
  if (!month) return '—';
  return questions[(month - 1) % 4];
}

function npsColor(n: number) {
  return n <= 6 ? '#F59E0B' : n <= 8 ? '#8B5CF6' : '#3B9EF5';
}

function npsCategory(n: number) {
  return n >= 9 ? 'Promotor' : n >= 7 ? 'Neutro' : 'Detrator';
}

function npsConditionalMedico(nps: number) {
  if (nps >= 9) return 'O que mais gerou resultado para você e sua clínica este mês?';
  if (nps >= 7) return 'O que precisaria melhorar para você nos dar um 10?';
  return 'O que está te frustrando hoje? Queremos entender.';
}

function npsConditionalEquipe(nps: number) {
  if (nps >= 9) return 'O que tem funcionado melhor no dia a dia de vocês?';
  if (nps >= 7) return 'O que poderia ser melhor no nosso suporte ou nas ferramentas?';
  return 'O que está travando o trabalho de vocês? Pode ser direto.';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatDateFull(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso));
  } catch { return iso; }
}

function diasLabel(dias: number | null) {
  if (dias === null) return 'Nunca enviado';
  if (dias === 0) return 'Link gerado';
  return `Há ${dias} dia${dias === 1 ? '' : 's'}`;
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function MField({ label, value }: { label: string; value: string | number | null | undefined }) {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  return (
    <div className="flex gap-2">
      <span className="text-[#A0A0B0] text-xs w-48 flex-shrink-0">{label}:</span>
      <span className="text-white text-xs flex-1 leading-relaxed">{display}</span>
    </div>
  );
}

function MSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="font-orbitron text-xs text-[#6EC6FF] uppercase tracking-wider mb-2">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailModal({ title, subtitle, onClose, children }: {
  title: string; subtitle: string; onClose: () => void; children: ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-gradient-border w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-orbitron text-lg font-bold text-white">{title}</h3>
            <p className="text-[#A0A0B0] text-sm">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-[#A0A0B0] hover:text-white text-xl transition-colors ml-4 flex-shrink-0">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MedicoDetailModal({ row, onClose }: { row: MedicoResponse; onClose: () => void }) {
  return (
    <DetailModal
      title={row.nome}
      subtitle={`${row.clinica} · ${formatDateFull(row.timestamp)}`}
      onClose={onClose}
    >
      <MSection title="NPS">
        <MField label="Nota" value={`${row.nps}/10 — ${npsCategory(row.nps)}`} />
        <div className="flex gap-2 mt-1">
          <span className="text-[#A0A0B0] text-xs w-48 flex-shrink-0">{npsConditionalMedico(row.nps)}:</span>
          <span className="text-white text-xs flex-1 leading-relaxed">{row.nps_resposta || '—'}</span>
        </div>
      </MSection>
      <MSection title="Resultado Percebido">
        <MField label="Selecionados" value={row.resultado_percebido || '—'} />
        {row.resultado_percebido_outro && (
          <MField label="Outro (campo livre)" value={row.resultado_percebido_outro} />
        )}
      </MSection>
      {row.pergunta_rotativa && (
        <MSection title="Pergunta do Mês">
          <div className="flex gap-2">
            <span className="text-[#A0A0B0] text-xs w-48 flex-shrink-0">
              {getRotatingQuestion(ROTATING_MEDICO, row.pergunta_rotativa)}:
            </span>
            <span className="text-white text-xs flex-1 leading-relaxed">
              {row.pergunta_rotativa_resposta || '—'}
            </span>
          </div>
        </MSection>
      )}
    </DetailModal>
  );
}

function EquipeDetailModal({ row, onClose }: { row: EquipeResponse; onClose: () => void }) {
  function pillarLabel(val: number | null) {
    if (val === null) return '—';
    return `${val}/5 — ${PILLAR_SCALE[val - 1]}`;
  }
  return (
    <DetailModal
      title={row.nome}
      subtitle={`${row.clinica} · ${formatDateFull(row.timestamp)}`}
      onClose={onClose}
    >
      <MSection title="NPS">
        <MField label="Nota" value={`${row.nps}/10 — ${npsCategory(row.nps)}`} />
        <div className="flex gap-2 mt-1">
          <span className="text-[#A0A0B0] text-xs w-48 flex-shrink-0">{npsConditionalEquipe(row.nps)}:</span>
          <span className="text-white text-xs flex-1 leading-relaxed">{row.nps_resposta || '—'}</span>
        </div>
      </MSection>
      <MSection title="Avaliação dos Pilares">
        <MField label="CRM" value={pillarLabel(row.nota_crm)} />
        <MField label="Automações e IA" value={pillarLabel(row.nota_automacoes)} />
        <MField label="Suporte MD.IA" value={pillarLabel(row.nota_suporte)} />
      </MSection>
      {row.pergunta_rotativa && (
        <MSection title="Pergunta do Mês">
          <div className="flex gap-2">
            <span className="text-[#A0A0B0] text-xs w-48 flex-shrink-0">
              {getRotatingQuestion(ROTATING_EQUIPE, row.pergunta_rotativa)}:
            </span>
            <span className="text-white text-xs flex-1 leading-relaxed">
              {row.pergunta_rotativa_resposta || '—'}
            </span>
          </div>
        </MSection>
      )}
    </DetailModal>
  );
}

// ── DueCard ───────────────────────────────────────────────────────────────────

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
          style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.35)' }}
        >
          {items.length} pendente{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-5 pb-5 text-center text-[#3B9EF5] text-sm">
          Todas em dia!
        </div>
      ) : (
        <div className="px-5 pb-5 space-y-2 max-h-64 overflow-y-auto scrollbar-blue">
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
                  style={{ color: item.diasSemEnvio === null ? '#F59E0B' : item.diasSemEnvio === 0 ? '#3B9EF5' : item.diasSemEnvio > 90 ? '#F59E0B' : accentColor }}
                >
                  {diasLabel(item.diasSemEnvio)}
                </p>
              </div>
              <button
                onClick={() => onGerarLink({ quizType, nome: item.nome, clinica: item.clinica })}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-sora font-semibold text-white transition-all"
                style={{ background: 'rgba(59,158,245,0.2)', border: '1px solid rgba(59,158,245,0.4)' }}
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

// ── Recent lists ──────────────────────────────────────────────────────────────

function NpsBar({ value }: { value: number }) {
  const color = npsColor(value);
  return (
    <div className="flex items-center gap-2">
      <div className="font-orbitron font-bold text-sm w-6 text-center" style={{ color }}>
        {value}
      </div>
      <div className="flex-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.05)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${(value / 10) * 100}%`, background: color }} />
      </div>
      <span className="text-[10px] text-[#50507A]">{npsCategory(value)}</span>
    </div>
  );
}

function MedicoRecentList({ items, onSelect }: { items: MedicoResponse[]; onSelect: (r: MedicoResponse) => void }) {
  if (items.length === 0) {
    return <p className="text-[#404060] text-sm text-center py-4">Nenhuma resposta de médicos ainda.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((r, i) => (
        <div
          key={i}
          onClick={() => onSelect(r)}
          className="py-3 px-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] space-y-2 cursor-pointer hover:bg-[rgba(59,158,245,0.05)] hover:border-[rgba(59,158,245,0.15)] transition-all"
        >
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

function EquipeRecentList({ items, onSelect }: { items: EquipeResponse[]; onSelect: (r: EquipeResponse) => void }) {
  if (items.length === 0) {
    return <p className="text-[#404060] text-sm text-center py-4">Nenhuma resposta de equipes ainda.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((r, i) => (
        <div
          key={i}
          onClick={() => onSelect(r)}
          className="py-3 px-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] space-y-2 cursor-pointer hover:bg-[rgba(139,92,246,0.05)] hover:border-[rgba(139,92,246,0.15)] transition-all"
        >
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

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function PulsoTab({ onOpenModal }: { onOpenModal: (data?: ModalPrefill) => void }) {
  const [data, setData] = useState<PulsoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRecent, setActiveRecent] = useState<'medico' | 'equipe'>('medico');
  const [selectedMedico, setSelectedMedico] = useState<MedicoResponse | null>(null);
  const [selectedEquipe, setSelectedEquipe] = useState<EquipeResponse | null>(null);

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
              {totalPendentes} clínica{totalPendentes !== 1 ? 's' : ''} aguardando envio de quiz
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
                    {t === 'medico' ? 'Médico' : 'Equipe'}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-gradient-border p-5">
              {activeRecent === 'medico' ? (
                <MedicoRecentList items={data.recentMedico} onSelect={setSelectedMedico} />
              ) : (
                <EquipeRecentList items={data.recentEquipe} onSelect={setSelectedEquipe} />
              )}
            </div>
          </div>
        </>
      )}

      {selectedMedico && <MedicoDetailModal row={selectedMedico} onClose={() => setSelectedMedico(null)} />}
      {selectedEquipe && <EquipeDetailModal row={selectedEquipe} onClose={() => setSelectedEquipe(null)} />}
    </div>
  );
}
