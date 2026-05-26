import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [{ data: contratos, error: e1 }, { data: renovacoes, error: e2 }] = await Promise.all([
      supabase.from('contratos').select('*').order('created_at', { ascending: false }),
      supabase.from('renovacoes').select('*').order('data', { ascending: false }),
    ]);

    if (e1) throw e1;
    if (e2) throw e2;

    const cList = contratos ?? [];
    const rList = renovacoes ?? [];

    const pagos = cList.filter(c => c.status_financeiro?.toLowerCase() === 'pago');
    const emAberto = cList.filter(c => c.status_financeiro?.toLowerCase() === 'em aberto');
    const mrr = cList.reduce((s, c) => s + (Number(c.valor) || 0), 0);

    const now = new Date();
    const mesAtual = now.getMonth() + 1;
    const anoAtual = now.getFullYear();
    const renovacoesDoMes = rList.filter(r => {
      if (!r.data) return false;
      const d = new Date(r.data + 'T00:00:00');
      return d.getMonth() + 1 === mesAtual && d.getFullYear() === anoAtual;
    });

    return NextResponse.json({
      kpis: {
        totalContratos: cList.length,
        contratosPagos: pagos.length,
        contratosEmAberto: emAberto.length,
        mrr,
        renovacoesDoMes: renovacoesDoMes.length,
      },
      contratos: cList,
      renovacoes: rList,
    });
  } catch (err) {
    console.error('[financeiro-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados financeiros.' }, { status: 500 });
  }
}
