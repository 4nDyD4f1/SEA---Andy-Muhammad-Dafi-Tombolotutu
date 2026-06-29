'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useToast } from '@/components/ui/Toast'

export default function CartPage() {
  const router = useRouter()
  const { items, storeName, updateQuantity, removeItem, getTotal, clearCart } = useCartStore()
  const toast = useToast()
  
  const [isSyncing, setIsSyncing] = useState(false)

  // Initial load sync from backend if needed
  useEffect(() => {
    // This is optional if we trust Zustand, but good for keeping in sync across devices
    const fetchCart = async () => {
      try {
        const res = await fetch('/api/buyer/cart')
        const data = await res.json()
        if (data.items && data.items.length === 0 && items.length > 0) {
          // Sync backend cart with local if backend is empty
          for (const item of items) {
            await fetch('/api/buyer/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId: item.product.id, quantity: item.quantity })
            })
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchCart()
  }, [])

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return
    setIsSyncing(true)
    
    // Optimistic update
    updateQuantity(productId, newQuantity)
    
    try {
      await fetch(`/api/buyer/cart/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      })
    } catch (err) {
      toast.error('Gagal memperbarui kuantitas')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRemove = async (productId: string) => {
    setIsSyncing(true)
    removeItem(productId)
    try {
      await fetch(`/api/buyer/cart/${productId}`, { method: 'DELETE' })
      toast.info('Item dihapus dari keranjang')
    } catch (err) {
      toast.error('Gagal menghapus item')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleClear = async () => {
    setIsSyncing(true)
    clearCart()
    try {
      await fetch('/api/buyer/cart', { method: 'DELETE' })
      toast.info('Keranjang dikosongkan')
    } catch (err) {
      toast.error('Gagal mengosongkan keranjang')
    } finally {
      setIsSyncing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-40 h-40 mb-6 bg-surface-container rounded-full flex items-center justify-center">
          <span className="text-6xl">🛍️</span>
        </div>
        <h2 className="text-headline-lg font-bold mb-2">Keranjang Kosong</h2>
        <p className="text-on-surface-variant mb-8 max-w-[448px]">Belum ada barang di keranjang Anda. Mari mulai berbelanja dan temukan produk menarik!</p>
        <Link href="/buyer" className="btn-primary px-8">Mulai Belanja</Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-full border border-outline-variant hover:bg-surface-container transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-headline-lg font-bold">Keranjang Belanja</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3">
          <div className="card overflow-hidden bg-white">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
                <span className="font-bold text-on-surface">{storeName}</span>
              </div>
              <button 
                onClick={handleClear}
                disabled={isSyncing}
                className="text-error text-sm font-semibold hover:underline flex items-center gap-1"
              >
                Kosongkan
              </button>
            </div>
            
            <div className="divide-y divide-outline-variant">
              {items.map((item) => (
                <div key={item.product.id} className="p-4 flex gap-4 items-start sm:items-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-surface-container overflow-hidden shrink-0">
                    {item.product.imageUrl ? (
                      <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline-variant">image</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-on-surface line-clamp-2 sm:line-clamp-1">{item.product.name}</h3>
                      <p className="text-coral font-bold mt-1">
                        Rp {item.product.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">Sisa stok: {item.product.stock}</p>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                      <div className="flex items-center border border-outline-variant rounded-md overflow-hidden bg-surface-container-lowest">
                        <button 
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          disabled={isSyncing || item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center hover:bg-surface-container disabled:opacity-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          disabled={isSyncing || item.quantity >= item.product.stock}
                          className="w-8 h-8 flex items-center justify-center hover:bg-surface-container disabled:opacity-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handleRemove(item.product.id)}
                        disabled={isSyncing}
                        className="text-outline hover:text-error transition-colors p-2"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="card p-6 bg-white sticky top-24">
            <h2 className="text-title-md font-bold mb-4 border-b border-outline-variant pb-4">Ringkasan Belanja</h2>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-on-surface-variant">Total Harga ({items.length} Barang)</span>
              <span className="font-semibold text-on-surface">Rp {getTotal().toLocaleString('id-ID')}</span>
            </div>
            
            <div className="divider"></div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-lg">Total</span>
              <span className="font-black text-xl text-coral">Rp {getTotal().toLocaleString('id-ID')}</span>
            </div>
            
            <Link href="/buyer/checkout" className="btn-primary w-full shadow-float text-base py-3">
              Beli Sekarang ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
