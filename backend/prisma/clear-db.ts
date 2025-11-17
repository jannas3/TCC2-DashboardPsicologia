// prisma/clear-db.ts
// Script para limpar todos os dados do banco de dados
// ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️  Iniciando limpeza do banco de dados...\n');

  try {
    // Ordem de exclusão respeitando foreign keys:
    // 1. SessionNote (depende de Appointment)
    // 2. Appointment (depende de Screening e Student)
    // 3. Screening (depende de Student)
    // 4. Student
    // 5. User (independente)

    console.log('1. Limpando SessionNote...');
    const sessionNotes = await prisma.sessionNote.deleteMany();
    console.log(`   ✅ ${sessionNotes.count} anotações de sessão removidas`);

    console.log('2. Limpando Appointment...');
    const appointments = await prisma.appointment.deleteMany();
    console.log(`   ✅ ${appointments.count} agendamentos removidos`);

    console.log('3. Limpando Screening...');
    const screenings = await prisma.screening.deleteMany();
    console.log(`   ✅ ${screenings.count} triagens removidas`);

    console.log('4. Limpando Student...');
    const students = await prisma.student.deleteMany();
    console.log(`   ✅ ${students.count} alunos removidos`);

    console.log('5. Limpando User...');
    const users = await prisma.user.deleteMany();
    console.log(`   ✅ ${users.count} usuários removidos`);

    console.log('\n✅ Limpeza concluída com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   - Anotações: ${sessionNotes.count}`);
    console.log(`   - Agendamentos: ${appointments.count}`);
    console.log(`   - Triagens: ${screenings.count}`);
    console.log(`   - Alunos: ${students.count}`);
    console.log(`   - Usuários: ${users.count}`);
    console.log('\n💡 Dica: Execute "npm run seed" para recriar usuários padrão.');
  } catch (error) {
    console.error('❌ Erro ao limpar banco de dados:', error);
    throw error;
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  clearDatabase()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('❌ Falha na limpeza:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

export { clearDatabase };


