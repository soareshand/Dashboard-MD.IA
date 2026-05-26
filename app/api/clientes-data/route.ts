import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [{ data: membros, error: e1 }, { data: contatosRaw, error: e2 }] = await Promise.all([
      supabase.from('clientes').select('*').order('nome'),
      supabase.from('contatos').select('*').order('created_at', { ascending: false }),
    ]);

    if (e1) throw e1;
    if (e2) throw e2;

    const rows = membros ?? [];
    const ativos = rows.filter(m => m.situacao === 'Ativo');
    const inativos = rows.filter(m => m.situacao === 'Inativo');

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const mesAtual = now.getMonth() + 1;
    const aniversariantes = rows.filter(m => {
      if (!m.data_nascimento) return false;
      return new Date(m.data_nascimento + 'T00:00:00').getMonth() + 1 === mesAtual;
    });

    const inativosNomes = new Set(
      rows.filter(m => m.situacao === 'Inativo').map(m => m.nome.trim().toLowerCase())
    );

    const contatos = (contatosRaw ?? [])
      .filter(c => !inativosNomes.has((c.medico ?? '').trim().toLowerCase()))
      .map(c => ({
      id: c.id,
      medico: c.medico,
      frequenciaIdeal: c.frequencia_ideal,
      ultimoContato: c.ultimo_contato,
      diasSemContato: c.ultimo_contato
        ? Math.floor((now.getTime() - new Date(c.ultimo_contato + 'T00:00:00').getTime()) / 86400000)
        : null,
      proximoContato: c.proximo_contato,
      tipoInteracao: c.tipo_interacao,
      status: c.status,
    }));

    contatos.sort((a, b) => (b.diasSemContato ?? 0) - (a.diasSemContato ?? 0));

    const emAlerta = contatos.filter(c => c.status?.toLowerCase().includes('aten'));
    const criticos = contatos.filter(c => (c.diasSemContato ?? 0) > 30);

    return NextResponse.json({
      kpis: {
        totalAtivos: ativos.length,
        totalInativos: inativos.length,
        aniversariantesDoMes: aniversariantes.length,
        emAlertaContato: emAlerta.length,
        criticos: criticos.length,
      },
      membros: rows,
      contatos,
      aniversariantes,
    });
  } catch (err) {
    console.error('[clientes-data]', err);
    return NextResponse.json({ error: 'Erro ao carregar dados de clientes.' }, { status: 500 });
  }
}
