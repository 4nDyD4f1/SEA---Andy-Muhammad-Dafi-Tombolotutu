import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  activeRole: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid' },
        { status: 400 }
      )
    }

    const { email, password, activeRole } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { roles: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    const roles = user.roles.map((r) => r.role)

    // Determine active role
    let selectedRole = roles[0]
    if (activeRole && roles.includes(activeRole)) {
      selectedRole = activeRole
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      roles,
      activeRole: selectedRole,
    })

    const responseData = {
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
        activeRole: selectedRole,
        walletBalance: user.walletBalance,
      },
      token,
      requireRoleSelection: roles.length > 1 && !activeRole,
    }

    const response = NextResponse.json(responseData)

    response.cookies.set('seapedia_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
