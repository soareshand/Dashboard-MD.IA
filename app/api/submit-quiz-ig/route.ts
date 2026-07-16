import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select('status')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Token não encontrado.' }, { status: 404 });
    }
    if (tokenData.status === 'respondido') {
      return NextResponse.json({ error: 'Este formulário já foi respondido.' }, { status: 409 });
    }

    const { error: insertError } = await supabase
      .from('quiz_ig_responses')
      .insert({
        token,
        nome: body.nome?.trim() || null,
        clinica: body.clinica?.trim() || null,
        email: body.email?.trim() || null,
        objetivo: body.objetivo?.trim() || null,
        objetivo_alcancado: body.objetivoAlcancado || null,
        maior_desafio: body.maiorDesafio?.trim() || null,
        nota_crm: body.notaCRM ?? null,
        crm_melhorou_relacionamento: body.crmMelhorouRelacionamento || null,
        nota_agente_ia: body.notaAgenteIA ?? null,
        agente_ia_melhorou_atendimento: body.agenteIAMelhorouAtendimento || null,
        agente_ia_uso_principal: body.agenteIAUsoPrincipal?.trim() || null,
        crescimento_pacientes: body.crescimentoPacientes || null,
        reducao_tempo_operacional: body.reducaoTempoOperacional || null,
        investimento_retorno: body.investimentoRetorno || null,
        pretende_renovar: body.pretendeRenovar || null,
        motivo_nao_renovar: body.motivoNaoRenovar?.trim() || null,
        indicaria: body.indicaria || null,
        indicacao_contato: body.indicacaoContato?.trim() || null,
        observacoes: body.observacoes?.trim() || null,
      });

    if (insertError) throw insertError;

    await supabase
      .from('tokens')
      .update({ status: 'respondido', answered_at: new Date().toISOString() })
      .eq('token', token);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[submit-quiz-ig POST]', err);
    return NextResponse.json({ error: 'Erro ao salvar resposta.' }, { status: 500 });
  }
}
