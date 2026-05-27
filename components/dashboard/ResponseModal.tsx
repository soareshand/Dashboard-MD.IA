'use client';

import { useEffect } from 'react';
import { TOOL_ITEMS } from '@/lib/quiz-config';

interface ResponseModalProps {
  row: {
    nome: string;
    clinica: string;
    timestamp: string;
    _full: Record<string, unknown>;
  };
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="font-orbitron text-xs text-[#6EC6FF] uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: unknown }) {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  return (
    <div className="flex gap-2">
      <span className="text-[#A0A0B0] text-xs w-48 flex-shrink-0">{label}:</span>
      <span className="text-white text-xs flex-1">{display}</span>
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ResponseModal({ row, onClose }: ResponseModalProps) {
  const f = row._full;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-gradient-border w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 animate-fade-up">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-orbitron text-lg font-bold text-white">{row.nome}</h3>
            <p className="text-[#A0A0B0] text-sm">{row.clinica} · {formatDate(row.timestamp)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#A0A0B0] hover:text-white text-xl transition-colors ml-4 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <Section title="Identificação">
          <Field label="Nome" value={f.nome} />
          <Field label="Clínica" value={f.clinica} />
        </Section>

        <Section title="Objetivos e Metas">
          <Field label="Objetivo principal" value={f.objetivo} />
          <Field label="Objetivo alcançado" value={f.objetivoAlcancado} />
          <Field label="Maior desafio" value={f.maiorDesafio} />
        </Section>

        <Section title="Resultados Percebidos">
          <Field label="Crescimento de pacientes" value={f.crescimentoPacientes} />
          <Field label="Redução tempo operacional" value={f.reducaoTempoOperacional} />
          <Field label="Investimento x Retorno" value={f.investimentoRetorno} />
        </Section>

        <Section title="Avaliação de Ferramentas (0–5)">
          {TOOL_ITEMS.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-[#A0A0B0] text-xs w-48 flex-shrink-0">{item.label}:</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0,1,2,3,4,5].map(n => {
                    const val = Number(f[item.id]);
                    return (
                      <div
                        key={n}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                          n === val
                            ? 'bg-gradient-to-br from-[#4A90E2] to-[#6EC6FF] text-white'
                            : 'bg-[#12122A] text-[#555] border border-[rgba(74,144,226,0.1)]'
                        }`}
                      >
                        {n}
                      </div>
                    );
                  })}
                </div>
                <span className="text-[#6EC6FF] text-xs font-mono font-bold">{String(f[item.id] ?? '-')}/5</span>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Renovação e Indicação">
          <Field label="Pretende renovar" value={f.pretendeRenovar} />
          <Field label="Motivo não renovar" value={f.motivoNaoRenovar} />
          <Field label="Indicaria MD.IA" value={f.indicaria} />
          <Field label="Indicação / contato" value={f.indicacaoContato} />
        </Section>

        {String(f.observacoes).trim() && (
          <Section title="Observações">
            <p className="text-white text-sm leading-relaxed bg-[#12122A] rounded-xl p-4 border border-[rgba(74,144,226,0.15)]">
              {String(f.observacoes)}
            </p>
          </Section>
        )}
      </div>
    </div>
  );
}
