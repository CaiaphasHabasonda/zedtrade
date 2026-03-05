import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, ShoppingCart, Package, Clock,
  CheckCircle, XCircle, Truck, ChevronRight,
  MapPin, Phone
} from 'lucide-react'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-50 text-blue-700 border-blue-200',         icon: CheckCircle },
  rejected:  { label: 'Rejected',  color: 'bg-red-50 text-red-700 border-red-200',            icon: XCircle },
  delivered: { label: 'Delivered', color: 'bg-green-50 text-green-700 border-green-200',      icon: Truck },
  cancelled: { label: 'Cancelled', color: 'bg-stone-50 text-stone-500 border-stone-200',      icon: XCircle },
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

export default function Orders() {
  const { user, supplierProfile } = useAuth()
  const navigate = useNavigate()
  const role = user?.user_metadata?.role
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)

    let query

    if (role === 'supplier' && supplierProfile) {
      // Supplier sees incoming orders with product and buyer info
      query = supabase
        .from('orders')
        .select(`
          *,
          products (name, images, unit),
          supplier_profiles (business_name)
        `)
        .eq('supplier_id', supplierProfile.id)
        .eq('deleted_by_supplier', false)
        .order('created_at', { ascending: false })
    } else {
      // Buyer sees their own orders
     query = supabase
        .from('orders')
        .select(`
          *,
          products (name, images, unit),
          supplier_profiles (business_name, phone, location)
        `)
        .eq('buyer_id', user.id)
        .eq('deleted_by_buyer', false)
        .order('created_at', { ascending: false })
    }

    const { data, error } = await query
    setOrders(data || [])
    setLoading(false)
  }

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab)

  const tabs = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { key: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
    { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
  ]

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 text-stone-500 hover:text-stone-700">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <h1 className="font-display text-xl font-black text-stone-900">
            Zed<span className="text-copper-500">Trade</span>
          </h1>
          <div className="w-24" />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-stone-900">
              {role === 'supplier' ? 'Incoming Orders' : 'My Orders'}
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              {role === 'supplier'
                ? 'Manage orders from your buyers'
                : 'Track your orders from suppliers'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-stone-100 text-stone-600' : 'bg-stone-200 text-stone-500'
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
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
            <ShoppingCart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="font-semibold text-stone-700 mb-1">No orders yet</h3>
            <p className="text-stone-400 text-sm">
              {role === 'supplier'
                ? 'Orders from buyers will appear here.'
                : 'Your orders will appear here once you place them.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4 hover:border-copper-300 transition-all hover:shadow-sm block"
              >
                {/* Product image */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                  {order.products?.images?.[0] ? (
                    <img src={order.products.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-stone-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 truncate">{order.products?.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {role === 'supplier' ? `Buyer: ${order.buyer_name}` : `From: ${order.supplier_profiles?.business_name}`}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {order.quantity} {order.products?.unit} · {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Price + Status */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-copper-600 mb-1.5">K{parseFloat(order.total_price).toFixed(2)}</p>
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