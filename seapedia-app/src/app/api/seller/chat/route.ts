import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/chat/seller - Get chat rooms for seller (bypasses role check, uses store ownership)
export async function GET(request: NextRequest) {
  try {
    const { auth, error } = requireAuth(request)
    if (error) return error
    
    const userId = auth.userId

    // Find store by userId (ownership-based, not role-based)
    const store = await prisma.store.findUnique({ where: { ownerId: userId } })
    if (!store) return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 })

    const rooms = await prisma.chatRoom.findMany({
      where: { storeId: store.id },
      include: {
        buyer: { select: { id: true, name: true } },
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
