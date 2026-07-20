
# Plano: módulos novos + revisão do painel admin

Escopo confirmado: (1) adicionar os módulos que faltam e (2) revisar o que já existe. Como é muito grande, entrego em 3 fases sequenciais — cada fase deixa o sistema utilizável antes de avançar.

## Fase A — Revisão do que já existe (curto)

Objetivo: garantir que Dashboard, Utilizadores, Técnicos, Assinaturas, Pagamentos, Serviços, Zonas, Denúncias, Logs, Definições e Gestão Admin funcionam ponta-a-ponta.

- Auditar cada rota `/admin/*` já existente: carregamento, mutações, RLS, sincronização com `/verificados` e `/pendentes`.
- Corrigir bugs encontrados (tipagem `bigint`, filtros, estados de loading, permissões).
- Confirmar auditoria: cada ação (ban, credenciar, aprovar subscrição, editar serviço/zona) grava em `admin_logs`.
- Confirmar credenciamento manual ativa WhatsApp/chamada no perfil público.

## Fase B — Módulos novos (núcleo)

Novas tabelas + RLS + GRANTs + páginas admin CRUD:

1. **Profissões** (`professions`) — nome, slug, ativo. CRUD admin. Relação opcional com técnicos.
2. **Categorias** (`categories`) — nome, slug, descrição, ativo. CRUD admin. Serviços passam a referenciar categoria.
3. **Avaliações** (`reviews`) — cliente → técnico/empresa, rating 1-5, comentário, status (visível/oculta). Admin aprova/oculta/elimina/responde.
4. **Promoções** (`promotions` + `coupons`) — campanha, código, desconto %, validade, ativo. CRUD admin.
5. **Notificações em massa** (`notifications`) — título, mensagem, público-alvo (todos/técnicos/empresas), lida/não-lida por utilizador (`notification_reads`). Admin envia; utilizador vê sino no header.
6. **Agendamentos** (`appointments`) — cliente, técnico, serviço, data, estado (pendente/confirmado/cancelado/concluído). Admin lista/filtra/cancela/reagenda. (Fluxo do cliente fica fora desta fase — só o CRUD admin e a visualização.)

Cada tabela segue o padrão obrigatório: CREATE → GRANT → ENABLE RLS → POLICIES + trigger `touch_updated_at`. Ações do admin registadas em `admin_logs`.

## Fase C — Polimento

- Sidebar admin reorganizada com os novos módulos agrupados (Catálogo: Profissões/Categorias/Serviços/Zonas; Operações: Assinaturas/Pagamentos/Agendamentos; Comunidade: Avaliações/Denúncias/Notificações; Sistema: Logs/Definições/Admins).
- Dashboard admin: cards com contadores reais (utilizadores, técnicos pendentes, subscrições ativas, receita do mês, novos registos 7d).
- Pesquisa global no topo do admin (utilizadores/técnicos/empresas por nome/email).
- Modo escuro no painel admin (toggle no header).

## Fora de escopo (posso fazer depois se pedir)

- Exportação PDF/Excel/CSV dos relatórios.
- Fluxo público de agendamento (cliente marca com técnico) — só admin nesta iteração.
- Editor visual de Termos/Política/Cores/Logo em runtime (hoje é código).
- Email em massa real (SMTP) — a Fase B guarda notificações in-app; email fica para quando ativar Brevo/Lovable Emails.

## Detalhes técnicos

- Stack atual: TanStack Start + Lovable Cloud (Supabase). Sem Next.js.
- Todas as tabelas novas em `public` com GRANTs corretos e RLS.
- Escritas privilegiadas via `has_role(auth.uid(),'admin')` nas policies; sem exposição a `anon`.
- Auditoria via `admin_logs` continua sendo a fonte única de verdade.
- Sem novos secrets/edge functions.

**Aprovas para eu começar pela Fase A e depois seguir para B?**
