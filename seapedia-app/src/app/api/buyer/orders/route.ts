import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/buyer/orders
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error

  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: auth.userId },
      include: {
        items: { include: { product: { select: { name: true, imageUrl: true } } } },
        store: { select: { name: true } },
        driver: { select: { name: true } },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
