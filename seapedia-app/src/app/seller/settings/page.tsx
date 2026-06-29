'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

interface StoreProfile {
  name: string
  description: string | null
  imageUrl: string | null
  address: string | null
}

interface AddressRequest {
  id: string
  newAddress: string
  status: string
}

export default function SellerSettingsPage() {
  const { user, setStoreProfile } = useAuthStore()
  const toast = useToast()
  
  const [profile, setProfile] = useState<StoreProfile | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  const [addressRequest, setAddressRequest] = useState<AddressRequest | null>(null)
  
  // Regional Address State
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  
  const [selectedProv, setSelectedProv] = useState({ id: '', name: '' })
  const [selectedCity, setSelectedCity] = useState({ id: '', name: '' })
  const [selectedDist, setSelectedDist] = useState({ id: '', name: '' })
  const [postalCode, setPostalCode] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchAddressRequest()
    
    // Fetch Provinces
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error(err))
  }, [])

  // Fetch Cities when Province changes
  useEffect(() => {
    if (selectedProv.id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProv.id}.json`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(err => console.error(err))
      setSelectedCity({ id: '', name: '' })
      setDistricts([])
      setSelectedDist({ id: '', name: '' })
    }
  }, [selectedProv.id])

  // Fetch Districts when City changes
  useEffect(() => {
    if (selectedCity.id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCity.id}.json`)
        .then(res => res.json())
        .then(data => setDistricts(data))
        .catch(err => console.error(err))
      setSelectedDist({ id: '', name: '' })
    }
  }, [selectedCity.id])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/seller/store')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setName(data.name)
        setDescription(data.description || '')
        if (data.imageUrl) {
          setImages([data.imageUrl])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAddressRequest = async () => {
    try {
      const res = await fetch('/api/seller/store/address-request')
      if (res.ok) {
        const data = await res.json()
        setAddressRequest(data) // null if no pending request
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('/api/seller/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          imageUrl: images.length > 0 ? images[0] : null
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Profil toko berhasil diperbarui')
        setProfile(data)
        setStoreProfile({ name: data.name, imageUrl: data.imageUrl })
      } else {
        toast.error(data.error || 'Gagal menyimpan profil')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRequestAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProv.name || !selectedCity.name || !selectedDist.name || !postalCode || streetAddress.length < 5) {
      toast.error('Mohon lengkapi data alamat toko Anda')
      return
    }

    const fullAddress = `${streetAddress}, Kec. ${selectedDist.name}, Kota/Kab. ${selectedCity.name}, Prov. ${selectedProv.name} ${postalCode}`
    
    setIsSubmittingAddress(true)
    try {
      const res = await fetch('/api/seller/store/address-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAddress: fullAddress })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Pengajuan perubahan alamat berhasil dikirim')
        setAddressRequest(data)
        // Reset form
        setSelectedProv({ id: '', name: '' })
        setSelectedCity({ id: '', name: '' })
        setSelectedDist({ id: '', name: '' })
        setPostalCode('')
        setStreetAddress('')
      } else {
        toast.error(data.error || 'Gagal mengajukan alamat')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengajukan')
    } finally {
      setIsSubmittingAddress(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div></div>
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/seller/dashboard" className="p-2 bg-white rounded-full border border-outline-variant hover:bg-surface-container transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-headline-lg font-bold">Pengaturan Toko</h1>
          <p className="text-on-surface-variant">Ubah profil dan kelola alamat toko Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profil Toko Section */}
        <div className="card bg-white p-6">
          <h2 className="text-title-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-coral">storefront</span>
            Profil Toko
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="label">Foto Profil Toko (Opsional)</label>
              <ImageUploader images={images} onChange={setImages} maxImages={1} />
              <p className="text-xs text-on-surface-variant mt-1">Gunakan rasio 1:1 untuk hasil terbaik.</p>
            </div>
            <div>
              <label className="label">Nama Toko *</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                minLength={3}
                maxLength={100}
              />
            </div>
            <div>
              <label className="label">Deskripsi Toko</label>
              <textarea
                className="input min-h-[120px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ceritakan tentang toko dan produk yang Anda jual..."
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary w-full"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </div>

        {/* Alamat Toko Section */}
        <div className="card bg-white p-6 h-fit">
          <h2 className="text-title-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-coral">location_on</span>
            Alamat Toko
          </h2>
          
          <div className="mb-6 p-4 bg-surface rounded-xl border border-outline-variant">
            <span className="text-sm font-bold text-on-surface-variant mb-1 block">ALAMAT SAAT INI</span>
            <p className="text-on-surface whitespace-pre-wrap">
              {profile?.address || <span className="italic text-on-surface-variant">Belum ada alamat terdaftar</span>}
            </p>
          </div>

          <div className="border-t border-outline-variant pt-6">
            <h3 className="font-bold mb-2">Ajukan Perubahan Alamat</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Perubahan alamat memerlukan persetujuan Admin agar sistem pengiriman tetap akurat.
            </p>

            {addressRequest ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 text-amber-700 font-bold mb-2">
                  <span className="material-symbols-outlined">pending_actions</span>
                  Menunggu Persetujuan
                </div>
                <p className="text-sm text-amber-800 mb-2">
                  Anda telah mengajukan alamat baru. Mohon tunggu admin untuk menyetujui.
                </p>
                <div className="text-sm bg-white/50 p-2 rounded border border-amber-100">
                  <span className="font-semibold block mb-1">Alamat Diajukan:</span>
                  {addressRequest.newAddress}
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestAddress} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Provinsi</label>
                    <select 
                      className="input cursor-pointer"
                      value={selectedProv.id}
                      onChange={(e) => {
                        const prov = provinces.find(p => p.id === e.target.value)
                        setSelectedProv(prov || { id: '', name: '' })
                      }}
                    >
                      <option value="">Pilih Provinsi</option>
                      {provinces.map(prov => (
                        <option key={prov.id} value={prov.id}>{prov.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Kota / Kabupaten</label>
                    <select 
                      className="input cursor-pointer"
                      value={selectedCity.id}
                      onChange={(e) => {
                        const city = cities.find(c => c.id === e.target.value)
                        setSelectedCity(city || { id: '', name: '' })
                      }}
                      disabled={!selectedProv.id}
                    >
                      <option value="">Pilih Kota/Kabupaten</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Kecamatan</label>
                    <select 
                      className="input cursor-pointer"
                      value={selectedDist.id}
                      onChange={(e) => {
                        const dist = districts.find(d => d.id === e.target.value)
                        setSelectedDist(dist || { id: '', name: '' })
                      }}
                      disabled={!selectedCity.id}
                    >
                      <option value="">Pilih Kecamatan</option>
                      {districts.map(dist => (
                        <option key={dist.id} value={dist.id}>{dist.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Kode Pos</label>
                    <input 
                      type="text" 
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Contoh: 12345"
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Detail Alamat (Jalan, RT/RW, Patokan)</label>
                  <textarea 
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="input min-h-[80px]"
                    placeholder="Contoh: Jl. Merdeka No. 12, RT 01/RW 02..."
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmittingAddress}
                  className="btn bg-on-surface text-white hover:bg-neutral-800 w-full"
                >
                  {isSubmittingAddress ? 'Mengirim...' : 'Ajukan Alamat Baru'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
