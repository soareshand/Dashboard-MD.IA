# MD.IA — Sistema de NPS / Quiz CS

Sistema completo de avaliação de mentoria para a MD.IA, com quiz multi-step para médicos e dashboard de KPIs para a equipe de Customer Success.

---

## Estrutura

| Rota | Descrição |
|------|-----------|
| `/quiz/[token]` | Formulário de avaliação (acesso por link único) |
| `/dashboard` | Painel de KPIs (embedável via iframe) |
| `/dashboard?embed=true` | Versão sem header/footer para iframe no InfiniteGear |

---

## Setup — Passo a Passo

### 1. Clonar e instalar dependências

```bash
cd "Dashboard Quiz CS"
npm install
```

---

### 2. Criar projeto no Google Cloud e obter credenciais

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto (ex: `mdia-nps`)
3. Ative a **Google Sheets API**:
   - Menu → APIs e Serviços → Biblioteca → procure "Google Sheets API" → Ativar
4. Crie uma **Service Account**:
   - Menu → APIs e Serviços → Credenciais → Criar credenciais → Conta de serviço
   - Dê um nome (ex: `mdia-sheets-writer`)
   - Após criar, clique na conta → Aba **Chaves** → Adicionar chave → JSON
   - Baixe o arquivo JSON — ele contém `client_email` e `private_key`

---

### 3. Configurar o Google Sheets

1. Crie uma planilha em [sheets.google.com](https://sheets.google.com)
2. Copie o **ID da planilha** da URL:
   `https://docs.google.com/spreadsheets/d/**SEU_ID_AQUI**/edit`
3. **Compartilhe a planilha** com o email da Service Account (com permissão de Editor)
4. Crie duas abas na planilha com exatamente estes nomes:

#### Aba `Tokens`
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| token | nome | clinica | email | dataCriacao | status |

#### Aba `Respostas`
| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Token | Nome | Clínica | Email | Objetivo | Objetivo Alcançado | Maior Desafio | Crescimento Pacientes | Redução Tempo Op. | Investimento x Retorno | Mentorias Grupo | Academy | Agente IA | Gerente IA | Automações | Dashboard | CRM | Treinamentos CRM | Suporte Equipe | Mentoria Gestão | Pretende Renovar | Motivo Não Renovar | Indicaria | Indicação Contato | Observações |

> **Dica:** Adicione a linha de cabeçalho manualmente. As linhas de dados começam na linha 2.

---

### 4. Configurar envio de email (Resend)

1. Crie uma conta em [resend.com](https://resend.com)
2. Vá em **API Keys** → criar nova chave
3. Configure um domínio remetente (ex: `mdia.com.br`) ou use o domínio de teste do Resend
4. Copie a chave gerada (começa com `re_`)

> **Alternativa:** Se preferir SMTP, adapte `lib/email.ts` usando Nodemailer.

---

### 5. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_SERVICE_ACCOUNT_EMAIL=mdia-sheets-writer@mdia-nps.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_BASE_URL=https://mdia-nps.vercel.app
ALLOWED_EMBED_ORIGIN=https://app.infinitegear.com.br
```

> **Atenção com a private key:** Cole o valor completo entre aspas duplas, substituindo quebras de linha por `\n`.

---

### 6. Rodar localmente

```bash
npm run dev
```

Acesse:
- Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- Quiz (teste): [http://localhost:3000/quiz/TOKEN](http://localhost:3000/quiz/TOKEN)

---

### 7. Deploy no Vercel

1. Faça push do projeto para um repositório Git (GitHub, GitLab, Bitbucket)
2. Acesse [vercel.com](https://vercel.com) → Import Project
3. Selecione o repositório
4. Em **Environment Variables**, adicione todas as variáveis do `.env.local`
5. Clique em **Deploy**

> A URL gerada pelo Vercel deve ser usada como `NEXT_PUBLIC_BASE_URL`.

---

### 8. Configurar iframe no InfiniteGear SuperAdmin

Adicione um iframe apontando para:
```
https://mdia-nps.vercel.app/dashboard?embed=true
```

O parâmetro `?embed=true` remove o header/footer e deixa apenas o conteúdo do painel.

---

## Adicionar novas ferramentas ao quiz

Edite o arquivo [`lib/quiz-config.ts`](lib/quiz-config.ts) e adicione um novo objeto no array `TOOL_ITEMS`:

```ts
{ id: 'notaNovaFerramenta', label: 'Nome da Nova Ferramenta', emoji: '🔧' },
```

Em seguida, adicione a coluna correspondente na aba `Respostas` do Google Sheets e atualize as funções em `lib/google-sheets.ts` para incluir o novo campo.

---

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Google Sheets API v4** via googleapis
- **Resend** para envio de email
- **Recharts** para gráficos
- **Deploy:** Vercel
