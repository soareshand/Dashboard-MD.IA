'use client';

import { useState } from 'react';

const SCALE_LABELS = ['Muito insatisfeito', 'Insatisfeito', 'Regular', 'Satisfeito', 'Muito satisfeito', 'Excelente'];

function ScaleQuestion({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-white font-sora text-sm leading-relaxed">{label}</p>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 border min-w-[60px] ${
              value === n
                ? 'bg-gradient-to-br from-[#4A90E2] to-[#6EC6FF] border-transparent text-white shadow-[0_0_12px_rgba(74,144,226,0.4)] scale-105'
                : 'bg-[#12122A] border-[rgba(74,144,226,0.2)] text-[#A0A0B0] hover:border-[#4A90E2] hover:text-white'
            }`}
          >
            <span className="font-orbitron font-bold text-lg leading-none">{n}</span>
            <span className="text-[9px] leading-tight text-center opacity-70">{SCALE_LABELS[n]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoiceQuestion({ label, options, value, onChange }: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-white font-sora text-sm leading-relaxed">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-2.5 rounded-xl text-sm font-sora transition-all duration-200 border ${
              value === opt
                ? 'bg-gradient-to-r from-[#4A90E2] to-[#6EC6FF] text-white border-transparent shadow-[0_0_12px_rgba(74,144,226,0.35)]'
                : 'bg-[#12122A] text-[#A0A0B0] border-[rgba(74,144,226,0.2)] hover:border-[#4A90E2] hover:text-white'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  token: string;
  nome: string;
  clinica: string;
  tipoCall: string;
}

export default function QuizCallClient({ token, nome, clinica, tipoCall }: Props) {
  const [step, setStep] = useState(0);
  const [respondente, setRespondente] = useState('');
  const [notaCall, setNotaCall] = useState<number | null>(null);
  const [necessidade, setNecessidade] = useState('');
  const [notaCS, setNotaCS] = useState<number | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const TOTAL = 5;

  const canNext = [
    respondente !== '',
    notaCall !== null,
    necessidade !== '',
    notaCS !== null,
    true, // observações é opcional
  ][step];

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/submit-nps-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, respondente, notaCall, necessidadeResolvida: necessidade, notaCS, observacoes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar.');
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="text-5xl">🎉</div>
        <h2 className="font-orbitron text-xl font-bold text-white">Obrigado!</h2>
        <p className="text-[#A0A0B0] text-sm">Sua avaliação foi registrada com sucesso.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#A0A0B0]">{nome} · {clinica}</p>
          {tipoCall && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-[rgba(74,144,226,0.15)] text-[#6EC6FF] border border-[rgba(74,144,226,0.2)]">
              {tipoCall}
            </span>
          )}
        </div>
        <span className="text-xs text-[#A0A0B0] font-mono">{step + 1}/{TOTAL}</span>
      </div>

      {/* Progress */}
      <div className="w-full h-1 bg-[#1A1A2E] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((step + 1) / TOTAL) * 100}%`, background: 'linear-gradient(90deg, #4A90E2, #6EC6FF)' }}
        />
      </div>

      {/* Steps */}
      {step === 0 && (
        <ChoiceQuestion
          label="Quem está respondendo esta avaliação?"
          options={['Médico(a)', 'Equipe da clínica']}
          value={respondente}
          onChange={setRespondente}
        />
      )}

      {step === 1 && (
        <ScaleQuestion
          label="Como você avalia a call de hoje?"
          value={notaCall}
          onChange={setNotaCall}
        />
      )}

      {step === 2 && (
        <ChoiceQuestion
          label="Sua dúvida ou necessidade foi resolvida?"
          options={['✅ Sim', '⚠️ Parcialmente', '❌ Não']}
          value={necessidade}
          onChange={setNecessidade}
        />
      )}

      {step === 3 && (
        <ScaleQuestion
          label="Como você avalia o atendimento do CS? (clareza, atenção e tempo de resposta)"
          value={notaCS}
          onChange={setNotaCS}
        />
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-white font-sora text-sm">Alguma observação? <span className="text-[#A0A0B0]">(opcional)</span></p>
          <textarea
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            placeholder="Escreva aqui seu feedback…"
            rows={4}
            className="w-full bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-3 text-white placeholder-[#555570] focus:outline-none focus:border-[#4A90E2] transition-all font-sora text-sm resize-none"
          />
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            className="px-4 py-2.5 rounded-xl border border-[rgba(74,144,226,0.2)] text-[#A0A0B0] hover:text-white text-sm transition-all"
          >
            ← Voltar
          </button>
        )}
        {step < TOTAL - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext}
            className="flex-1 py-2.5 rounded-xl btn-glow text-white font-sora font-semibold text-sm disabled:opacity-40"
          >
            Continuar →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl btn-glow text-white font-sora font-semibold text-sm disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Enviar avaliação ✓'}
          </button>
        )}
      </div>
    </div>
  );
}
