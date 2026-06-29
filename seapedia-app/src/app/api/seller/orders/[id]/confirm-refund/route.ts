import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// POST /api/seller/orders/[id]/confirm-refund
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error
  const { id } = await params

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { store: true, items: true }
    })

    if (!order || order.store.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    if (order.status !== 'MENUNGGU_REFUND') {
      return NextResponse.json({ error: 'Status pesanan tidak valid untuk direfund' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id },
        data: {
          status: 'DIKEMBALIKAN',
        }
      })

      // Restore stock for each item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }

      // Refund the money to buyer's wallet
      await tx.user.update({
        where: { id: order.buyerId },
        data: { walletBalance: { increment: order.total } },
      })
      await tx.walletTransaction.create({
        data: {
          userId: order.buyerId,
          type: 'REFUND',
          amount: order.total,
          description: `Pengembalian dana untuk pesanan #${order.id.slice(-6).toUpperCase()}`
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
