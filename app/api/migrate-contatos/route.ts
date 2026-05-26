import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getMonitoramentoContato } from '@/lib/google-sheets';

function dateToISO(raw: string): string | null {
  if (!raw) return null;
  const parts = raw.trim().split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Try ISO already
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
}

export async function POST() {
  try {
    const rows = await getMonitoramentoContato();

    const contatosRows = rows
      .filter(r => r.medico.trim())
      .map(r => ({
        medico: r.medico.trim(),
        frequencia_ideal: r.frequenciaIdeal || null,
        ultimo_contato: dateToISO(r.ultimoContato),
        proximo_contato: dateToISO(r.proximoContato),
        tipo_interacao: r.tipoInteracao || null,
        status: r.status || 'OK',
      }));

    const { error } = await supabase.from('contatos').insert(contatosRows);
    if (error) throw error;

    return NextResponse.json({ success: true, importados: contatosRows.length });
  } catch (err) {
    console.error('[migrate-contatos]', err);
    const msg = err instanceof Error
      ? err.message
      : (err as { message?: string })?.message ?? JSON.stringify(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
