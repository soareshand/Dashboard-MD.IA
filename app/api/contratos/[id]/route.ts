import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from('contratos').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contratos DELETE]', err);
    return NextResponse.json({ error: 'Erro ao excluir contrato.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.medico?.trim()) {
      return NextResponse.json({ error: 'Médico é obrigatório.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('contratos')
      .update({
        medico: body.medico.trim(),
        status_contrato: body.statusContrato || 'Enviado',
        valor: Number(body.valor) || 0,
        status_financeiro: body.statusFinanceiro || 'Em Aberto',
        nota_fiscal: body.notaFiscal || null,
        observacoes: body.observacoes || null,
      })
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contratos PUT]', err);
    return NextResponse.json({ error: 'Erro ao atualizar contrato.' }, { status: 500 });
  }
}
