import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from('clientes').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[clientes DELETE]', err);
    return NextResponse.json({ error: 'Erro ao excluir membro.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clientes')
      .update({
        situacao: body.situacao || 'Ativo',
        nome: body.nome.trim(),
        grupo: body.grupo || null,
        entrada: body.entrada || null,
        saida: body.saida || null,
        cpf: body.cpf || null,
        endereco: body.endereco || null,
        cep: body.cep || null,
        estado: body.estado || null,
        telefone: body.telefone || null,
        email: body.email || null,
        data_nascimento: body.dataNascimento || null,
      })
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[clientes PUT]', err);
    return NextResponse.json({ error: 'Erro ao atualizar membro.' }, { status: 500 });
  }
}
