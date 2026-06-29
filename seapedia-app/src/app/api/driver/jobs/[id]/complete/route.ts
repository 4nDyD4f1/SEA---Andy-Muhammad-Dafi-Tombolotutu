import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// POST /api/driver/jobs/[id]/complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = requireAuth(request, 'DRIVER')
  if (error) return error
  const { id } = await params

  try {
    const order = await prisma.order.findUnique({ where: { id } })

    if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    if (order.driverId !== auth.userId) {
      return NextResponse.json({ error: 'Bukan pesanan Anda' }, { status: 403 })
    }
    if (order.status !== 'SEDANG_DIKIRIM') {
      return NextResponse.json({ error: 'Status pesanan tidak sesuai' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Complete order
      await tx.order.update({
        where: { id },
        data: {
          status: 'PESANAN_SELESAI',
          completedAt: new Date(),
        },
      })

      // Pay seller (subtotal - discount)
      const sellerIncome = order.subtotal - order.discountAmount
      await tx.user.update({
        where: { id: order.sellerId },
        data: { walletBalance: { increment: sellerIncome } },
      })
      await tx.walletTransaction.create({
        data: {
          userId: order.sellerId,
          type: 'COMMISSION',
          amount: sellerIncome,
          description: `Pendapatan dari order #${id.slice(-6).toUpperCase()}`,
        },
      })

      // Pay driver commission
      await tx.user.update({
        where: { id: auth.userId },
        data: { walletBalance: { increment: order.driverCommission } },
      })
      await tx.walletTransaction.create({
        data: {
          userId: auth.userId,
          type: 'COMMISSION',
          amount: order.driverCommission,
          description: `Komisi pengiriman order #${id.slice(-6).toUpperCase()}`,
        },
      })
    })

    return NextResponse.json({ message: 'Pengiriman berhasil dikonfirmasi!' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
