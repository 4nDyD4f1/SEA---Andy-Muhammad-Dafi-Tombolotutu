import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { SLA_HOURS } from '@/lib/utils'

// POST /api/seller/orders/[id]/process
// Changes order status from SEDANG_DIKEMAS to MENUNGGU_PENGIRIM
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
      include: { store: { select: { ownerId: true } } },
    })

    if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    if (order.store.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    if (order.status !== 'SEDANG_DIKEMAS') {
      return NextResponse.json({ error: `Pesanan tidak bisa diproses, status saat ini: ${order.status}` }, { status: 400 })
    }

    // Get current system date for SLA deadline calculation
    const systemConfig = await prisma.systemConfig.findUnique({ where: { key: 'CURRENT_DATE' } })
    const now = systemConfig ? new Date(systemConfig.value) : new Date()
    const slaDeadline = new Date(now.getTime() + SLA_HOURS * 60 * 60 * 1000)

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'MENUNGGU_PENGIRIM',
        processedAt: now,
        slaDeadline,
      },
    })

    return NextResponse.json({ message: 'Pesanan berhasil diproses', order: updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
