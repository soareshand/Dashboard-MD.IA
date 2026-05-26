import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.medico?.trim()) {
      return NextResponse.json({ error: 'Médico é obrigatório.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('contratos')
      .insert({
        medico: body.medico.trim(),
        status_contrato: body.statusContrato || 'Enviado',
        valor: Number(body.valor) || 0,
        status_financeiro: body.statusFinanceiro || 'Em Aberto',
        nota_fiscal: body.notaFiscal || null,
        observacoes: body.observacoes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[contratos POST]', err);
    return NextResponse.json({ error: 'Erro ao salvar contrato.' }, { status: 500 });
  }
}
