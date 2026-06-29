'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { ProductCard, Product } from '@/components/product/ProductCard'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import Image from 'next/image'

export default function BuyerHomePage() {
  const { user } = useAuthStore()
  const { addItem, clearCart, storeName } = useCartStore()
  const toast = useToast()
  
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Elektronik')
  
  // Single store warning modal state
  const [isWarningOpen, setIsWarningOpen] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=50')
        const data = await res.json()
        if (res.ok) setProducts(data.products || [])
      } catch (error) {
        console.error('Failed to fetch products', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filteredProducts = activeCategory === 'Semua' 
    ? products 
    : products.filter(p => p.category?.toLowerCase().includes(activeCategory.toLowerCase()) || activeCategory.toLowerCase().includes(p.category?.toLowerCase() || ''))

  const handleAddToCart = async (product: Product) => {
    if (product.store.ownerId === user?.id) {
      toast.error('Tidak dapat membeli produk dari toko Anda sendiri!')
      return
    }
    
    // Optimistically try to add
    const status = addItem(product, product.store.id, product.store.name)
    
    if (status === 'different_store') {
      setPendingProduct(product)
      setIsWarningOpen(true)
    } else {
      toast.success(`${product.name} ditambahkan ke keranjang`)
      // Sync with backend cart
      try {
        await fetch('/api/buyer/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: 1 })
        })
      } catch (err) {
        console.error('Failed to sync cart to server')
      }
    }
  }

  const handleReplaceCart = async () => {
    if (!pendingProduct) return
    
    // Clear cart both in Zustand and Backend
    clearCart()
    try {
      await fetch('/api/buyer/cart', { method: 'DELETE' })
      
      // Then add new item
      addItem(pendingProduct, pendingProduct.store.id, pendingProduct.store.name)
      await fetch('/api/buyer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: pendingProduct.id, quantity: 1 })
      })
      toast.success('Keranjang diperbarui')
    } catch (err) {
      toast.error('Gagal memperbarui keranjang')
    } finally {
      setIsWarningOpen(false)
      setPendingProduct(null)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
        <div>
          <h1 className="text-headline-lg font-bold">Halo, {user?.name.split(' ')[0]}! 👋</h1>
          <p className="text-on-surface-variant">Mau belanja apa hari ini?</p>
        </div>
        <div className="bg-primary/10 px-4 py-3 rounded-lg border border-primary/20">
          <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Saldo Wallet</p>
          <p className="text-xl font-black text-primary">Rp {user?.walletBalance.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-6">
        {['Semua', 'Elektronik', 'Fashion', 'Makanan', 'Otomotif'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveCategory(tab)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors border ${
              activeCategory === tab 
                ? 'bg-primary text-white border-primary shadow-sm' 
                : 'bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
            <div key={i} className="card overflow-hidden h-[300px] flex flex-col">
              <div className="w-full aspect-square shimmer"></div>
              <div className="p-4 flex-grow flex flex-col gap-2">
                <div className="h-4 shimmer rounded w-3/4"></div>
                <div className="h-4 shimmer rounded w-1/2"></div>
                <div className="h-8 shimmer rounded mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={() => handleAddToCart(product)}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 mt-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl text-outline-variant">search_off</span>
            <h3 className="text-title-md font-bold text-on-surface">Tidak ada produk</h3>
          </div>
          <p className="text-on-surface-variant">Belum ada produk untuk kategori ini. Coba pilih kategori lain.</p>
        </div>
      )}

      {/* Warning Modal */}
      <Modal isOpen={isWarningOpen} onClose={() => setIsWarningOpen(false)} title="Peringatan Toko Berbeda">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-secondary-container text-secondary mx-auto flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>
          <p className="text-body-lg mb-4">
            Keranjang Anda saat ini berisi produk dari toko <strong>{storeName}</strong>. 
            Apakah Anda ingin mengosongkan keranjang dan mulai belanja dari toko <strong>{pendingProduct?.store.name}</strong>?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setIsWarningOpen(false)} className="btn-outline flex-1">
              Batal
            </button>
            <button onClick={handleReplaceCart} className="btn-primary bg-secondary flex-1">
              Ya, Ganti Toko
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
