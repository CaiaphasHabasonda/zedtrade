import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  ShoppingCart, Package, Search,
  ArrowLeft, ChevronRight, Clock,
  CheckCircle, XCircle, Truck
} from 'lucide-react'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: CheckCircle },
  rejected:  { label: 'Rejected',  color: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle },
  delivered: { label: 'Delivered', color: 'bg-green-50 text-green-700 border-green-200',    icon: Truck },
  cancelled: { label: 'Cancelled', color: 'bg-stone-50 text-stone-500 border-stone-200',    icon: XCircle },
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        products (name, images, unit),
        supplier_profiles (business_name, location)
      `)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const filtered = orders.filter(o => {
    const matchesSearch =
      search === '' ||
      o.products?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier_profiles?.business_name?.toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      filter === 'all' || o.status === filter

    return matchesSearch && matchesFilter
  })

  const tabs = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { key: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
    { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
    { key: 'rejected', label: 'Rejected', count: orders.filter(o => o.status === 'rejected').length },
  ]

  const totalRevenue = orders
    .filter(o => ['confirmed', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + parseFloat(o.total_price), 0)

  const platformFee = totalRevenue * 0.04

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/admin" className="flex items-center gap-2 text-stone-500 hover:text-stone-700">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <h1 className="font-display text-xl font-black text-stone-900">
            Zed<span className="text-copper-500">Trade</span>
            <span className="text-red-500 ml-1 text-sm">Admin</span>
          </h1>
          <div className="w-24" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-stone-900">All Orders</h1>
            <p className="text-stone-500 text-sm mt-0.5">{orders.length} total orders on ZedTrade</p>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Orders', value: orders.length, color: 'text-stone-900' },
            { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-600' },
            { label: 'GMV (K)', value: `K${totalRevenue.toFixed(0)}`, color: 'text-green-600' },
            { label: 'Platform Fee (4%)', value: `K${platformFee.toFixed(0)}`, color: 'text-copper-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-stone-200 p-4">
              <p className={`font-display text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by product, buyer or supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 w-full max-w-md"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-6 w-fit overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  filter === tab.key ? 'bg-stone-100 text-stone-600' : 'bg-stone-200 text-stone-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
            <ShoppingCart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No orders found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4 hover:border-copper-300 transition-all hover:shadow-sm block"
              >
                {/* Product image */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                  {order.products?.images?.[0] ? (
                    <img src={order.products.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-stone-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 truncate">{order.products?.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Buyer: {order.buyer_name} · Supplier: {order.supplier_profiles?.business_name}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {order.quantity} {order.products?.unit} · {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Price + Status */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-copper-600 mb-1.5">
                    K{parseFloat(order.total_price).toFixed(2)}
                  </p>
                  <StatusBadge status={order.status} />
                </div>

                <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}