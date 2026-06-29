import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // System config - current date
  await prisma.systemConfig.upsert({
    where: { key: 'CURRENT_DATE' },
    update: {},
    create: {
      key: 'CURRENT_DATE',
      value: new Date().toISOString(),
    },
  })

  // Admin user
  const adminHash = await bcrypt.hash('password123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@seapedia.com' },
    update: { passwordHash: adminHash },
    create: {
      name: 'Admin SEAPEDIA',
      email: 'admin@seapedia.com',
      passwordHash: adminHash,
      walletBalance: 0,
      roles: {
        create: [{ role: 'ADMIN' }],
      },
    },
  })
  console.log(`✅ Admin created: ${admin.email}`)

  // Demo seller
  const sellerHash = await bcrypt.hash('password123', 12)
  const seller = await prisma.user.upsert({
    where: { email: 'seller@seapedia.com' },
    update: { passwordHash: sellerHash },
    create: {
      name: 'Budi Santoso',
      email: 'seller@seapedia.com',
      passwordHash: sellerHash,
      walletBalance: 500000,
      roles: {
        create: [{ role: 'SELLER' }],
      },
    },
  })

  // Demo store
  const store = await prisma.store.upsert({
    where: { ownerId: seller.id },
    update: {},
    create: {
      ownerId: seller.id,
      name: 'Elektronik Budi Store',
      description: 'Toko elektronik terpercaya dengan produk berkualitas tinggi',
      imageUrl: 'https://picsum.photos/seed/store1/800/400',
    },
  })
  console.log(`✅ Store created: ${store.name}`)

  // Demo products
  const products = [
    {
      name: 'Laptop Gaming ASUS ROG',
      description: 'Laptop gaming performa tinggi dengan GPU RTX 4060, RAM 16GB, SSD 512GB',
      price: 15999000,
      stock: 10,
      category: 'Elektronik',
      imageUrl: 'https://picsum.photos/seed/laptop1/400/400',
    },
    {
      name: 'Smartphone Samsung Galaxy S24',
      description: 'Flagship terbaru Samsung dengan kamera 200MP dan baterai 5000mAh',
      price: 12500000,
      stock: 25,
      category: 'Elektronik',
      imageUrl: 'https://picsum.photos/seed/phone1/400/400',
    },
    {
      name: 'Headphone Sony WH-1000XM5',
      description: 'Headphone wireless noise-cancelling terbaik di kelasnya',
      price: 4999000,
      stock: 15,
      category: 'Audio',
      imageUrl: 'https://picsum.photos/seed/headphone1/400/400',
    },
    {
      name: 'Mechanical Keyboard Logitech G915',
      description: 'Keyboard mechanical wireless dengan switch GL Linear',
      price: 2999000,
      stock: 20,
      category: 'Aksesori',
      imageUrl: 'https://picsum.photos/seed/keyboard1/400/400',
    },
    {
      name: 'Monitor LG UltraWide 34"',
      description: 'Monitor ultrawide 4K untuk produktivitas dan gaming',
      price: 8750000,
      stock: 8,
      category: 'Elektronik',
      imageUrl: 'https://picsum.photos/seed/monitor1/400/400',
    },
    {
      name: 'Webcam Logitech C920 Pro',
      description: 'Webcam HD 1080p untuk streaming dan video call profesional',
      price: 1350000,
      stock: 30,
      category: 'Aksesori',
      imageUrl: 'https://picsum.photos/seed/webcam1/400/400',
    },
  ]

  for (const p of products) {
    await prisma.product.create({
      data: { ...p, storeId: store.id },
    })
  }
  console.log(`✅ ${products.length} products created`)

  // Demo buyer
  const buyerHash = await bcrypt.hash('password123', 12)
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@seapedia.com' },
    update: { passwordHash: buyerHash },
    create: {
      name: 'Ani Rahayu',
      email: 'buyer@seapedia.com',
      passwordHash: buyerHash,
      walletBalance: 5000000,
      roles: {
        create: [{ role: 'BUYER' }],
      },
    },
  })
  console.log(`✅ Buyer created: ${buyer.email}`)

  // Demo driver
  const driverHash = await bcrypt.hash('password123', 12)
  const driver = await prisma.user.upsert({
    where: { email: 'driver@seapedia.com' },
    update: { passwordHash: driverHash },
    create: {
      name: 'Joko Widodo',
      email: 'driver@seapedia.com',
      passwordHash: driverHash,
      walletBalance: 250000,
      roles: {
        create: [{ role: 'DRIVER' }],
      },
    },
  })
  console.log(`✅ Driver created: ${driver.email}`)

  // Multi-role demo user (Buyer + Seller + Driver)
  const multiHash = await bcrypt.hash('password123', 12)
  const multiUser = await prisma.user.upsert({
    where: { email: 'multi@seapedia.com' },
    update: { passwordHash: multiHash },
    create: {
      name: 'Sari Multi',
      email: 'multi@seapedia.com',
      passwordHash: multiHash,
      walletBalance: 1000000,
      roles: {
        create: [{ role: 'BUYER' }, { role: 'SELLER' }, { role: 'DRIVER' }],
      },
    },
  })
  console.log(`✅ Multi-role user created: ${multiUser.email}`)

  // Demo vouchers
  const vouchers = [
    {
      code: 'WELCOME10',
      description: 'Diskon 10% untuk pengguna baru',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUsage: 100,
      minPurchase: 100000,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'HEMAT50K',
      description: 'Potongan Rp 50.000 untuk pembelian min Rp 500.000',
      discountType: 'FIXED',
      discountValue: 50000,
      maxUsage: 50,
      minPurchase: 500000,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'FLASH20',
      description: 'Flash sale diskon 20%',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxUsage: 10,
      minPurchase: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  ]

  for (const v of vouchers) {
    await prisma.voucher.upsert({
      where: { code: v.code },
      update: {},
      create: v,
    })
  }
  console.log(`✅ ${vouchers.length} vouchers created`)

  // Demo reviews
  const reviews = [
    { name: 'Budi R.', rating: 5, comment: 'Aplikasi yang sangat membantu! Mudah digunakan dan pengiriman cepat.' },
    { name: 'Siti M.', rating: 4, comment: 'Produknya lengkap, harga bersaing. Recommended!' },
    { name: 'Ahmad F.', rating: 5, comment: 'SEAPEDIA terbaik! Seller responsif, driver on time.' },
    { name: 'Dewi K.', rating: 4, comment: 'UI-nya clean dan modern. Suka banget beli disini.' },
    { name: 'Riko P.', rating: 5, comment: 'Fitur wallet-nya memudahkan transaksi. Top!' },
  ]

  for (const r of reviews) {
    await prisma.review.create({ data: r })
  }
  console.log(`✅ ${reviews.length} reviews created`)

  console.log('\n🎉 Seed completed!\n')
  console.log('Demo accounts:')
  console.log('  Admin:  admin@seapedia.com  / password123')
  console.log('  Seller: seller@seapedia.com / password123')
  console.log('  Buyer:  buyer@seapedia.com  / password123')
  console.log('  Driver: driver@seapedia.com / password123')
  console.log('  Multi:  multi@seapedia.com  / password123  (Buyer+Seller+Driver)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
