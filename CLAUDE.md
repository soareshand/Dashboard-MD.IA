# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

To stop the dev server on Windows when Ctrl+C doesn't work:
```powershell
Get-Process -Name "node" | Stop-Process -Force
```

## Architecture

Two public surfaces, no authentication:

- **`/quiz/[token]`** — Public multi-step NPS form for doctors, accessed via unique link. Server component validates the token via Supabase before rendering the client form.
- **`/dashboard`** — KPI panel for the CS team. Supports `?embed=true` to strip header/footer for iframe embedding in InfiniteGear SuperAdmin CRM.

**Database:** Supabase (PostgreSQL). `lib/supabase.ts` exports a single client using the service role key (bypasses RLS — no RLS policies are active). Google Sheets (`lib/google-sheets.ts`) is still used for presença data (read/write) and the `validate-token` legacy route; all other live data is in Supabase.

**Supabase tables:**
- `tokens` — one row per generated quiz link (`token`, `cliente_nome`, `clinica`, `email`, `quiz_type`, `extra_info`, `status`, `answered_at`)
- `quiz_renovacao_responses` — NPS renovation quiz answers (snake_case columns)
- `quiz_call_responses` — NPS call quality answers
- `quiz_treinamento_responses` — NPS training quality answers
- `clientes` — member registry (`situacao`, `nome`, `clinica`, `grupo`, `entrada`, `saida`, `cpf`, `endereco`, `cep`, `estado`, `telefone`, `email`, `data_nascimento`)
- `contratos` — contracts (`medico`, `status_contrato`, `valor`, `status_financeiro`, `nota_fiscal`, `observacoes`)
- `renovacoes` — renewals (`data`, `medico`, `status_contrato`, `valor`, `status_financeiro`)
- `contatos` — Monitoramento de Contato (`medico`, `frequencia_ideal`, `ultimo_contato`, `proximo_contato`, `tipo_interacao`, `status`)

**Data flow:**
1. CS generates link via dashboard modal → `POST /api/generate-link` → inserts into `tokens` → returns `quizUrl`
2. Doctor opens link → server reads token status from Supabase → if valid+pending, renders appropriate quiz client
3. Doctor submits → `POST /api/submit-quiz` (or `submit-nps-call` / `submit-nps-treinamento`) → inserts response row, marks token `respondido`
4. Dashboard polls `GET /api/dashboard-data` every 30s → aggregates KPIs from `quiz_renovacao_responses`. Response shape: `{ kpis, toolAverages, objetivoDistribuicao, resultadosPercebidos, recentResponses, lastUpdated }`. `resultadosPercebidos` has `crescimentoPacientes`, `reducaoTempo`, `investimentoRetorno` — each with counts per answer variant.

## Key files

- **`lib/supabase.ts`** — Single Supabase client (service role). Uses `cache: 'no-store'` in its custom `fetch` to bypass Next.js 14 fetch cache for all Supabase HTTP calls.
- **`lib/quiz-config.ts`** — The only file to edit when adding/removing rated tools. Each `ToolItem` `id` is a camelCase key that must match the `mapRow()` output in `dashboard-data/route.ts` and correspond to a snake_case column in `quiz_renovacao_responses`.
- **`app/api/dashboard-data/route.ts`** — Contains `mapRow()` that converts snake_case DB columns to the camelCase keys expected by `TOOL_ITEMS`. Keep this in sync with `quiz_renovacao_responses` schema.
- **`app/quiz/[token]/QuizClient.tsx`** — 6-step renovation quiz form. `OBJETIVOS_OPTIONS` and `DESAFIOS_OPTIONS` arrays at the top control predefined button options in Step 2.
- **`components/quiz/OptionSelector.tsx`** — Renders predefined option buttons + a purple "✏️ Outro" button that reveals a textarea for free text. Accepts optional `multi?: boolean` prop — when true, multiple options can be toggled and the value is stored as a comma-separated string (`"A, B, C"`). Single-select (default) stores one value or the free-text string directly.
- **`app/dashboard/DashboardClient.tsx`** — Dashboard layout with sidebar (full mode) or top-bar (embed mode); `isEmbed` prop switches layouts. Sidebar branded as "MD.IA HUB / Customer Success" using `font-orbitron`. `SidebarIcon` renders SVG icons — active color `#3B9EF5`, inactive `#ffffff`; active labels `text-white`, inactive `text-[#a2a2b2]`.
- **`app/api/geral-data/route.ts`** — Aggregates all client health data for the Geral tab. Fetches clientes, presencas, all quiz types, contatos, produtos_catalogo, and contratos in parallel. Builds `calcScore()` (0–10 scale): Produtos ativos (2.5 pts), NPS média (2.5 pts), Taxa presença (2 pts), Status contato (1 pt), Dias renovação (1 pt), Status contrato (1 pt — only "assinado" or "não precisa"). Contract lookup is case-insensitive (`.toLowerCase()`) to handle name variations between `contratos.medico` and `clientes.nome`. Returns `{ cards, totalProdutos, catalog }`.
- **`components/dashboard/GenerateLinkModal.tsx`** — Generates quiz links and shows a pre-built WhatsApp message (3 templates: renovação, pós-call, pós-treinamento). Renovação: dropdown of active doctors (from `clientes-data`), auto-fills clinic. Pós-call/treinamento: Médico/Equipe toggle — Médico shows doctor dropdown (auto-fills clinic); Equipe shows text input + clinic dropdown from existing clientes. Greeting uses "Dr./Dra. + first name" for médico flows, plain name for equipe.
- **`components/dashboard/tabs/ClientesTab.tsx`** — Member registry with full CRUD via `MembroModal` (includes `clinica`, `estado` dropdown for Brazilian states). Members table shows 6 columns only (Situação, Grupo, Nome, Entrada, Saída, Renovação) — all other fields (CPF, telefone, etc.) remain accessible via the edit modal. Monitoramento de Contato sub-tab has full CRUD via `ContatoModal` (médico is a dropdown of active members; próximo contato is auto-calculated from frequência + último contato). Members table supports filter by Ativo/Inativo and name search. Inactive members' contatos are filtered out server-side in `clientes-data`.
- **`components/dashboard/tabs/FinanceiroTab.tsx`** — Contracts and renewals with full CRUD via `ContratoModal` / `RenovacaoModal`. The `medico` field in both modals is a `<select>` populated from `/api/clientes-data` active members (format: "Clínica — Nome"), preventing name mismatches with the `clientes` table. Tables are sorted alphabetically by médico using `localeCompare('pt-BR')`. Status do contrato options: Assinado, Pendente, Em análise, Não precisa.

**CRUD API pattern:** Each entity has `POST /api/{entity}` (create) and `PUT /api/{entity}/[id]` (update). All routes validate required fields and return `{ success: true, data }` or `{ error }`. Active CRUD entities: `clientes`, `contratos`, `renovacoes`, `contatos`.

**Design system — text colors:** `#a2a2b2` is the standard for all muted/secondary text (labels, subtitles, legends, inactive states). `text-white` for primary/active content. `#3B9EF5` for accents/active sidebar. Never use dark gray variants like `#4B5E72`, `#5858A0`, `#374151`, `#6B7A8D` — replace with `#a2a2b2`. Font `font-orbitron` for headings and numeric values; `font-sora` for body text and labels.

**One-time migration routes (do not run again):** `POST /api/migrate-sheets` (clientes from Sheets), `POST /api/migrate-contatos` (296 contato rows from Sheets), `POST /api/patch-clientes-cpf` (backfilled cpf/cep/estado for 55 existing clientes).

**Orphaned tabs (not wired into DashboardClient):** `ServicosTab.tsx` and `ResgateTab.tsx` exist in `components/dashboard/tabs/` but are not imported. Their corresponding API routes (`servicos-data`, `resgate-data`) still read from Google Sheets.

## Important constraints

**`export const dynamic = 'force-dynamic'`:** All Supabase-backed API routes must export this to avoid Next.js trying to statically render them at build time. Currently applied to: `clientes-data`, `financeiro-data`, `dashboard-data`, `nps-call-data`, `nps-treinamento-data`. Add it to any new Supabase route.

**snake_case ↔ camelCase mapping:** Supabase returns snake_case columns. `mapRow()` in `dashboard-data/route.ts` converts them to camelCase for `TOOL_ITEMS` compatibility. When adding a new tool, add the snake_case column to the DB table AND add the camelCase mapping in `mapRow()`.

**Renovation rate filtering:** Quiz saves `'✅ Sim'` / `'❌ Não'` but dashboard filters with `.includes('Sim')` / `.includes('Não')` to handle both emoji and plain variants. Do not change this to strict equality.

**Email is fully optional:** `lib/email.ts` uses a lazy `getResend()` function (not module-level instantiation) to avoid build errors when `RESEND_API_KEY` is absent. The generate-link API uses dynamic `import('@/lib/email')` inside a conditional. Never move Resend to a top-level import.

**iframe embedding:** `next.config.js` sets `frame-ancestors` CSP and CORS headers. `ALLOWED_EMBED_ORIGIN` env var controls the allowed origin (defaults to `*` in development).

**`NEXT_PUBLIC_BASE_URL`:** Controls the base URL for generated quiz links. Must match the actual dev server port. If the server starts on a different port (e.g. 3001, 3002 due to conflicts), update `.env.local` and restart.

**Adding a new tool to the quiz:**
1. Add entry to `TOOL_ITEMS` in `lib/quiz-config.ts`
2. Add the snake_case column to `quiz_renovacao_responses` in Supabase
3. Add the camelCase mapping in `mapRow()` in `app/api/dashboard-data/route.ts`
4. Add the snake_case insert in `app/api/submit-quiz/route.ts`
