interface Props {
  status: string
}

export function OrderStatusBadge({ status }: Props) {
  let badgeClass = ''
  let label = status

  switch (status) {
    case 'SEDANG_DIKEMAS':
      badgeClass = 'bg-secondary-container/20 text-secondary'
      label = 'Sedang Dikemas'
      break
    case 'MENUNGGU_PENGIRIM':
      badgeClass = 'bg-primary/10 text-primary'
      label = 'Menunggu Kurir'
      break
    case 'SEDANG_DIKIRIM':
      badgeClass = 'bg-purple-100 text-purple-700'
      label = 'Sedang Dikirim'
      break
    case 'PESANAN_SELESAI':
      badgeClass = 'bg-tertiary/10 text-tertiary'
      label = 'Selesai'
      break
    case 'MENUNGGU_REFUND':
      badgeClass = 'bg-orange-100 text-orange-700'
      label = 'Menunggu Refund'
      break
    case 'DIKEMBALIKAN':
      badgeClass = 'bg-error-container text-on-error-container'
      label = 'Dikembalikan'
      break
    default:
      badgeClass = 'bg-surface-container-high text-on-surface-variant'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
      {label}
    </span>
  )
}
