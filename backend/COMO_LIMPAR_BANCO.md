# Como Limpar os Dados do Banco de Dados

## ⚠️ ATENÇÃO
**Esta ação é IRREVERSÍVEL!** Todos os dados serão permanentemente excluídos.

## Opções Disponíveis

### Opção 1: Limpar apenas os dados (mantém estrutura)
```bash
cd TCC2-DashboardPsicologia/backend
npm run db:clear
```

Isso irá:
- ✅ Excluir todos os dados das tabelas
- ✅ Manter a estrutura do banco (tabelas, índices, etc.)
- ✅ Não afetar as migrations

### Opção 2: Reset completo (recomendado para desenvolvimento)
```bash
cd TCC2-DashboardPsicologia/backend
npm run db:reset
```

Isso irá:
- ✅ Excluir todos os dados
- ✅ Recriar todas as tabelas do zero
- ✅ Aplicar todas as migrations novamente
- ✅ Executar o seed (criar usuários padrão)

### Opção 3: Usando Prisma diretamente
```bash
cd TCC2-DashboardPsicologia/backend
npx prisma migrate reset
```

### Opção 4: SQL direto (PostgreSQL)
```sql
-- Conecte-se ao banco e execute:
TRUNCATE TABLE "SessionNote" CASCADE;
TRUNCATE TABLE "Appointment" CASCADE;
TRUNCATE TABLE "Screening" CASCADE;
TRUNCATE TABLE "Student" CASCADE;
TRUNCATE TABLE "User" CASCADE;
```

## O que será excluído

1. **SessionNote** - Todas as anotações de sessão
2. **Appointment** - Todos os agendamentos
3. **Screening** - Todas as triagens
4. **Student** - Todos os alunos
5. **User** - Todos os usuários (incluindo admins)

## Após limpar

Para recriar usuários padrão:
```bash
npm run db:seed
```

Ou:
```bash
npm run db:reset  # Já inclui o seed
```

## Usando Docker

Se estiver usando Docker:
```bash
docker-compose exec backend npm run db:clear
```

Ou para reset completo:
```bash
docker-compose exec backend npm run db:reset
```

## Verificar dados antes de limpar

Para ver quantos registros existem:
```bash
npx prisma studio
```

Ou execute uma query SQL:
```sql
SELECT 
  (SELECT COUNT(*) FROM "User") as users,
  (SELECT COUNT(*) FROM "Student") as students,
  (SELECT COUNT(*) FROM "Screening") as screenings,
  (SELECT COUNT(*) FROM "Appointment") as appointments,
  (SELECT COUNT(*) FROM "SessionNote") as session_notes;
```


