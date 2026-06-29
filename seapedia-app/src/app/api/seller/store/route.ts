import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { sanitizeHtml } from '@/lib/utils'

const updateStoreSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(20000).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
})

// GET /api/seller/store
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

    return NextResponse.json(store)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT /api/seller/store
export async function PUT(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error

  try {
    const body = await request.json()
    const parsed = updateStoreSchema.safeParse(body)
    
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errorMsg = Object.entries(fieldErrors).map(([k, v]) => `${k}: ${v}`).join(', ');
      return NextResponse.json({ error: `Data tidak valid: ${errorMsg}` }, { status: 400 })
    }

    const currentStore = await prisma.store.findUnique({
      where: { ownerId: auth.userId }
    })

    if (!currentStore) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 })
    }

    // Check name uniqueness if changed
    if (parsed.data.name && parsed.data.name !== currentStore.name) {
      const existing = await prisma.store.findUnique({
        where: { name: parsed.data.name }
      })
      if (existing) {
        return NextResponse.json({ error: 'Nama toko sudah digunakan' }, { status: 400 })
      }
    }

    const updatedStore = await prisma.store.update({
      where: { ownerId: auth.userId },
      data: {
        name: parsed.data.name ? sanitizeHtml(parsed.data.name) : undefined,
        description: parsed.data.description !== undefined ? (parsed.data.description ? sanitizeHtml(parsed.data.description) : null) : undefined,
        imageUrl: parsed.data.imageUrl !== undefined ? parsed.data.imageUrl : undefined
      }
    })

    return NextResponse.json(updatedStore)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
