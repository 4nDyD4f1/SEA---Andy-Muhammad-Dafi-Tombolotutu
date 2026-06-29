import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/driver/jobs - Available jobs for drivers
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'DRIVER')
  if (error) return error

  try {
    const jobs = await prisma.order.findMany({
      where: { status: 'MENUNGGU_PENGIRIM' },
      include: {
        items: {
          include: { product: { select: { name: true } } },
          take: 3,
        },
        store: { select: { name: true } },
        buyer: { select: { name: true } },
      },
      orderBy: { processedAt: 'asc' }, // Oldest first = most urgent
    })

    return NextResponse.json(jobs)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
