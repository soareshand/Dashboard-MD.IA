'use client';

import React, { useEffect, useState } from 'react';

interface ModalPrefill {
  quizType?: QuizType;
  nome?: string;
  clinica?: string;
}

interface GenerateLinkModalProps {
  onClose: () => void;
  initialData?: ModalPrefill;
  onLinkGenerated?: () => void;
}

type QuizType = 'renovacao' | 'call' | 'treinamento' | 'mensal_medico' | 'mensal_equipe';
type Genero = 'Dr.' | 'Dra.';
type Participante = 'medico' | 'equipe';

interface MedicoOpcao {
  nome: string;
  clinica: string;
}

const TABS_ROW1: { id: QuizType; label: string }[] = [
  { id: 'renovacao',   label: 'Renovação'      },
  { id: 'call',        label: 'Pós-Call'        },
  { id: 'treinamento', label: 'Pós-Treino'      },
];
const TABS_ROW2: { id: QuizType; label: string }[] = [
  { id: 'mensal_medico', label: 'Pulso Médico' },
  { id: 'mensal_equipe', label: 'Pulso Equipe' },
];
const ALL_TABS = [...TABS_ROW1, ...TABS_ROW2];

function TabIcon({ id, active }: { id: QuizType; active: boolean }) {
  const c = active ? '#ffffff' : '#6B7A8D';
  const s = { width: 15, height: 15, viewBox: '0 0 24 24' as const, fill: 'none' as const, stroke: c, strokeWidth: '1.8' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (id === 'renovacao') return (
    <svg {...s}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
  );
  if (id === 'call') return (
    <svg {...s}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.1 6.1l1-1a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>
  );
  if (id === 'mensal_medico') return (
    <svg {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
  );
  if (id === 'mensal_equipe') return (
    <svg {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  );
  return (
    <svg {...s}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  );
}

const TIPOS_CALL = ['Onboarding', 'Ongoing', 'Suporte'];

const BTN_ACTIVE = { background: 'linear-gradient(135deg, #2563EB, #3B9EF5)' };
const INP = 'w-full bg-[#12122A] border border-[rgba(59,158,245,0.25)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#3B9EF5] transition-all';

export default function GenerateLinkModal({ onClose, initialData, onLinkGenerated }: GenerateLinkModalProps) {
  const [quizType, setQuizType] = useState<QuizType>(initialData?.quizType ?? 'renovacao');
  const [participante, setParticipante] = useState<Participante>(
    initialData?.quizType === 'mensal_equipe' ? 'equipe' : 'medico'
  );
  const [nome, setNome] = useState(initialData?.nome ?? '');
  const [genero, setGenero] = useState<Genero>('Dr.');
  const [clinica, setClinica] = useState(initialData?.clinica ?? '');
  const [tipoCall, setTipoCall] = useState('');
  const [ferramenta, setFerramenta] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ quizUrl: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [medicosAtivos, setMedicosAtivos] = useState<MedicoOpcao[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    fetch('/api/clientes-data')
      .then(r => r.json())
      .then(d => {
        const ativos = (d.membros ?? [])
          .filter((m: { situacao: string }) => m.situacao === 'Ativo')
          .map((m: { nome: string; clinica?: string }) => ({ nome: m.nome, clinica: m.clinica || '' }))
          .sort((a: MedicoOpcao, b: MedicoOpcao) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setMedicosAtivos(ativos);
      })
      .catch(() => {});
  }, []);

  const clinicasDisponiveis = Array.from(new Set(medicosAtivos.map(m => m.clinica).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  function handleSelectMedico(nomeVal: string) {
    setNome(nomeVal);
    const m = medicosAtivos.find(m => m.nome === nomeVal);
    if (m?.clinica) setClinica(m.clinica);
  }

  function reset() {
    setResult(null);
    setNome('');
    setClinica('');
    setTipoCall('');
    setFerramenta('');
    setError('');
    setCopied(false);
    setCopiedMsg(false);
  }

  function handleTabChange(tab: QuizType) {
    setQuizType(tab);
    setNome('');
    setClinica('');
    setError('');
    setResult(null);
    // For Pulso types, force the right participante
    if (tab === 'mensal_medico') setParticipante('medico');
    if (tab === 'mensal_equipe') setParticipante('equipe');
  }

  function handleParticipanteChange(p: Participante) {
    setParticipante(p);
    setNome('');
    setClinica('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const meta = quizType === 'call' ? tipoCall : quizType === 'treinamento' ? ferramenta : '';
      const res = await fetch('/api/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, clinica, quizType, meta, email: '', enviarEmail: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar link.');
      setResult(data);
      onLinkGenerated?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.quizUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getPrimeiroNome(n: string): string {
    return n.trim().replace(/^Dr(?:a)?\.?\s*/i, '').split(' ')[0];
  }

  function buildWhatsAppMessage(url: string): string {
    const isMed = quizType === 'renovacao' || quizType === 'mensal_medico' || participante === 'medico';
    const saudacao = isMed ? `${genero} ${getPrimeiroNome(nome)}` : nome.trim().split(' ')[0];
    if (quizType === 'call') {
      return `Oláa, ${saudacao}!\n\nObrigado pela disponibilidade na nossa call! Adoraríamos saber sua opinião sobre ela.\n\nPreparamos um formulário rápido, leva menos de 2 minutinhos. Sua avaliação é essencial para melhorarmos cada vez mais!\n\n${url}`;
    }
    if (quizType === 'treinamento') {
      const tool = ferramenta.trim() || 'a ferramenta';
      return `Oláa, ${saudacao}!\n\nObrigado pela disponibilidade no treinamento de ${tool}! Queremos saber como foi a sua experiência.\n\nPreparamos um formulário rápido, leva menos de 2 minutinhos. Sua avaliação nos ajuda a oferecer treinamentos cada vez melhores!\n\n${url}`;
    }
    if (quizType === 'mensal_medico') {
      return `Oláa, ${saudacao}! Tudo bem?\n\nTodo mês acompanhamos de perto a evolução da sua clínica, e adoraríamos ouvir você!\n\nPreparamos uma avaliação rápida, são apenas 4 perguntinhas, leva menos de 2 minutinhos. Seu feedback faz toda a diferença para continuarmos evoluindo juntos.\n\n${url}`;
    }
    if (quizType === 'mensal_equipe') {
      return `Oláa, ${saudacao}!\n\nTodo mês colhemos o feedback da equipe para garantir que tudo está funcionando bem e identificar onde podemos melhorar.\n\nPreparamos uma avaliação rápida, são apenas 4 perguntinhas, leva menos de 2 minutinhos.\n\n${url}`;
    }
    return `Oláa, ${saudacao}! Tudo bem?\n\nPassando para avisar que a sua mentoria da MD.IA já está chegando ao fim. Preparei um formulário onde gostaríamos de ouvir a sua experiência ao longo da jornada, seus objetivos, resultados percebidos, avaliação das ferramentas e mentorias, além da intenção de renovação.\n\nSegue o link: ${url}\n\nO seu retorno é muito importante para nós e nos ajuda a evoluir cada vez mais. Qualquer dúvida, estou à disposição. Muito obrigado!`;
  }

  function handleCopyMsg() {
    if (!result) return;
    navigator.clipboard.writeText(buildWhatsAppMessage(result.quizUrl));
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  }

  const isMedicoFlow = quizType === 'renovacao' || quizType === 'mensal_medico' || participante === 'medico';

  const metaValid =
    quizType === 'renovacao' ||
    quizType === 'mensal_medico' ||
    quizType === 'mensal_equipe' ||
    (quizType === 'call' && tipoCall !== '') ||
    (quizType === 'treinamento' && ferramenta.trim() !== '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-gradient-border w-full max-w-md p-6 animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-orbitron text-base font-bold text-white">Gerar Link do Quiz</h3>
          <button onClick={onClose} className="text-[#A0A0B0] hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Type tabs */}
        <div className="space-y-1 mb-5">
          <div className="flex gap-1 bg-[#0D0D1A] rounded-xl p-1">
            {TABS_ROW1.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-sora transition-all ${
                  quizType === tab.id ? 'text-white shadow-md' : 'text-[#A0A0B0] hover:text-white'
                }`}
                style={quizType === tab.id ? BTN_ACTIVE : {}}
              >
                <TabIcon id={tab.id} active={quizType === tab.id} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-[#0D0D1A] rounded-xl p-1">
            {TABS_ROW2.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-sora transition-all ${
                  quizType === tab.id ? 'text-white shadow-md' : 'text-[#A0A0B0] hover:text-white'
                }`}
                style={quizType === tab.id ? { background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' } : {}}
              >
                <TabIcon id={tab.id} active={quizType === tab.id} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Participante toggle — só para call e treinamento (pulso tem tipo fixo) */}
            {quizType !== 'renovacao' && quizType !== 'mensal_medico' && quizType !== 'mensal_equipe' && (
              <div>
                <label className="text-xs text-[#A0A0B0] mb-1.5 block">Participante</label>
                <div className="flex rounded-xl overflow-hidden border border-[rgba(59,158,245,0.25)]">
                  {(['medico', 'equipe'] as Participante[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleParticipanteChange(p)}
                      className={`flex-1 py-2.5 text-xs font-sora font-semibold transition-all ${
                        participante === p ? 'text-white' : 'bg-[#12122A] text-[#A0A0B0] hover:text-white'
                      }`}
                      style={participante === p ? BTN_ACTIVE : {}}
                    >
                      {p === 'medico' ? 'Médico(a)' : 'Equipe'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="text-xs text-[#A0A0B0] mb-1.5 block">
                {isMedicoFlow ? 'Nome do médico *' : 'Nome do responsável *'}
              </label>

              {isMedicoFlow ? (
                /* Doctor dropdown + Dr./Dra. toggle */
                <div className="flex gap-2">
                  <div className="flex rounded-xl overflow-hidden border border-[rgba(59,158,245,0.25)] shrink-0">
                    {(['Dr.', 'Dra.'] as Genero[]).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGenero(g)}
                        className={`px-3 py-2.5 text-xs font-sora font-semibold transition-all ${
                          genero === g ? 'text-white' : 'bg-[#12122A] text-[#A0A0B0] hover:text-white'
                        }`}
                        style={genero === g ? BTN_ACTIVE : {}}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <select
                    value={nome}
                    onChange={e => handleSelectMedico(e.target.value)}
                    required
                    className={INP + ' flex-1 appearance-none cursor-pointer'}
                  >
                    <option value="" className="bg-[#12122A] text-[#A0A0B0]">Selecione o médico…</option>
                    {medicosAtivos.map(m => (
                      <option key={m.nome} value={m.nome} className="bg-[#12122A]">{m.nome}</option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Free text for equipe */
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  placeholder="Nome do responsável"
                  className={INP}
                />
              )}
            </div>

            {/* Clínica */}
            <div>
              <label className="text-xs text-[#A0A0B0] mb-1.5 block">Clínica *</label>
              {!isMedicoFlow && clinicasDisponiveis.length > 0 ? (
                /* Equipe: dropdown with registered clinics */
                <select
                  value={clinica}
                  onChange={e => setClinica(e.target.value)}
                  required
                  className={INP + ' appearance-none cursor-pointer'}
                >
                  <option value="" className="bg-[#12122A] text-[#A0A0B0]">Selecione a clínica…</option>
                  {clinicasDisponiveis.map(c => (
                    <option key={c} value={c} className="bg-[#12122A]">{c}</option>
                  ))}
                </select>
              ) : (
                /* Médico: auto-preenchida ou input livre */
                <input
                  value={clinica}
                  onChange={e => setClinica(e.target.value)}
                  required
                  placeholder="Nome da clínica"
                  className={INP}
                />
              )}
            </div>

            {/* Tipo de call */}
            {quizType === 'call' && (
              <div>
                <label className="text-xs text-[#A0A0B0] mb-1.5 block">Tipo de call *</label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS_CALL.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipoCall(t)}
                      className={`px-3 py-2 rounded-xl text-sm font-sora transition-all border ${
                        tipoCall === t
                          ? 'text-white border-transparent shadow-[0_0_10px_rgba(59,158,245,0.3)]'
                          : 'bg-[#12122A] text-[#A0A0B0] border-[rgba(59,158,245,0.2)] hover:border-[#3B9EF5] hover:text-white'
                      }`}
                      style={tipoCall === t ? BTN_ACTIVE : {}}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ferramenta treinada */}
            {quizType === 'treinamento' && (
              <div>
                <label className="text-xs text-[#A0A0B0] mb-1.5 block">Ferramenta treinada *</label>
                <input
                  value={ferramenta}
                  onChange={e => setFerramenta(e.target.value)}
                  placeholder="Ex: Secretária IA, CRM InfiniteGear…"
                  className="w-full bg-[#12122A] border border-[rgba(139,92,246,0.3)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#8B5CF6] transition-all"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading || !metaValid}
              className="w-full py-3 rounded-xl btn-glow text-white font-sora font-semibold text-sm disabled:opacity-60"
            >
              {loading ? 'Gerando…' : `Gerar Link — ${ALL_TABS.find(t => t.id === quizType)?.label}`}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(59,158,245,0.08)] border border-[rgba(59,158,245,0.2)]">
              <div>
                <p className="text-[#3B9EF5] font-medium text-sm">Link gerado!</p>
                <p className="text-[#93C5FD]/70 text-xs mt-0.5">
                  {ALL_TABS.find(t => t.id === quizType)?.label}
                  {quizType === 'call' && tipoCall ? ` · ${tipoCall}` : ''}
                  {quizType === 'treinamento' && ferramenta ? ` · ${ferramenta}` : ''}
                  {quizType !== 'renovacao' && quizType !== 'mensal_medico' && quizType !== 'mensal_equipe'
                    ? ` · ${participante === 'medico' ? 'Médico(a)' : 'Equipe'}`
                    : ''}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#A0A0B0] mb-1.5 block">Link do formulário</label>
              <div className="flex gap-2">
                <input
                  value={result.quizUrl}
                  readOnly
                  className="flex-1 bg-[#12122A] border border-[rgba(59,158,245,0.25)] rounded-xl px-3 py-2 text-[#93C5FD] text-xs font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl border border-[rgba(59,158,245,0.3)] text-[#A0A0B0] hover:text-white hover:border-[#3B9EF5] text-xs transition-all flex-shrink-0"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#A0A0B0] mb-1.5 block">Mensagem para WhatsApp</label>
              <div className="relative">
                <pre className="w-full bg-[#0D0D1A] border border-[rgba(59,158,245,0.2)] rounded-xl px-3 py-3 text-[#C0C0D0] text-xs font-sans leading-relaxed whitespace-pre-wrap break-words">
                  {buildWhatsAppMessage(result.quizUrl)}
                </pre>
                <button
                  onClick={handleCopyMsg}
                  className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg bg-[#12122A] border border-[rgba(59,158,245,0.3)] text-[#A0A0B0] hover:text-white hover:border-[#3B9EF5] text-xs transition-all flex items-center gap-1"
                >
                  {copiedMsg ? '✓ Copiado' : '📋 Copiar'}
                </button>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full py-2 text-[#A0A0B0] hover:text-white text-xs transition-colors"
            >
              Gerar outro link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
