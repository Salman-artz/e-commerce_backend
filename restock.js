const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.product.updateMany({
    data: { stock: 10, status: 'ACTIVE' }
  });
  console.log('Products restocked!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
