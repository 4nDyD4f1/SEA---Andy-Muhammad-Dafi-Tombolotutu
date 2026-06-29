import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { sanitizeHtml } from '@/lib/utils'

const addressRequestSchema = z.object({
  newAddress: z.string().min(5).max(500),
})

// GET /api/seller/store/address-request
// Get the current pending request if any
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error

  try {
    const store = await prisma.store.findUnique({
      where: { ownerId: auth.userId }
    })
    
    if (!store) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 })
    }

    const pendingRequest = await prisma.addressChangeRequest.findFirst({
      where: {
        storeId: store.id,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(pendingRequest || null)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/seller/store/address-request
export async function POST(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error

  try {
    const body = await request.json()
    const parsed = addressRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errorMsg = Object.entries(fieldErrors).map(([k, v]) => `${k}: ${v}`).join(', ');
      return NextResponse.json({ error: `Data tidak valid: ${errorMsg}` }, { status: 400 })
    }

    const store = await prisma.store.findUnique({
      where: { ownerId: auth.userId }
    })

    if (!store) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 })
    }

    // Check if there is already a pending request
    const existingPending = await prisma.addressChangeRequest.findFirst({
      where: {
        storeId: store.id,
        status: 'PENDING'
      }
    })

    if (existingPending) {
      return NextResponse.json({ error: 'Anda sudah memiliki pengajuan alamat yang sedang diproses admin' }, { status: 400 })
    }

    const newRequest = await prisma.addressChangeRequest.create({
      data: {
        storeId: store.id,
        newAddress: sanitizeHtml(parsed.data.newAddress),
        status: 'PENDING'
      }
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
