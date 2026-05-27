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

    // Deduplicate by nome (clientes table may have duplicate active entries)
    const seenNomes = new Set<string>();
    const ativosDedupe = rows.filter(m => {
      if (m.situacao !== 'Ativo') return false;
      const key = m.nome.trim().toLowerCase();
      if (seenNomes.has(key)) return false;
      seenNomes.add(key);
      return true;
    });
    const ativos = ativosDedupe;
    const inativos = rows.filter(m => m.situacao === 'Inativo');

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const mesAtual = now.getMonth() + 1;
    const aniversariantes = rows.filter(m => {
      if (!m.data_nascimento) return false;
      return new Date(m.data_nascimento + 'T00:00:00').getMonth() + 1 === mesAtual;
    });

    // Deduplicate contatos by médico, keep the most recent (query ordered by created_at DESC)
    const contatoByMedico = new Map<string, typeof contatosRaw[0]>();
    for (const c of (contatosRaw ?? [])) {
      const key = (c.medico ?? '').trim().toLowerCase();
      if (!contatoByMedico.has(key)) {
        contatoByMedico.set(key, c);
      }
    }

    // Build member-centric contatos (one row per active member)
    const statusOrder: Record<string, number> = { 'Crítico': 0, 'Atenção': 1, 'Em dia': 2 };

    const contatos = ativos.map(m => {
      const key = m.nome.trim().toLowerCase();
      const c = contatoByMedico.get(key);

      const ultimoContato = c?.ultimo_contato ?? null;
      const proximoContato = c?.proximo_contato ?? null;

      const diasSemContato = ultimoContato
        ? Math.floor((now.getTime() - new Date(ultimoContato + 'T00:00:00').getTime()) / 86400000)
        : null;

      let status = '';
      if (ultimoContato || proximoContato) {
        status = 'Em dia';
        if (proximoContato) {
          const proximo = new Date(proximoContato + 'T00:00:00');
          const diffDays = Math.ceil((proximo.getTime() - now.getTime()) / 86400000);
          if (diffDays < 0) status = 'Crítico';
          else if (diffDays <= 3) status = 'Atenção';
        }
      }

      return {
        id: c?.id ?? null,
        medico: m.nome,
        clinica: m.clinica ?? null,
        frequenciaIdeal: c?.frequencia_ideal ?? null,
        ultimoContato,
        diasSemContato,
        proximoContato,
        tipoInteracao: c?.tipo_interacao ?? null,
        status,
      };
    });

    contatos.sort((a, b) => {
      const so = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
      if (so !== 0) return so;
      return (b.diasSemContato ?? -1) - (a.diasSemContato ?? -1);
    });

    const emAlerta = contatos.filter(c => c.status === 'Atenção' || c.status === 'Crítico');
    const criticos = contatos.filter(c => c.status === 'Crítico');

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
