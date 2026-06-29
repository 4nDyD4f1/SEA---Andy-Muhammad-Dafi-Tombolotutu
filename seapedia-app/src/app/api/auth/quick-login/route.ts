import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// POST /api/auth/quick-login - Testing only, creates accounts if they don't exist
export async function POST(request: Request) {
  const body = await request.json()
  const { role } = body // 'BUYER' or 'SELLER'

  const testAccounts: Record<string, { email: string, name: string, password: string, wallet: number }> = {
    BUYER: {
      email: 'buyer@test.com',
      name: 'Pembeli Test',
      password: 'test123',
      wallet: 500000
    },
    SELLER: {
      email: 'seller@test.com',
      name: 'Penjual Test',
      password: 'test123',
      wallet: 0
    },
    ADMIN: {
      email: 'admin@test.com',
      name: 'Admin Test',
      password: 'test123',
      wallet: 0
    },
    DRIVER: {
      email: 'driver@test.com',
      name: 'Driver Test',
      password: 'test123',
      wallet: 0
    }
  }

  const account = testAccounts[role]
  if (!account) return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })

  try {
    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: account.email },
      include: { roles: true }
    })

    if (!user) {
      const passwordHash = await bcrypt.hash(account.password, 10)
      user = await prisma.user.create({
        data: {
          email: account.email,
          name: account.name,
          passwordHash,
          walletBalance: account.wallet,
          roles: {
            create: [{ role }]
          }
        },
        include: { roles: true }
      })
    }

    // If role not in user roles, add it
    const hasRole = user.roles.some(r => r.role === role)
    if (!hasRole) {
      await prisma.userRole.create({ data: { userId: user.id, role } })
    }

    // If SELLER, ensure they have a store
    if (role === 'SELLER') {
      const existingStore = await prisma.store.findUnique({ where: { ownerId: user.id } })
      if (!existingStore) {
        await prisma.store.create({
          data: {
            name: 'Toko Test Penjual',
            description: 'Toko demo untuk testing SEAPEDIA',
            ownerId: user.id,
            products: {
              create: [
                {
                  name: 'Produk Demo - Headphone Wireless',
                  description: 'Produk demo untuk testing. Kualitas premium dengan suara jernih.',
                  price: 150000,
                  stock: 50,
                  category: 'Elektronik',
                  imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'
                },
                {
                  name: 'Produk Demo - Kemeja Batik',
                  description: 'Kemeja batik modern dengan motif elegan.',
                  price: 85000,
                  stock: 30,
                  category: 'Fashion',
                  imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80'
                },
                {
                  name: 'Produk Demo - Minyak Goreng 2L',
                  description: 'Minyak goreng premium untuk masakan sehari-hari.',
                  price: 35000,
                  stock: 100,
                  category: 'Sembako',
                  imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80'
                }
              ]
            }
          }
        })
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: true }
    })

    const roles = updatedUser!.roles.map(r => r.role)
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      roles,
      activeRole: role,
    })

    const responseData = {
      message: 'Quick login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
        activeRole: role,
        walletBalance: updatedUser!.walletBalance,
      },
      token,
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
    console.error('Quick login error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
