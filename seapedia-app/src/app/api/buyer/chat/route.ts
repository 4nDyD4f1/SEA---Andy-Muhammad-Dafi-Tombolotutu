import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/buyer/chat - Get chat rooms for buyer
export async function GET(request: NextRequest) {
  try {
    const { auth, error } = requireAuth(request, 'BUYER')
    if (error) return error
    
    const userId = auth.userId

    const rooms = await prisma.chatRoom.findMany({
      where: { buyerId: userId },
      include: {
        store: { select: { id: true, name: true, imageUrl: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
