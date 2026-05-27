import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from('contatos').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contatos DELETE]', err);
    return NextResponse.json({ error: 'Erro ao excluir contato.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const medico = body.medico?.trim();
    if (!medico) {
      return NextResponse.json({ error: 'Contato é obrigatório.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('contatos')
      .update({
        medico,
        ultimo_contato: body.ultimoContato || null,
        proximo_contato: body.proximoContato || null,
        frequencia_ideal: body.frequenciaIdeal || null,
        tipo_interacao: body.tipoInteracao || null,
      })
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contatos PUT]', err);
    return NextResponse.json({ error: 'Erro ao atualizar contato.' }, { status: 500 });
  }
}
