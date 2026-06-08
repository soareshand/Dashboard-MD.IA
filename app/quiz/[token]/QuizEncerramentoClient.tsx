'use client';

import { useState } from 'react';

const SERVICOS = ['Mentoria', 'CRM com IA (Infinite Gear)'];

const MOTIVOS = [
  'Financeiro',
  'Falta de tempo para aplicar',
  'Resultados abaixo do esperado',
  'Produto não se adequou à minha realidade',
  'Mudança de prioridade na clínica',
  'Outro',
];

function ChoiceQuestion({ label, options, value, onChange }: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-white font-sora text-sm leading-relaxed">{label}</p>
      <div className="flex flex-col gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-3 rounded-xl text-sm font-sora transition-all duration-200 border text-left ${
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

function MultiChoiceQuestion({ label, options, values, outroText, onChange, onOutroChange }: {
  label: string;
  options: string[];
  values: string[];
  outroText: string;
  onChange: (v: string[]) => void;
  onOutroChange: (v: string) => void;
}) {
  function toggle(opt: string) {
    if (values.includes(opt)) {
      onChange(values.filter(v => v !== opt));
    } else {
      onChange([...values, opt]);
    }
  }
  const outroSelected = values.includes('Outro');
  return (
    <div className="space-y-4">
      <p className="text-white font-sora text-sm leading-relaxed">{label}</p>
      <div className="flex flex-col gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-4 py-3 rounded-xl text-sm font-sora transition-all duration-200 border text-left ${
              values.includes(opt)
                ? 'bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white border-transparent shadow-[0_0_12px_rgba(109,40,217,0.35)]'
                : 'bg-[#12122A] text-[#A0A0B0] border-[rgba(139,92,246,0.2)] hover:border-[#8B5CF6] hover:text-white'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {outroSelected && (
        <textarea
          value={outroText}
          onChange={e => onOutroChange(e.target.value)}
          placeholder="Descreva o motivo…"
          rows={3}
          className="w-full bg-[#12122A] border border-[rgba(139,92,246,0.35)] rounded-xl px-4 py-3 text-white placeholder-[#555570] focus:outline-none focus:border-[#8B5CF6] transition-all font-sora text-sm resize-none"
        />
      )}
      <p className="text-[10px] text-[#a2a2b2]">Pode selecionar mais de um</p>
    </div>
  );
}

function NpsQuestion({ label, value, onChange }: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-white font-sora text-sm leading-relaxed">{label}</p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`flex items-center justify-center rounded-xl transition-all duration-200 border font-orbitron font-bold text-sm h-11 ${
              value === i
                ? 'bg-gradient-to-br from-[#4A90E2] to-[#6EC6FF] border-transparent text-white shadow-[0_0_12px_rgba(74,144,226,0.4)] scale-105'
                : 'bg-[#12122A] border-[rgba(74,144,226,0.2)] text-[#A0A0B0] hover:border-[#4A90E2] hover:text-white'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-[#a2a2b2] px-0.5">
        <span>Não recomendaria</span>
        <span>Recomendaria com certeza</span>
      </div>
    </div>
  );
}

interface Props {
  token: string;
  nome: string;
  clinica: string;
}

export default function QuizEncerramentoClient({ token, nome, clinica }: Props) {
  const [step, setStep] = useState(0);
  const [servico, setServico] = useState('');
  const [motivos, setMotivos] = useState<string[]>([]);
  const [outroMotivo, setOutroMotivo] = useState('');
  const [nps, setNps] = useState<number | null>(null);
  const [oque, setOque] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const TOTAL = 5;

  const motivoValido = motivos.length > 0 && (!motivos.includes('Outro') || outroMotivo.trim() !== '');

  const canNext = [
    servico !== '',
    motivoValido,
    nps !== null,
    true,
    true,
  ][step];

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const motivoFinal = motivos
        .map(m => (m === 'Outro' && outroMotivo.trim() ? `Outro: ${outroMotivo.trim()}` : m))
        .join(', ');
      const res = await fetch('/api/submit-encerramento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, servico, motivo: motivoFinal, nps, oque, mensagem }),
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
      <div className="text-center space-y-4 py-8">
        <div className="text-5xl">🙏</div>
        <h2 className="font-orbitron text-xl font-bold text-white">Obrigado!</h2>
        <p className="text-[#A0A0B0] text-sm leading-relaxed">
          Seu feedback é muito valioso para nós.<br />
          Esperamos te encontrar novamente em breve.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#A0A0B0]">{nome}{clinica ? ` · ${clinica}` : ''}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-[rgba(139,92,246,0.15)] text-[#A78BFA] border border-[rgba(139,92,246,0.2)]">
            Encerramento
          </span>
        </div>
        <span className="text-xs text-[#A0A0B0] font-mono">{step + 1}/{TOTAL}</span>
      </div>

      <div className="w-full h-1 bg-[#1A1A2E] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((step + 1) / TOTAL) * 100}%`, background: 'linear-gradient(90deg, #6D28D9, #A78BFA)' }}
        />
      </div>

      {step === 0 && (
        <ChoiceQuestion
          label="Qual serviço você utilizou na MD.IA?"
          options={SERVICOS}
          value={servico}
          onChange={setServico}
        />
      )}

      {step === 1 && (
        <MultiChoiceQuestion
          label="Qual foi o principal motivo do encerramento?"
          options={MOTIVOS}
          values={motivos}
          outroText={outroMotivo}
          onChange={setMotivos}
          onOutroChange={setOutroMotivo}
        />
      )}

      {step === 2 && (
        <NpsQuestion
          label="Mesmo encerrando, o quanto você recomendaria a MD.IA para outro médico?"
          value={nps}
          onChange={setNps}
        />
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-white font-sora text-sm">
            O que poderia ter sido diferente?{' '}
            <span className="text-[#A0A0B0]">(opcional)</span>
          </p>
          <textarea
            value={oque}
            onChange={e => setOque(e.target.value)}
            placeholder="Conte-nos o que poderia ter mudado sua experiência…"
            rows={4}
            className="w-full bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-3 text-white placeholder-[#555570] focus:outline-none focus:border-[#4A90E2] transition-all font-sora text-sm resize-none"
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-white font-sora text-sm">
            Deixe uma mensagem final{' '}
            <span className="text-[#A0A0B0]">(opcional)</span>
          </p>
          <textarea
            value={mensagem}
            onChange={e => setMensagem(e.target.value)}
            placeholder="Qualquer palavra de despedida, sugestão ou reconhecimento é bem-vinda…"
            rows={4}
            className="w-full bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-3 text-white placeholder-[#555570] focus:outline-none focus:border-[#4A90E2] transition-all font-sora text-sm resize-none"
          />
        </div>
      )}

      {error && <p className="text-[#F59E0B] text-xs">{error}</p>}

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
