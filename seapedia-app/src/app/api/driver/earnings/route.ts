import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/driver/earnings
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'DRIVER')
  if (error) return error

  try {
    const user = await prisma.user.findUnique({ where: { id: auth.userId } })

    const completedOrders = await prisma.order.findMany({
      where: { driverId: auth.userId, status: 'PESANAN_SELESAI' },
      select: {
        id: true,
        driverCommission: true,
        completedAt: true,
        shippingFee: true,
        courierType: true,
        store: { select: { name: true } },
      },
      orderBy: { completedAt: 'desc' },
    })

    const activeOrders = await prisma.order.findMany({
      where: { driverId: auth.userId, status: 'SEDANG_DIKIRIM' },
      include: {
        store: { select: { name: true } },
        buyer: { select: { name: true } },
      },
    })

    const totalEarnings = completedOrders.reduce((sum, o) => sum + o.driverCommission, 0)

    return NextResponse.json({
      walletBalance: user?.walletBalance || 0,
      totalEarnings,
      completedDeliveries: completedOrders.length,
      completedOrders,
      activeOrders,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
