import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error

  try {
    const reviews = await prisma.review.findMany({
      where: {
        order: {
          store: {
            ownerId: auth.userId
          }
        }
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: { imageUrl: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(reviews)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
