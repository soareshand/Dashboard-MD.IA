import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const NOTA_KEYS = [
  'nota_mentorias_grupo', 'nota_academy', 'nota_agente_ia', 'nota_gerente_ia',
  'nota_automacoes', 'nota_dashboard', 'nota_crm', 'nota_treinamentos_crm',
  'nota_suporte_equipe', 'nota_mentoria_gestao',
] as const;

function calcScore(opts: {
  produtosAtivos: number; totalProdutos: number;
  npsMedia: number | null; taxaPresenca: number | null;
  contatoStatus: string | null; diasRenovacao: number | null;
}): number {
  let s = 0;
  // Produtos ativos: max 3 pts
  if (opts.totalProdutos > 0) s += (opts.produtosAtivos / opts.totalProdutos) * 3;
  // NPS: max 3 pts
  if (opts.npsMedia !== null) s += (opts.npsMedia / 5) * 3;
  // Presença: max 2 pts
  if (opts.taxaPresenca !== null) s += (opts.taxaPresenca / 100) * 2;
  // Contato: max 1 pt
  if (opts.contatoStatus === 'Em dia' || opts.contatoStatus === 'OK') s += 1;
  else if (opts.contatoStatus === 'Atenção') s += 0.5;
  // Renovação: max 1 pt
  if (opts.diasRenovacao !== null) {
    if (opts.diasRenovacao > 90) s += 1;
    else if (opts.diasRenovacao > 60) s += 0.75;
    else if (opts.diasRenovacao > 30) s += 0.5;
    else if (opts.diasRenovacao > 0) s += 0.25;
  }
  return Math.round(s * 10) / 10;
}

export async function GET() {
  try {
    const [
      { data: clientesRows },
      { data: presencaRows },
      { data: quizRows },
      { data: contatoRows },
      { data: catalogRows },
    ] = await Promise.all([
      supabase.from('clientes').select('id, nome, clinica, grupo, entrada, data_nascimento, produtos').eq('situacao', 'Ativo'),
      supabase.from('presencas').select('medico, sessao, status'),
      supabase.from('quiz_renovacao_responses').select('nome, timestamp, nota_mentorias_grupo, nota_academy, nota_agente_ia, nota_gerente_ia, nota_automacoes, nota_dashboard, nota_crm, nota_treinamentos_crm, nota_suporte_equipe, nota_mentoria_gestao'),
      supabase.from('contatos').select('medico, proximo_contato'),
      supabase.from('produtos_catalogo').select('id, nome, ordem').order('ordem'),
    ]);

    const clientes = clientesRows ?? [];
    const totalProdutos = (catalogRows ?? []).length;

    // Presença: count unique sessions and presences per medico
    const allSessoes = new Set((presencaRows ?? []).map(p => p.sessao as string));
    const totalSessoes = allSessoes.size;
    const presCount = new Map<string, number>();
    const medicosInPresenca = new Set<string>();
    for (const p of (presencaRows ?? [])) {
      medicosInPresenca.add(p.medico);
      if (p.status === 'Presente') {
        presCount.set(p.medico, (presCount.get(p.medico) ?? 0) + 1);
      }
    }
    const presencaByMedico = new Map<string, { presencas: number; taxa: number }>();
    medicosInPresenca.forEach(medico => {
      const count = presCount.get(medico) ?? 0;
      presencaByMedico.set(medico, {
        presencas: count,
        taxa: totalSessoes > 0 ? Math.round((count / totalSessoes) * 100) : 0,
      });
    });

    // Quiz: last NPS per medico (sorted by timestamp desc)
    const quizByMedico = new Map<string, number>();
    const sortedQuiz = [...(quizRows ?? [])].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    for (const r of sortedQuiz) {
      if (!quizByMedico.has(r.nome)) {
        const avg = NOTA_KEYS.reduce((s, k) => s + (Number((r as Record<string, unknown>)[k]) || 0), 0) / NOTA_KEYS.length;
        quizByMedico.set(r.nome, Math.round(avg * 10) / 10);
      }
    }

    // Contato status per medico (computed from proximo_contato)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const contatoByMedico = new Map<string, string>();
    for (const c of (contatoRows ?? [])) {
      if (!c.proximo_contato) continue;
      const proximo = new Date(c.proximo_contato + 'T00:00:00');
      const diff = Math.ceil((proximo.getTime() - hoje.getTime()) / 86400000);
      const status = diff < 0 ? 'Crítico' : diff <= 3 ? 'Atenção' : 'Em dia';
      contatoByMedico.set(c.medico, status);
    }

    const mesAtual = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();

    const cards = clientes.map(m => {
      const produtosMap = (m.produtos ?? {}) as Record<string, boolean>;
      const produtosAtivos = Object.values(produtosMap).filter(Boolean).length;

      let diasRenovacao: number | null = null;
      if (m.entrada) {
        const entrada = new Date(m.entrada + 'T00:00:00');
        const renov = new Date(entrada.getFullYear() + 1, entrada.getMonth(), entrada.getDate());
        diasRenovacao = Math.ceil((renov.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      }

      const partsNasc = (m.data_nascimento ?? '').split('-');
      const isAniversariante = partsNasc.length === 3 && parseInt(partsNasc[1]) === mesAtual;
      const isAniversarioHoje = isAniversariante && parseInt(partsNasc[2]) === diaAtual;

      const presenca = presencaByMedico.get(m.nome);
      const npsMedia = quizByMedico.get(m.nome) ?? null;
      const contatoStatus = contatoByMedico.get(m.nome) ?? null;

      const score = calcScore({
        produtosAtivos, totalProdutos,
        npsMedia, taxaPresenca: presenca?.taxa ?? null,
        contatoStatus, diasRenovacao,
      });

      return {
        id: m.id,
        nome: m.nome,
        clinica: m.clinica,
        grupo: m.grupo,
        entrada: m.entrada,
        produtosAtivos,
        npsMedia,
        presencas: presenca?.presencas ?? null,
        taxaPresenca: presenca?.taxa ?? null,
        contatoStatus,
        diasRenovacao,
        score,
        isAniversariante,
        isAniversarioHoje,
      };
    }).sort((a, b) => b.score - a.score);

    return NextResponse.json({ cards, totalProdutos, catalog: catalogRows ?? [] });
  } catch (err) {
    console.error('[geral-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados gerais.' }, { status: 500 });
  }
}
