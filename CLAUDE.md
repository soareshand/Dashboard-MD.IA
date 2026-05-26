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

**Database:** Supabase (PostgreSQL). `lib/supabase.ts` exports a single client using the service role key (bypasses RLS — no RLS policies are active). Google Sheets (`lib/google-sheets.ts`) is used only for one-time migration source data; all live data is in Supabase.

**Supabase tables:**
- `tokens` — one row per generated quiz link (`token`, `cliente_nome`, `clinica`, `email`, `quiz_type`, `extra_info`, `status`, `answered_at`)
- `quiz_renovacao_responses` — NPS renovation quiz answers (snake_case columns)
- `quiz_call_responses` — NPS call quality answers
- `quiz_treinamento_responses` — NPS training quality answers
- `clientes` — member registry (`situacao`, `nome`, `grupo`, `entrada`, `saida`, `cpf`, `endereco`, `cep`, `estado`, `telefone`, `email`, `data_nascimento`)
- `contratos` — contracts (`medico`, `status_contrato`, `valor`, `status_financeiro`, `nota_fiscal`, `observacoes`)
- `renovacoes` — renewals (`data`, `medico`, `status_contrato`, `valor`, `status_financeiro`)
- `contatos` — Monitoramento de Contato (`medico`, `frequencia_ideal`, `ultimo_contato`, `proximo_contato`, `tipo_interacao`, `status`)

**Data flow:**
1. CS generates link via dashboard modal → `POST /api/generate-link` → inserts into `tokens` → returns `quizUrl`
2. Doctor opens link → server reads token status from Supabase → if valid+pending, renders appropriate quiz client
3. Doctor submits → `POST /api/submit-quiz` (or `submit-nps-call` / `submit-nps-treinamento`) → inserts response row, marks token `respondido`
4. Dashboard polls `GET /api/dashboard-data` every 30s → aggregates KPIs from `quiz_renovacao_responses`

## Key files

- **`lib/supabase.ts`** — Single Supabase client (service role). Uses `cache: 'no-store'` in its custom `fetch` to bypass Next.js 14 fetch cache for all Supabase HTTP calls.
- **`lib/quiz-config.ts`** — The only file to edit when adding/removing rated tools. Each `ToolItem` `id` is a camelCase key that must match the `mapRow()` output in `dashboard-data/route.ts` and correspond to a snake_case column in `quiz_renovacao_responses`.
- **`app/api/dashboard-data/route.ts`** — Contains `mapRow()` that converts snake_case DB columns to the camelCase keys expected by `TOOL_ITEMS`. Keep this in sync with `quiz_renovacao_responses` schema.
- **`app/quiz/[token]/QuizClient.tsx`** — 6-step renovation quiz form. `OBJETIVOS_OPTIONS` and `DESAFIOS_OPTIONS` arrays at the top control predefined button options in Step 2.
- **`components/quiz/OptionSelector.tsx`** — Renders predefined option buttons + a purple "✏️ Outro" button that reveals a textarea for free text.
- **`app/dashboard/DashboardClient.tsx`** — Dashboard with 30s polling; `isEmbed` prop hides header.
- **`components/dashboard/GenerateLinkModal.tsx`** — Generates quiz links and shows a pre-built WhatsApp message (3 templates: renovação, pós-call, pós-treinamento) with the doctor's first name and the quiz URL embedded.
- **`components/dashboard/tabs/ClientesTab.tsx`** — Member registry with full CRUD via `MembroModal` (includes `estado` dropdown for Brazilian states). Monitoramento de Contato sub-tab has full CRUD via `ContatoModal` (médico is a dropdown of active members; próximo contato is auto-calculated from frequência + último contato). Members table supports filter by Ativo/Inativo and name search. Inactive members' contatos are filtered out server-side in `clientes-data`.
- **`components/dashboard/tabs/FinanceiroTab.tsx`** — Contracts and renewals with full CRUD via `ContratoModal` / `RenovacaoModal`.

**CRUD API pattern:** Each entity has `POST /api/{entity}` (create) and `PUT /api/{entity}/[id]` (update). All routes validate required fields and return `{ success: true, data }` or `{ error }`. Active CRUD entities: `clientes`, `contratos`, `renovacoes`, `contatos`.

**One-time migration routes (do not run again):** `POST /api/migrate-sheets` (clientes from Sheets), `POST /api/migrate-contatos` (296 contato rows from Sheets), `POST /api/patch-clientes-cpf` (backfilled cpf/cep/estado for 55 existing clientes).

**Temporary debug file to delete:** `app/api/debug-clientes/route.ts` — was used to diagnose the Next.js fetch cache bug; no longer needed.

## Important constraints

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
