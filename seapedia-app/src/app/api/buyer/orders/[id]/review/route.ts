import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
})

// POST /api/buyer/orders/[id]/review
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

    if (order.status !== 'PESANAN_SELESAI') {
      return NextResponse.json({ error: 'Ulasan hanya bisa diberikan untuk pesanan yang sudah selesai' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data ulasan tidak valid' }, { status: 400 })
    }

    if (order.review) {
      const hoursSinceReview = (new Date().getTime() - new Date(order.review.createdAt).getTime()) / (1000 * 60 * 60)
      if (hoursSinceReview > 48) {
        return NextResponse.json({ error: 'Batas waktu 48 jam untuk mengubah ulasan telah habis' }, { status: 400 })
      }
      
      await prisma.review.update({
        where: { id: order.review.id },
        data: {
          rating: parsed.data.rating,
          comment: parsed.data.comment,
          // Only update image if a new one is provided or explicitly set to null
          imageUrl: parsed.data.imageUrl !== undefined ? parsed.data.imageUrl : order.review.imageUrl
        }
      })
    } else {
      await prisma.review.create({
        data: {
          orderId: order.id,
          name: auth.name,
          rating: parsed.data.rating,
          comment: parsed.data.comment,
          imageUrl: parsed.data.imageUrl || null
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
