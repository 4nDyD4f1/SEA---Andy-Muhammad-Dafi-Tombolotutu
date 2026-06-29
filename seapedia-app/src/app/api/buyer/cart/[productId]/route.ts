import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// DELETE /api/buyer/cart/[productId] - Remove specific item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error
  const { productId } = await params

  try {
    const cart = await prisma.cart.findUnique({ where: { buyerId: auth.userId } })
    if (!cart) return NextResponse.json({ message: 'Cart tidak ada' })

    await prisma.cartItem.delete({
      where: { cartId_productId: { cartId: cart.id, productId } },
    })

    // If cart is empty, clear storeId
    const remainingItems = await prisma.cartItem.count({ where: { cartId: cart.id } })
    if (remainingItems === 0) {
      await prisma.cart.update({ where: { id: cart.id }, data: { storeId: null } })
    }

    return NextResponse.json({ message: 'Item dihapus' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/buyer/cart/[productId] - Update quantity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error
  const { productId } = await params

  const body = await request.json()
  const { quantity } = body

  if (typeof quantity !== 'number' || quantity < 0) {
    return NextResponse.json({ error: 'Quantity tidak valid' }, { status: 400 })
  }

  try {
    const cart = await prisma.cart.findUnique({ where: { buyerId: auth.userId } })
    if (!cart) return NextResponse.json({ error: 'Cart tidak ditemukan' }, { status: 404 })

    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } },
      })
    } else {
      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (!product || product.stock < quantity) {
        return NextResponse.json({ error: 'Stok tidak cukup' }, { status: 400 })
      }
      await prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity },
      })
    }

    return NextResponse.json({ message: 'Quantity diupdate' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
