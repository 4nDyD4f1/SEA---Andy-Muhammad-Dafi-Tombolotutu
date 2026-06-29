'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import { ImageUploader } from '@/components/ui/ImageUploader'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('')
  const [images, setImages] = useState<string[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/seller/products/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setName(data.name)
          setDescription(data.description || '')
          const fetchedPrice = data.price || 0
          const fetchedOriginal = data.originalPrice || fetchedPrice
          const fetchedDiscount = fetchedOriginal > 0 ? Math.round(((fetchedOriginal - fetchedPrice) / fetchedOriginal) * 100) : 0
          
          setOriginalPrice(fetchedOriginal.toLocaleString('id-ID'))
          setDiscountPercent(fetchedDiscount > 0 ? fetchedDiscount.toString() : '')
          setFinalPrice(fetchedPrice.toLocaleString('id-ID'))
          setStock(data.stock.toString())
          setCategory(data.category || '')
          
          if (data.images) {
            try {
              setImages(JSON.parse(data.images))
            } catch (e) {
              setImages(data.imageUrl ? [data.imageUrl] : [])
            }
          } else {
            setImages(data.imageUrl ? [data.imageUrl] : [])
          }
        } else {
          toast.error('Gagal mengambil data produk')
          router.push('/seller/products')
        }
      } catch (err) {
        toast.error('Terjadi kesalahan')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProduct()
  }, [params.id, router, toast])

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    const orig = Number(originalPrice.replace(/\./g, '')) || 0
    const final = Number(finalPrice.replace(/\./g, '')) || 0
    const disc = Number(discountPercent) || 0

    if (name === 'originalPrice') {
      if (orig > 0 && final > 0) {
        let calcDisc = Math.round(((orig - final) / orig) * 100)
        if (calcDisc < 0) calcDisc = 0
        if (calcDisc > 100) calcDisc = 100
        setDiscountPercent(calcDisc > 0 ? calcDisc.toString() : '')
      } else if (orig > 0 && final === 0) {
        setFinalPrice(orig.toLocaleString('id-ID'))
        setDiscountPercent('')
      }
    } else if (name === 'discountPercent') {
      if (orig > 0) {
        const calcFinal = Math.round(orig - (orig * disc / 100))
        setFinalPrice(calcFinal > 0 ? calcFinal.toLocaleString('id-ID') : '')
      }
    } else if (name === 'finalPrice') {
      if (orig > 0 && final > 0) {
        let calcDisc = Math.round(((orig - final) / orig) * 100)
        if (calcDisc < 0) calcDisc = 0
        if (calcDisc > 100) calcDisc = 100
        setDiscountPercent(calcDisc > 0 ? calcDisc.toString() : '')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const originalPriceNum = Number(originalPrice.replace(/\./g, '')) || 0
    const discountNum = Number(discountPercent) || 0
    const finalPriceNum = Number(finalPrice.replace(/\./g, '')) || 0

    try {
      const res = await fetch(`/api/seller/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: finalPriceNum > 0 ? finalPriceNum : originalPriceNum,
          originalPrice: discountNum > 0 ? originalPriceNum : null,
          stock: Number(stock),
          category,
          images
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Produk berhasil diperbarui!')
        router.push('/seller/products')
      } else {
        toast.error(data.error || 'Gagal memperbarui produk')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan server')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-10 shimmer w-1/3 rounded"></div>
        <div className="card h-[400px] shimmer"></div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/seller/products" className="btn-ghost p-2 rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined text-[#0A192F]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-headline-lg font-bold text-[#0A192F]">Edit Produk</h1>
          <p className="text-slate-500">Perbarui informasi produk Anda</p>
        </div>
      </div>

      <div className="card bg-white p-6 md:p-8 border-t-4 border-[#0A192F]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="label text-[#0A192F]">Nama Produk</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="input focus:border-[#64FFDA]"
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="label text-[#0A192F]">Harga Asli (Rp) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">Rp</span>
                <input 
                  type="text" 
                  name="originalPrice"
                  value={originalPrice}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/\D/g, '')
                    const orig = rawValue ? parseInt(rawValue, 10) : 0
                    setOriginalPrice(orig ? orig.toLocaleString('id-ID') : '')
                  }}
                  onBlur={handleBlur}
                  className="input focus:border-[#64FFDA] pl-12 font-bold"
                  placeholder="Contoh: 150.000"
                  required 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="label text-slate-500">Diskon (%)</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="discountPercent"
                  value={discountPercent}
                  onChange={e => {
                    let rawValue = e.target.value.replace(/\D/g, '')
                    if (Number(rawValue) > 100) rawValue = '100'
                    setDiscountPercent(rawValue)
                  }}
                  onBlur={handleBlur}
                  className="input focus:border-[#64FFDA] pr-12 text-[#64FFDA] font-bold"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="label text-slate-500">Harga Jual (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">Rp</span>
                <input 
                  type="text" 
                  name="finalPrice"
                  value={finalPrice}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/\D/g, '')
                    const final = rawValue ? parseInt(rawValue, 10) : 0
                    setFinalPrice(final ? final.toLocaleString('id-ID') : '')
                  }}
                  onBlur={handleBlur}
                  className="input pl-12 font-bold focus:border-[#64FFDA]"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="label text-[#0A192F]">Stok *</label>
              <input 
                type="number" 
                value={stock}
                onChange={e => setStock(e.target.value)}
                className="input focus:border-[#64FFDA]"
                min="0"
                required 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label text-[#0A192F]">Kategori</label>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="input focus:border-[#64FFDA]"
              required
            >
              <option value="">Pilih Kategori</option>
              <option value="Elektronik">Elektronik</option>
              <option value="Fashion">Fashion</option>
              <option value="Makanan">Makanan</option>
              <option value="Otomotif">Otomotif</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="label text-[#0A192F]">Foto Produk (Multi)</label>
            <ImageUploader 
              images={images} 
              onChange={setImages}
              maxImages={5}
            />
          </div>

          <div className="space-y-1.5">
            <label className="label text-[#0A192F]">Deskripsi</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input min-h-[120px] resize-y focus:border-[#64FFDA]"
            ></textarea>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full btn-primary bg-[#0A192F] hover:bg-[#112240] text-[#64FFDA] shadow-float py-3"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
