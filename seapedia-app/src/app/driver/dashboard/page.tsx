'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function DriverDashboard() {
  const [jobs, setJobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [takingJobId, setTakingJobId] = useState<string | null>(null)
  const toast = useToast()

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/driver/jobs')
      const data = await res.json()
      if (res.ok) setJobs(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    // Auto refresh every 10 seconds
    const interval = setInterval(fetchJobs, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleTakeJob = async (id: string) => {
    setTakingJobId(id)
    try {
      const res = await fetch(`/api/driver/jobs/${id}/take`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Job berhasil diambil!')
        // Remove from list
        setJobs(jobs.filter(j => j.id !== id))
      } else {
        // 409 means someone else took it
        toast.error(data.error || 'Gagal mengambil job')
        fetchJobs() // refresh immediately
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setTakingJobId(null)
    }
  }

  const getSLAColor = (deadlineStr: string) => {
    const hoursLeft = (new Date(deadlineStr).getTime() - new Date().getTime()) / (1000 * 60 * 60)
    if (hoursLeft < 2) return 'text-error bg-error-container'
    if (hoursLeft < 12) return 'text-secondary bg-secondary-container/20'
    return 'text-tertiary bg-tertiary/10'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-outline-variant shadow-sm">
        <div>
          <h1 className="text-title-md font-bold">Job Board</h1>
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
            </span>
            Auto-refresh aktif
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-tertiary">{jobs.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Tersedia</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card p-6 h-48 shimmer"></div>)}
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="card bg-white overflow-hidden border-2 border-transparent hover:border-tertiary/30 transition-colors">
              <div className="p-4 border-b border-outline-variant flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-high text-on-surface">
                      {job.courierType}
                    </span>
                    <span className="font-mono text-xs text-outline-variant">#{job.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <h3 className="font-bold text-lg">Rp {job.driverCommission.toLocaleString('id-ID')}</h3>
                </div>
                
                {job.slaDeadline && (
                  <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${getSLAColor(job.slaDeadline)}`}>
                    <span className="material-symbols-outlined text-[14px]">timer</span>
                    SLA: {new Date(job.slaDeadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center justify-between py-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">storefront</span>
                    <div className="w-[1px] h-6 bg-outline-variant"></div>
                    <span className="material-symbols-outlined text-[16px] text-coral">location_on</span>
                  </div>
                  <div className="flex flex-col justify-between h-[60px] text-sm flex-grow">
                    <div>
                      <p className="font-semibold line-clamp-1">{job.store?.name}</p>
                    </div>
                    <div>
                      <p className="font-semibold line-clamp-1">{job.buyer?.name}</p>
                      <p className="text-xs text-on-surface-variant line-clamp-1">{job.shippingAddress}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-surface-container-low p-2 rounded text-xs text-on-surface-variant">
                  <strong>Item:</strong> {job.items.map((i:any) => i.product.name).join(', ')} 
                  {job.items.length > 3 ? '...' : ''}
                </div>
              </div>
              
              <div className="p-3 bg-surface-container-lowest border-t border-outline-variant">
                <button 
                  onClick={() => handleTakeJob(job.id)}
                  disabled={takingJobId === job.id}
                  className="w-full btn-primary bg-tertiary shadow-float flex items-center justify-center gap-2"
                >
                  {takingJobId === job.id ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">pan_tool</span>
                      Ambil Job
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-outline-variant shadow-sm">
          <div className="w-24 h-24 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-4 text-tertiary relative">
            <span className="material-symbols-outlined text-[48px] animate-pulse">local_shipping</span>
          </div>
          <h3 className="text-title-md font-bold text-on-surface">Tidak ada pesanan</h3>
          <p className="text-on-surface-variant mt-2 text-sm max-w-[320px] mx-auto">Tunggu sebentar, pesanan baru akan muncul di sini secara otomatis.</p>
        </div>
      )}
    </div>
  )
}
