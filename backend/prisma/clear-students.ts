// prisma/clear-students.ts
// Script para limpar apenas os dados dos alunos
// ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
// Nota: Triagens e agendamentos relacionados também serão excluídos devido ao CASCADE

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearStudents() {
  console.log('🗑️  Iniciando limpeza de dados dos alunos...\n');

  try {
    // Primeiro, vamos contar o que será excluído
    const studentsCount = await prisma.student.count();
    const screeningsCount = await prisma.screening.count();
    const appointmentsCount = await prisma.appointment.count({
      where: {
        studentId: { not: null }
      }
    });
    const sessionNotesCount = await prisma.sessionNote.count();

    console.log('📊 Dados que serão afetados:');
    console.log(`   - Alunos: ${studentsCount}`);
    console.log(`   - Triagens: ${screeningsCount} (serão excluídas por CASCADE)`);
    console.log(`   - Agendamentos vinculados a alunos: ${appointmentsCount}`);
    console.log(`   - Anotações de sessão: ${sessionNotesCount} (serão excluídas se vinculadas a agendamentos de alunos)\n`);

    // Ordem de exclusão respeitando foreign keys:
    // 1. SessionNote (depende de Appointment)
    // 2. Appointment vinculado a Student (mas não os vinculados apenas a Screening)
    // 3. Screening (depende de Student - será excluído por CASCADE)
    // 4. Student

    console.log('1. Limpando anotações de sessão de agendamentos de alunos...');
    // Exclui anotações de agendamentos que têm studentId
    const sessionNotes = await prisma.sessionNote.deleteMany({
      where: {
        appointment: {
          studentId: { not: null }
        }
      }
    });
    console.log(`   ✅ ${sessionNotes.count} anotações de sessão removidas`);

    console.log('2. Limpando agendamentos vinculados a alunos...');
    // Exclui agendamentos que têm studentId (mas mantém os que só têm screeningId)
    const appointments = await prisma.appointment.deleteMany({
      where: {
        studentId: { not: null }
      }
    });
    console.log(`   ✅ ${appointments.count} agendamentos removidos`);

    console.log('3. Limpando triagens (serão excluídas automaticamente por CASCADE)...');
    // As triagens serão excluídas automaticamente quando os alunos forem excluídos
    // devido ao onDelete: Cascade no schema

    console.log('4. Limpando alunos...');
    const students = await prisma.student.deleteMany();
    console.log(`   ✅ ${students.count} alunos removidos`);

    // Verifica se as triagens foram excluídas
    const remainingScreenings = await prisma.screening.count();
    if (remainingScreenings > 0) {
      console.log(`\n⚠️  Aviso: ${remainingScreenings} triagens ainda existem (não tinham studentId válido)`);
    }

    console.log('\n✅ Limpeza de alunos concluída com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   - Alunos removidos: ${students.count}`);
    console.log(`   - Agendamentos removidos: ${appointments.count}`);
    console.log(`   - Anotações removidas: ${sessionNotes.count}`);
    console.log(`   - Triagens removidas: ${screeningsCount - remainingScreenings}`);
    
    if (remainingScreenings === 0) {
      console.log('\n💡 Todas as triagens foram removidas junto com os alunos.');
    }
  } catch (error) {
    console.error('❌ Erro ao limpar dados dos alunos:', error);
    throw error;
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  clearStudents()
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

export { clearStudents };


