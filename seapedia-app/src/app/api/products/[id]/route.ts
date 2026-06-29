import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            ownerId: true,
            owner: { select: { name: true } },
            vouchers: true
          },
        },
        orderItems: {
          include: {
            order: {
              include: { review: true }
            }
          }
        }
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    const reviewsMap = new Map()
    product.orderItems.forEach((item: any) => {
      if (item.order?.review && !reviewsMap.has(item.order.review.id)) {
        reviewsMap.set(item.order.review.id, item.order.review)
      }
    })
    const reviews = Array.from(reviewsMap.values()).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Fetch Store stats
    const storeStats = await prisma.store.findUnique({
      where: { id: product.store.id },
      include: {
        _count: { select: { products: true } }
      }
    })
    
    const storeReviewCount = await prisma.review.count({
      where: { order: { storeId: product.store.id } }
    })

    const responseData = {
      ...product,
      reviews,
      orderItems: undefined,
      storeStats: {
        productCount: storeStats?._count.products || 0,
        reviewCount: storeReviewCount,
        createdAt: storeStats?.createdAt || product.store.createdAt
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Product detail error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
