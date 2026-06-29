import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const seller = await prisma.user.findUnique({ where: { email: 'seller@seapedia.com' } })
  if (seller) {
    await prisma.userRole.deleteMany({
      where: {
        userId: seller.id,
        role: 'BUYER'
      }
    })
    console.log('Removed BUYER role from seller@seapedia.com')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
