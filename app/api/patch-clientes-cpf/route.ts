import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getMembros } from '@/lib/google-sheets';

export async function POST() {
  try {
    const [membros, { data: clientes, error }] = await Promise.all([
      getMembros(),
      supabase.from('clientes').select('id, nome'),
    ]);

    if (error) throw error;

    const clienteMap = new Map((clientes ?? []).map(c => [c.nome.trim().toLowerCase(), c.id]));

    let updated = 0;
    let notFound = 0;

    for (const m of membros) {
      const id = clienteMap.get(m.nome.trim().toLowerCase());
      if (!id) { notFound++; continue; }

      const { error: e } = await supabase
        .from('clientes')
        .update({
          cpf: m.cpf || null,
          cep: m.cep || null,
          estado: m.estado || null,
          endereco: m.endereco || null,
        })
        .eq('id', id);

      if (e) throw new Error(`Erro ao atualizar ${m.nome}: ${e.message}`);
      updated++;
    }

    return NextResponse.json({ success: true, updated, notFound });
  } catch (err) {
    console.error('[patch-clientes-cpf]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro no patch.' },
      { status: 500 }
    );
  }
}
