'use client'

import { useToastStore, useToast } from '@/store/toastStore'
import { useEffect, useState } from 'react'

export { useToast }

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return 'check_circle'
    case 'error':
      return 'error'
    case 'info':
      return 'info'
    case 'warning':
      return 'warning'
    default:
      return 'info'
  }
}

const getColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-tertiary-container text-on-tertiary-container border-tertiary'
    case 'error':
      return 'bg-error-container text-on-error-container border-error'
    case 'info':
      return 'bg-primary-container text-on-primary-container border-primary'
    case 'warning':
      return 'bg-secondary-container text-on-secondary-container border-secondary'
    default:
      return 'bg-surface-container-high text-on-surface'
  }
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-float text-sm font-medium animate-slide-up border pointer-events-auto ${getColor(
            toast.type
          )}`}
        >
          <span className="material-symbols-outlined">{getIcon(toast.type)}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 hover:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
    </div>
  )
}
