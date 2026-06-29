import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// POST /api/buyer/orders/[id]/complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error
  const { id } = await params

  try {
    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order || order.buyerId !== auth.userId) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    if (order.status !== 'SEDANG_DIKIRIM') {
      return NextResponse.json({ error: 'Pesanan tidak dalam status pengiriman' }, { status: 400 })
    }

    await prisma.order.update({
      where: { id },
      data: {
        status: 'PESANAN_SELESAI',
        completedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
