# 📋 DOCUMENTAÇÃO COMPLETA — Sistema de Ordem de Serviço (OS) para Assistência Técnica

---

## 1. VISÃO GERAL

Sistema web completo de gestão de Ordens de Serviço para assistência técnica de notebooks e desktops. Desenvolvido em **Next.js 14** (App Router), **Prisma ORM**, **PostgreSQL**, com autenticação via **NextAuth.js** e interface totalmente em **Português (BR)**.

**Nome da empresa configurada:** DRT Informática  
**Domínios de produção:** `drtinfo.abacusai.app` e `testedrtinfo.abacusai.app`  
**Tema padrão:** Escuro (com opção de tema claro)

---

## 2. STACK TECNOLÓGICA

| Tecnologia | Uso |
|---|---|
| Next.js 14 (App Router) | Framework principal |
| TypeScript | Linguagem |
| Prisma ORM | Acesso ao banco de dados |
| PostgreSQL | Banco de dados |
| NextAuth.js | Autenticação (Credentials Provider, JWT) |
| Tailwind CSS | Estilização |
| Framer Motion | Animações |
| Lucide React | Ícones |
| Recharts | Gráficos do dashboard |
| html2canvas | Exportação PNG no cliente |
| AWS S3 | Upload de arquivos (logo) |
| Abacus.AI HTML2PDF API | Geração de PDF |
| Abacus.AI Notification API | Envio de e-mails |

---

## 3. ESTRUTURA DE PASTAS

```
nextjs_space/
├── app/
│   ├── layout.tsx                    # Layout raiz (fontes, meta, providers)
│   ├── page.tsx                      # Redirect: autenticado → /dashboard, senão → /login
│   ├── providers.tsx                 # SessionProvider + gerenciamento de tema
│   ├── globals.css                   # CSS global (variáveis de tema, scrollbar)
│   ├── login/page.tsx                # Página de login e cadastro
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # Handler NextAuth
│   │   │   └── login/route.ts          # Endpoint direto de login
│   │   ├── signup/route.ts             # Cadastro de usuário
│   │   ├── clientes/
│   │   │   ├── route.ts                # GET (listar) + POST (criar) clientes
│   │   │   └── [id]/route.ts           # GET/PUT/DELETE cliente específico
│   │   ├── ordens/
│   │   │   ├── route.ts                # GET (listar) + POST (criar) OS
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET/PUT/DELETE OS específica
│   │   │       ├── export/route.ts     # Exportação PDF
│   │   │       └── export-png/route.ts # Exportação PNG
│   │   ├── orcamentos/
│   │   │   ├── route.ts                # GET (listar) + POST (criar) orçamentos
│   │   │   └── [id]/route.ts           # GET/PUT/DELETE + POST (aprovar) orçamento
│   │   ├── dashboard/route.ts          # Dados agregados do dashboard
│   │   ├── relatorios/route.ts         # Relatórios financeiros
│   │   ├── tecnicos/route.ts           # Lista de técnicos
│   │   ├── settings/route.ts           # GET/PUT configurações da empresa
│   │   ├── upload/presigned/route.ts   # Gera URL pré-assinada para upload S3
│   │   └── notificacao/route.ts        # Envio de e-mails de notificação
│   └── (dashboard)/
│       ├── layout.tsx                  # Layout protegido (verifica autenticação)
│       ├── dashboard/
│       │   ├── page.tsx                # Página principal do dashboard
│       │   └── dashboard-chart.tsx     # Gráfico de barras mensal
│       ├── clientes/page.tsx           # CRUD de clientes
│       ├── orcamentos/
│       │   ├── page.tsx                # Lista de orçamentos
│       │   └── novo/page.tsx           # Formulário de novo orçamento
│       ├── ordens/
│       │   ├── page.tsx                # Lista de ordens de serviço
│       │   ├── nova/page.tsx           # Formulário de nova OS
│       │   └── [id]/page.tsx           # Detalhes/edição de OS específica
│       ├── relatorios/page.tsx         # Relatórios financeiros
│       └── configuracoes/page.tsx      # Personalização (logo, nome, tema, obs)
├── components/
│   ├── sidebar.tsx                     # Menu lateral de navegação
│   ├── dashboard-shell.tsx             # Shell do dashboard (sidebar + conteúdo)
│   ├── status-badge.tsx                # Badge de status das OS
│   ├── count-up.tsx                    # Animação de contagem numérica
│   └── modal.tsx                       # Modal reutilizável
├── lib/
│   ├── auth.ts                         # Configuração do NextAuth
│   ├── prisma.ts                       # Singleton do PrismaClient
│   ├── os-html-builder.ts             # Gerador de HTML para PDF e PNG
│   ├── aws-config.ts                  # Configuração S3
│   └── s3.ts                          # Funções de upload/download S3
├── prisma/
│   └── schema.prisma                  # Schema do banco de dados
└── scripts/
    └── seed.ts                        # Seed de usuários iniciais
```

---

## 4. MODELOS DO BANCO DE DADOS

### 4.1 User (Usuário/Técnico)
```
- id: String (CUID)
- name: String?
- email: String (unique)
- password: String? (hash bcrypt)
- role: String ("admin" | "tecnico") — padrão: "tecnico"
- Relações: ordensServico (técnico responsável)
```

### 4.2 Cliente
```
- id: String (CUID)
- nome: String
- telefone: String?
- whatsapp: String?
- email: String?
- cpfCnpj: String? (unique)
- endereco, cidade, estado, cep, bairro: String?
- Relações: ordensServico[], orcamentos[]
```

### 4.3 OrdemServico
```
- id: String (CUID)
- numero: Int (autoincrement, unique) — sequência inicia em 4674
- clienteId: String (FK → Cliente)
- tecnicoId: String? (FK → User)
- tipoEquipamento: String ("notebook" | "desktop") — padrão: "notebook"
- marca, modelo, numeroSerie: String?
- descricaoProblema: String (Text)
- diagnostico: String? (Text)
- status: String — valores: "aberta", "em_andamento", "aguardando_peca", "concluida", "cancelada"
- prazoEstimado: DateTime?
- valorTotal: Float (campo único para valor) — padrão: 0
- formaPagamento: String? — valores: "dinheiro", "pix", "cartao_debito", "cartao_credito", "transferencia", "boleto"
- dataPagamento: DateTime?
- observacoes: String? (Text)
- Relações: cliente, tecnico, orcamento?
```

### 4.4 Orcamento (NOVO)
```
- id: String (CUID)
- numero: Int (autoincrement, unique)
- nomeCliente: String
- telefoneCliente: String
- clienteId: String? (FK → Cliente) — preenchido automaticamente
- descricao: String (Text)
- valorTotal: Float — padrão: 0
- status: String — valores: "pendente", "aprovado", "recusado"
- observacoes: String? (Text)
- ordemServicoId: String? (unique, FK → OrdemServico) — preenchido ao aprovar
- Relações: cliente?, ordemServico?
```

### 4.5 Configuracao
```
- id: String (fixo: "config_unica")
- nomeEmpresa: String?
- logoUrl: String? (URL pública do S3)
- logoCloudPath: String? (caminho S3)
- tema: String ("escuro" | "claro") — padrão: "escuro"
- observacaoOS: String? (Text) — texto padrão exibido nas exportações
```

---

## 5. AUTENTICAÇÃO

- **Provider:** Credentials (email + senha com bcrypt)
- **Estratégia:** JWT
- **Papéis:** `admin` e `tecnico`
- **Página de login:** `/login` (com toggle para cadastro)
- **Proteção:** Middleware no layout `(dashboard)` verifica sessão via `getServerSession`
- **Todas as APIs** verificam sessão antes de executar

### Usuários seed:
| Email | Senha | Role |
|---|---|---|
| john@doe.com | johndoe123 | admin |
| tecnico@assistencia.com | tecnico123 | tecnico |
| tecnico2@assistencia.com | tecnico123 | tecnico |

---

## 6. FUNCIONALIDADES

### 6.1 Dashboard (`/dashboard`)
- Cards com contadores animados: OS abertas, em andamento, aguardando peça, concluídas, canceladas
- Total de clientes
- Faturamento do mês (soma de `valorTotal` das OS concluídas com `dataPagamento` no mês)
- Gráfico de barras: evolução mensal de OS e faturamento (últimos 6 meses)
- Lista das 5 OS mais recentes

### 6.2 Clientes (`/clientes`)
- Lista com busca por nome, CPF/CNPJ, e-mail, telefone, WhatsApp
- Modal para criar/editar cliente com campos: nome, telefone, WhatsApp, e-mail, CPF/CNPJ, endereço, bairro, cidade, estado, CEP
- Exclusão com confirmação (bloqueada se houver OS vinculadas)
- Mostra quantidade de OS por cliente

### 6.3 Orçamentos (`/orcamentos`) — NOVO
- **Lista** com busca e filtro por status (pendente/aprovado/recusado)
- **Novo orçamento** (`/orcamentos/novo`):
  - Campos: Nome do Cliente, Telefone/WhatsApp, Descrição do Serviço, Valor, Observações
  - **Cadastro automático do cliente:** ao salvar, o sistema busca um cliente pelo telefone; se não existir, cria automaticamente
- **Ações por orçamento:**
  - **Aprovar** → cria uma OS automaticamente com os dados do orçamento, vincula e redireciona para a OS
  - **Recusar** → marca como recusado
  - **Ver OS** → link para a OS gerada (quando aprovado)
  - **Excluir** → com confirmação

### 6.4 Ordens de Serviço (`/ordens`)
- **Lista** com busca (nome, número, marca, modelo) e filtros (status, período)
- **Nova OS** (`/ordens/nova`):
  - Selecionar cliente existente, equipamento (tipo, marca, modelo, nº série), problema, diagnóstico, técnico, prazo, valor, forma de pagamento, observações
- **Detalhes/Edição** (`/ordens/[id]`):
  - Visualização completa dos dados
  - Edição inline de todos os campos
  - Status editável: aberta, em_andamento, aguardando_peca, concluida, cancelada
  - **WhatsApp clicável:** número do cliente vira link `wa.me/55XXXXXXX` (abre em nova aba)
  - **Exportação PDF:** gera PDF em meia folha A4 (2 cópias por página)
  - **Exportação PNG:** gera imagem com a logo da empresa
  - **Excluir OS** com confirmação

### 6.5 Relatórios (`/relatorios`)
- Filtro por período (data início/fim)
- Cards: Total Em Aberto, Total Recebido, Total Geral, Ticket Médio
- Duas abas: "OS em Aberto" e "OS Pagas" com lista detalhada

### 6.6 Personalização (`/configuracoes`)
- Nome da empresa
- Upload de logo (via S3 presigned URL)
- Alternância de tema: escuro ↔ claro
- Observação padrão para exportações de OS

---

## 7. EXPORTAÇÕES

### 7.1 PDF (`/api/ordens/[id]/export`)
- Usa a API Abacus.AI HTML2PDF (Playwright)
- **Formato:** Meia folha A4 — gera 2 cópias idênticas da OS em uma única página A4
- Logo é convertida para **base64 inline** no servidor antes de enviar ao gerador de PDF
- Inclui: cabeçalho com logo + nome empresa, dados do cliente, equipamento, financeiro, status, problema/diagnóstico, área de assinatura, observação da empresa
- Download automático como `OS-{numero}.pdf`

### 7.2 PNG (`/api/ordens/[id]/export-png` + `html2canvas` no cliente)
- API retorna HTML com a logo já em **base64 data URI** (resolve problema de CORS do html2canvas)
- Usa `buildOSHtmlPng` — layout de card único, fonte maior, otimizado para imagem
- Renderiza em iframe oculto → html2canvas → download como `OS-{numero}.png`

---

## 8. TEMAS

### Tema Escuro (padrão)
```css
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--text-primary: #f1f5f9;
--text-secondary: #94a3b8;
--border: #334155;
```

### Tema Claro
```css
--bg-primary: #f1f5f9;
--bg-secondary: #ffffff;
--text-primary: #0f172a;
--text-secondary: #64748b;
--border: #cbd5e1;
```

### Cores fixas
```css
--accent: #2563eb;
--accent-light: #3b82f6;
```

O tema é controlado pelo atributo `data-theme` no `<html>`, gerenciado pelo componente `providers.tsx` que busca a configuração do banco.

---

## 9. NOTIFICAÇÕES POR E-MAIL

- Ao criar uma OS, o sistema envia e-mails automaticamente via API Abacus.AI:
  - **Para o admin** (`contato@drtinformatica.com.br`): notificação de nova OS
  - **Para o cliente** (se tiver e-mail cadastrado): confirmação de abertura
- IDs de notificação configurados via variáveis de ambiente:
  - `NOTIF_ID_NOVA_OS_NOTIFICAO_ADMIN`
  - `NOTIF_ID_NOVA_OS_CONFIRMAO_CLIENTE`

---

## 10. UPLOAD DE ARQUIVOS

- Usado para upload da **logo da empresa**
- Fluxo: cliente → `/api/upload/presigned` → recebe URL pré-assinada → upload direto ao S3
- Armazena `logoUrl` (URL pública) e `logoCloudPath` (chave S3) na tabela `Configuracao`

---

## 11. NAVEGAÇÃO (SIDEBAR)

Itens do menu:
1. 🏠 **Dashboard** → `/dashboard`
2. 👥 **Clientes** → `/clientes`
3. 📄 **Orçamentos** → `/orcamentos`
4. 📋 **Ordens de Serviço** → `/ordens`
5. 📊 **Relatórios** → `/relatorios`
6. ⚙️ **Personalização** → `/configuracoes`

O sidebar exibe a logo e nome da empresa (carregados de `/api/settings`) e atualiza em tempo real via evento `settings-change`.

---

## 12. FLUXO COMPLETO: ORÇAMENTO → OS

```
1. Usuário acessa /orcamentos/novo
2. Preenche: Nome do Cliente, Telefone, Descrição, Valor, Observações
3. Salva → Sistema verifica se cliente existe pelo telefone
   ├── Se existe → vincula ao cliente existente
   └── Se não existe → cria novo cliente automaticamente
4. Orçamento fica com status "pendente" na lista
5. Quando o cliente aprovar:
   → Usuário clica "Aprovar" no sistema
   → Sistema cria OS automaticamente (status "aberta")
   → Orçamento muda para status "aprovado" e vincula à OS
   → Usuário é redirecionado para a nova OS
6. Se o cliente não aprovar:
   → Usuário clica "Recusar" → orçamento fica com status "recusado"
```

---

## 13. STATUS DAS OS

| Status | Label | Cor |
|---|---|---|
| aberta | Aberta | Azul (#3b82f6) |
| em_andamento | Em Andamento | Amarelo (#f59e0b) |
| aguardando_peca | Aguardando Peça | Roxo (#a855f7) |
| concluida | Concluída | Verde (#22c55e) |
| cancelada | Cancelada | Vermelho (#ef4444) |

---

## 14. FORMAS DE PAGAMENTO

| Valor | Label |
|---|---|
| dinheiro | Dinheiro |
| pix | PIX |
| cartao_debito | Cartão Débito |
| cartao_credito | Cartão Crédito |
| transferencia | Transferência |
| boleto | Boleto |

---

## 15. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
ABACUSAI_API_KEY=...
WEB_APP_ID=...
AWS_BUCKET_NAME=...
AWS_FOLDER_PREFIX=...
NOTIF_ID_NOVA_OS_NOTIFICAO_ADMIN=...
NOTIF_ID_NOVA_OS_CONFIRMAO_CLIENTE=...
```

---

## 16. PADRÕES DE CÓDIGO

- Todas as páginas do dashboard são **client components** (`'use client'`)
- APIs usam `export const dynamic = 'force-dynamic'`
- Autenticação verificada em todas as APIs via `getServerSession(authOptions)`
- Prisma Client singleton em `lib/prisma.ts`
- CSS usa variáveis para temas dinâmicos
- Tailwind com cores customizadas mapeadas para variáveis CSS
- Componentes reutilizáveis: `Modal`, `StatusBadge`, `CountUp`, `Sidebar`
- Animações com Framer Motion em listas e transições de página

---

*Documento gerado automaticamente com base no estado atual do sistema.*
