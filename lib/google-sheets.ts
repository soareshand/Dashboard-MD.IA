import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

function getAuth() {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

async function ensureSheet(sheets: ReturnType<typeof getSheetsClient>, title: string, headers: string[]) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = meta.data.sheets?.some(s => s.properties?.title === title);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${title}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
  }
}

// ── Tokens ──────────────────────────────────────────────────────────────────

export interface TokenRow {
  token: string;
  nome: string;
  clinica: string;
  email: string;
  dataCriacao: string;
  status: 'pendente' | 'respondido';
  quizType: 'renovacao' | 'call' | 'treinamento';
  meta: string;
}

export async function saveToken(data: Omit<TokenRow, 'status' | 'dataCriacao'>) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tokens!A:H',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        data.token,
        data.nome,
        data.clinica,
        data.email,
        new Date().toISOString(),
        'pendente',
        data.quizType ?? 'renovacao',
        data.meta ?? '',
      ]],
    },
  });
}

export async function getToken(token: string): Promise<TokenRow | null> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tokens!A:H',
  });
  const rows = res.data.values ?? [];
  const row = rows.find(r => r[0] === token);
  if (!row) return null;
  return {
    token: row[0],
    nome: row[1],
    clinica: row[2],
    email: row[3],
    dataCriacao: row[4],
    status: row[5] as 'pendente' | 'respondido',
    quizType: (row[6] as TokenRow['quizType']) || 'renovacao',
    meta: row[7] ?? '',
  };
}

export async function markTokenAnswered(token: string) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tokens!A:A',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex(r => r[0] === token);
  if (rowIndex === -1) return;
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Tokens!F${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['respondido']] },
  });
}

export async function getAllTokens(): Promise<TokenRow[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tokens!A:H',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1).map(r => ({
    token: r[0] ?? '',
    nome: r[1] ?? '',
    clinica: r[2] ?? '',
    email: r[3] ?? '',
    dataCriacao: r[4] ?? '',
    status: (r[5] ?? 'pendente') as 'pendente' | 'respondido',
    quizType: (r[6] as TokenRow['quizType']) || 'renovacao',
    meta: r[7] ?? '',
  }));
}

// ── Respostas ────────────────────────────────────────────────────────────────

export interface QuizResponse {
  timestamp: string;
  token: string;
  nome: string;
  clinica: string;
  email: string;
  objetivo: string;
  objetivoAlcancado: string;
  maiorDesafio: string;
  crescimentoPacientes: string;
  reducaoTempoOperacional: string;
  investimentoRetorno: string;
  notaMentoriasGrupo: number;
  notaAcademy: number;
  notaAgenteIA: number;
  notaGerenteIA: number;
  notaAutomacoes: number;
  notaDashboard: number;
  notaCRM: number;
  notaTreinamentosCRM: number;
  notaSuporteEquipe: number;
  notaMentoriaGestao: number;
  pretendeRenovar: string;
  motivoNaoRenovar: string;
  indicaria: string;
  indicacaoContato: string;
  observacoes: string;
}

export async function saveQuizResponse(data: QuizResponse) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Respostas!A:Z',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        data.timestamp,
        data.token,
        data.nome,
        data.clinica,
        data.email,
        data.objetivo,
        data.objetivoAlcancado,
        data.maiorDesafio,
        data.crescimentoPacientes,
        data.reducaoTempoOperacional,
        data.investimentoRetorno,
        data.notaMentoriasGrupo,
        data.notaAcademy,
        data.notaAgenteIA,
        data.notaGerenteIA,
        data.notaAutomacoes,
        data.notaDashboard,
        data.notaCRM,
        data.notaTreinamentosCRM,
        data.notaSuporteEquipe,
        data.notaMentoriaGestao,
        data.pretendeRenovar,
        data.motivoNaoRenovar,
        data.indicaria,
        data.indicacaoContato,
        data.observacoes,
      ]],
    },
  });
}

export async function getAllResponses(): Promise<QuizResponse[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Respostas!A:Z',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1).map(r => ({
    timestamp: r[0] ?? '',
    token: r[1] ?? '',
    nome: r[2] ?? '',
    clinica: r[3] ?? '',
    email: r[4] ?? '',
    objetivo: r[5] ?? '',
    objetivoAlcancado: r[6] ?? '',
    maiorDesafio: r[7] ?? '',
    crescimentoPacientes: r[8] ?? '',
    reducaoTempoOperacional: r[9] ?? '',
    investimentoRetorno: r[10] ?? '',
    notaMentoriasGrupo: Number(r[11]) || 0,
    notaAcademy: Number(r[12]) || 0,
    notaAgenteIA: Number(r[13]) || 0,
    notaGerenteIA: Number(r[14]) || 0,
    notaAutomacoes: Number(r[15]) || 0,
    notaDashboard: Number(r[16]) || 0,
    notaCRM: Number(r[17]) || 0,
    notaTreinamentosCRM: Number(r[18]) || 0,
    notaSuporteEquipe: Number(r[19]) || 0,
    notaMentoriaGestao: Number(r[20]) || 0,
    pretendeRenovar: r[21] ?? '',
    motivoNaoRenovar: r[22] ?? '',
    indicaria: r[23] ?? '',
    indicacaoContato: r[24] ?? '',
    observacoes: r[25] ?? '',
  }));
}

// ── NPS Call ─────────────────────────────────────────────────────────────────

export interface QuizCallResponse {
  timestamp: string;
  token: string;
  nome: string;
  clinica: string;
  tipoCall: string;
  respondente: string;
  notaCall: number;
  necessidadeResolvida: string;
  notaCS: number;
  observacoes: string;
}

export async function getAllCallResponses(): Promise<QuizCallResponse[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Respostas NPS Call!A:J',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1).filter(r => r[0]).map(r => ({
    timestamp: r[0] ?? '',
    token: r[1] ?? '',
    nome: r[2] ?? '',
    clinica: r[3] ?? '',
    tipoCall: r[4] ?? '',
    respondente: r[5] ?? '',
    notaCall: Number(r[6]) || 0,
    necessidadeResolvida: r[7] ?? '',
    notaCS: Number(r[8]) || 0,
    observacoes: r[9] ?? '',
  }));
}

export async function saveQuizCallResponse(data: QuizCallResponse) {
  const sheets = getSheetsClient();
  await ensureSheet(sheets, 'Respostas NPS Call', [
    'Timestamp', 'Token', 'Nome', 'Clínica', 'Tipo Call', 'Respondente', 'Nota Call', 'Necessidade Resolvida', 'Nota CS', 'Observações',
  ]);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Respostas NPS Call!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        data.timestamp, data.token, data.nome, data.clinica,
        data.tipoCall, data.respondente, data.notaCall,
        data.necessidadeResolvida, data.notaCS, data.observacoes,
      ]],
    },
  });
}

// ── NPS Treinamento ───────────────────────────────────────────────────────────

export interface QuizTreinamentoResponse {
  timestamp: string;
  token: string;
  nome: string;
  clinica: string;
  ferramenta: string;
  respondente: string;
  notaTreinamento: number;
  notaClareza: number;
  segurancaUso: string;
  observacoes: string;
}

export async function getAllTreinamentoResponses(): Promise<QuizTreinamentoResponse[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Respostas NPS Treinamento!A:J',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1).filter(r => r[0]).map(r => ({
    timestamp: r[0] ?? '',
    token: r[1] ?? '',
    nome: r[2] ?? '',
    clinica: r[3] ?? '',
    ferramenta: r[4] ?? '',
    respondente: r[5] ?? '',
    notaTreinamento: Number(r[6]) || 0,
    notaClareza: Number(r[7]) || 0,
    segurancaUso: r[8] ?? '',
    observacoes: r[9] ?? '',
  }));
}

export async function saveQuizTreinamentoResponse(data: QuizTreinamentoResponse) {
  const sheets = getSheetsClient();
  await ensureSheet(sheets, 'Respostas NPS Treinamento', [
    'Timestamp', 'Token', 'Nome', 'Clínica', 'Ferramenta', 'Respondente', 'Nota Treinamento', 'Nota Clareza', 'Segurança para Usar', 'Observações',
  ]);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Respostas NPS Treinamento!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        data.timestamp, data.token, data.nome, data.clinica,
        data.ferramenta, data.respondente, data.notaTreinamento,
        data.notaClareza, data.segurancaUso, data.observacoes,
      ]],
    },
  });
}

// ── Cadastro de Mentorados ────────────────────────────────────────────────────

export interface MembroRow {
  situacao: string;
  dataEntrada: string;
  grupo: string;
  nome: string;
  dataNascimento: string;
  cpf: string;
  endereco: string;
  estado: string;
  cep: string;
  email: string;
  whatsapp: string;
  dataSaida: string;
}

export async function getMembros(): Promise<MembroRow[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Cadastro de Mentorados!A:M',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1)
    .filter(r => r[3])
    .map(r => ({
      situacao: r[0] ?? '',
      dataEntrada: r[1] ?? '',
      grupo: r[2] ?? '',
      nome: r[3] ?? '',
      dataNascimento: r[4] ?? '',
      cpf: r[5] ?? '',
      endereco: r[6] ?? '',
      estado: r[7] ?? '',
      cep: r[8] ?? '',
      email: r[9] ?? '',
      whatsapp: r[10] ?? '',
      dataSaida: r[12] ?? '',
    }));
}

// ── Controle de Pagamentos ────────────────────────────────────────────────────

export interface PagamentoRow {
  medico: string;
  contrato: string;
  valor: string;
  statusFinanceiro: string;
  notaFiscal: string;
  observacoes: string;
}

export async function getPagamentos(): Promise<PagamentoRow[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Controle de Pagamentos e Contra!A:F',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1)
    .filter(r => r[0])
    .map(r => ({
      medico: r[0] ?? '',
      contrato: r[1] ?? '',
      valor: r[2] ?? '',
      statusFinanceiro: r[3] ?? '',
      notaFiscal: r[4] ?? '',
      observacoes: r[5] ?? '',
    }));
}

// ── Renovações ────────────────────────────────────────────────────────────────

export interface RenovacaoRow {
  data: string;
  medico: string;
  contrato: string;
  valor: string;
  statusFinanceiro: string;
}

export async function getRenovacoes(): Promise<RenovacaoRow[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Renovações!A:G',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1)
    .filter(r => r[1])
    .map(r => ({
      data: r[0] ?? '',
      medico: r[1] ?? '',
      contrato: r[2] ?? '',
      valor: r[3] ?? '',
      statusFinanceiro: r[4] ?? '',
    }));
}

// ── Resgate ───────────────────────────────────────────────────────────────────

export interface ResgateRow {
  situacao: string;
  dataEntrada: string;
  grupo: string;
  nome: string;
  sequencia: string;
  respondeu: string;
  marcouCall: string;
  obs: string;
}

export async function getResgate(): Promise<ResgateRow[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Resgate!A:H',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1)
    .filter(r => r[3])
    .map(r => ({
      situacao: r[0] ?? '',
      dataEntrada: r[1] ?? '',
      grupo: r[2] ?? '',
      nome: r[3] ?? '',
      sequencia: r[4] ?? '',
      respondeu: r[5] ?? '',
      marcouCall: r[6] ?? '',
      obs: r[7] ?? '',
    }));
}

// ── Controle de Serviços ──────────────────────────────────────────────────────

export interface ServicoRow {
  grupo: string;
  nome: string;
  infiniteCRM: string;
  secretariaLeads: string;
  secretariaPacientes: string;
  gerenteEtiquetas: string;
  funil: string;
  experiencia: string;
  confirmAgendamento: string;
  avisoTarefas: string;
  infiniteForms: string;
  infinitePrompts: string;
  motivos: string;
}

export async function getServicos(): Promise<ServicoRow[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Controle de Serviços!A:Q',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1)
    .filter(r => r[1])
    .map(r => ({
      grupo: r[0] ?? '',
      nome: r[1] ?? '',
      infiniteCRM: r[2] ?? '',
      secretariaLeads: r[3] ?? '',
      secretariaPacientes: r[4] ?? '',
      gerenteEtiquetas: r[5] ?? '',
      funil: r[6] ?? '',
      experiencia: r[7] ?? '',
      confirmAgendamento: r[9] ?? '',
      avisoTarefas: r[10] ?? '',
      infiniteForms: r[13] ?? '',
      infinitePrompts: r[15] ?? '',
      motivos: r[16] ?? '',
    }));
}

// ── Monitoramento de Contato ──────────────────────────────────────────────────

export interface ContatoRow {
  medico: string;
  frequenciaIdeal: string;
  ultimoContato: string;
  diasSemContato: string;
  status: string;
  proximoContato: string;
  tipoInteracao: string;
}

export async function getMonitoramentoContato(): Promise<ContatoRow[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Monitoramento de Contato!A:I',
  });
  const rows = res.data.values ?? [];
  return rows.slice(1)
    .filter(r => r[0])
    .map(r => ({
      medico: r[0] ?? '',
      frequenciaIdeal: r[1] ?? '',
      tipoInteracao: r[3] ?? '',
      ultimoContato: r[5] ?? '',
      diasSemContato: r[6] ?? '',
      status: r[7] ?? '',
      proximoContato: r[8] ?? '',
    }));
}

// ── Presença nas Mentorias ────────────────────────────────────────────────────

export interface PresencaData {
  medicos: string[];
  sessoes: string[];
  grid: Record<string, Record<string, string>>;
}

export async function getPresencas(): Promise<PresencaData> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "'Presença nas Mentorias em Grupo'!A:AZ",
  });
  const rows = res.data.values ?? [];
  if (rows.length === 0) return { medicos: [], sessoes: [], grid: {} };

  const headerRow = rows[0];
  const sessoes = headerRow.slice(1).filter(Boolean) as string[];
  const medicos: string[] = [];
  const grid: Record<string, Record<string, string>> = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const medico = row[0];
    if (!medico) continue;
    medicos.push(medico);
    grid[medico] = {};
    for (let j = 1; j < headerRow.length; j++) {
      const sessao = headerRow[j];
      if (sessao) grid[medico][sessao] = row[j] ?? '';
    }
  }

  return { medicos, sessoes, grid };
}

// ── Excluir Sessão de Presença ────────────────────────────────────────────────

export async function deletePresencaSessao(sessao: string): Promise<void> {
  const sheets = getSheetsClient();
  const SHEET_NAME = 'Presença nas Mentorias em Grupo';

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetMeta = meta.data.sheets?.find(s => s.properties?.title === SHEET_NAME);
  if (sheetMeta?.properties?.sheetId == null) throw new Error('Sheet not found');
  const sheetId = sheetMeta!.properties!.sheetId!;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!1:1`,
  });
  const headerRow = res.data.values?.[0] ?? [];
  const colIndex = headerRow.indexOf(sessao);
  if (colIndex === -1) throw new Error('Sessão não encontrada.');

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: 'COLUMNS', startIndex: colIndex, endIndex: colIndex + 1 },
        },
      }],
    },
  });
}

// ── Registrar Presença ────────────────────────────────────────────────────────

function colIndexToLetter(index: number): string {
  let result = '';
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

export async function registrarPresenca(
  data: string,
  presencas: Record<string, 'Presente' | 'Faltou'>
) {
  const sheets = getSheetsClient();
  const SHEET = "'Presença nas Mentorias em Grupo'";

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:AZ`,
  });
  const rows = res.data.values ?? [];
  const headerRow = rows[0] ?? [];

  let colIndex = headerRow.indexOf(data);
  const isNewColumn = colIndex === -1;
  // Column A (index 0) is always reserved for doctor names; dates start at B (index 1)
  if (isNewColumn) colIndex = Math.max(1, headerRow.length);

  const colLetter = colIndexToLetter(colIndex);
  const updates: { range: string; values: string[][] }[] = [];
  const newRows: string[][] = [];

  if (isNewColumn) {
    updates.push({ range: `${SHEET}!${colLetter}1`, values: [[data]] });
  }

  for (const [medico, status] of Object.entries(presencas)) {
    const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === medico);
    if (rowIndex === -1) {
      // Doctor not yet in sheet — build a new row with the right column count
      const newRow = new Array(colIndex + 1).fill('');
      newRow[0] = medico;
      newRow[colIndex] = status;
      newRows.push(newRow);
    } else {
      updates.push({
        range: `${SHEET}!${colLetter}${rowIndex + 1}`,
        values: [[status]],
      });
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
    });
  }

  if (newRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A:A`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: newRows },
    });
  }
}

// ── Limpar todos os dados de presença ─────────────────────────────────────────

export async function clearPresencas(): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "'Presença nas Mentorias em Grupo'!A:AZ",
  });
}
