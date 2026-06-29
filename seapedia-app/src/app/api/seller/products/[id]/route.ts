import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { sanitizeHtml } from '@/lib/utils'

const productUpdateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(20000).optional(),
  price: z.number().nonnegative().optional(),
  originalPrice: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  category: z.string().max(100).optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  images: z.array(z.string()).optional(),
})

// GET /api/seller/products/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { store: { select: { ownerId: true } } },
  })

  if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
  if (product.store.ownerId !== auth.userId) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  return NextResponse.json(product)
}

// PUT /api/seller/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error
  const { id } = await params

  try {
    // Verify ownership first
    const product = await prisma.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    })

    if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    if (product.store.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'Akses ditolak — bukan produk toko Anda' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = productUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(parsed.data.name && { name: sanitizeHtml(parsed.data.name) }),
        ...(parsed.data.description !== undefined && { description: sanitizeHtml(parsed.data.description) }),
        ...(parsed.data.price !== undefined && { price: parsed.data.price }),
        ...(parsed.data.originalPrice !== undefined && { originalPrice: parsed.data.originalPrice }),
        ...(parsed.data.stock !== undefined && { stock: parsed.data.stock }),
        ...(parsed.data.category !== undefined && { category: parsed.data.category }),
        ...(parsed.data.images !== undefined ? {
          images: parsed.data.images ? JSON.stringify(parsed.data.images) : null,
          imageUrl: parsed.data.images && parsed.data.images.length > 0 ? parsed.data.images[0] : null
        } : {
          ...(parsed.data.imageUrl !== undefined && { imageUrl: parsed.data.imageUrl || null })
        }),
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/seller/products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { store: { select: { ownerId: true } } },
  })

  if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
  if (product.store.ownerId !== auth.userId) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ message: 'Produk berhasil dihapus' })
}
