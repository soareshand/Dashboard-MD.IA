import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.medico?.trim()) {
      return NextResponse.json({ error: 'Médico é obrigatório.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('contatos')
      .insert({
        medico: body.medico.trim(),
        status: body.status || 'OK',
        ultimo_contato: body.ultimoContato || null,
        proximo_contato: body.proximoContato || null,
        frequencia_ideal: body.frequenciaIdeal || null,
        tipo_interacao: body.tipoInteracao || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[contatos POST]', err);
    return NextResponse.json({ error: 'Erro ao salvar contato.' }, { status: 500 });
  }
}
