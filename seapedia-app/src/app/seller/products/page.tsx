'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/components/ui/Toast'

export default function SellerProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const toast = useToast()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/seller/products')
        const data = await res.json()
        if (res.ok) setProducts(data.products || [])
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) return

    try {
      const res = await fetch(`/api/seller/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id))
        toast.success('Produk berhasil dihapus')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus produk')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    }
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-headline-lg font-bold">Produk Saya</h1>
          <p className="text-on-surface-variant">Kelola daftar produk, stok, dan harga.</p>
        </div>
        <Link href="/seller/products/new" className="btn-primary shadow-float">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Produk
        </Link>
      </div>

      <div className="card bg-white p-4 mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-outline">search</span>
        <input 
          type="text" 
          placeholder="Cari nama produk..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none w-full text-on-surface"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card h-64 shimmer"></div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="card bg-white overflow-hidden flex flex-col group">
              <div className="relative w-full aspect-square bg-surface-container overflow-hidden">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-outline-variant">image</span>
                  </div>
                )}
                {product.stock <= 5 && (
                  <div className="absolute top-2 right-2 bg-error text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                    {product.stock === 0 ? 'Sold Out' : `Sisa ${product.stock}`}
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-bold text-on-surface line-clamp-2 leading-tight">{product.name}</h3>
                </div>
                <div className="mt-auto">
                  <p className="text-lg font-black text-coral mb-4">Rp {product.price.toLocaleString('id-ID')}</p>
                  
                  <div className="flex items-center gap-2 pt-4 border-t border-outline-variant/50">
                    <Link href={`/seller/products/${product.id}/edit`} className="flex-1 btn-outline btn-sm hover:!bg-surface-container hover:!text-on-surface hover:!border-outline-variant text-center inline-block">
                      <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                    </Link>
                    <button 
                      onClick={() => handleDelete(product.id, product.name)}
                      className="flex-1 btn-danger btn-sm bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span> Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-outline-variant shadow-sm">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">inventory_2</span>
          <h3 className="text-title-md font-bold text-on-surface">Tidak ada produk</h3>
          <p className="text-on-surface-variant mt-2">Anda belum menambahkan produk atau produk tidak ditemukan.</p>
        </div>
      )}
    </div>
  )
}
