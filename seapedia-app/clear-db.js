const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Clearing all data...')
  
  // Delete in order of dependencies
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.walletTransaction.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.chatRoom.deleteMany()
  await prisma.userVoucher.deleteMany()
  await prisma.voucher.deleteMany()
  await prisma.product.deleteMany()
  await prisma.store.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('All data cleared! Fresh start ready.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
