import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/admin/address-requests
export async function GET(request: NextRequest) {
  const { error } = requireAuth(request, 'ADMIN')
  if (error) return error

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'PENDING'

    const requests = await prisma.addressChangeRequest.findMany({
      where: status !== 'ALL' ? { status } : undefined,
      include: {
        store: {
          select: {
            name: true,
            address: true,
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(requests)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
