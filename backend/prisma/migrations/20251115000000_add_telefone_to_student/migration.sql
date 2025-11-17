-- AlterTable
ALTER TABLE "Student" ADD COLUMN "telefone" TEXT NOT NULL DEFAULT '';

-- Atualiza registros existentes com telefone vazio (será obrigatório em novos registros)
UPDATE "Student" SET "telefone" = '' WHERE "telefone" IS NULL;


