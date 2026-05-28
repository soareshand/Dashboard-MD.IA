import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) return NextResponse.json({ error: 'Token obrigatório.' }, { status: 400 });

    const { data: tokenRow, error: tokenErr } = await supabase
      .from('tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenErr || !tokenRow) return NextResponse.json({ error: 'Token inválido.' }, { status: 404 });
    if (tokenRow.status === 'respondido') return NextResponse.json({ error: 'Este link já foi utilizado.' }, { status: 409 });

    const { error: insertErr } = await supabase.from('quiz_mensal_equipe_responses').insert({
      token,
      timestamp: new Date().toISOString(),
      nome: body.nome ?? tokenRow.cliente_nome,
      clinica: body.clinica ?? tokenRow.clinica,
      nps: body.nps,
      nps_resposta: body.npsResposta ?? '',
      nota_crm: body.notaCrm ?? null,
      nota_automacoes: body.notaAutomacoes ?? null,
      nota_suporte: body.notaSuporte ?? null,
      pergunta_rotativa: body.perguntaRotativa ?? null,
      pergunta_rotativa_resposta: body.perguntaRotativaResposta ?? '',
    });

    if (insertErr) throw insertErr;

    await supabase.from('tokens').update({ status: 'respondido', answered_at: new Date().toISOString() }).eq('token', token);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[submit-quiz-mensal-equipe]', err);
    return NextResponse.json({ error: 'Erro ao enviar avaliação.' }, { status: 500 });
  }
}
