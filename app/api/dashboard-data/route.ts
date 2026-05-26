import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TOOL_ITEMS } from '@/lib/quiz-config';

export const dynamic = 'force-dynamic';

function mapRow(r: Record<string, unknown>) {
  return {
    timestamp: String(r.timestamp ?? ''),
    token: String(r.token ?? ''),
    nome: String(r.nome ?? ''),
    clinica: String(r.clinica ?? ''),
    email: String(r.email ?? ''),
    objetivo: String(r.objetivo ?? ''),
    objetivoAlcancado: String(r.objetivo_alcancado ?? ''),
    maiorDesafio: String(r.maior_desafio ?? ''),
    crescimentoPacientes: String(r.crescimento_pacientes ?? ''),
    reducaoTempoOperacional: String(r.reducao_tempo_operacional ?? ''),
    investimentoRetorno: String(r.investimento_retorno ?? ''),
    notaMentoriasGrupo: Number(r.nota_mentorias_grupo) || 0,
    notaAcademy: Number(r.nota_academy) || 0,
    notaAgenteIA: Number(r.nota_agente_ia) || 0,
    notaGerenteIA: Number(r.nota_gerente_ia) || 0,
    notaAutomacoes: Number(r.nota_automacoes) || 0,
    notaDashboard: Number(r.nota_dashboard) || 0,
    notaCRM: Number(r.nota_crm) || 0,
    notaTreinamentosCRM: Number(r.nota_treinamentos_crm) || 0,
    notaSuporteEquipe: Number(r.nota_suporte_equipe) || 0,
    notaMentoriaGestao: Number(r.nota_mentoria_gestao) || 0,
    pretendeRenovar: String(r.pretende_renovar ?? ''),
    motivoNaoRenovar: String(r.motivo_nao_renovar ?? ''),
    indicaria: String(r.indicaria ?? ''),
    indicacaoContato: String(r.indicacao_contato ?? ''),
    observacoes: String(r.observacoes ?? ''),
  };
}

export async function GET() {
  try {
    const [{ data: rows }, { data: tokens }] = await Promise.all([
      supabase.from('quiz_renovacao_responses').select('*'),
      supabase.from('tokens').select('token, status'),
    ]);

    const responses = (rows ?? []).map(mapRow);
    const total = responses.length;

    const objetivoSim = responses.filter(r => r.objetivoAlcancado === 'Sim').length;
    const objetivoParcial = responses.filter(r => r.objetivoAlcancado === 'Parcialmente').length;
    const taxaObjetivo = total > 0 ? Math.round(((objetivoSim + objetivoParcial) / total) * 100) : 0;

    const renovacaoSim = responses.filter(r => r.pretendeRenovar.includes('Sim')).length;
    const taxaRenovacao = total > 0 ? Math.round((renovacaoSim / total) * 100) : 0;

    const toolIds = TOOL_ITEMS.map(t => t.id) as Array<keyof ReturnType<typeof mapRow>>;
    const npsGeral = total > 0
      ? responses.reduce((acc, r) => {
          const avg = toolIds.reduce((s, k) => s + (Number(r[k]) || 0), 0) / toolIds.length;
          return acc + avg;
        }, 0) / total
      : 0;

    const toolAverages = TOOL_ITEMS.map(tool => {
      const key = tool.id as keyof ReturnType<typeof mapRow>;
      const avg = total > 0
        ? responses.reduce((s, r) => s + (Number(r[key]) || 0), 0) / total
        : 0;
      return { id: tool.id, label: tool.label, emoji: tool.emoji, avg: Math.round(avg * 10) / 10 };
    }).sort((a, b) => b.avg - a.avg);

    const objetivoDistribuicao = {
      Sim: objetivoSim,
      Parcialmente: objetivoParcial,
      Nao: responses.filter(r => r.objetivoAlcancado === 'Não').length,
    };

    const resultadosPercebidos = {
      crescimentoPacientes: {
        Sim: responses.filter(r => r.crescimentoPacientes === 'Sim').length,
        AindaNao: responses.filter(r => r.crescimentoPacientes.includes('Ainda')).length,
        Nao: responses.filter(r => r.crescimentoPacientes === 'Não').length,
      },
      reducaoTempo: {
        Sim: responses.filter(r => r.reducaoTempoOperacional === 'Sim').length,
        AindaNao: responses.filter(r => r.reducaoTempoOperacional.includes('Ainda')).length,
        Nao: responses.filter(r => r.reducaoTempoOperacional === 'Não').length,
      },
      investimentoRetorno: {
        Positivo: responses.filter(r => r.investimentoRetorno === 'Positivo').length,
        Neutro: responses.filter(r => r.investimentoRetorno === 'Neutro').length,
        Negativo: responses.filter(r => r.investimentoRetorno === 'Negativo').length,
      },
    };

    const tokenMap = new Map((tokens ?? []).map(t => [t.token, t]));
    const recentResponses = [...responses]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(r => {
        const toolAvg = toolIds.reduce((s, k) => s + (Number(r[k]) || 0), 0) / toolIds.length;
        return {
          token: r.token,
          nome: r.nome,
          clinica: r.clinica,
          timestamp: r.timestamp,
          pretendeRenovar: r.pretendeRenovar,
          npsMedia: Math.round(toolAvg * 10) / 10,
          statusToken: tokenMap.get(r.token)?.status ?? 'respondido',
          _full: r,
        };
      });

    return NextResponse.json({
      kpis: {
        totalRespostas: total,
        taxaObjetivoAlcancado: taxaObjetivo,
        taxaRenovacao,
        npsMediaGeral: Math.round(npsGeral * 10) / 10,
      },
      toolAverages,
      objetivoDistribuicao,
      resultadosPercebidos,
      recentResponses,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[dashboard-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados.' }, { status: 500 });
  }
}
