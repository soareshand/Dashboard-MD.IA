import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, respondente, notaCall, necessidadeResolvida, notaCS, observacoes } = body;

    if (!token) return NextResponse.json({ error: 'Token obrigatório.' }, { status: 400 });

    const { data: tokenData, error: tokenErr } = await supabase
      .from('tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenErr || !tokenData) return NextResponse.json({ error: 'Link inválido.' }, { status: 404 });
    if (tokenData.status === 'respondido') return NextResponse.json({ error: 'Este link já foi utilizado.' }, { status: 409 });

    const { error: insertErr } = await supabase.from('quiz_call_responses').insert({
      token,
      timestamp: new Date().toISOString(),
      nome: tokenData.cliente_nome,
      clinica: tokenData.clinica,
      tipo_call: tokenData.extra_info,
      respondente,
      nota_call: notaCall,
      necessidade_resolvida: necessidadeResolvida,
      nota_cs: notaCS,
      observacoes: observacoes ?? '',
    });

    if (insertErr) throw insertErr;

    const { error: updateErr } = await supabase
      .from('tokens')
      .update({ status: 'respondido', answered_at: new Date().toISOString() })
      .eq('token', token);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[submit-nps-call]', err);
    return NextResponse.json({ error: 'Erro ao salvar resposta.' }, { status: 500 });
  }
}
