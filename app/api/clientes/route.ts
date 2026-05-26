import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('clientes')
      .insert({
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
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[clientes POST]', err);
    return NextResponse.json({ error: 'Erro ao salvar membro.' }, { status: 500 });
  }
}
