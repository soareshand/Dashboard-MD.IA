import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: rows, error } = await supabase.from('quiz_encerramento_responses').select('*');
    if (error) throw error;

    const responses = (rows ?? []).map(r => ({
      timestamp: String(r.timestamp ?? ''),
      token: String(r.token ?? ''),
      nome: String(r.nome ?? ''),
      clinica: String(r.clinica ?? ''),
      servicoUtilizado: String(r.servico_utilizado ?? ''),
      motivoEncerramento: String(r.motivo_encerramento ?? ''),
      nps: r.nps !== null && r.nps !== undefined ? Number(r.nps) : null,
      oque: String(r.o_que_poderia_mudar ?? ''),
      mensagem: String(r.mensagem_final ?? ''),
    }));

    const total = responses.length;
    const comNps = responses.filter(r => r.nps !== null);
    const mediaNps = comNps.length > 0
      ? Math.round((comNps.reduce((s, r) => s + (r.nps as number), 0) / comNps.length) * 10) / 10
      : null;

    // NPS distribution 0-10
    const npsDistribuicao = Array.from({ length: 11 }, (_, i) => ({
      nota: i,
      count: responses.filter(r => r.nps === i).length,
    }));

    // Por motivo
    const motivoMap: Record<string, number> = {};
    for (const r of responses) {
      const k = r.motivoEncerramento || 'Não informado';
      motivoMap[k] = (motivoMap[k] ?? 0) + 1;
    }
    const porMotivo = Object.entries(motivoMap)
      .map(([motivo, count]) => ({ motivo, count }))
      .sort((a, b) => b.count - a.count);

    // Por serviço
    const servicoMap: Record<string, number> = {};
    for (const r of responses) {
      const k = r.servicoUtilizado || 'Não informado';
      servicoMap[k] = (servicoMap[k] ?? 0) + 1;
    }
    const porServico = Object.entries(servicoMap)
      .map(([servico, count]) => ({ servico, count }))
      .sort((a, b) => b.count - a.count);

    const recent = [...responses]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return NextResponse.json({ kpis: { total, mediaNps }, npsDistribuicao, porMotivo, porServico, recent });
  } catch (err) {
    console.error('[nps-encerramento-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados de Encerramento.' }, { status: 500 });
  }
}
