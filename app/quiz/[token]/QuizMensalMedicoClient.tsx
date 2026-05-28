'use client';

import { useState } from 'react';
import ProgressBar from '@/components/quiz/ProgressBar';

const TOTAL_STEPS = 4;

const RESULTADO_OPTIONS = [
  { emoji: '📈', label: 'Faturamento' },
  { emoji: '📅', label: 'Agenda mais cheia' },
  { emoji: '🚫', label: 'Menos no-show' },
  { emoji: '👥', label: 'Equipe mais organizada' },
  { emoji: '⏱', label: 'Menos tempo operacional' },
  { emoji: '😐', label: 'Não percebi evolução ainda' },
];

const ROTATING_QUESTIONS = [
  'Qual problema da sua clínica ainda tira seu sono?',
  'Se pudéssemos criar uma nova automação pra você, qual seria?',
  'Qual conteúdo ou treinamento faria diferença para o time da sua clínica?',
  'O que seu time de recepção mais precisa de apoio hoje?',
];

function npsColor(n: number) {
  return n <= 6 ? '#F59E0B' : n <= 8 ? '#8B5CF6' : '#3B9EF5';
}

function npsLabel(n: number) {
  return n >= 9 ? 'Promotor 🌟' : n >= 7 ? 'Neutro 🙂' : 'Detrator 🚩';
}

function conditionalQuestion(nps: number) {
  if (nps >= 9) return 'O que mais gerou resultado para você e sua clínica este mês?';
  if (nps >= 7) return 'O que precisaria melhorar para você nos dar um 10?';
  return 'O que está te frustrando hoje? Queremos entender.';
}

function NpsGrid({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 11 }, (_, i) => {
          const isSelected = value === i;
          const color = npsColor(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={`h-11 rounded-xl font-orbitron font-bold text-base transition-all duration-200 border ${
                isSelected
                  ? 'text-white scale-110 shadow-[0_0_16px_rgba(74,144,226,0.3)]'
                  : 'bg-[#12122A] text-[#A0A0B0] hover:text-white'
              }`}
              style={
                isSelected
                  ? { background: color, borderColor: 'transparent' }
                  : { borderColor: 'rgba(74,144,226,0.2)' }
              }
            >
              {i}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-[#50507A]">
        <span>0 — Jamais indicaria</span>
        <span>10 — Indicaria com certeza</span>
      </div>
      {value !== null && (
        <p className="text-center text-sm font-sora font-medium" style={{ color: npsColor(value) }}>
          {npsLabel(value)}
        </p>
      )}
    </div>
  );
}

export default function QuizMensalMedicoClient({
  token, nome, clinica,
}: {
  token: string; nome: string; clinica: string;
}) {
  const [step, setStep] = useState(1);
  const [nps, setNps] = useState<number | null>(null);
  const [npsResposta, setNpsResposta] = useState('');
  const [resultadoSelecionado, setResultadoSelecionado] = useState<string[]>([]);
  const [resultadoOutro, setResultadoOutro] = useState('');
  const [perguntaRotativaResposta, setPerguntaRotativaResposta] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const currentMonth = new Date().getMonth() + 1;
  const rotatingIdx = (currentMonth - 1) % 4;
  const rotatingQuestion = ROTATING_QUESTIONS[rotatingIdx];
  const temOutro = resultadoSelecionado.includes('Outro');

  function toggleResultado(val: string) {
    const EXCLUSIVE = '😐 Não percebi evolução ainda';
    if (val === EXCLUSIVE) {
      setResultadoSelecionado(prev => prev.includes(EXCLUSIVE) ? [] : [EXCLUSIVE]);
      return;
    }
    setResultadoSelecionado(prev => {
      const without = prev.filter(v => v !== EXCLUSIVE && v !== val);
      return prev.includes(val) ? without : [...without, val];
    });
  }

  function canProceed() {
    if (step === 1) return nps !== null;
    if (step === 2) return npsResposta.trim() !== '';
    if (step === 3) {
      if (resultadoSelecionado.length === 0) return false;
      if (temOutro && resultadoOutro.trim() === '') return false;
      return true;
    }
    if (step === 4) return perguntaRotativaResposta.trim() !== '';
    return false;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/submit-quiz-mensal-medico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, nome, clinica, nps, npsResposta,
          resultadoPercebido: resultadoSelecionado.join(', '),
          resultadoPercebidoOutro: temOutro ? resultadoOutro : '',
          perguntaRotativa: currentMonth,
          perguntaRotativaResposta,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar.');
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-5xl">🙏</div>
        <h2 className="font-orbitron text-xl font-bold text-white">Obrigado pelo feedback!</h2>
        <p className="text-[#A0A0B0] text-sm leading-relaxed">
          Suas respostas nos ajudam a evoluir o suporte para a sua clínica.
        </p>
        <div className="ecg-line mt-6 ecg-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar current={step} total={TOTAL_STEPS} />

      {/* Step 1 — NPS */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <p className="text-[#3B9EF5] text-xs font-sora font-semibold uppercase tracking-widest mb-2">
              Pergunta 1 de {TOTAL_STEPS}
            </p>
            <h2 className="font-orbitron text-base font-bold text-white leading-snug">
              Em uma escala de 0 a 10, o quanto você recomendaria a MD.IA para outro médico com clínica?
            </h2>
          </div>
          <NpsGrid value={nps} onChange={setNps} />
        </div>
      )}

      {/* Step 2 — Conditional open question */}
      {step === 2 && nps !== null && (
        <div className="space-y-5">
          <div>
            <p className="text-[#3B9EF5] text-xs font-sora font-semibold uppercase tracking-widest mb-2">
              Pergunta 2 de {TOTAL_STEPS}
            </p>
            <h2 className="font-orbitron text-base font-bold text-white leading-snug">
              {conditionalQuestion(nps)}
            </h2>
          </div>
          <textarea
            value={npsResposta}
            onChange={e => setNpsResposta(e.target.value)}
            placeholder="Escreva aqui…"
            rows={4}
            className="w-full bg-[#12122A] border border-[rgba(59,158,245,0.25)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3B9EF5] transition-all resize-none placeholder-[#303050]"
          />
        </div>
      )}

      {/* Step 3 — Resultado percebido */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <p className="text-[#3B9EF5] text-xs font-sora font-semibold uppercase tracking-widest mb-2">
              Pergunta 3 de {TOTAL_STEPS}
            </p>
            <h2 className="font-orbitron text-base font-bold text-white leading-snug">
              Onde você sentiu evolução na clínica este mês?
            </h2>
            <p className="text-[#6060A0] text-xs mt-1.5">Pode marcar mais de uma opção.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {RESULTADO_OPTIONS.map(opt => {
              const val = `${opt.emoji} ${opt.label}`;
              const isSelected = resultadoSelecionado.includes(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => toggleResultado(val)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-sora transition-all duration-200 border ${
                    isSelected
                      ? 'text-white border-transparent shadow-[0_0_12px_rgba(59,158,245,0.25)]'
                      : 'bg-[#12122A] text-[#A0A0B0] border-[rgba(74,144,226,0.2)] hover:border-[#4A90E2] hover:text-white'
                  }`}
                  style={isSelected ? { background: 'linear-gradient(135deg, #2563EB, #3B9EF5)' } : {}}
                >
                  {val}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => toggleResultado('Outro')}
              className={`px-4 py-2.5 rounded-xl text-sm font-sora transition-all duration-200 border ${
                temOutro
                  ? 'text-white border-transparent shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                  : 'bg-[#12122A] text-[#A0A0B0] border-[rgba(139,92,246,0.2)] hover:border-[#8B5CF6] hover:text-white'
              }`}
              style={temOutro ? { background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)' } : {}}
            >
              ✏️ Outro
            </button>
          </div>
          {temOutro && (
            <div className="space-y-1.5">
              <label className="text-xs font-sora font-medium" style={{ color: '#8B5CF6' }}>
                Qual outro resultado? <span className="text-[#F59E0B]">*</span>
              </label>
              <textarea
                value={resultadoOutro}
                onChange={e => setResultadoOutro(e.target.value)}
                placeholder="Descreva o resultado percebido…"
                rows={3}
                className="w-full bg-[#12122A] border border-[rgba(139,92,246,0.35)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#8B5CF6] transition-all resize-none placeholder-[#303050]"
              />
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Rotating question */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <p className="text-[#3B9EF5] text-xs font-sora font-semibold uppercase tracking-widest mb-2">
              Pergunta 4 de {TOTAL_STEPS}
            </p>
            <h2 className="font-orbitron text-base font-bold text-white leading-snug">
              {rotatingQuestion}
            </h2>
          </div>
          <textarea
            value={perguntaRotativaResposta}
            onChange={e => setPerguntaRotativaResposta(e.target.value)}
            placeholder="Escreva aqui…"
            rows={4}
            className="w-full bg-[#12122A] border border-[rgba(59,158,245,0.25)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3B9EF5] transition-all resize-none placeholder-[#303050]"
          />
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-3 pt-1">
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-5 py-3 rounded-xl border border-[rgba(74,144,226,0.25)] text-[#A0A0B0] hover:text-white hover:border-[#4A90E2] text-sm font-sora transition-all"
          >
            ← Voltar
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="flex-1 py-3 rounded-xl btn-glow text-white font-sora font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Próximo →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
            className="flex-1 py-3 rounded-xl btn-glow text-white font-sora font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando…' : 'Enviar Avaliação'}
          </button>
        )}
      </div>
    </div>
  );
}
