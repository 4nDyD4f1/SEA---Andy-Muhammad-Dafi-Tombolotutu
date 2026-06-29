import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// POST /api/driver/jobs/[id]/take - Lock job (race condition prevention)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = requireAuth(request, 'DRIVER')
  if (error) return error
  const { id } = await params

  try {
    // Atomic update - only succeeds if status is still MENUNGGU_PENGIRIM
    // This prevents race conditions
    const updated = await prisma.order.updateMany({
      where: {
        id,
        status: 'MENUNGGU_PENGIRIM',
        driverId: null, // Extra safety: not already taken
      },
      data: {
        status: 'SEDANG_DIKIRIM',
        driverId: auth.userId,
        pickedAt: new Date(),
      },
    })

    if (updated.count === 0) {
      // Either order doesn't exist, wrong status, or already taken by another driver
      return NextResponse.json({
        error: 'Pesanan tidak tersedia. Mungkin sudah diambil driver lain.',
      }, { status: 409 })
    }

    const order = await prisma.order.findUnique({ where: { id } })
    return NextResponse.json({ message: 'Job berhasil diambil!', order })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
