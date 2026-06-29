import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const { auth, error } = requireAuth(request)
    if (error) return error
    
    const userId = auth.userId

    // Count chat rooms where there is at least one unread message from someone else
    const unreadCount = await prisma.chatRoom.count({
      where: {
        AND: [
          {
            OR: [
              { buyerId: userId },
              { store: { ownerId: userId } }
            ]
          },
          {
            messages: {
              some: {
                isRead: false,
                senderId: { not: userId }
              }
            }
          }
        ]
      }
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
