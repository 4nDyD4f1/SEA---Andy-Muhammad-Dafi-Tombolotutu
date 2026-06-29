import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/seller/orders
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error

  try {
    const store = await prisma.store.findUnique({ where: { ownerId: auth.userId } })
    if (!store) return NextResponse.json({ orders: [], store: null })

    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      include: {
        items: { include: { product: { select: { name: true, imageUrl: true } } } },
        buyer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders, store })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
