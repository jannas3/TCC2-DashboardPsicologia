// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type Role = 'ADMIN' | 'PROFESSIONAL';

async function hashPassword(plain: string) {
  const rounds = 10;
  return bcrypt.hash(plain, rounds);
}

async function main() {
  
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@teste.com';
  const adminPass  = process.env.SEED_ADMIN_PASS  || 'Admin@1234';
  const adminName  = process.env.SEED_ADMIN_NAME  || 'Admin Teste';

  const users: Array<{
    email: string;
    name: string;
    role: Role;
    password: string;
  }> = [
    { email: adminEmail, name: adminName, role: 'ADMIN',        password: adminPass },
    { email: 'prof@teste.com', name: 'Profissional Demo', role: 'PROFESSIONAL', password: 'Test@1234' }
  ];

  for (const u of users) {
    const passwordHash = await hashPassword(u.password);

    const result = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: { email: u.email, name: u.name, role: u.role, passwordHash }
    });

    
    console.log(`✔ Seed: ${result.email} (${u.role}) pronto. Senha: ${u.password}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Seed concluído');
  })
  .catch(async (e) => {
    console.error('❌ Seed falhou:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
