'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

export default function TimeSimulatorPage() {
  const [hoursToAdvance, setHoursToAdvance] = useState<number | ''>(24)
  const [isSimulating, setIsSimulating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const toast = useToast()
  const router = useRouter()

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hoursToAdvance || hoursToAdvance <= 0) return
    
    if (!confirm(`Peringatan: Time Simulation akan mempercepat waktu sistem sebanyak ${hoursToAdvance} jam dan MENGEKSEKUSI SLA refund otomatis! Lanjutkan?`)) return

    setIsSimulating(true)
    setResult(null)
    
    try {
      const res = await fetch('/api/admin/time-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: Number(hoursToAdvance) })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Simulasi waktu berhasil dijalankan!')
        setResult(data)
      } else {
        toast.error(data.error || 'Gagal menjalankan simulasi')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold flex items-center gap-2 text-error">
          <span className="material-symbols-outlined text-[32px]">history_toggle_off</span>
          Time Simulator
        </h1>
        <p className="text-on-surface-variant mt-2">
          Alat khusus admin untuk mempercepat waktu sistem dan memicu eksekusi SLA (Service Level Agreement) otomatis seperti Auto-Refund pesanan yang tidak diproses.
        </p>
      </div>

      <div className="card bg-white p-6 md:p-8 border-2 border-error/20">
        <div className="bg-error-container text-on-error-container p-4 rounded-lg mb-6 flex gap-3 items-start">
          <span className="material-symbols-outlined shrink-0">warning</span>
          <div className="text-sm">
            <strong className="block mb-1">DANGER ZONE</strong>
            Tindakan ini tidak dapat dibatalkan. Sistem akan menganggap waktu telah berlalu sesuai nilai yang Anda masukkan. 
            Semua pesanan dengan status <code>SEDANG_DIKEMAS</code> atau <code>MENUNGGU_PENGIRIM</code> yang melewati batas SLA 24 jam akan otomatis dibatalkan dan direfund ke saldo wallet pembeli.
          </div>
        </div>

        <form onSubmit={handleSimulate} className="space-y-6">
          <div>
            <label className="label">Jumlah jam yang ingin dilewati (Simulasi)</label>
            <div className="flex gap-4 items-center">
              <input 
                type="number" 
                value={hoursToAdvance}
                onChange={e => setHoursToAdvance(e.target.value ? Number(e.target.value) : '')}
                className="input font-bold text-xl w-32 text-center"
                min="1"
                required
              />
              <span className="font-bold text-on-surface-variant">Jam</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">Contoh: Masukkan 24 untuk mensimulasikan waktu 1 hari penuh (SLA Refund)</p>
          </div>

          <button 
            type="submit" 
            disabled={isSimulating || !hoursToAdvance}
            className="btn-danger w-full sm:w-auto px-8 py-3 font-bold text-base shadow-float flex items-center justify-center gap-2"
          >
            {isSimulating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined">fast_forward</span>
                Jalankan Simulasi Waktu
              </>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="card bg-white p-6 animate-slide-up border border-outline-variant shadow-lg">
          <h2 className="text-title-md font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">fact_check</span>
            Hasil Eksekusi SLA
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50">
              <p className="text-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">Waktu Maju</p>
              <p className="font-bold text-2xl text-primary">{result.advancedHours} Jam</p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50">
              <p className="text-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">Pesanan Direfund</p>
              <p className="font-bold text-2xl text-error">{result.refundedOrdersCount} Pesanan</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant text-on-surface font-mono text-sm p-5 rounded-xl overflow-auto max-h-[200px] shadow-inner">
            <p className="mb-3 text-outline font-bold">--- SYSTEM LOG ---</p>
            <div className="space-y-1.5">
              <p>Simulating time advance of <span className="font-bold text-primary">{result.advancedHours} hours</span>...</p>
              <p>Checking active orders against SLA deadlines (24h)...</p>
              <p>Found <span className="font-bold text-error">{result.refundedOrdersCount} orders</span> exceeding SLA.</p>
              {result.refundedOrdersCount > 0 && (
                <p className="text-error font-bold mt-2">Executing auto-refund transactions...</p>
              )}
            </div>
            <p className="mt-3 text-outline font-bold">--- END LOG ---</p>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button 
              onClick={() => router.push('/admin/dashboard')}
              className="btn-outline font-bold"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
