'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

interface AddressRequest {
  id: string
  storeId: string
  newAddress: string
  status: string
  createdAt: string
  store: {
    name: string
    address: string | null
    owner: {
      name: string
      email: string
    }
  }
}

export default function AdminAddressRequestsPage() {
  const toast = useToast()
  const [requests, setRequests] = useState<AddressRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/address-requests?status=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengambil data pengajuan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Apakah Anda yakin ingin ${action === 'APPROVED' ? 'menyetujui' : 'menolak'} pengajuan ini?`)) return

    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/address-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(`Pengajuan berhasil di${action === 'APPROVED' ? 'setujui' : 'tolak'}`)
        setRequests(requests.filter(req => req.id !== id))
      } else {
        toast.error(data.error || 'Gagal memproses pengajuan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/dashboard" className="p-2 bg-white rounded-full border border-outline-variant hover:bg-surface-container transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-headline-lg font-bold">Permintaan Alamat</h1>
          <p className="text-on-surface-variant">Tinjau dan setujui perubahan alamat dari toko.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {status === 'PENDING' ? 'Menunggu' : status === 'APPROVED' ? 'Disetujui' : status === 'REJECTED' ? 'Ditolak' : 'Semua'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="card bg-white p-12 text-center">
          <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">task</span>
          </div>
          <h3 className="font-bold text-lg mb-1">Tidak ada pengajuan</h3>
          <p className="text-on-surface-variant text-sm">Belum ada pengajuan perubahan alamat dengan status ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="card bg-white p-6 border border-outline-variant">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-primary font-bold">
                      <span className="material-symbols-outlined">storefront</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{req.store.name}</h3>
                      <p className="text-xs text-on-surface-variant">Pemilik: {req.store.owner.name} ({req.store.owner.email})</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-surface rounded-lg">
                      <span className="text-[10px] font-bold text-on-surface-variant block mb-1 uppercase tracking-wider">Alamat Lama</span>
                      <p className="text-sm whitespace-pre-wrap">{req.store.address || <span className="italic">Tidak ada alamat</span>}</p>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <span className="text-[10px] font-bold text-primary block mb-1 uppercase tracking-wider">Alamat Baru Diajukan</span>
                      <p className="text-sm whitespace-pre-wrap font-medium">{req.newAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between md:items-end gap-4 md:w-48 shrink-0 border-t md:border-t-0 md:border-l border-outline-variant pt-4 md:pt-0 md:pl-6">
                  <div className="text-xs text-on-surface-variant">
                    {new Date(req.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  
                  {req.status === 'PENDING' ? (
                    <div className="flex md:flex-col gap-2 w-full">
                      <button
                        onClick={() => handleAction(req.id, 'APPROVED')}
                        disabled={processingId === req.id}
                        className="btn bg-green-600 hover:bg-green-700 text-white w-full py-2 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Setujui
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'REJECTED')}
                        disabled={processingId === req.id}
                        className="btn bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 w-full py-2 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold w-fit ${
                      req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {req.status}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
