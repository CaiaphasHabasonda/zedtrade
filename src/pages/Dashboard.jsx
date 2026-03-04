import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Store, Package, ShoppingCart, Star,
  TrendingUp, Plus, Settings, LogOut,
  AlertCircle, ChevronRight, MapPin, Phone
} from 'lucide-react'

function TopNav({ user, onSignOut }) {
  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <h1 className="font-display text-2xl font-black text-stone-900">
          Zed<span className="text-copper-500">Trade</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500 hidden sm:block">
            {user?.user_metadata?.full_name}
          </span>
          <div className="w-8 h-8 rounded-full bg-copper-100 flex items-center justify-center">
            <span className="text-copper-600 font-bold text-sm">
              {user?.user_metadata?.full_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-500 transition-colors ml-1 border border-stone-200 rounded-lg px-3 py-1.5 hover:border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

function SupplierDashboard({ profile, user, onSignOut }) {
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
            { label: 'Active Products', value: '0', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Total Orders', value: profile.total_orders || '0', icon: ShoppingCart, color: 'text-copper-500', bg: 'bg-orange-50' },
            { label: 'Avg Rating', value: profile.avg_rating > 0 ? profile.avg_rating : '—', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
            { label: 'Revenue (K)', value: '0', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
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
                <h3 className="font-semibold text-stone-900">Your Products</h3>
                <Link
                  to="/products/new"
                  className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </Link>
              </div>
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-stone-400" />
                </div>
                <h4 className="font-semibold text-stone-700 mb-1">No products yet</h4>
                <p className="text-stone-400 text-sm mb-5 max-w-xs mx-auto">
                  Add your first product and start receiving orders from buyers across Zambia.
                </p>
                <Link
                  to="/products/new"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  List your first product
                </Link>
              </div>
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
              <div className="p-8 text-center">
                <ShoppingCart className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-400 text-sm">No orders yet</p>
              </div>
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
  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav user={user} onSignOut={onSignOut} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <div className="text-5xl mb-4">🛍️</div>
          <h2 className="font-display text-2xl font-black text-stone-900 mb-2">
            Welcome, {user?.user_metadata?.full_name}!
          </h2>
          <p className="text-stone-500 mb-6">Browse products from suppliers across Zambia.</p>
          <Link to="/browse" className="btn-primary inline-flex items-center gap-2">
            Browse Products
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function NoProfileBanner({ onSignOut }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-6">
        <h1 className="font-display text-2xl font-black text-stone-900">
          Zed<span className="text-copper-500">Trade</span>
        </h1>
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-500 transition-colors border border-stone-200 rounded-lg px-3 py-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </nav>
      <div className="flex items-center justify-center p-4 mt-20">
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="font-display text-2xl font-black text-stone-900 mb-2">
            Complete your profile
          </h2>
          <p className="text-stone-500 mb-6">
            Set up your supplier profile so buyers can find and order from you.
          </p>
          <Link to="/onboarding" className="btn-primary inline-flex items-center gap-2">
            Set up profile
            <ChevronRight className="w-4 h-4" />
          </Link>
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