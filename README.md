# Psicoflow - Sistema de Triagem Psicológica IFAM CMZL

## 📋 Sobre o Projeto

O **Psicoflow** é uma plataforma completa de gestão de saúde mental desenvolvida para o Instituto Federal do Amazonas - Campus Manaus Zona Leste (IFAM CMZL). O sistema integra um chatbot de triagem via Telegram com um dashboard administrativo web, permitindo uma gestão eficiente do atendimento psicológico aos estudantes.
<img width="1412" height="771" alt="image" src="https://github.com/user-attachments/assets/2f9347bd-99ac-4729-8d5f-5c7b9f0be379" />


### 🎯 Funcionalidades Principais

- **Chatbot de Triagem**: Bot no Telegram que realiza triagens psicológicas utilizando as escalas PHQ-9 (depressão) e GAD-7 (ansiedade) Com Inteligencia Artificial(gemini)
- **Dashboard Administrativo**: Interface web para gestão completa de:
  - Triagens realizadas pelos alunos
  - Cadastro e gerenciamento de alunos
  - Agendamento de consultas
  - Registro de atendimentos e notas de sessão
  - Relatórios e visualizações de dados
- **Avaliação de Risco**: Classificação automática do nível de risco (Mínimo, Leve, Moderado, Moderadamente Grave, Grave)
- **Integração com IA**: Uso de IA generativa (Gemini) para análise e geração de relatórios acolhedores
- **Sistema de Alertas**: Notificações para casos que requerem acompanhamento prioritário

### 🛠️ Tecnologias Utilizadas

**Backend:**
- Node.js com Express
- TypeScript
- Prisma ORM (PostgreSQL)
- JWT para autenticação
- Swagger para documentação da API

**Frontend:**
- Next.js 15
- React 19
- Material-UI (MUI)
- TypeScript
- ApexCharts e Recharts para visualizações

**Infraestrutura:**
- Docker e Docker Compose
- PostgreSQL 16

---

## 🚀 Guia de Execução

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker** e **Docker Compose** instalados e funcionando
- Portas `3001` (frontend) e `4000` (backend) livres na máquina
- **Node.js** instalado localmente (para instalar dependências antes de subir os containers)

### 📦 Instalação das Dependências

Antes de subir os containers, é necessário instalar as dependências localmente:

1. **Instalar dependências do backend:**
   ```bash
   cd TCC2-DashboardPsicologia/backend
   npm install
   ```

2. **Instalar dependências do frontend:**
   ```bash
   cd TCC2-DashboardPsicologia/frontend
   npm install
   ```

> **Nota**: As dependências são instaladas localmente e montadas nos containers via volumes. Isso otimiza o tempo de inicialização dos containers.

### ⚙️ Configuração do Ambiente

1. **Configure as variáveis de ambiente:**

   - **Backend** (`./backend/.env`):
     ```env
     DATABASE_URL="postgresql://usuario:senha@postgres:5432/ifam_psico"
     JWT_SECRET="seu-jwt-secret-aqui"
     PORT=4000
     # ... outras variáveis necessárias
     ```

   - **Frontend** (`./frontend/.env`):
     ```env
     NEXT_PUBLIC_API_URL="http://localhost:4000"
     # ... outras variáveis necessárias
     ```

   - **Root** (`.env` - para o PostgreSQL):
     ```env
     POSTGRES_USER=ifam
     POSTGRES_PASSWORD=sua-senha
     POSTGRES_DB=ifam_psico
     ```

### 🐳 Executando com Docker Compose

1. **Acesse a pasta do projeto:**
   ```bash
   cd TCC2-DashboardPsicologia
   ```

2. **Suba os serviços (frontend, backend e banco de dados):**
   ```bash
   docker compose up --build -d
   ```

   O comando `--build` garante que as imagens sejam reconstruídas caso haja alterações nos Dockerfiles.

3. **Aplique as migrações do banco de dados:**
   ```bash
   # Gerar o cliente Prisma
   docker compose exec backend npx prisma generate
   
   # Aplicar as migrações
   docker compose exec backend npx prisma migrate deploy
   ```

   > **Para desenvolvimento**, você pode usar `migrate dev` que também cria migrações:
   > ```bash
   > docker compose exec backend npx prisma migrate dev --name init
   > ```

4. **Verifique se os serviços estão rodando:**
   ```bash
   docker compose ps
   ```

### 🌐 Acessando a Aplicação

Após subir os containers, acesse:

- **Dashboard Web**: [http://localhost:3001/dashboard](http://localhost:3001/dashboard)
- **Página de Triagens**: [http://localhost:3001/dashboard/triagem](http://localhost:3001/dashboard/triagem)
- **API Health Check**: [http://localhost:4000/health](http://localhost:4000/health)
- **Documentação Swagger**: [http://localhost:4000/docs](http://localhost:4000/docs)

### 🔐 Credenciais Padrão

- **Usuário**: `admin@teste.com`
- **Senha**: `Admin@1234`

> ⚠️ **Importante**: Altere essas credenciais em produção!

---

## 📝 Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver logs do backend em tempo real
docker compose logs -f backend

# Ver logs do frontend em tempo real
docker compose logs -f frontend

# Ver logs de todos os serviços
docker compose logs -f

# Parar todos os serviços
docker compose down

# Parar e remover volumes (⚠️ apaga dados do banco)
docker compose down -v

# Reiniciar um serviço específico
docker compose restart backend
```

### Banco de Dados

```bash
# Acessar o Prisma Studio (interface visual do banco)
docker compose exec backend npx prisma studio

# Criar uma nova migração
docker compose exec backend npx prisma migrate dev --name nome_da_migracao

# Resetar o banco de dados (⚠️ apaga todos os dados)
docker compose exec backend npx prisma migrate reset
```

### Desenvolvimento

```bash
# Executar comandos dentro do container backend
docker compose exec backend <comando>

# Executar comandos dentro do container frontend
docker compose exec frontend <comando>

# Acessar o shell do container backend
docker compose exec backend sh

# Acessar o shell do container frontend
docker compose exec frontend sh
```

---

## 🏗️ Estrutura do Projeto

```
TCC2-DashboardPsicologia/
├── backend/              # API Node.js/Express
│   ├── src/
│   │   ├── modules/     # Módulos da aplicação (auth, screening, etc.)
│   │   ├── middlewares/ # Middlewares customizados
│   │   └── server.ts    # Ponto de entrada
│   ├── prisma/          # Schema e migrações do Prisma
│   └── Dockerfile
├── frontend/            # Aplicação Next.js
│   ├── src/
│   │   ├── app/         # Rotas e páginas
│   │   ├── components/  # Componentes React
│   │   └── lib/         # Utilitários e API client
│   └── Dockerfile
├── db/
│   └── init/            # Scripts de inicialização do PostgreSQL
├── docker-compose.yml   # Configuração dos serviços
└── README.md
```

---

## 🔧 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com o banco de dados:**
   - Verifique se o container do PostgreSQL está rodando: `docker compose ps`
   - Confirme as variáveis de ambiente no arquivo `.env`
   - Verifique os logs: `docker compose logs postgres`

2. **Porta já em uso:**
   - Verifique se as portas 3001 e 4000 estão livres
   - Altere as portas no `docker-compose.yml` se necessário

3. **Erro ao aplicar migrações:**
   - Certifique-se de que o Prisma Client foi gerado: `docker compose exec backend npx prisma generate`
   - Verifique se o banco de dados está acessível

4. **Dependências não encontradas:**
   - Certifique-se de ter executado `npm install` nas pastas `backend` e `frontend` antes de subir os containers

---

## 📚 Documentação Adicional

- **API Swagger**: Acesse [http://localhost:4000/docs](http://localhost:4000/docs) quando o backend estiver rodando
- **Prisma Studio**: Execute `docker compose exec backend npx prisma studio` para visualizar o banco de dados

---

## 👥 Contribuindo

Este é um projeto de TCC (Trabalho de Conclusão de Curso).
Discente : Janaina dos Santos Ferreira

