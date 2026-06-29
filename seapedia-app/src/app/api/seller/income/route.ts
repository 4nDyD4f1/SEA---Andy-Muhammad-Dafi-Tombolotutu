import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/seller/income
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error

  try {
    const store = await prisma.store.findUnique({ where: { ownerId: auth.userId } })
    if (!store) return NextResponse.json({ totalIncome: 0, orders: [] })

    const successOrders = await prisma.order.findMany({
      where: {
        storeId: store.id,
        status: 'PESANAN_SELESAI',
      },
      include: {
        items: true,
        buyer: { select: { name: true } },
      },
      orderBy: { completedAt: 'desc' },
    })

    const refundedOrders = await prisma.order.findMany({
      where: {
        storeId: store.id,
        status: 'DIKEMBALIKAN',
      },
      select: { total: true },
    })

    const totalIncome = successOrders.reduce((sum, o) => sum + (o.subtotal - o.discountAmount), 0)
    const totalRefunded = refundedOrders.reduce((sum, o) => sum + o.total, 0)

    // Monthly breakdown
    const monthlyData: Record<string, number> = {}
    for (const order of successOrders) {
      const month = order.completedAt
        ? new Date(order.completedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
        : 'N/A'
      monthlyData[month] = (monthlyData[month] || 0) + (order.subtotal - order.discountAmount)
    }

    return NextResponse.json({
      totalIncome,
      totalRefunded,
      successOrderCount: successOrders.length,
      refundedOrderCount: refundedOrders.length,
      monthlyData,
      recentOrders: successOrders.slice(0, 10),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
