const statusStyles = {
  NEW: 'bg-gray-100 text-gray-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  NEEDS_DECANTING: 'bg-amber-100 text-amber-800',
  PACKED: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  RTO: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PENDING: 'bg-gray-100 text-gray-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-indigo-100 text-indigo-800',
  MANUAL: 'bg-orange-100 text-orange-800',
  SHOPIFY: 'bg-blue-100 text-blue-800',
  CREATED: 'bg-slate-100 text-slate-800',
  AWB_ASSIGNED: 'bg-indigo-100 text-indigo-800',
  PICKUP_SCHEDULED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-purple-100 text-purple-800',
  IN_TRANSIT: 'bg-amber-100 text-amber-800',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
  RTO_DELIVERED: 'bg-orange-100 text-orange-800'
}

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-800'
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
