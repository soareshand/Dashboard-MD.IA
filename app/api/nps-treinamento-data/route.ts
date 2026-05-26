import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: rows, error } = await supabase.from('quiz_treinamento_responses').select('*');
    if (error) throw error;

    const responses = (rows ?? []).map(r => ({
      timestamp: String(r.timestamp ?? ''),
      token: String(r.token ?? ''),
      nome: String(r.nome ?? ''),
      clinica: String(r.clinica ?? ''),
      ferramenta: String(r.ferramenta ?? ''),
      respondente: String(r.respondente ?? ''),
      notaTreinamento: Number(r.nota_treinamento) || 0,
      notaClareza: Number(r.nota_clareza) || 0,
      segurancaUso: String(r.seguranca_uso ?? ''),
      observacoes: String(r.observacoes ?? ''),
    }));

    const total = responses.length;

    const mediaTreinamento = total > 0
      ? Math.round((responses.reduce((s, r) => s + r.notaTreinamento, 0) / total) * 10) / 10
      : 0;

    const mediaClareza = total > 0
      ? Math.round((responses.reduce((s, r) => s + r.notaClareza, 0) / total) * 10) / 10
      : 0;

    const seguros = responses.filter(r => r.segurancaUso.includes('Sim')).length;
    const parcialmente = responses.filter(r => r.segurancaUso.includes('Parcialmente')).length;
    const naoSeguros = responses.filter(r => r.segurancaUso.includes('Não')).length;
    const taxaSeguranca = total > 0 ? Math.round(((seguros + parcialmente) / total) * 100) : 0;

    const ferrMap: Record<string, { total: number; somaTrein: number; somaClar: number; seguros: number }> = {};
    for (const r of responses) {
      const f = r.ferramenta || 'Sem ferramenta';
      if (!ferrMap[f]) ferrMap[f] = { total: 0, somaTrein: 0, somaClar: 0, seguros: 0 };
      ferrMap[f].total++;
      ferrMap[f].somaTrein += r.notaTreinamento;
      ferrMap[f].somaClar += r.notaClareza;
      if (r.segurancaUso.includes('Sim')) ferrMap[f].seguros++;
    }
    const porFerramenta = Object.entries(ferrMap).map(([ferramenta, v]) => ({
      ferramenta,
      total: v.total,
      mediaTreinamento: Math.round((v.somaTrein / v.total) * 10) / 10,
      mediaClareza: Math.round((v.somaClar / v.total) * 10) / 10,
      taxaSeguranca: Math.round((v.seguros / v.total) * 100),
    })).sort((a, b) => b.total - a.total);

    const distTreinamento = [0, 1, 2, 3, 4, 5].map(n => ({
      nota: n,
      count: responses.filter(r => r.notaTreinamento === n).length,
    }));

    const recent = [...responses]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return NextResponse.json({
      kpis: { total, mediaTreinamento, mediaClareza, taxaSeguranca },
      segurancaDistribuicao: { Sim: seguros, Parcialmente: parcialmente, Nao: naoSeguros },
      porFerramenta,
      distTreinamento,
      recent,
    });
  } catch (err) {
    console.error('[nps-treinamento-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados de NPS Treinamento.' }, { status: 500 });
  }
}
