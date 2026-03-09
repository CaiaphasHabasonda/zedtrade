import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Store, CheckCircle, XCircle, MapPin,
  Phone, Star, Package, ShoppingCart,
  Search, Shield, ArrowLeft
} from 'lucide-react'

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('supplier_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setSuppliers(data || [])
    setLoading(false)
  }

  const toggleVerified = async (supplier) => {
    setUpdating(supplier.id)
    const newValue = !supplier.is_verified
    await supabase
      .from('supplier_profiles')
      .update({ is_verified: newValue })
      .eq('id', supplier.id)

    await supabase.from('admin_logs').insert({
      admin_id: (await supabase.auth.getUser()).data.user.id,
      action: newValue ? 'verify_supplier' : 'unverify_supplier',
      target_type: 'supplier',
      target_id: supplier.id,
      details: `${newValue ? 'Verified' : 'Unverified'} supplier: ${supplier.business_name}`,
    })

    setSuppliers(prev => prev.map(s =>
      s.id === supplier.id ? { ...s, is_verified: newValue } : s
    ))
    setUpdating(null)
  }

  const toggleActive = async (supplier) => {
    setUpdating(supplier.id)
    const newValue = !supplier.is_active
    await supabase
      .from('supplier_profiles')
      .update({ is_active: newValue })
      .eq('id', supplier.id)

    await supabase.from('admin_logs').insert({
      admin_id: (await supabase.auth.getUser()).data.user.id,
      action: newValue ? 'activate_supplier' : 'suspend_supplier',
      target_type: 'supplier',
      target_id: supplier.id,
      details: `${newValue ? 'Activated' : 'Suspended'} supplier: ${supplier.business_name}`,
    })

    setSuppliers(prev => prev.map(s =>
      s.id === supplier.id ? { ...s, is_active: newValue } : s
    ))
    setUpdating(null)
  }

  const filtered = suppliers.filter(s => {
    const matchesSearch =
      search === '' ||
      s.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.location?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)

    const matchesFilter =
      filter === 'all' ||
      (filter === 'verified' && s.is_verified) ||
      (filter === 'unverified' && !s.is_verified) ||
      (filter === 'suspended' && !s.is_active)

    return matchesSearch && matchesFilter
  })

  const tabs = [
    { key: 'all', label: 'All', count: suppliers.length },
    { key: 'verified', label: 'Verified', count: suppliers.filter(s => s.is_verified).length },
    { key: 'unverified', label: 'Unverified', count: suppliers.filter(s => !s.is_verified).length },
    { key: 'suspended', label: 'Suspended', count: suppliers.filter(s => !s.is_active).length },
  ]

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2 text-stone-500 hover:text-stone-700">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
          </div>
          <h1 className="font-display text-xl font-black text-stone-900">
            Zed<span className="text-copper-500">Trade</span>
            <span className="text-red-500 ml-1 text-sm">Admin</span>
          </h1>
          <div className="w-24" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-stone-900">Suppliers</h1>
            <p className="text-stone-500 text-sm mt-0.5">{suppliers.length} total suppliers on ZedTrade</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, location or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 w-full max-w-md"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

        {/* Suppliers List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
            <Store className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No suppliers found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(supplier => (
              <div
                key={supplier.id}
                className={`bg-white rounded-2xl border p-5 transition-all ${
                  !supplier.is_active
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-stone-200'
                }`}
              >
                <div className="flex items-start gap-4">

                  {/* Icon */}
                  <div className="w-12 h-12 bg-forest-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="w-6 h-6 text-forest-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-stone-900">{supplier.business_name}</h3>
                      {supplier.is_verified && (
                        <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {!supplier.is_active && (
                        <span className="flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                          <XCircle className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-stone-500 mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{supplier.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />{supplier.phone}
                      </span>
                      {supplier.avg_rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />{supplier.avg_rating}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" />{supplier.total_orders} orders
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {supplier.category?.map(cat => (
                        <span key={cat} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleVerified(supplier)}
                      disabled={updating === supplier.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                        supplier.is_verified
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                      }`}
                    >
                      {supplier.is_verified ? (
                        <><CheckCircle className="w-3.5 h-3.5" /> Verified</>
                      ) : (
                        <><Shield className="w-3.5 h-3.5" /> Verify</>
                      )}
                    </button>

                    <button
                      onClick={() => toggleActive(supplier)}
                      disabled={updating === supplier.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                        supplier.is_active
                          ? 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                      }`}
                    >
                      {supplier.is_active ? (
                        <><XCircle className="w-3.5 h-3.5" /> Suspend</>
                      ) : (
                        <><CheckCircle className="w-3.5 h-3.5" /> Activate</>
                      )}
                    </button>

                    <Link
                      to={`/suppliers/${supplier.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors text-center justify-center"
                    >
                      View Store
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}