import Notifications from '../components/Notifications'
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import { supabase } from '../lib/supabase'
import {
  Store, Package, ShoppingCart, Star,
  TrendingUp, Plus, Settings, LogOut,
  AlertCircle, ChevronRight, MapPin, Phone
} from 'lucide-react'

function TopNav({ user, onSignOut }) {
  const role = user?.user_metadata?.role
  const initial = user?.user_metadata?.full_name?.[0]?.toUpperCase()

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/dashboard">
          <h1 className="font-display text-2xl font-black text-stone-900">
            Zed<span className="text-copper-500">Trade</span>
          </h1>
        </Link>

        {/* Nav Links */}
        <div className="hidden sm:flex items-center gap-1">
          {role === 'supplier' ? (
            <>
              <Link to="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
                Dashboard
              </Link>
              <Link to="/orders" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
                Orders
              </Link>
              <Link to="/products/new" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
                Add Product
              </Link>
              <Link to="/profile/edit" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
                Edit Profile
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
                Dashboard
              </Link>
              <Link to="/browse" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
                Browse
              </Link>
              <Link to="/orders" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
                My Orders
              </Link>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Notifications />
          <div className="w-8 h-8 rounded-full bg-copper-100 flex items-center justify-center">
            <span className="text-copper-600 font-bold text-sm">{initial}</span>
          </div>
          <span className="text-sm text-stone-500 hidden sm:block">
            {user?.user_metadata?.full_name?.split(' ')[0]}
          </span>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-500 transition-colors ml-1 border border-stone-200 rounded-lg px-3 py-1.5 hover:border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

function SupplierDashboard({ profile, user, onSignOut }) {
const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState([])
  const [revenue, setRevenue] = useState(0)

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', profile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      setProducts(data || [])
      setProductsLoading(false)
    }

   const fetchRecentOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`*, products (name, images, unit)`)
        .eq('supplier_id', profile.id)
        .eq('deleted_by_supplier', false)
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentOrders(data || [])
    }

    const fetchRevenue = async () => {
      const { data } = await supabase
        .from('orders')
        .select('total_price')
        .eq('supplier_id', profile.id)
        .in('status', ['confirmed', 'delivered'])
      const total = (data || []).reduce((sum, o) => sum + parseFloat(o.total_price), 0)
      setRevenue(total)
    }

    fetchRevenue()

    fetchProducts()
    fetchRecentOrders()
  }, [profile.id])

  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav user={user} onSignOut={onSignOut} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-forest-600 to-forest-500 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium mb-1">Welcome back 👋</p>
              <h2 className="font-display text-2xl font-black mb-1">
                {profile.business_name}
              </h2>
              <div className="flex items-center gap-3 text-green-200 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />{profile.location}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />{profile.phone}
                </span>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <Store className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.category?.map(cat => (
              <span key={cat} className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Products', value: products.length, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
           { label: 'Total Orders', value: recentOrders.length > 0 ? recentOrders.length : profile.total_orders || '0', icon: ShoppingCart, color: 'text-copper-500', bg: 'bg-orange-50' },
            { label: 'Avg Rating', value: profile.avg_rating > 0 ? `${profile.avg_rating}★` : '—', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
            { label: 'Revenue (K)', value: revenue > 0 ? `K${revenue.toFixed(0)}` : '0', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="font-display text-2xl font-black text-stone-900">{stat.value}</div>
              <div className="text-xs text-stone-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

         {/* Products panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-stone-100">
                <h3 className="font-semibold text-stone-900">
                  Your Products
                  {products.length > 0 && (
                    <span className="ml-2 text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-normal">
                      {products.length}
                    </span>
                  )}
                </h3>
                <Link
                  to="/products/new"
                  className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </Link>
              </div>

              {productsLoading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin mx-auto" />
                </div>
              ) : products.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-stone-400" />
                  </div>
                  <h4 className="font-semibold text-stone-700 mb-1">No products yet</h4>
                  <p className="text-stone-400 text-sm mb-5 max-w-xs mx-auto">
                    Add your first product and start receiving orders from buyers across Zambia.
                  </p>
                  <Link to="/products/new" className="btn-primary inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    List your first product
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {products.map(product => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
                    >
                      {/* Image */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-stone-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 truncate">{product.name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{product.category}</p>
                      </div>

                      {/* Price & Stock */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-stone-900">
                          K{parseFloat(product.price).toFixed(2)}
                          <span className="text-xs text-stone-400 font-normal">/{product.unit}</span>
                        </p>
                        <p className={`text-xs mt-0.5 ${product.stock_qty > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {product.stock_qty > 0 ? `${product.stock_qty} in stock` : 'Out of stock'}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-stone-100">
                <h3 className="font-semibold text-stone-900">Recent Orders</h3>
                <Link to="/orders" className="text-copper-600 text-sm font-medium hover:text-copper-700">
                  View all
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingCart className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-400 text-sm">No orders yet</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {recentOrders.map(order => {
                    const statusColors = {
                      pending:   'bg-yellow-50 text-yellow-700',
                      confirmed: 'bg-blue-50 text-blue-700',
                      rejected:  'bg-red-50 text-red-700',
                      delivered: 'bg-green-50 text-green-700',
                      cancelled: 'bg-stone-50 text-stone-500',
                    }
                    return (
                      <Link
                        key={order.id}
                        to={`/orders/${order.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                          {order.products?.images?.[0] ? (
                            <img src={order.products.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-stone-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800 truncate">{order.products?.name}</p>
                          <p className="text-xs text-stone-400">{order.buyer_name} · {order.quantity} {order.products?.unit}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-stone-800">K{parseFloat(order.total_price).toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="p-5 border-b border-stone-100">
                <h3 className="font-semibold text-stone-900">Quick Actions</h3>
              </div>
              <div className="divide-y divide-stone-100">
                {[
                  { label: 'Add a new product', icon: Plus, to: '/products/new' },
                  { label: 'Edit business profile', icon: Settings, to: '/profile/edit' },
                  { label: 'View all orders', icon: ShoppingCart, to: '/orders' },
                ].map(action => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                        <action.icon className="w-4 h-4 text-stone-500" />
                      </div>
                      <span className="text-sm font-medium text-stone-700">{action.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BuyerDashboard({ user, onSignOut }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`*, products (name, images, unit), supplier_profiles (business_name)`)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()
  }, [user.id])

  const totalSpent = orders
    .filter(o => ['confirmed', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + parseFloat(o.total_price), 0)

  const statusColors = {
    pending:   'bg-yellow-50 text-yellow-700',
    confirmed: 'bg-blue-50 text-blue-700',
    rejected:  'bg-red-50 text-red-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-stone-50 text-stone-500',
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav user={user} onSignOut={onSignOut} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-stone-900 mb-1">
            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-stone-500">Here's your order activity on ZedTrade.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'text-copper-500', bg: 'bg-orange-50' },
            { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: Package, color: 'text-yellow-500', bg: 'bg-yellow-50' },
            { label: 'Total Spent (K)', value: totalSpent > 0 ? `K${totalSpent.toFixed(0)}` : '0', icon: Store, color: 'text-blue-500', bg: 'bg-blue-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="font-display text-2xl font-black text-stone-900">{stat.value}</div>
              <div className="text-xs text-stone-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Browse CTA */}
        <div className="bg-gradient-to-r from-forest-600 to-forest-500 rounded-2xl p-6 mb-8 text-white flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-black mb-1">Discover Products</h2>
            <p className="text-green-200 text-sm">Browse products from suppliers across Zambia</p>
          </div>
          <Link
            to="/browse"
            className="bg-white text-forest-600 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors flex-shrink-0"
          >
            Browse Now →
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-stone-100">
            <h3 className="font-semibold text-stone-900">Your Orders</h3>
            <Link to="/orders" className="text-copper-600 text-sm font-medium hover:text-copper-700">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h4 className="font-semibold text-stone-700 mb-1">No orders yet</h4>
              <p className="text-stone-400 text-sm mb-5">Start browsing products from suppliers.</p>
              <Link to="/browse" className="btn-primary inline-flex items-center gap-2">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {orders.slice(0, 5).map(order => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                    {order.products?.images?.[0] ? (
                      <img src={order.products.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-stone-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 text-sm truncate">{order.products?.name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {order.supplier_profiles?.business_name} · {order.quantity} {order.products?.unit}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-stone-800 text-sm mb-1">
                      K{parseFloat(order.total_price).toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default function Dashboard() {
  const { user, supplierProfile, profileLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const role = user?.user_metadata?.role
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    navigate('/')
  }

 if (profileLoading || signingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (role === 'supplier' && !supplierProfile) {
    return <NoProfileBanner onSignOut={handleSignOut} />
  }

  if (role === 'supplier' && supplierProfile) {
    return <SupplierDashboard profile={supplierProfile} user={user} onSignOut={handleSignOut} />
  }

  return <BuyerDashboard user={user} onSignOut={handleSignOut} />
}