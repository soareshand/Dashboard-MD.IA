import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: rows, error } = await supabase.from('quiz_call_responses').select('*');
    if (error) throw error;

    const responses = (rows ?? []).map(r => ({
      timestamp: String(r.timestamp ?? ''),
      token: String(r.token ?? ''),
      nome: String(r.nome ?? ''),
      clinica: String(r.clinica ?? ''),
      tipoCall: String(r.tipo_call ?? ''),
      respondente: String(r.respondente ?? ''),
      notaCall: Number(r.nota_call) || 0,
      necessidadeResolvida: String(r.necessidade_resolvida ?? ''),
      notaCS: Number(r.nota_cs) || 0,
      observacoes: String(r.observacoes ?? ''),
    }));

    const total = responses.length;

    const mediaCall = total > 0
      ? Math.round((responses.reduce((s, r) => s + r.notaCall, 0) / total) * 10) / 10
      : 0;

    const mediaCS = total > 0
      ? Math.round((responses.reduce((s, r) => s + r.notaCS, 0) / total) * 10) / 10
      : 0;

    const resolvidas = responses.filter(r => r.necessidadeResolvida.includes('Sim')).length;
    const parcialmente = responses.filter(r => r.necessidadeResolvida.includes('Parcialmente')).length;
    const naoResolvidas = responses.filter(r => r.necessidadeResolvida.includes('Não')).length;
    const taxaResolucao = total > 0 ? Math.round(((resolvidas + parcialmente) / total) * 100) : 0;

    const tiposMap: Record<string, { total: number; somaCall: number; somaCS: number }> = {};
    for (const r of responses) {
      const t = r.tipoCall || 'Sem tipo';
      if (!tiposMap[t]) tiposMap[t] = { total: 0, somaCall: 0, somaCS: 0 };
      tiposMap[t].total++;
      tiposMap[t].somaCall += r.notaCall;
      tiposMap[t].somaCS += r.notaCS;
    }
    const porTipo = Object.entries(tiposMap).map(([tipo, v]) => ({
      tipo,
      total: v.total,
      mediaCall: Math.round((v.somaCall / v.total) * 10) / 10,
      mediaCS: Math.round((v.somaCS / v.total) * 10) / 10,
    })).sort((a, b) => b.total - a.total);

    const distCall = [0, 1, 2, 3, 4, 5].map(n => ({
      nota: n,
      count: responses.filter(r => r.notaCall === n).length,
    }));

    const recent = [...responses]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return NextResponse.json({
      kpis: { total, mediaCall, mediaCS, taxaResolucao },
      resolucaoDistribuicao: { Sim: resolvidas, Parcialmente: parcialmente, Nao: naoResolvidas },
      porTipo,
      distCall,
      recent,
    });
  } catch (err) {
    console.error('[nps-call-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados de NPS Call.' }, { status: 500 });
  }
}
