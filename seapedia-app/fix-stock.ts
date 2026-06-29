import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function fix() {
  await prisma.product.updateMany({
    where: { name: { contains: 'Hannochs Lampu Emergency Bohlam LED EON 15W Cahaya Putih' } },
    data: { stock: { increment: 18 } }
  });
  console.log('Fixed stock!');
}
fix();
