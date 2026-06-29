import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { sanitizeHtml } from '@/lib/utils'

const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(20000).optional(),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  stock: z.number().int().min(0),
  category: z.string().max(100).optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  images: z.array(z.string()).optional(),
})

// GET /api/seller/products
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error

  try {
    const store = await prisma.store.findUnique({ where: { ownerId: auth.userId } })
    if (!store) {
      return NextResponse.json({ error: 'Anda belum memiliki toko', products: [] })
    }

    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ products, store })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/seller/products
export async function POST(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error

  try {
    const body = await request.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errorMsg = Object.entries(fieldErrors).map(([k, v]) => `${k}: ${v}`).join(', ');
      return NextResponse.json({ error: `Data tidak valid: ${errorMsg}`, details: parsed.error.flatten() }, { status: 400 })
    }

    const store = await prisma.store.findUnique({ where: { ownerId: auth.userId } })
    if (!store) {
      return NextResponse.json({ error: 'Buat toko terlebih dahulu' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: sanitizeHtml(parsed.data.name),
        description: parsed.data.description ? sanitizeHtml(parsed.data.description) : null,
        price: parsed.data.price,
        originalPrice: parsed.data.originalPrice || null,
        stock: parsed.data.stock,
        category: parsed.data.category ? sanitizeHtml(parsed.data.category) : null,
        imageUrl: parsed.data.images && parsed.data.images.length > 0 ? parsed.data.images[0] : (parsed.data.imageUrl || null),
        images: parsed.data.images ? JSON.stringify(parsed.data.images) : null,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Server error', stack: err.stack }, { status: 500 })
  }
}
