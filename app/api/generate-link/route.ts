import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateToken, buildQuizUrl } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  try {
    const { nome, clinica, email, quizType, meta } = await req.json();

    if (!nome || !clinica) {
      return NextResponse.json({ error: 'Nome e clínica são obrigatórios.' }, { status: 400 });
    }

    const validTypes = ['renovacao', 'call', 'treinamento', 'mensal_medico', 'mensal_equipe', 'encerramento'];
    const type = validTypes.includes(quizType) ? quizType : 'renovacao';

    const token = generateToken();
    const quizUrl = buildQuizUrl(token);

    const { error } = await supabase.from('tokens').insert({
      token,
      cliente_nome: nome,
      clinica,
      email: email ?? '',
      quiz_type: type,
      extra_info: meta ?? '',
    });

    if (error) throw error;

    return NextResponse.json({ success: true, token, quizUrl });
  } catch (err) {
    console.error('[generate-link]', err);
    return NextResponse.json({ error: 'Erro ao gerar link.' }, { status: 500 });
  }
}
