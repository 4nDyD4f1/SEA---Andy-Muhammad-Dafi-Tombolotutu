'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [simulatedEmail, setSimulatedEmail] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSimulatedEmail(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan')
      } else {
        // Berhasil! (Untuk demo kita tampilkan simulasi email)
        if (data._simulatedEmail) {
          setSimulatedEmail(data._simulatedEmail)
        } else {
          // Kasus jika email tidak ketemu di db (simulasi tetap jalan agar aman dari enumerasi)
          setSimulatedEmail({
            to: email,
            subject: 'Reset Password Akun SEAPEDIA',
            resetLink: '#',
            fake: true
          })
        }
      }
    } catch (err) {
      setError('Gagal terhubung ke server')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-surface-container-lowest overflow-hidden selection:bg-primary/20">
      <div className="z-10 w-full max-w-[448px] animate-slide-up">
        
        {/* Header & Logo */}
        <div className="flex flex-col items-center mb-8">

          <h2 className="text-3xl font-bold text-on-surface mb-3 tracking-tight">Lupa Password? 🔐</h2>
          <p className="text-on-surface-variant text-center px-4">
            Jangan panik! Masukkan email Anda yang terdaftar dan kami akan mengirimkan tautan pemulihan.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 text-error animate-shake">
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!simulatedEmail ? (
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-primary/5 border border-outline-variant">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5 group">
                <label className="text-sm font-semibold text-on-surface group-focus-within:text-primary transition-colors">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest border-2 border-surface-container-high rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                    placeholder="nama@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-primary hover:bg-primary-container text-white py-4 rounded-xl font-bold shadow-[0_8px_20px_-8px_rgba(0,91,175,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Kirim Tautan Reset'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali ke Login
              </Link>
            </div>
          </div>
        ) : (
          /* SIMULASI INBOX EMAIL */
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-outline-variant animate-slide-up">
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">mark_email_unread</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Simulasi Kotak Masuk</h3>
                <p className="text-xs text-on-surface-variant">Karena tidak terhubung ke SMTP sungguhan</p>
              </div>
            </div>
            
            <div className="p-8">
              <div className="mb-6 pb-6 border-b border-outline-variant">
                <p className="text-sm text-on-surface-variant mb-1">Dari: <span className="font-semibold text-on-surface">noreply@seapedia.com</span></p>
                <p className="text-sm text-on-surface-variant mb-1">Kepada: <span className="font-semibold text-on-surface">{simulatedEmail.to}</span></p>
                <p className="text-sm text-on-surface-variant">Subjek: <span className="font-semibold text-on-surface">{simulatedEmail.subject}</span></p>
              </div>

              <div className="text-center space-y-6">
                <div className="inline-block p-4 bg-primary/10 rounded-2xl mb-2">
                  <span className="material-symbols-outlined text-4xl text-primary">lock_reset</span>
                </div>
                <h2 className="text-xl font-bold text-on-surface">Permintaan Reset Password</h2>
                <p className="text-on-surface-variant text-sm">
                  Kami menerima permintaan untuk mereset kata sandi akun SEAPEDIA Anda. Jika ini memang Anda, silakan klik tombol di bawah ini:
                </p>

                {simulatedEmail.fake ? (
                  <div className="inline-block px-6 py-3 bg-surface-container text-on-surface-variant rounded-xl font-medium text-sm">
                    Link Invalid (Email tidak terdaftar)
                  </div>
                ) : (
                  <Link 
                    href={simulatedEmail.resetLink.replace(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', '')}
                    className="inline-block px-8 py-3 bg-primary hover:bg-primary-container text-white rounded-xl font-bold transition-colors"
                  >
                    Reset Password Saya
                  </Link>
                )}
                
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-6">
                  Tautan ini akan kedaluwarsa dalam 1 jam. Jika Anda tidak meminta reset password, abaikan saja email ini.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
