import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// Fetch messages for a room
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { auth, error } = requireAuth(request)
    if (error) return error
    
    const userId = auth.userId

    const params = await context.params
    const roomId = params.roomId

    // Verify room access
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { store: true }
    })

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    // Check if user is the buyer or the store owner
    if (room.buyerId !== userId && room.store.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' }
    })

    // Mark messages as read
    await prisma.chatMessage.updateMany({
      where: { roomId, senderId: { not: userId }, isRead: false },
      data: { isRead: true }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Send message
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { auth, error } = requireAuth(request)
    if (error) return error
    
    const userId = auth.userId

    const params = await context.params
    const roomId = params.roomId
    const body = await request.json()
    const { text } = body

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Verify access
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { store: true }
    })

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (room.buyerId !== userId && room.store.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: userId,
        text
      }
    })

    // Update room updatedAt
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
