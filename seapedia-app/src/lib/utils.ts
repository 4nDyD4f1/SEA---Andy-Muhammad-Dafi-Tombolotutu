/**
 * Server-side HTML sanitizer using regex-based approach
 * (DOMPurify is used client-side, this handles server-side sanitization)
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove all HTML tags
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

/**
 * Sanitize an object's string values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeHtml(sanitized[key] as string)
    }
  }
  return sanitized
}

/**
 * Courier fee configuration
 */
export const COURIER_FEES: Record<string, number> = {
  INSTANT: 25000,
  NEXT_DAY: 15000,
  REGULAR: 10000,
}

export const DRIVER_COMMISSION_RATE = 0.8 // 80% of shipping fee
export const TAX_RATE = 0.12 // 12% PPN
export const SLA_HOURS = 24 // 24 hours SLA for delivery

/**
 * Calculate order total
 * Formula: (subtotal - discount + shippingFee) * 1.12
 */
export function calculateOrderTotal(
  subtotal: number,
  discountAmount: number,
  shippingFee: number
): { taxAmount: number; total: number } {
  const beforeTax = subtotal - discountAmount + shippingFee
  const taxAmount = beforeTax * TAX_RATE
  const total = beforeTax * (1 + TAX_RATE)
  return { taxAmount, total }
}

/**
 * Format currency to IDR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
