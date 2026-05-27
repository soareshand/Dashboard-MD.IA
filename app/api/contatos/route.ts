import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const medico = body.medico?.trim();
    if (!medico) {
      return NextResponse.json({ error: 'Contato é obrigatório.' }, { status: 400 });
    }

    const updateData = {
      ultimo_contato: body.ultimoContato || null,
      proximo_contato: body.proximoContato || null,
      frequencia_ideal: body.frequenciaIdeal || null,
      tipo_interacao: body.tipoInteracao || null,
    };

    // Upsert: update existing row for this médico, or insert new
    const { data: existing } = await supabase
      .from('contatos')
      .select('id')
      .eq('medico', medico)
      .order('created_at', { ascending: false })
      .limit(1);

    let result, err;
    if (existing && existing.length > 0) {
      ({ data: result, error: err } = await supabase
        .from('contatos')
        .update(updateData)
        .eq('id', existing[0].id)
        .select()
        .single());
    } else {
      ({ data: result, error: err } = await supabase
        .from('contatos')
        .insert({ medico, ...updateData })
        .select()
        .single());
    }

    if (err) throw err;
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('[contatos POST]', err);
    return NextResponse.json({ error: 'Erro ao salvar contato.' }, { status: 500 });
  }
}
