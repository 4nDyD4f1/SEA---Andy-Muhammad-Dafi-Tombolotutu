'use client'

import { useState, useRef } from 'react'

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject('Hanya file gambar yang diperbolehkan')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 500
          let width = img.width
          let height = img.height

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width
            width = MAX_SIZE
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height
            height = MAX_SIZE
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          resolve(canvas.toDataURL('image/jpeg', 0.6))
        }
        img.onerror = () => reject('Gagal membaca gambar')
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject('Gagal membaca file')
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = async (files: FileList | File[]) => {
    const newImages = [...images]
    for (let i = 0; i < files.length; i++) {
      if (newImages.length >= maxImages) break
      try {
        const base64 = await processFile(files[i])
        newImages.push(base64)
      } catch (e) {
        console.error(e)
      }
    }
    onChange(newImages)
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // reset input
    }
  }

  const handleRemove = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    onChange(newImages)
  }

  // Reordering Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOverReorder = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null) {
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDropReorder = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const newImages = [...images]
    const [draggedItem] = newImages.splice(draggedIndex, 1)
    newImages.splice(targetIndex, 0, draggedItem)
    
    onChange(newImages)
    setDraggedIndex(null)
  }

  // OS Files Drag and Drop Logic
  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedIndex === null) {
      setIsDragOver(true)
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleContainerDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files && handleFiles(e.target.files)} 
        accept="image/*" 
        multiple 
        className="hidden" 
      />

      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages}
          className="btn-primary inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">upload_file</span>
          Tambah Foto
        </button>
        {images.length >= maxImages && (
          <span className="text-xs text-error font-medium">Maksimal {maxImages} gambar tercapai</span>
        )}
      </div>

      {/* Grid and Dropzone */}
      <div 
        className={`flex flex-wrap gap-4 p-6 border-2 border-dashed rounded-xl transition-colors min-h-[160px] ${isDragOver ? 'border-primary bg-primary/5' : 'border-outline-variant/50 bg-surface-container-lowest'}`}
        onDragOver={handleContainerDragOver}
        onDragLeave={handleContainerDragLeave}
        onDrop={handleContainerDrop}
      >
        {images.map((url, index) => (
          <div
            key={`${url.substring(0, 30)}-${index}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOverReorder(e, index)}
            onDrop={(e) => handleDropReorder(e, index)}
            onDragEnd={() => setDraggedIndex(null)}
            className={`relative w-24 h-24 md:w-32 md:h-32 border-2 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-transform ${
              draggedIndex === index ? 'opacity-50 scale-95 border-dashed border-primary' : 'border-outline-variant hover:border-primary'
            } bg-white shadow-sm`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={url} 
              alt={`Product ${index + 1}`} 
              className="w-full h-full object-cover pointer-events-none"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/400x400/png?text=Invalid+Image'
              }}
            />
            
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity md:opacity-80 md:hover:opacity-100 shadow-md"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
            
            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none">
              {index === 0 ? 'Utama' : `${index + 1}`}
            </div>
          </div>
        ))}

        {/* Upload Placeholder if empty or slots available */}
        {images.length < maxImages && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 md:w-32 md:h-32 border-2 border-dashed border-outline-variant hover:border-primary rounded-xl flex flex-col items-center justify-center text-outline-variant hover:text-primary cursor-pointer transition-colors bg-white/50"
          >
            <span className="material-symbols-outlined text-2xl mb-1">add_photo_alternate</span>
            <span className="text-[10px] text-center px-1 font-medium">Klik atau Tarik File Kesini</span>
          </div>
        )}
      </div>
      <p className="text-xs text-on-surface-variant flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">lightbulb</span>
        Seret (drag) foto untuk mengubah urutan. Foto pertama akan menjadi sampul produk.
      </p>
    </div>
  )
}
