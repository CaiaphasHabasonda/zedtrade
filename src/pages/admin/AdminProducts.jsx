import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Package, Search, ArrowLeft,
  Eye, EyeOff, Store, Tag
} from 'lucide-react'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, supplier_profiles(business_name, location)')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const toggleActive = async (product) => {
    setUpdating(product.id)
    const newValue = !product.is_active
    await supabase
      .from('products')
      .update({ is_active: newValue })
      .eq('id', product.id)

    await supabase.from('admin_logs').insert({
      admin_id: (await supabase.auth.getUser()).data.user.id,
      action: newValue ? 'activate_product' : 'deactivate_product',
      target_type: 'product',
      target_id: product.id,
      details: `${newValue ? 'Activated' : 'Deactivated'} product: ${product.name}`,
    })

    setProducts(prev => prev.map(p =>
      p.id === product.id ? { ...p, is_active: newValue } : p
    ))
    setUpdating(null)
  }

  const filtered = products.filter(p => {
    const matchesSearch =
      search === '' ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier_profiles?.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && p.is_active) ||
      (filter === 'inactive' && !p.is_active) ||
      (filter === 'out_of_stock' && p.stock_qty === 0)

    return matchesSearch && matchesFilter
  })

  const tabs = [
    { key: 'all', label: 'All', count: products.length },
    { key: 'active', label: 'Active', count: products.filter(p => p.is_active).length },
    { key: 'inactive', label: 'Inactive', count: products.filter(p => !p.is_active).length },
    { key: 'out_of_stock', label: 'Out of Stock', count: products.filter(p => p.stock_qty === 0).length },
  ]

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

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-stone-900">All Products</h1>
            <p className="text-stone-500 text-sm mt-0.5">{products.length} total products on ZedTrade</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by product name, supplier or category..."
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

        {/* Products List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No products found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(product => (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border p-4 flex items-center gap-4 transition-all ${
                  !product.is_active ? 'border-red-200 bg-red-50/30' : 'border-stone-200'
                }`}
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
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-stone-800 truncate">{product.name}</p>
                    {!product.is_active && (
                      <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full flex-shrink-0">
                        Inactive
                      </span>
                    )}
                    {product.stock_qty === 0 && (
                      <span className="text-xs bg-yellow-50 text-yellow-600 border border-yellow-200 px-2 py-0.5 rounded-full flex-shrink-0">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Store className="w-3 h-3" />{product.supplier_profiles?.business_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />{product.category}
                    </span>
                    <span>{product.stock_qty} in stock</span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-black text-copper-600">
                    K{parseFloat(product.price).toFixed(2)}
                  </p>
                  <p className="text-xs text-stone-400">per {product.unit}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(product)}
                    disabled={updating === product.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                      product.is_active
                        ? 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    }`}
                  >
                    {product.is_active ? (
                      <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                    ) : (
                      <><Eye className="w-3.5 h-3.5" /> Show</>
                    )}
                  </button>
                  <Link
                    to={`/products/${product.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}