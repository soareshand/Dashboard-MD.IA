import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getMembros, getPagamentos, getRenovacoes } from '@/lib/google-sheets';

function dateToISO(ddmmyyyy: string): string | null {
  if (!ddmmyyyy) return null;
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y || y.length !== 4) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function parseBRL(v: string): number {
  return Number(v.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.')) || 0;
}

export async function POST() {
  try {
    const [membros, pagamentos, renovacoes] = await Promise.all([
      getMembros(),
      getPagamentos(),
      getRenovacoes(),
    ]);

    // ── Clientes ────────────────────────────────────────────────────────────
    const clientesRows = membros
      .filter(m => m.nome.trim())
      .map(m => ({
        situacao: m.situacao || 'Ativo',
        nome: m.nome.trim(),
        grupo: m.grupo || null,
        entrada: dateToISO(m.dataEntrada),
        saida: dateToISO(m.dataSaida),
        cpf: m.cpf || null,
        endereco: m.endereco || (m.estado ? `Estado: ${m.estado}` : null),
        cep: m.cep || null,
        telefone: m.whatsapp || null,
        email: m.email || null,
        data_nascimento: dateToISO(m.dataNascimento),
      }));

    const { error: eClientes } = await supabase
      .from('clientes')
      .insert(clientesRows)
      .select('id');

    if (eClientes) throw new Error(`clientes: ${eClientes.message}`);

    // ── Contratos ────────────────────────────────────────────────────────────
    const contratosRows = pagamentos
      .filter(p => p.medico.trim())
      .map(p => ({
        medico: p.medico.trim(),
        status_contrato: p.contrato || 'Enviado',
        valor: parseBRL(p.valor),
        status_financeiro: p.statusFinanceiro || 'Em Aberto',
        nota_fiscal: p.notaFiscal || null,
        observacoes: p.observacoes || null,
      }));

    const { error: eContratos } = await supabase
      .from('contratos')
      .insert(contratosRows)
      .select('id');

    if (eContratos) throw new Error(`contratos: ${eContratos.message}`);

    // ── Renovações ────────────────────────────────────────────────────────────
    const renovacoesRows = renovacoes
      .filter(r => r.medico.trim())
      .map(r => ({
        data: dateToISO(r.data),
        medico: r.medico.trim(),
        status_contrato: r.contrato || 'Enviado',
        valor: parseBRL(r.valor),
        status_financeiro: r.statusFinanceiro || 'Em Aberto',
      }));

    const { error: eRenovacoes } = await supabase
      .from('renovacoes')
      .insert(renovacoesRows)
      .select('id');

    if (eRenovacoes) throw new Error(`renovacoes: ${eRenovacoes.message}`);

    return NextResponse.json({
      success: true,
      importados: {
        clientes: clientesRows.length,
        contratos: contratosRows.length,
        renovacoes: renovacoesRows.length,
      },
    });
  } catch (err) {
    console.error('[migrate-sheets]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro na migração.' },
      { status: 500 }
    );
  }
}
