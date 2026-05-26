import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, ...formData } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token obrigatório.' }, { status: 400 });
    }

    const { data: tokenRow, error: tokenErr } = await supabase
      .from('tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenErr || !tokenRow) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 404 });
    }
    if (tokenRow.status === 'respondido') {
      return NextResponse.json({ error: 'Este link já foi utilizado.' }, { status: 409 });
    }

    const { error: insertErr } = await supabase.from('quiz_renovacao_responses').insert({
      token,
      timestamp: new Date().toISOString(),
      nome: formData.nome ?? tokenRow.cliente_nome,
      clinica: formData.clinica ?? tokenRow.clinica,
      email: formData.email ?? tokenRow.email,
      objetivo: formData.objetivo ?? '',
      objetivo_alcancado: formData.objetivoAlcancado ?? '',
      maior_desafio: formData.maiorDesafio ?? '',
      crescimento_pacientes: formData.crescimentoPacientes ?? '',
      reducao_tempo_operacional: formData.reducaoTempoOperacional ?? '',
      investimento_retorno: formData.investimentoRetorno ?? '',
      nota_mentorias_grupo: Number(formData.notaMentoriasGrupo) || 0,
      nota_academy: Number(formData.notaAcademy) || 0,
      nota_agente_ia: Number(formData.notaAgenteIA) || 0,
      nota_gerente_ia: Number(formData.notaGerenteIA) || 0,
      nota_automacoes: Number(formData.notaAutomacoes) || 0,
      nota_dashboard: Number(formData.notaDashboard) || 0,
      nota_crm: Number(formData.notaCRM) || 0,
      nota_treinamentos_crm: Number(formData.notaTreinamentosCRM) || 0,
      nota_suporte_equipe: Number(formData.notaSuporteEquipe) || 0,
      nota_mentoria_gestao: Number(formData.notaMentoriaGestao) || 0,
      pretende_renovar: formData.pretendeRenovar ?? '',
      motivo_nao_renovar: formData.motivoNaoRenovar ?? '',
      indicaria: formData.indicaria ?? '',
      indicacao_contato: formData.indicacaoContato ?? '',
      observacoes: formData.observacoes ?? '',
    });

    if (insertErr) throw insertErr;

    const { error: updateErr } = await supabase
      .from('tokens')
      .update({ status: 'respondido', answered_at: new Date().toISOString() })
      .eq('token', token);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[submit-quiz]', err);
    return NextResponse.json({ error: 'Erro interno ao salvar respostas.' }, { status: 500 });
  }
}
