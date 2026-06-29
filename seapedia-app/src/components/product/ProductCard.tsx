import Image from 'next/image'
import Link from 'next/link'

export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number | null
  imageUrl: string | null
  stock: number
  category?: string
  store: {
    id: string
    name: string
    ownerId?: string
  }
}

interface ProductCardProps {
  product: Product
  onAddToCart?: () => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0

  return (
    <Link 
      href={`/product/${product.id}`} 
      className="group flex flex-col bg-white border border-outline-variant/30 rounded-md overflow-hidden hover:shadow-float hover:-translate-y-1 transition-all duration-300 h-full"
    >
      <div className="relative w-full aspect-square bg-surface-container-low overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container">
            <span className="material-symbols-outlined text-4xl text-outline-variant">image</span>
          </div>
        )}
        
        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-0 left-0 bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10 shadow-sm">
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-error text-white px-3 py-1 rounded-full text-xs font-bold">Habis</span>
          </div>
        )}
      </div>
      
      <div className="p-2.5 flex flex-col flex-grow">
        <h3 className="text-on-surface text-xs leading-[1.3] line-clamp-2 mb-1.5 min-h-[30px] group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        <div className="flex flex-col mb-1.5">
          <div className="text-on-surface font-bold text-sm">
            Rp {product.price.toLocaleString('id-ID')}
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="text-[10px] text-outline line-through">
              Rp {product.originalPrice.toLocaleString('id-ID')}
            </div>
          )}
        </div>
        
        <div className="text-[9px] md:text-[10px] font-bold text-coral mb-2">
          Hemat s.d 10% Pakai Bonus
        </div>
        
        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant mb-2">
          <span className="material-symbols-outlined text-[#FFC107] text-[12px] [font-variation-settings:'FILL'_1]">star</span>
          <span>4.8</span>
          <span>•</span>
          <span>500+ terjual</span>
        </div>

        <div className="flex items-center gap-1 mt-auto pt-1 border-t border-outline-variant/20">
          <span className="material-symbols-outlined text-primary text-[12px] [font-variation-settings:'FILL'_1]">verified</span>
          <span className="text-[10px] text-on-surface-variant truncate">{product.store.name}</span>
        </div>
      </div>
    </Link>
  )
}
