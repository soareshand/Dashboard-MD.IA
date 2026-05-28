'use client';

import { useState } from 'react';
import ProgressBar from '@/components/quiz/ProgressBar';

const TOTAL_STEPS = 4;

const ROTATING_QUESTIONS = [
  'O que mais travou o trabalho de vocês este mês?',
  'Se pudéssemos automatizar uma tarefa do dia a dia, qual seria?',
  'Qual treinamento faria diferença para a equipe hoje?',
  'Como está a comunicação entre vocês e a equipe MD.IA?',
];

const PILLARS = [
  { key: 'notaCrm', label: 'CRM — usabilidade e resultado' },
  { key: 'notaAutomacoes', label: 'Automações e agente de IA' },
  { key: 'notaSuporte', label: 'Suporte da equipe MD.IA' },
];

const SCALE_LABELS = ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];

function npsColor(n: number) {
  return n <= 6 ? '#F59E0B' : n <= 8 ? '#8B5CF6' : '#3B9EF5';
}

function npsLabel(n: number) {
  return n >= 9 ? 'Promotor 🌟' : n >= 7 ? 'Neutro 🙂' : 'Detrator 🚩';
}

function conditionalQuestion(nps: number) {
  if (nps >= 9) return 'O que tem funcionado melhor no dia a dia de vocês?';
  if (nps >= 7) return 'O que poderia ser melhor no nosso suporte ou nas ferramentas?';
  return 'O que está travando o trabalho de vocês? Pode ser direto.';
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

function PillarRating({
  label, value, onChange,
}: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-white font-sora text-sm">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => {
          const isSelected = value === n;
          const color = n <= 2 ? '#F59E0B' : n === 3 ? '#8B5CF6' : '#3B9EF5';
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-200 border ${
                isSelected
                  ? 'text-white border-transparent shadow-[0_0_12px_rgba(74,144,226,0.3)] scale-105'
                  : 'bg-[#12122A] border-[rgba(74,144,226,0.2)] text-[#A0A0B0] hover:border-[#4A90E2] hover:text-white'
              }`}
              style={isSelected ? { background: color } : {}}
            >
              <span className="font-orbitron font-bold text-base leading-none">{n}</span>
              <span className="text-[9px] leading-tight text-center opacity-70">{SCALE_LABELS[n - 1]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function QuizMensalEquipeClient({
  token, nome, clinica,
}: {
  token: string; nome: string; clinica: string;
}) {
  const [step, setStep] = useState(1);
  const [nps, setNps] = useState<number | null>(null);
  const [npsResposta, setNpsResposta] = useState('');
  const [notaCrm, setNotaCrm] = useState<number | null>(null);
  const [notaAutomacoes, setNotaAutomacoes] = useState<number | null>(null);
  const [notaSuporte, setNotaSuporte] = useState<number | null>(null);
  const [perguntaRotativaResposta, setPerguntaRotativaResposta] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const currentMonth = new Date().getMonth() + 1;
  const rotatingIdx = (currentMonth - 1) % 4;
  const rotatingQuestion = ROTATING_QUESTIONS[rotatingIdx];

  const pillarValues: Record<string, number | null> = { notaCrm, notaAutomacoes, notaSuporte };
  const pillarSetters: Record<string, (v: number) => void> = {
    notaCrm: setNotaCrm,
    notaAutomacoes: setNotaAutomacoes,
    notaSuporte: setNotaSuporte,
  };

  function canProceed() {
    if (step === 1) return nps !== null;
    if (step === 2) return npsResposta.trim() !== '';
    if (step === 3) return notaCrm !== null && notaAutomacoes !== null && notaSuporte !== null;
    if (step === 4) return perguntaRotativaResposta.trim() !== '';
    return false;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/submit-quiz-mensal-equipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, nome, clinica, nps, npsResposta,
          notaCrm, notaAutomacoes, notaSuporte,
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
          Suas respostas nos ajudam a melhorar cada vez mais o suporte para a clínica.
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
              Em uma escala de 0 a 10, o quanto você recomenda a MD.IA para outras clínicas?
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

      {/* Step 3 — Pillar ratings */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <p className="text-[#3B9EF5] text-xs font-sora font-semibold uppercase tracking-widest mb-2">
              Pergunta 3 de {TOTAL_STEPS}
            </p>
            <h2 className="font-orbitron text-base font-bold text-white leading-snug">
              Como você avalia cada área este mês?
            </h2>
          </div>
          <div className="space-y-5">
            {PILLARS.map(p => (
              <PillarRating
                key={p.key}
                label={p.label}
                value={pillarValues[p.key]}
                onChange={pillarSetters[p.key]}
              />
            ))}
          </div>
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
