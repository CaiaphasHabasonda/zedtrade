import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Users, Package, ShoppingCart, TrendingUp,
  Shield, AlertTriangle, CheckCircle, Store,
  LogOut, BarChart2, Flag
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    verifiedSuppliers: 0,
    totalBuyers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalDisputes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentSuppliers, setRecentSuppliers] = useState([])
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const [
      { count: totalSuppliers },
      { count: verifiedSuppliers },
      { count: totalProducts },
      { count: totalOrders },
      { count: pendingOrders },
      { data: revenueData },
      { data: recentSuppliersData },
      { data: recentOrdersData },
    ] = await Promise.all([
      supabase.from('supplier_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('supplier_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('total_price').in('status', ['confirmed', 'delivered']),
      supabase.from('supplier_profiles').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('orders').select('*, products(name), supplier_profiles(business_name)').order('created_at', { ascending: false }).limit(5),
    ])

    const totalRevenue = (revenueData || []).reduce((sum, o) => sum + parseFloat(o.total_price), 0)

    setStats({
      totalSuppliers: totalSuppliers || 0,
      verifiedSuppliers: verifiedSuppliers || 0,
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      totalRevenue,
    })

    setRecentSuppliers(recentSuppliersData || [])
    setRecentOrders(recentOrdersData || [])
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const statCards = [
    { label: 'Total Suppliers', value: stats.totalSuppliers, icon: Store, color: 'text-blue-500', bg: 'bg-blue-50', link: '/admin/suppliers' },
    { label: 'Verified Suppliers', value: stats.verifiedSuppliers, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', link: '/admin/suppliers' },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-purple-500', bg: 'bg-purple-50', link: '/admin/products' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-copper-500', bg: 'bg-orange-50', link: '/admin/orders' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', link: '/admin/orders' },
    { label: 'Platform Revenue', value: `K${stats.totalRevenue.toFixed(0)}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', link: '/admin/orders' },
  ]

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700',
    confirmed: 'bg-blue-50 text-blue-700',
    rejected: 'bg-red-50 text-red-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-stone-50 text-stone-500',
  }

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h1 className="font-display text-lg font-black text-stone-900">
                Zed<span className="text-copper-500">Trade</span>
                <span className="text-red-500 ml-1 text-sm">Admin</span>
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <Link to="/admin" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50">
              Dashboard
            </Link>
            <Link to="/admin/suppliers" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50">
              Suppliers
            </Link>
            <Link to="/admin/orders" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50">
              Orders
            </Link>
            <Link to="/admin/products" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50">
              Products
            </Link>
            <Link to="/admin/disputes" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50">
              Disputes
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-500 hidden sm:block">
              {user?.user_metadata?.full_name}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-500 border border-stone-200 rounded-lg px-3 py-1.5 hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-stone-900 mb-1">
            Admin Dashboard
          </h1>
          <p className="text-stone-500">Welcome back. Here's what's happening on ZedTrade.</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 animate-pulse">
                <div className="w-9 h-9 bg-stone-100 rounded-lg mb-3" />
                <div className="h-6 bg-stone-100 rounded mb-1" />
                <div className="h-3 bg-stone-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map(stat => (
              <Link
                key={stat.label}
                to={stat.link}
                className="bg-white rounded-xl border border-stone-200 p-4 hover:border-copper-300 hover:shadow-sm transition-all"
              >
                <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="font-display text-2xl font-black text-stone-900">{stat.value}</div>
                <div className="text-xs text-stone-500 mt-0.5">{stat.label}</div>
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Suppliers */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <h3 className="font-semibold text-stone-900">Recent Suppliers</h3>
              <Link to="/admin/suppliers" className="text-copper-600 text-sm font-medium hover:text-copper-700">
                View all
              </Link>
            </div>
            <div className="divide-y divide-stone-100">
              {recentSuppliers.map(supplier => (
                <div key={supplier.id} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-forest-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-forest-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-stone-800 text-sm truncate">{supplier.business_name}</p>
                      {supplier.is_verified && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-stone-400">{supplier.location} · {supplier.phone}</p>
                  </div>
                  <Link
                    to={`/admin/suppliers`}
                    className="text-xs text-copper-600 hover:text-copper-700 font-medium flex-shrink-0"
                  >
                    Manage →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <h3 className="font-semibold text-stone-900">Recent Orders</h3>
              <Link to="/admin/orders" className="text-copper-600 text-sm font-medium hover:text-copper-700">
                View all
              </Link>
            </div>
            <div className="divide-y divide-stone-100">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 text-sm truncate">{order.products?.name}</p>
                    <p className="text-xs text-stone-400">{order.supplier_profiles?.business_name} · {order.buyer_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-stone-800 text-sm">K{parseFloat(order.total_price).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}