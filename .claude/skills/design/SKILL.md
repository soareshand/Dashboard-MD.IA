---
description: Design system da MD.IA — cores, tipografia, componentes, padrões de layout. Use sempre que for criar ou revisar UI neste projeto ou em projetos futuros da MD.IA.
---

# MD.IA Design System

## Identidade visual

Tema escuro (dark-only). Paleta base em deep navy com acentos em azul elétrico e roxo. Nunca usar fundo branco ou light mode.

**Marca:** MD.IA HUB — tipografia `font-orbitron` em todas as referências à marca.

---

## Cores

### Texto
| Uso | Valor |
|-----|-------|
| Primário / conteúdo ativo | `text-white` |
| Secundário / muted (labels, legendas, subtítulos, estados inativos) | `#a2a2b2` |
| Placeholder em inputs | `#555570` |
| Texto alternativo muted | `#A0A0B0` |

**Nunca usar:** `#4B5E72`, `#5858A0`, `#374151`, `#6B7A8D` — sempre substituir por `#a2a2b2`.

### Fundos
| Uso | Valor |
|-----|-------|
| Página / seções principais | `#0D0D1A` ou `#1A1A2E` |
| Cards, inputs, botões inativos | `#12122A` |
| Hover sutil em cards | `#16162A` |

### Acentos
| Uso | Valor |
|-----|-------|
| Acento principal / sidebar ativo | `#3B9EF5` |
| Ícone sidebar ativo | `#3B9EF5` |
| Ícone sidebar inativo | `#ffffff` |
| Label sidebar ativa | `text-white` |
| Label sidebar inativa | `text-[#a2a2b2]` |

### Gradientes
| Uso | Gradiente |
|-----|-----------|
| Ação primária (botões, seleção padrão) | `from-[#4A90E2] to-[#6EC6FF]` |
| Encerramento / multi-select | `from-[#6D28D9] to-[#8B5CF6]` |
| Barra de progresso quiz encerramento | `linear-gradient(90deg, #6D28D9, #A78BFA)` |
| Barra de progresso quiz padrão | `linear-gradient(90deg, #4A90E2, #6EC6FF)` |
| Badge encerramento | `bg-[rgba(139,92,246,0.15)]` border `rgba(139,92,246,0.2)` text `#A78BFA` |

### Bordas
| Uso | Valor |
|-----|-------|
| Borda padrão (blue tint) | `border-[rgba(74,144,226,0.2)]` |
| Borda purple tint | `border-[rgba(139,92,246,0.2)]` |
| Borda active/focus | `border-[#4A90E2]` ou `border-[#8B5CF6]` |

### Sombras / Glow
| Uso | Valor |
|-----|-------|
| Elemento ativo (azul) | `shadow-[0_0_12px_rgba(74,144,226,0.35)]` |
| Elemento ativo (roxo) | `shadow-[0_0_12px_rgba(109,40,217,0.35)]` |
| Botão ativo (scale) | `scale-105` |

---

## Tipografia

| Fonte | Uso |
|-------|-----|
| `font-orbitron` | Títulos, valores KPI numéricos, contadores de step, nome da marca, sidebar header |
| `font-sora` | Corpo, labels, botões, descrições, placeholders, textos de formulário |

---

## Componentes padrão

### Botões
```tsx
// Ação primária
<button className="py-2.5 rounded-xl btn-glow text-white font-sora font-semibold text-sm">

// Opção selecionada (azul)
className="bg-gradient-to-r from-[#4A90E2] to-[#6EC6FF] text-white border-transparent shadow-[0_0_12px_rgba(74,144,226,0.35)]"

// Opção selecionada (roxo — encerramento/multi)
className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white border-transparent shadow-[0_0_12px_rgba(109,40,217,0.35)]"

// Opção não selecionada
className="bg-[#12122A] text-[#A0A0B0] border-[rgba(74,144,226,0.2)] hover:border-[#4A90E2] hover:text-white"

// Voltar / secundário
className="px-4 py-2.5 rounded-xl border border-[rgba(74,144,226,0.2)] text-[#A0A0B0] hover:text-white text-sm"
```

### Inputs / Textarea
```tsx
className="w-full bg-[#12122A] border border-[rgba(74,144,226,0.25)] rounded-xl px-4 py-3 text-white placeholder-[#555570] focus:outline-none focus:border-[#4A90E2] transition-all font-sora text-sm resize-none"
```

### Cards KPI
```tsx
<div className="bg-[#12122A] rounded-2xl p-5 border border-[rgba(74,144,226,0.1)]">
  <p className="text-[#a2a2b2] text-xs font-sora">Label</p>
  <p className="text-3xl font-orbitron font-bold text-white mt-1">Valor</p>
</div>
```

### Badges / Pills
```tsx
// Badge padrão azul
<span className="px-2 py-0.5 rounded-full text-xs bg-[rgba(74,144,226,0.15)] text-[#6EC6FF] border border-[rgba(74,144,226,0.2)]">

// Badge roxo (encerramento)
<span className="px-2 py-0.5 rounded-full text-xs bg-[rgba(139,92,246,0.15)] text-[#A78BFA] border border-[rgba(139,92,246,0.2)]">
```

### Border radius padrão
- Botões e inputs: `rounded-xl`
- Cards maiores: `rounded-2xl`
- Pills/badges: `rounded-full`
- Progresso bar: `rounded-full`

---

## Layout do Dashboard

### Modo completo (sidebar)
- Sidebar fixa à esquerda com branding `font-orbitron`: "MD.IA HUB / Customer Success"
- `SidebarIcon` com SVGs: ativo `#3B9EF5`, inativo `#ffffff`
- Labels: ativa `text-white`, inativa `text-[#a2a2b2]`

### Modo embed (`?embed=true`)
- Top-bar horizontal (sem sidebar)
- Usado para iframe no InfiniteGear SuperAdmin CRM

### Sub-tabs
```tsx
// Estilo de tab ativa com gradiente
style={{ background: 'linear-gradient(135deg, #4A90E2, #6EC6FF)' }}

// Tab inativa
className="bg-[#12122A] text-[#a2a2b2] border border-[rgba(74,144,226,0.2)]"
```

---

## Layout dos Quizzes

- Fundo escuro consistente com o dashboard
- Barra de progresso no topo com gradiente da categoria
- Header: nome + clínica em `text-[#A0A0B0]` + badge da categoria
- Contador de step: `font-mono text-xs text-[#A0A0B0]`
- NPS grid: `grid grid-cols-6 gap-2 sm:grid-cols-11` — números `font-orbitron font-bold`

---

## Cores semânticas (status/feedback)

| Significado | Cor |
|-------------|-----|
| Sucesso / positivo | `#10B981` (green-500) |
| Atenção / alerta | `#F59E0B` (amber-400) |
| Erro / negativo | `#EF4444` (red-500) |
| Info / neutro | `#3B9EF5` |
| NPS promotor (9-10) | azul `#3B9EF5` |
| NPS neutro (7-8) | roxo `#8B5CF6` |
| NPS detrator (0-6) | amarelo `#F59E0B` |
