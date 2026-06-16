'use client';

import { useEffect, useState } from 'react';

interface Props {
  medicos: string[];
  grid: Record<string, Record<string, string>>;
  onClose: () => void;
  onSuccess: () => void;
}

function toInputValue(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('/');
  if (!d || !m || !y) return '';
  return `${y}-${m}-${d}`;
}

function fromInputValue(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-');
  if (!d || !m || !y) return '';
  return `${d}/${m}/${y}`;
}

function getSessaoLabel(ddmmyyyy: string): { label: string; valid: boolean } {
  if (!ddmmyyyy) return { label: '', valid: false };
  const [d, m, y] = ddmmyyyy.split('/').map(Number);
  if (!d || !m || !y) return { label: '', valid: false };
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  if (day === 1) return { label: 'Segunda-feira — Mentoria 21h', valid: true };
  if (day === 2) return { label: 'Terça-feira — Mentoria 8h', valid: true };
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return { label: `${dias[day]} — não é dia de mentoria`, valid: false };
}

function getTodayInputValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function RegistrarPresencaModal({ medicos, grid, onClose, onSuccess }: Props) {
  const [dateInput, setDateInput] = useState(getTodayInputValue());
  const [presencas, setPresencas] = useState<Record<string, 'Presente' | 'Faltou'>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [search, setSearch] = useState('');

  const sessaoFormatada = fromInputValue(dateInput);
  const { label: sessaoLabel, valid: diaValido } = getSessaoLabel(sessaoFormatada);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Pre-fill from existing grid data whenever date changes
  useEffect(() => {
    const existing: Record<string, 'Presente' | 'Faltou'> = {};
    medicos.forEach(m => {
      existing[m] = (grid[m]?.[sessaoFormatada] as 'Presente' | 'Faltou') ?? 'Faltou';
    });
    setPresencas(existing);
  }, [medicos, sessaoFormatada, grid]);

  function toggle(medico: string) {
    setPresencas(prev => ({ ...prev, [medico]: prev[medico] === 'Presente' ? 'Faltou' : 'Presente' }));
  }

  function marcarTodos(status: 'Presente' | 'Faltou') {
    const next: Record<string, 'Presente' | 'Faltou'> = {};
    medicos.forEach(m => { next[m] = status; });
    setPresencas(next);
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/registrar-presenca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: sessaoFormatada, presencas }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erro ao registrar.');
      if (json.debug) {
        setDebugInfo(`Enviados: ${json.debug.rowsSent} | No banco: ${json.debug.rowsInDB}`);
        await new Promise(r => setTimeout(r, 3000));
      }
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }

  const filteredMedicos = medicos.filter(m =>
    m.toLowerCase().includes(search.toLowerCase())
  );
  const presentesCount = Object.values(presencas).filter(v => v === 'Presente').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-gradient-border w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <div>
            <h3 className="font-orbitron text-base font-bold text-white">Registrar Presença</h3>
            <p className="text-xs text-[#A0A0B0] mt-0.5">
              {presentesCount} de {medicos.length} presentes
            </p>
          </div>
          <button onClick={onClose} className="text-[#A0A0B0] hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Date picker */}
        <div className="px-6 pb-4 shrink-0">
          <label className="text-xs text-[#A0A0B0] mb-1.5 block">Data da sessão</label>
          <input
            type="date"
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            className="w-full bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4A90E2] transition-all [color-scheme:dark]"
          />
          {sessaoLabel && (
            <p className={`text-xs mt-1.5 pl-1 ${diaValido ? 'text-[#4A90E2]' : 'text-yellow-500'}`}>
              {diaValido ? '📅' : '⚠️'} {sessaoLabel}
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="px-6 pb-3 shrink-0 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => marcarTodos('Presente')}
            className="px-3 py-1.5 rounded-lg text-xs font-sora bg-[rgba(59,158,245,0.08)] text-[#3B9EF5] border border-[rgba(59,158,245,0.2)] hover:bg-[rgba(59,158,245,0.15)] transition-all"
          >
            ✓ Todos Presentes
          </button>
          <button
            onClick={() => marcarTodos('Faltou')}
            className="px-3 py-1.5 rounded-lg text-xs font-sora bg-[rgba(245,158,11,0.08)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.15)] transition-all"
          >
            ✕ Todos Faltaram
          </button>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="ml-auto w-32 bg-[#12122A] border border-[rgba(74,144,226,0.2)] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#4A90E2] transition-all"
          />
        </div>

        {/* Doctor list */}
        <div className="overflow-y-auto flex-1 px-6 space-y-1.5 pb-2">
          {filteredMedicos.map(medico => {
            const presente = presencas[medico] === 'Presente';
            return (
              <button
                key={medico}
                type="button"
                onClick={() => toggle(medico)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-sora transition-all border ${
                  presente
                    ? 'bg-[rgba(59,158,245,0.08)] border-[rgba(59,158,245,0.2)] text-[#3B9EF5]'
                    : 'bg-[#12122A] border-[rgba(74,144,226,0.1)] text-[#A0A0B0] hover:border-[rgba(74,144,226,0.3)]'
                }`}
              >
                <span className="text-left">{medico}</span>
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                  presente ? 'bg-[rgba(59,158,245,0.12)] text-[#3B9EF5]' : 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B]'
                }`}>
                  {presente ? 'Presente' : 'Faltou'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 shrink-0 space-y-3 border-t border-[rgba(74,144,226,0.1)]">
          {error && <p className="text-[#F59E0B] text-xs">{error}</p>}
          {debugInfo && <p className="text-[#3B9EF5] text-xs font-mono">{debugInfo}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading || !sessaoFormatada}
            className="w-full py-3 rounded-xl btn-glow text-white font-sora font-semibold text-sm disabled:opacity-60"
          >
            {loading ? 'Salvando…' : `Salvar — ${sessaoFormatada || 'selecione uma data'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
