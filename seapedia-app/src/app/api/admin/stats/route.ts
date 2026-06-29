import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/admin/stats
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'ADMIN')
  if (error) return error

  try {
    const [
      totalUsers, totalStores, totalOrders, totalVouchers,
      ordersByStatus, recentOrders, systemDate,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.order.count(),
      prisma.voucher.count(),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { name: true } },
          store: { select: { name: true } },
        },
      }),
      prisma.systemConfig.findUnique({ where: { key: 'CURRENT_DATE' } }),
    ])

    // Count active vouchers (not expired, not fully used)
    const now = new Date()
    const activeVouchers = await prisma.voucher.count({
      where: {
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ],
      },
    })

    const totalRevenue = await prisma.order.aggregate({
      where: { status: 'PESANAN_SELESAI' },
      _sum: { total: true },
    })

    return NextResponse.json({
      totalUsers,
      totalStores,
      totalOrders,
      totalVouchers,
      activeVouchers,
      totalRevenue: totalRevenue._sum.total || 0,
      ordersByStatus: ordersByStatus.map(o => ({ status: o.status, count: o._count._all })),
      recentOrders,
      systemDate: systemDate?.value || new Date().toISOString(),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
