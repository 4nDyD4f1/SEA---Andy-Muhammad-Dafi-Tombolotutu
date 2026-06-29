import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/buyer/cart
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error

  try {
    const cart = await prisma.cart.findUnique({
      where: { buyerId: auth.userId },
      include: {
        items: {
          include: {
            product: {
              include: { store: { select: { id: true, name: true } } },
            },
          },
        },
      },
    })

    return NextResponse.json(cart || { items: [], storeId: null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/buyer/cart - Add item to cart
export async function POST(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error

  try {
    const body = await request.json()
    const { productId, quantity = 1 } = body

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    })

    if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    if (product.stock < quantity) {
      return NextResponse.json({ error: 'Stok tidak cukup' }, { status: 400 })
    }

    let cart = await prisma.cart.findUnique({ where: { buyerId: auth.userId } })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { buyerId: auth.userId, storeId: product.storeId },
      })
    } else if (cart.storeId && cart.storeId !== product.storeId) {
      // Single-store rule violation - return warning
      return NextResponse.json({
        error: 'different_store',
        message: `Keranjang Anda sudah berisi produk dari toko lain. Kosongkan keranjang terlebih dahulu?`,
        currentStoreId: cart.storeId,
        newStoreId: product.storeId,
      }, { status: 409 })
    }

    // Upsert cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    })

    if (existingItem) {
      await prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity: { increment: quantity } },
      })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      })
      if (!cart.storeId) {
        await prisma.cart.update({ where: { id: cart.id }, data: { storeId: product.storeId } })
      }
    }

    return NextResponse.json({ message: 'Produk ditambahkan ke keranjang' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/buyer/cart - Clear cart
export async function DELETE(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error

  try {
    const cart = await prisma.cart.findUnique({ where: { buyerId: auth.userId } })
    if (!cart) return NextResponse.json({ message: 'Keranjang sudah kosong' })

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    await prisma.cart.update({ where: { id: cart.id }, data: { storeId: null } })

    return NextResponse.json({ message: 'Keranjang dikosongkan' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
