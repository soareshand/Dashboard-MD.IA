'use client';

import { useState } from 'react';
import ProgressBar from '@/components/quiz/ProgressBar';
import ChoiceButtons from '@/components/quiz/ChoiceButtons';
import ScaleInput from '@/components/quiz/ScaleInput';
import OptionSelector from '@/components/quiz/OptionSelector';
import { TOOL_ITEMS } from '@/lib/quiz-config';

const OBJETIVOS_OPTIONS = [
  'Captação de novos pacientes',
  'Retenção de pacientes',
  'Organizar agenda e horários',
  'Melhorar comunicação com pacientes',
  'Implementar tecnologia na clínica',
  'Estabilizar o faturamento',
  'Me destacar da concorrência',
  'Reduzir tempo operacional',
];

const DESAFIOS_OPTIONS = [
  'Captação de pacientes',
  'Retenção de pacientes',
  'Gestão de agenda e horários',
  'Falta de tempo para gestão',
  'Concorrência no mercado',
  'Comunicação com pacientes',
  'Equipe e funcionários',
  'Faturamento irregular',
  'Uso da tecnologia',
  'Cidade pequena / mercado restrito',
];

const TOTAL_STEPS = 7;

interface InitialData {
  nome: string;
  clinica: string;
  email: string;
}

interface FormData {
  nome: string;
  clinica: string;
  email: string;
  objetivo: string;
  objetivoAlcancado: string;
  maiorDesafio: string;
  crescimentoPacientes: string;
  reducaoTempoOperacional: string;
  investimentoRetorno: string;
  notaMentoriasGrupo: number | null;
  notaAcademy: number | null;
  notaAgenteIA: number | null;
  notaGerenteIA: number | null;
  notaAutomacoes: number | null;
  notaDashboard: number | null;
  notaCRM: number | null;
  notaTreinamentosCRM: number | null;
  notaSuporteEquipe: number | null;
  notaMentoriaGestao: number | null;
  pretendeRenovar: string;
  motivoNaoRenovar: string;
  indicaria: string;
  indicacaoContato: string;
  observacoes: string;
}

export default function QuizClient({ token, initial }: { token: string; initial: InitialData }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    nome: initial.nome,
    clinica: initial.clinica,
    email: initial.email,
    objetivo: '',
    objetivoAlcancado: '',
    maiorDesafio: '',
    crescimentoPacientes: '',
    reducaoTempoOperacional: '',
    investimentoRetorno: '',
    notaMentoriasGrupo: null,
    notaAcademy: null,
    notaAgenteIA: null,
    notaGerenteIA: null,
    notaAutomacoes: null,
    notaDashboard: null,
    notaCRM: null,
    notaTreinamentosCRM: null,
    notaSuporteEquipe: null,
    notaMentoriaGestao: null,
    pretendeRenovar: '',
    motivoNaoRenovar: '',
    indicaria: '',
    indicacaoContato: '',
    observacoes: '',
  });

  function update(field: keyof FormData, value: string | number | null) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function canAdvance(): boolean {
    if (step === 1) return !!(form.nome.trim() && form.clinica.trim());
    if (step === 2) return !!(form.objetivo.trim() && form.objetivoAlcancado && form.maiorDesafio.trim());
    if (step === 3) return !!(form.crescimentoPacientes && form.reducaoTempoOperacional && form.investimentoRetorno);
    if (step === 4) return TOOL_ITEMS.every(t => form[t.id as keyof FormData] !== null);
    if (step === 5) {
      if (!form.pretendeRenovar) return false;
      if (form.pretendeRenovar.includes('Não') && !form.motivoNaoRenovar.trim()) return false;
      if (!form.indicaria) return false;
      return true;
    }
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar.');
      setSubmitted(true);
      setStep(TOTAL_STEPS);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted || step === TOTAL_STEPS) {
    return <SuccessScreen nome={form.nome} />;
  }

  return (
    <div className="animate-fade-up">
      <ProgressBar current={step} total={TOTAL_STEPS - 1} />

      <div key={step} className="animate-fade-up">
        {step === 1 && <Step1 form={form} update={update} />}
        {step === 2 && <Step2 form={form} update={update} />}
        {step === 3 && <Step3 form={form} update={update} />}
        {step === 4 && <Step4 form={form} update={update} />}
        {step === 5 && <Step5 form={form} update={update} />}
        {step === 6 && <Step6 form={form} update={update} />}
      </div>

      {error && <p className="text-[#F59E0B] text-sm mt-4 text-center">{error}</p>}

      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 rounded-xl border border-[rgba(74,144,226,0.3)] text-[#A0A0B0] hover:text-white hover:border-[#4A90E2] transition-all font-sora"
          >
            Voltar
          </button>
        )}
        {step < 6 ? (
          <button
            type="button"
            disabled={!canAdvance()}
            onClick={() => setStep(s => s + 1)}
            className="flex-1 py-3 rounded-xl btn-glow text-white font-sora font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Próximo
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl btn-glow text-white font-sora font-semibold disabled:opacity-60"
          >
            {submitting ? 'Enviando…' : 'Enviar Avaliação'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Steps ────────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#A0A0B0] mb-1.5">{children}</p>;
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-3 text-white placeholder-[#555570] focus:outline-none focus:border-[#4A90E2] focus:shadow-[0_0_8px_rgba(74,144,226,0.2)] transition-all font-sora text-sm"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-3 text-white placeholder-[#555570] focus:outline-none focus:border-[#4A90E2] focus:shadow-[0_0_8px_rgba(74,144,226,0.2)] transition-all font-sora text-sm resize-none"
    />
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-orbitron text-lg font-bold text-white mb-6">{children}</h2>;
}

function QuestionBlock({ children }: { children: React.ReactNode }) {
  return <div className="mb-6">{children}</div>;
}

// Step 1 — Identificação
function Step1({ form, update }: { form: FormData; update: (f: keyof FormData, v: string | number | null) => void }) {
  return (
    <>
      <StepTitle>Identificação</StepTitle>
      <QuestionBlock>
        <Label>Nome completo *</Label>
        <TextInput value={form.nome} onChange={v => update('nome', v)} placeholder="Dr(a). Nome Sobrenome" />
      </QuestionBlock>
      <QuestionBlock>
        <Label>Clínica / Consultório *</Label>
        <TextInput value={form.clinica} onChange={v => update('clinica', v)} placeholder="Nome da clínica" />
      </QuestionBlock>
    </>
  );
}

// Step 2 — Objetivos e Metas
function Step2({ form, update }: { form: FormData; update: (f: keyof FormData, v: string | number | null) => void }) {
  return (
    <>
      <StepTitle>Objetivos e Metas</StepTitle>
      <QuestionBlock>
        <Label>Qual foi o seu principal objetivo ao entrar na MD.IA? <span className="text-[#555570] text-xs">(pode selecionar mais de um)</span></Label>
        <OptionSelector
          options={OBJETIVOS_OPTIONS}
          value={form.objetivo}
          onChange={v => update('objetivo', v)}
          placeholder="Descreva seu objetivo..."
          multi
        />
      </QuestionBlock>
      <QuestionBlock>
        <Label>Esse objetivo foi alcançado?</Label>
        <ChoiceButtons
          options={['Sim', 'Parcialmente', 'Não']}
          value={form.objetivoAlcancado}
          onChange={v => update('objetivoAlcancado', v)}
        />
      </QuestionBlock>
      <QuestionBlock>
        <Label>Qual é o seu maior desafio hoje na clínica? <span className="text-[#555570] text-xs">(pode selecionar mais de um)</span></Label>
        <OptionSelector
          options={DESAFIOS_OPTIONS}
          value={form.maiorDesafio}
          onChange={v => update('maiorDesafio', v)}
          placeholder="Descreva seu desafio..."
          multi
        />
      </QuestionBlock>
    </>
  );
}

// Step 3 — Resultados Percebidos
function Step3({ form, update }: { form: FormData; update: (f: keyof FormData, v: string | number | null) => void }) {
  return (
    <>
      <StepTitle>Resultados Percebidos</StepTitle>
      <QuestionBlock>
        <Label>Houve crescimento no número de pacientes?</Label>
        <ChoiceButtons
          options={['Sim', 'Não', 'Ainda não percebi']}
          value={form.crescimentoPacientes}
          onChange={v => update('crescimentoPacientes', v)}
        />
      </QuestionBlock>
      <QuestionBlock>
        <Label>Houve redução no tempo operacional da clínica?</Label>
        <ChoiceButtons
          options={['Sim', 'Não', 'Ainda não percebi']}
          value={form.reducaoTempoOperacional}
          onChange={v => update('reducaoTempoOperacional', v)}
        />
      </QuestionBlock>
      <QuestionBlock>
        <Label>Como você avalia a relação Investimento x Retorno?</Label>
        <ChoiceButtons
          options={['Positivo', 'Neutro', 'Negativo']}
          value={form.investimentoRetorno}
          onChange={v => update('investimentoRetorno', v)}
        />
      </QuestionBlock>
    </>
  );
}

// Step 4 — Avaliação das Ferramentas
function Step4({ form, update }: { form: FormData; update: (f: keyof FormData, v: string | number | null) => void }) {
  return (
    <>
      <StepTitle>Experiência com a Mentoria e Ferramentas</StepTitle>
      <p className="text-xs text-[#A0A0B0] mb-6">Avalie cada item de 0 (Muito Insatisfeito) a 5 (Muito Satisfeito)</p>
      <div>
        {TOOL_ITEMS.map(item => (
          <ScaleInput
            key={item.id}
            item={item}
            value={form[item.id as keyof FormData] as number | null}
            onChange={v => update(item.id as keyof FormData, v)}
          />
        ))}
      </div>
    </>
  );
}

// Step 5 — Intenção de Renovação
function Step5({ form, update }: { form: FormData; update: (f: keyof FormData, v: string | number | null) => void }) {
  return (
    <>
      <StepTitle>Intenção de Renovação</StepTitle>
      <QuestionBlock>
        <Label>Pretende renovar a mentoria?</Label>
        <ChoiceButtons
          options={['✅ Sim', '❌ Não']}
          value={form.pretendeRenovar}
          onChange={v => update('pretendeRenovar', v)}
          size="lg"
        />
        {form.pretendeRenovar === '❌ Não' && (
          <div className="mt-4 animate-fade-in">
            <Label>Qual o principal motivo? *</Label>
            <Textarea
              value={form.motivoNaoRenovar}
              onChange={v => update('motivoNaoRenovar', v)}
              placeholder="Conte-nos o motivo..."
            />
          </div>
        )}
      </QuestionBlock>
      <QuestionBlock>
        <Label>Você indicaria a MD.IA para outro médico?</Label>
        <ChoiceButtons
          options={['Sim', 'Não']}
          value={form.indicaria}
          onChange={v => update('indicaria', v)}
        />
        {form.indicaria === 'Sim' && (
          <div className="mt-4 animate-fade-in">
            <Label>Você tem alguém em mente? (opcional)</Label>
            <TextInput
              value={form.indicacaoContato}
              onChange={v => update('indicacaoContato', v)}
              placeholder="Nome ou contato do indicado"
            />
          </div>
        )}
      </QuestionBlock>
    </>
  );
}

// Step 6 — Observações Finais
function Step6({ form, update }: { form: FormData; update: (f: keyof FormData, v: string | number | null) => void }) {
  return (
    <>
      <StepTitle>Observações Finais</StepTitle>
      <QuestionBlock>
        <Label>Deixe um comentário, sugestão ou observação (opcional)</Label>
        <Textarea
          value={form.observacoes}
          onChange={v => update('observacoes', v)}
          placeholder="Seu feedback é muito importante para nós..."
          rows={6}
        />
      </QuestionBlock>
    </>
  );
}

// Tela de Sucesso
function SuccessScreen({ nome }: { nome: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-up text-center">
      <div className="w-24 h-24 mb-8 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="url(#successGrad)"
            strokeWidth="3"
          />
          <defs>
            <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A90E2" />
              <stop offset="100%" stopColor="#6EC6FF" />
            </linearGradient>
          </defs>
          <polyline
            points="28,52 44,68 72,36"
            fill="none"
            stroke="url(#successGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 100,
              strokeDashoffset: 0,
              animation: 'checkmark 0.6s ease forwards',
            }}
          />
        </svg>
        <div className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(74,144,226,0.4)]" />
      </div>
      <h2 className="font-orbitron text-2xl font-bold text-white mb-3">
        Obrigado, {nome.split(' ')[0]}!
      </h2>
      <p className="text-[#A0A0B0] text-base max-w-sm">
        Suas respostas foram registradas com sucesso.
      </p>
      <p className="text-[#A0A0B0] text-sm mt-2 max-w-sm">
        Nossa equipe analisará seu feedback com atenção.
      </p>
      <div className="ecg-line w-64 mt-8 ecg-pulse" />
    </div>
  );
}
