import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { sanitizeHtml } from '@/lib/utils'

const reviewSchema = z.object({
  name: z.string().min(2).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
})

// GET /api/reviews
export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(reviews)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/reviews - No auth required
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', details: parsed.error.flatten() }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        name: sanitizeHtml(parsed.data.name),
        rating: parsed.data.rating,
        comment: sanitizeHtml(parsed.data.comment),
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
