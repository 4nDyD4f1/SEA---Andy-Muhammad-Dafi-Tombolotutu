import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { sanitizeHtml } from '@/lib/utils'

const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional().nullable(),
})

// GET /api/buyer/profile
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        walletBalance: true,
      }
    })
    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT /api/buyer/profile
export async function PUT(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error

  try {
    const body = await request.json()
    const parsed = profileSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(parsed.data.name && { name: sanitizeHtml(parsed.data.name) }),
        ...(parsed.data.email && { email: sanitizeHtml(parsed.data.email) }),
        ...(parsed.data.address !== undefined && { address: parsed.data.address ? sanitizeHtml(parsed.data.address) : null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        walletBalance: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
