import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// Fetch chat rooms for the current user
export async function GET(request: NextRequest) {
  try {
    const { auth, error } = requireAuth(request)
    if (error) return error
    
    const userId = auth.userId
    const role = auth.activeRole

    let rooms: any[] = []

    // Check if user has a store (seller) based on role or store ownership
    if (role === 'SELLER') {
      const store = await prisma.store.findUnique({ where: { ownerId: userId } })
      if (!store) return NextResponse.json([])

      rooms = await prisma.chatRoom.findMany({
        where: { storeId: store.id },
        include: {
          buyer: { select: { id: true, name: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { updatedAt: 'desc' }
      })
    } else {
      // BUYER - also check if they have buyer rooms
      rooms = await prisma.chatRoom.findMany({
        where: { buyerId: userId },
        include: {
          store: { select: { id: true, name: true, imageUrl: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { updatedAt: 'desc' }
      })
    }

    return NextResponse.json(rooms)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Create or get chat room
export async function POST(request: NextRequest) {
  try {
    const { auth, error } = requireAuth(request)
    if (error) return error
    
    const buyerId = auth.userId
    
    const body = await request.json()
    const { storeId } = body

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
    }

    // Check if room exists
    let room = await prisma.chatRoom.findUnique({
      where: {
        buyerId_storeId: {
          buyerId,
          storeId
        }
      }
    })

    // If not, create it
    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          buyerId,
          storeId
        }
      })
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
