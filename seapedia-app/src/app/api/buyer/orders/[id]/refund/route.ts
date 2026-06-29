import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// POST /api/buyer/orders/[id]/refund
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
      include: { review: true }
    })

    if (!order || order.buyerId !== auth.userId) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    if (order.status !== 'SEDANG_DIKIRIM' && order.status !== 'PESANAN_SELESAI') {
      return NextResponse.json({ error: 'Hanya pesanan yang sedang dikirim atau selesai yang bisa diajukan refund' }, { status: 400 })
    }

    if (order.review) {
      return NextResponse.json({ error: 'Pesanan yang sudah diulas tidak dapat diajukan refund' }, { status: 400 })
    }

    await prisma.order.update({
      where: { id },
      data: {
        status: 'MENUNGGU_REFUND',
      }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
