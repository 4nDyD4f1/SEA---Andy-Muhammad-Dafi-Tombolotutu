import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { COURIER_FEES, calculateOrderTotal, DRIVER_COMMISSION_RATE } from '@/lib/utils'

const checkoutSchema = z.object({
  shippingAddress: z.string().min(10).max(500),
  courierType: z.enum(['INSTANT', 'NEXT_DAY', 'REGULAR']),
  voucherCode: z.string().optional(),
})

// POST /api/buyer/checkout
export async function POST(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error

  try {
    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', details: parsed.error.flatten() }, { status: 400 })
    }

    const { shippingAddress, courierType, voucherCode } = parsed.data

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { buyerId: auth.userId },
      include: {
        items: {
          include: {
            product: {
              include: { store: { select: { id: true, ownerId: true } } },
            },
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 })
    }

    // Verify all items from same store
    const storeIds = [...new Set(cart.items.map((i) => i.product.storeId))]
    if (storeIds.length > 1) {
      return NextResponse.json({ error: 'Produk harus dari satu toko' }, { status: 400 })
    }

    // Check stock availability
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return NextResponse.json({
          error: `Stok tidak cukup untuk ${item.product.name} (tersedia: ${item.product.stock})`,
        }, { status: 400 })
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const shippingFee = COURIER_FEES[courierType]
    let discountAmount = 0

    // Apply voucher
    if (voucherCode) {
      const voucher = await prisma.voucher.findUnique({ where: { code: voucherCode } })
      if (!voucher) {
        return NextResponse.json({ error: 'Kode voucher tidak valid' }, { status: 400 })
      }

      const now = new Date()
      if (voucher.expiresAt && new Date(voucher.expiresAt) < now) {
        return NextResponse.json({ error: 'Voucher sudah kadaluarsa' }, { status: 400 })
      }
      if (voucher.usedCount >= voucher.maxUsage) {
        return NextResponse.json({ error: 'Kuota voucher sudah habis' }, { status: 400 })
      }
      if (subtotal < voucher.minPurchase) {
        return NextResponse.json({
          error: `Minimum pembelian untuk voucher ini adalah Rp ${voucher.minPurchase.toLocaleString('id-ID')}`,
        }, { status: 400 })
      }

      if (voucher.discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * voucher.discountValue) / 100
      } else {
        discountAmount = voucher.discountValue
      }
    }

    const { taxAmount, total } = calculateOrderTotal(subtotal, discountAmount, shippingFee)

    // Check wallet balance
    const user = await prisma.user.findUnique({ where: { id: auth.userId } })
    if (!user || user.walletBalance < total) {
      return NextResponse.json({
        error: `Saldo tidak cukup. Saldo Anda: Rp ${user?.walletBalance.toLocaleString('id-ID')}, Total: Rp ${total.toLocaleString('id-ID')}`,
      }, { status: 400 })
    }

    const store = cart.items[0].product.store
    const driverCommission = shippingFee * DRIVER_COMMISSION_RATE

    // Execute everything in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Deduct buyer wallet
      await tx.user.update({
        where: { id: auth.userId },
        data: { walletBalance: { decrement: total } },
      })

      // Wallet transaction log
      await tx.walletTransaction.create({
        data: {
          userId: auth.userId,
          type: 'PAYMENT',
          amount: -total,
          description: `Pembayaran order dari ${store.ownerId}`,
        },
      })

      // Deduct stock for each item
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // Create order
      const newOrder = await tx.order.create({
        data: {
          buyerId: auth.userId,
          sellerId: store.ownerId,
          storeId: store.id,
          subtotal,
          discountAmount,
          shippingFee,
          taxAmount,
          total,
          status: 'SEDANG_DIKEMAS',
          shippingAddress,
          courierType,
          voucherCode: voucherCode || null,
          driverCommission,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            })),
          },
        },
      })

      // Update voucher usage
      if (voucherCode) {
        const v = await tx.voucher.update({
          where: { code: voucherCode },
          data: { usedCount: { increment: 1 } },
        })
        
        // Mark UserVoucher as used
        await tx.userVoucher.updateMany({
          where: { userId: auth.userId, voucherId: v.id },
          data: { isUsed: true }
        })
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      await tx.cart.update({
        where: { id: cart.id },
        data: { storeId: null },
      })

      return newOrder
    })

    return NextResponse.json({ message: 'Checkout berhasil', order }, { status: 201 })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
