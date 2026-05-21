const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUser() {
  try {
    const user = await prisma.usuario.upsert({
      where: { email: 'admin@banca.com' },
      update: {},
      create: {
        nome: 'Admin',
        email: 'admin@banca.com',
        senha: 'admin123'
      }
    });
    console.log('Usuário criado:', user);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
