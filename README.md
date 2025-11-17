# 🧠 Psicoflow - Sistema de Triagem Psicológica IFAM CMZL

## 📋 Sobre o Projeto

O **Psicoflow** é uma plataforma completa de gestão de saúde mental desenvolvida para o Instituto Federal do Amazonas - Campus Manaus Zona Leste (IFAM CMZL). O sistema integra um chatbot de triagem via Telegram com um dashboard administrativo web, permitindo uma gestão eficiente e humanizada do atendimento psicológico aos estudantes.

O sistema foi desenvolvido como parte de um Trabalho de Conclusão de Curso (TCC) e visa modernizar o processo de triagem psicológica, tornando-o mais acessível, eficiente e acolhedor para os estudantes.

<img width="1412" height="771" alt="image" src="https://github.com/user-attachments/assets/2f9347bd-99ac-4729-8d5f-5c7b9f0be379" />

### 🎯 Funcionalidades Principais

#### 🤖 Chatbot de Triagem (Telegram)
- **Triagem Conversacional**: Bot acolhedor que guia estudantes através de um fluxo estruturado
- **Escalas Validadas**: Aplicação automática das escalas PHQ-9 (depressão) e GAD-7 (ansiedade)
- **Inteligência Artificial**: Integração com Google Gemini para:
  - Classificação emocional de mensagens
  - Análise integrada de sintomas
  - Geração de relatórios técnicos estruturados
- **Detecção de Crise**: Identificação automática de sinais de risco com protocolo de emergência
- **Validação Rigorosa**: Validação de todas as respostas do usuário antes de avançar

#### 📊 Dashboard Administrativo Web
- **Gestão de Triagens**:
  - Visualização de todas as triagens realizadas
  - Ordenação por prioridade clínica (casos graves primeiro)
  - Filtros por status, risco e período
  - Visualização completa de relatórios gerados pela IA
  - Exportação e impressão de dados
  
- **Gestão de Alunos**:
  - Cadastro e edição de estudantes
  - Histórico completo de triagens por aluno
  - Busca avançada por nome, matrícula, curso
  - Importação em lote via CSV
  
- **Agendamento de Consultas**:
  - Criação de agendamentos vinculados a triagens
  - Calendário visual de atendimentos
  - Gestão de status (Pendente, Confirmado, Realizado, Cancelado)
  - Filtros por profissional, período e status
  
- **Registro de Atendimentos**:
  - Notas de sessão estruturadas
  - Campos para queixa, resumo, observações e evolução
  - Histórico completo de atendimentos por aluno
  
- **Dashboard Analítico**:
  - KPIs em tempo real (alunos atendidos, sessões agendadas, casos em andamento)
  - Gráficos de distribuição de risco
  - Alertas para casos prioritários
  - Visualizações de tendências

#### 🔍 Avaliação de Risco
- **Classificação Automática**: Níveis de risco baseados em PHQ-9 e GAD-7:
  - Mínimo (0-4 pontos)
  - Leve (5-9 pontos)
  - Moderado (10-14 pontos)
  - Moderadamente Grave (15-19 pontos)
  - Grave (20-27 pontos)
- **Priorização Inteligente**: Ordenação automática por prioridade clínica
- **Análise Integrada**: Combinação de scores e relatos livres para avaliação completa

#### 🔐 Segurança e Autenticação
- Autenticação JWT para profissionais
- Controle de acesso por roles
- Upload seguro de avatares
- Proteção de rotas sensíveis

### 🛠️ Tecnologias Utilizadas

#### Backend
- **Node.js** com **Express 5** - Framework web robusto
- **TypeScript** - Tipagem estática para maior segurança
- **Prisma ORM** - ORM moderno com migrações automáticas
- **PostgreSQL 16** - Banco de dados relacional
- **JWT** - Autenticação baseada em tokens
- **Swagger/OpenAPI** - Documentação interativa da API
- **Zod** - Validação de schemas
- **Multer** - Upload de arquivos
- **Helmet** - Segurança HTTP
- **Rate Limiting** - Proteção contra abuso

#### Frontend
- **Next.js 15** - Framework React com SSR
- **React 19** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Material-UI (MUI) v7** - Componentes de UI
- **MUI X Data Grid** - Tabelas avançadas com ordenação e filtros
- **ApexCharts** e **Recharts** - Visualizações de dados
- **React Hook Form** - Gerenciamento de formulários
- **Axios** - Cliente HTTP
- **Day.js** - Manipulação de datas

#### Infraestrutura
- **Docker** e **Docker Compose** - Containerização
- **PostgreSQL 16** - Banco de dados
- **Health Checks** - Monitoramento de serviços

---

## 🚀 Guia de Instalação e Execução

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker** e **Docker Compose** ([Download Docker](https://www.docker.com/get-started))
- **Node.js 18+** e **npm** ([Download Node.js](https://nodejs.org/))
- Portas `3001` (frontend) e `4000` (backend) livres na máquina
- **Git** (opcional, para clonar o repositório)

### 📦 Passo 1: Instalação das Dependências

Antes de subir os containers, é necessário instalar as dependências localmente (elas serão montadas nos containers via volumes):

#### Backend
```bash
cd TCC2-DashboardPsicologia/backend
npm install
```

#### Frontend
```bash
cd TCC2-DashboardPsicologia/frontend
npm install
```

> **💡 Nota**: As dependências são instaladas localmente e montadas nos containers via volumes. Isso otimiza o tempo de inicialização e permite hot-reload durante o desenvolvimento.

### ⚙️ Passo 2: Configuração do Ambiente

Crie os arquivos `.env` necessários com as variáveis de ambiente:

#### 1. Arquivo `.env` na raiz (para PostgreSQL)
```env
POSTGRES_USER=ifam
POSTGRES_PASSWORD=sua_senha_segura_aqui
POSTGRES_DB=ifam_psico
```

#### 2. Arquivo `backend/.env`
```env
# Banco de Dados
DATABASE_URL="postgresql://ifam:sua_senha_segura_aqui@postgres:5432/ifam_psico"

# Autenticação
JWT_SECRET="seu-jwt-secret-super-seguro-aqui"

# Servidor
PORT=4000
NODE_ENV=development

# Integração com Bot
BOT_SHARED_SECRET="seu_segredo_compartilhado_com_bot"

# CORS (opcional)
CORS_ORIGIN="http://localhost:3001"
```

#### 3. Arquivo `frontend/.env`
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

> **⚠️ Importante**: 
> - Use senhas fortes em produção
> - O `BOT_SHARED_SECRET` deve ser o mesmo configurado no bot do Telegram
> - Nunca commite arquivos `.env` no repositório

### 🐳 Passo 3: Executando com Docker Compose

#### 1. Acesse a pasta do projeto
```bash
cd TCC2-DashboardPsicologia
```

#### 2. Suba os serviços (frontend, backend e banco de dados)
```bash
docker compose up --build -d
```

O comando `--build` garante que as imagens sejam reconstruídas caso haja alterações nos Dockerfiles.

#### 3. Aplique as migrações do banco de dados

**Para produção/primeira execução:**
```bash
# Gerar o cliente Prisma
docker compose exec backend npx prisma generate

# Aplicar as migrações
docker compose exec backend npx prisma migrate deploy
```

**Para desenvolvimento (cria novas migrações se necessário):**
```bash
docker compose exec backend npx prisma migrate dev --name init
```

#### 4. (Opcional) Popular o banco com dados de exemplo
```bash
docker compose exec backend npm run db:seed
```

#### 5. Verifique se os serviços estão rodando
```bash
docker compose ps
```

Você deve ver três containers: `ifam-postgres`, `ifam-backend` e `ifam-frontend`, todos com status "Up".

### 🌐 Passo 4: Acessando a Aplicação

Após subir os containers, acesse:

- **🏠 Dashboard Web**: [http://localhost:3001/dashboard](http://localhost:3001/dashboard)
- **📋 Página de Triagens**: [http://localhost:3001/dashboard/triagem](http://localhost:3001/dashboard/triagem)
- **👥 Gestão de Alunos**: [http://localhost:3001/dashboard/alunos](http://localhost:3001/dashboard/alunos)
- **📅 Agendamentos**: [http://localhost:3001/dashboard/agendamento](http://localhost:3001/dashboard/agendamento)
- **💼 Atendimentos**: [http://localhost:3001/dashboard/atendimento](http://localhost:3001/dashboard/atendimento)
- **🔍 API Health Check**: [http://localhost:4000/health](http://localhost:4000/health)
- **📚 Documentação Swagger**: [http://localhost:4000/docs](http://localhost:4000/docs)

### 🔐 Credenciais Padrão

Após executar o seed, você pode fazer login com:

- **Email**: `admin@teste.com`
- **Senha**: `Admin@1234`

> ⚠️ **IMPORTANTE**: Altere essas credenciais imediatamente em produção!

---

## 📝 Comandos Úteis

### 🐳 Gerenciamento de Containers

```bash
# Ver logs do backend em tempo real
docker compose logs -f backend

# Ver logs do frontend em tempo real
docker compose logs -f frontend

# Ver logs de todos os serviços
docker compose logs -f

# Parar todos os serviços
docker compose down

# Parar e remover volumes (⚠️ APAGA DADOS DO BANCO)
docker compose down -v

# Reiniciar um serviço específico
docker compose restart backend
docker compose restart frontend

# Reconstruir e subir um serviço específico
docker compose up --build -d backend
```

### 🗄️ Banco de Dados

```bash
# Acessar o Prisma Studio (interface visual do banco)
docker compose exec backend npx prisma studio
# Acesse: http://localhost:5555

# Criar uma nova migração
docker compose exec backend npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações pendentes
docker compose exec backend npx prisma migrate deploy

# Resetar o banco de dados (⚠️ APAGA TODOS OS DADOS)
docker compose exec backend npx prisma migrate reset

# Gerar o Prisma Client (após mudanças no schema)
docker compose exec backend npx prisma generate

# Popular banco com dados de exemplo
docker compose exec backend npm run db:seed

# Limpar banco de dados (remover todos os registros)
docker compose exec backend npm run db:clear
```

### 💻 Desenvolvimento

```bash
# Executar comandos dentro do container backend
docker compose exec backend <comando>

# Executar comandos dentro do container frontend
docker compose exec frontend <comando>

# Acessar o shell do container backend
docker compose exec backend sh

# Acessar o shell do container frontend
docker compose exec frontend sh

# Executar testes (quando implementados)
docker compose exec backend npm test
docker compose exec frontend npm test
```

### 🔧 Manutenção

```bash
# Ver uso de recursos dos containers
docker stats

# Limpar cache do Docker
docker system prune -a

# Verificar saúde dos serviços
docker compose ps
```

---

## 🏗️ Estrutura Detalhada do Projeto

```
TCC2-DashboardPsicologia/
├── backend/                      # API Node.js/Express
│   ├── src/
│   │   ├── modules/              # Módulos da aplicação
│   │   │   ├── appointment/     # Gestão de agendamentos
│   │   │   │   ├── appointment.controller.ts
│   │   │   │   ├── appointment.routes.ts
│   │   │   │   └── appointment.service.ts
│   │   │   ├── auth/            # Autenticação e autorização
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.validators.ts
│   │   │   ├── screening/       # Gestão de triagens
│   │   │   │   ├── screening.controller.ts
│   │   │   │   ├── screening.routes.ts
│   │   │   │   ├── screening.service.ts
│   │   │   │   └── screening.validators.ts
│   │   │   ├── session-note/   # Notas de sessão
│   │   │   │   ├── sessionNote.controller.ts
│   │   │   │   ├── sessionNote.routes.ts
│   │   │   │   └── sessionNote.service.ts
│   │   │   ├── student/        # Gestão de alunos
│   │   │   │   ├── student.controller.ts
│   │   │   │   ├── student.routes.ts
│   │   │   │   └── student.service.ts
│   │   │   └── users/          # Gestão de usuários
│   │   │       ├── avatar.controller.ts
│   │   │       ├── avatar.routes.ts
│   │   │       └── avatar.service.ts
│   │   ├── config/              # Configurações
│   │   │   └── env.ts          # Variáveis de ambiente
│   │   ├── db/                  # Banco de dados
│   │   │   └── prisma.ts       # Cliente Prisma
│   │   ├── docs/                # Documentação
│   │   │   └── swagger.ts      # Configuração Swagger
│   │   ├── middlewares/         # Middlewares customizados
│   │   │   ├── botAuth.ts      # Autenticação do bot
│   │   │   ├── errorHandler.ts # Tratamento de erros
│   │   │   └── require-auth.ts # Proteção de rotas
│   │   ├── utils/              # Utilitários
│   │   │   └── risk.ts        # Cálculo de níveis de risco
│   │   ├── app.ts              # Configuração Express
│   │   └── server.ts           # Ponto de entrada
│   ├── prisma/                  # Prisma ORM
│   │   ├── migrations/         # Migrações do banco
│   │   ├── schema.prisma      # Schema do banco de dados
│   │   ├── seed.ts            # Seed de dados iniciais
│   │   ├── clear-db.ts        # Script para limpar banco
│   │   └── clear-students.ts  # Script para limpar alunos
│   ├── uploads/                # Arquivos uploadados
│   │   └── avatars/            # Avatares de usuários
│   ├── dockerfile              # Dockerfile do backend
│   ├── package.json           # Dependências Node.js
│   └── tsconfig.json          # Configuração TypeScript
│
├── frontend/                    # Aplicação Next.js
│   ├── src/
│   │   ├── app/                # Rotas e páginas (App Router)
│   │   │   ├── (dashboard)/   # Grupo de rotas do dashboard
│   │   │   │   └── page.tsx  # Página inicial
│   │   │   ├── auth/          # Páginas de autenticação
│   │   │   │   ├── sign-in/  # Login
│   │   │   │   ├── sign-up/  # Cadastro
│   │   │   │   └── reset-password/ # Recuperação de senha
│   │   │   ├── dashboard/     # Páginas do dashboard
│   │   │   │   ├── triagem/   # Gestão de triagens
│   │   │   │   ├── alunos/    # Gestão de alunos
│   │   │   │   ├── agendamento/ # Agendamentos
│   │   │   │   ├── atendimento/ # Atendimentos
│   │   │   │   ├── overview/  # Visão geral/analytics
│   │   │   │   ├── account/   # Perfil do usuário
│   │   │   │   └── settings/ # Configurações
│   │   │   ├── errors/        # Páginas de erro
│   │   │   ├── layout.tsx     # Layout principal
│   │   │   └── page.tsx       # Página inicial
│   │   ├── components/        # Componentes React
│   │   │   ├── auth/          # Componentes de autenticação
│   │   │   ├── core/          # Componentes base
│   │   │   └── dashboard/     # Componentes do dashboard
│   │   │       ├── layout/    # Layout do dashboard
│   │   │       └── overview/ # Cards e gráficos
│   │   ├── contexts/          # Contextos React
│   │   │   └── user-context.tsx # Contexto do usuário
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilitários e API client
│   │   │   ├── api.ts         # Cliente da API
│   │   │   └── auth/          # Utilitários de autenticação
│   │   ├── styles/            # Estilos globais
│   │   │   └── theme/         # Tema Material-UI
│   │   └── types/             # Tipos TypeScript
│   ├── public/                # Arquivos estáticos
│   │   └── assets/           # Imagens e ícones
│   ├── dockerfile            # Dockerfile do frontend
│   ├── package.json          # Dependências Node.js
│   └── next.config.mjs       # Configuração Next.js
│
├── db/                         # Scripts de banco de dados
│   └── init/                  # Scripts de inicialização PostgreSQL
│
├── docker-compose.yml         # Configuração dos serviços Docker
├── package.json              # Dependências raiz (se houver)
└── README.md                 # Este arquivo
```

### 📦 Módulos Principais

#### Backend

- **Screening Module**: Gerencia triagens recebidas do bot, com ordenação por prioridade clínica
- **Student Module**: CRUD completo de estudantes
- **Appointment Module**: Gestão de agendamentos com validação de conflitos
- **Session Note Module**: Registro estruturado de notas de sessão
- **Auth Module**: Autenticação JWT e gerenciamento de usuários

#### Frontend

- **Triagem Page**: Lista de triagens com ordenação, filtros e visualização de relatórios
- **Alunos Page**: Gestão de alunos com busca e importação CSV
- **Agendamento Page**: Calendário e lista de agendamentos
- **Atendimento Page**: Gestão de atendimentos e notas de sessão
- **Overview Page**: Dashboard com KPIs e gráficos

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de conexão com o banco de dados

**Sintomas**: Erro `ECONNREFUSED` ou `Can't reach database server`

**Soluções**:
```bash
# Verificar se o container do PostgreSQL está rodando
docker compose ps

# Verificar logs do PostgreSQL
docker compose logs postgres

# Reiniciar o PostgreSQL
docker compose restart postgres

# Verificar variáveis de ambiente
docker compose exec backend env | grep DATABASE_URL
```

#### 2. Porta já em uso

**Sintomas**: `Error: listen EADDRINUSE: address already in use`

**Soluções**:
```bash
# Verificar processos usando as portas
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :4000

# Linux/macOS
lsof -i :3001
lsof -i :4000

# Alterar portas no docker-compose.yml se necessário
```

#### 3. Erro ao aplicar migrações

**Sintomas**: `Migration failed` ou `Schema is not in sync`

**Soluções**:
```bash
# Gerar Prisma Client
docker compose exec backend npx prisma generate

# Verificar status das migrações
docker compose exec backend npx prisma migrate status

# Aplicar migrações pendentes
docker compose exec backend npx prisma migrate deploy

# Se necessário, resetar (⚠️ apaga dados)
docker compose exec backend npx prisma migrate reset
```

#### 4. Dependências não encontradas

**Sintomas**: `Cannot find module` ou `Module not found`

**Soluções**:
```bash
# Reinstalar dependências do backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Reinstalar dependências do frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Reconstruir containers
docker compose up --build -d
```

#### 5. Erro ChunkLoadError no Next.js

**Sintomas**: `ChunkLoadError: Loading chunk X failed` no navegador

**Soluções**:
```bash
# Limpar cache do Next.js dentro do container
docker compose exec frontend rm -rf .next

# Reiniciar o container do frontend
docker compose restart frontend

# Se persistir, reconstruir o container
docker compose down frontend
docker compose up --build frontend -d

# Limpar cache localmente (se rodando fora do Docker)
cd frontend
npm run clean
npm run dev
```

#### 6. Erro de autenticação do bot

**Sintomas**: Bot não consegue enviar triagens para o backend

**Soluções**:
```bash
# Verificar se o BOT_SHARED_SECRET está correto
docker compose exec backend env | grep BOT_SHARED_SECRET

# Verificar logs do backend para erros de autenticação
docker compose logs backend | grep -i "bot\|secret\|auth"

# Testar endpoint manualmente
curl -X POST http://localhost:4000/api/screenings \
  -H "Content-Type: application/json" \
  -H "X-Bot-Secret: seu_secret_aqui" \
  -d '{"test": "data"}'
```

#### 7. Prisma Client não gerado

**Sintomas**: `PrismaClient is not configured` ou `Cannot find @prisma/client`

**Soluções**:
```bash
# Gerar Prisma Client
docker compose exec backend npx prisma generate

# Se persistir, reinstalar dependências
docker compose exec backend npm install
docker compose exec backend npx prisma generate
```

---

## 📚 Documentação Adicional

### API Documentation

- **Swagger UI**: Acesse [http://localhost:4000/docs](http://localhost:4000/docs) quando o backend estiver rodando
- **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

### Banco de Dados

- **Prisma Studio**: Execute `docker compose exec backend npx prisma studio` e acesse http://localhost:5555
- **Schema**: Veja `backend/prisma/schema.prisma` para estrutura completa do banco

### Integração com Bot

O bot do Telegram se integra com este dashboard através do endpoint:

```
POST /api/screenings
Headers:
  Content-Type: application/json
  X-Bot-Secret: <BOT_SHARED_SECRET>
```

Veja a documentação completa do bot em `../chatbot-dashboard/README.md`

---

## 🔒 Segurança

### Boas Práticas Implementadas

- ✅ Autenticação JWT com tokens expiráveis
- ✅ Senhas hasheadas com bcrypt
- ✅ Rate limiting nas rotas da API
- ✅ Helmet para segurança HTTP
- ✅ Validação de dados com Zod
- ✅ CORS configurado adequadamente
- ✅ Variáveis de ambiente para secrets
- ✅ Proteção de rotas sensíveis

### Checklist de Produção

Antes de colocar em produção, certifique-se de:

- [ ] Alterar todas as senhas padrão
- [ ] Usar secrets fortes para JWT e BOT_SHARED_SECRET
- [ ] Configurar HTTPS
- [ ] Configurar backup do banco de dados
- [ ] Revisar permissões de arquivos
- [ ] Configurar monitoramento e logs
- [ ] Revisar configurações de CORS
- [ ] Implementar rate limiting adequado
- [ ] Configurar variáveis de ambiente de produção

---

## 🧪 Testes

### Executar Testes (quando implementados)

```bash
# Backend
docker compose exec backend npm test

# Frontend
docker compose exec frontend npm test
```

---

## 📊 Funcionalidades Avançadas

### Ordenação Inteligente de Triagens

O sistema implementa ordenação por prioridade clínica:

- **Casos Graves** aparecem primeiro (PHQ-9 ≥20, GAD-7 ≥15, ou Q9 ≥1)
- **Ordenação por data** dentro de cada grupo de risco
- **Filtro por risco LEVE** ordena apenas por data (ignora prioridade)

### Análise com IA

As triagens recebidas do bot incluem análise gerada por IA:

- Classificação de urgência (alta, média, baixa)
- Identificação de sinais de depressão e ansiedade
- Análise de impacto funcional
- Identificação de fatores de proteção
- Geração de relatórios técnicos estruturados

---

## 👥 Contribuindo

Este é um projeto de TCC (Trabalho de Conclusão de Curso).

**Discente**: Janaina dos Santos Ferreira  
**Instituição**: Instituto Federal do Amazonas - Campus Manaus Zona Leste (IFAM CMZL)

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos como parte de um Trabalho de Conclusão de Curso.


---

**Desenvolvido com ❤️ para o IFAM-CMZL**
