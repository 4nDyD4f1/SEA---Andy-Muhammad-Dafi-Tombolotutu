import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { sanitizeHtml } from '@/lib/utils'

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  }),
  role: z.enum(['BUYER', 'SELLER', 'DRIVER']).default('BUYER'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, password, role } = parsed.data

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)
    
    // Determine roles to create based on selection
    const rolesToCreate = [{ role } as any]

    const user = await prisma.user.create({
      data: {
        name: sanitizeHtml(name),
        email: email.toLowerCase().trim(),
        passwordHash,
        walletBalance: 100000, // Starting balance for demo
        roles: {
          create: rolesToCreate,
        },
      },
      include: { roles: true },
    })

    const roles = user.roles.map((r) => r.role)
    const activeRole = role // Set their active role to what they picked
    
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      roles,
      activeRole,
    })

    const response = NextResponse.json({
      message: 'Registrasi berhasil',
      user: { id: user.id, name: user.name, email: user.email, roles, activeRole, walletBalance: user.walletBalance },
      token,
    })

    response.cookies.set('seapedia_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
