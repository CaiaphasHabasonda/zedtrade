import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Search, Package, MapPin, Star,
  SlidersHorizontal, X, ShoppingBag
} from 'lucide-react'

const CATEGORIES = [
  'All',
  'Agriculture & Farming',
  'Food & Beverages',
  'Electronics & Appliances',
  'Clothing & Textiles',
  'Hardware & Construction',
  'Health & Beauty',
  'Household Goods',
  'Stationery & Office',
  'Automotive Parts',
  'Other',
]

const LOCATIONS = [
  'All',
  'Lusaka', 'Kitwe', 'Ndola', 'Livingstone', 'Kabwe',
  'Chipata', 'Solwezi', 'Kasama', 'Mongu', 'Chingola',
  'Mufulira', 'Luanshya', 'Other',
]

export default function Browse() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [location, setLocation] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [category, location, sortBy])

  const fetchProducts = async () => {
    setLoading(true)

    let query = supabase
      .from('products')
      .select(`*, supplier_profiles (business_name, location, avg_rating)`)
      .eq('is_active', true)
      .gt('stock_qty', 0)

    if (category !== 'All') {
      query = query.eq('category', category)
    }

    if (location !== 'All') {
      query = query.eq('supplier_profiles.location', location)
    }

    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'price_low') {
      query = query.order('price', { ascending: true })
    } else if (sortBy === 'price_high') {
      query = query.order('price', { ascending: false })
    } else if (sortBy === 'popular') {
      query = query.order('total_orders', { ascending: false })
    }

    const { data } = await query
    setProducts(data || [])
    setLoading(false)
  }

  const filtered = products.filter(p =>
    search === '' ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  const clearFilters = () => {
    setSearch('')
    setCategory('All')
    setLocation('All')
    setSortBy('newest')
  }

  const hasActiveFilters = search || category !== 'All' || location !== 'All' || sortBy !== 'newest'

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/">
            <h1 className="font-display text-2xl font-black text-stone-900">
              Zed<span className="text-copper-500">Trade</span>
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/orders" className="text-sm text-stone-500 hover:text-stone-700 font-medium">
              My Orders
            </Link>
            <Link to="/dashboard" className="btn-primary text-sm py-2 px-4">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-stone-900 mb-1">
            Browse Products
          </h1>
          <p className="text-stone-500">
            Discover products from suppliers across Zambia 🇿🇲
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-copper-500 text-white border-copper-500'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-white text-copper-600 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Location</label>
                <select
                  className="input"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                >
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Sort By</label>
                <select
                  className="input"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-copper-600 hover:text-copper-700 font-medium flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-copper-500 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-copper-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-stone-500 mb-4">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
            {category !== 'All' && ` in ${category}`}
            {search && ` for "${search}"`}
          </p>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
                <div className="aspect-square bg-stone-100" />
                <div className="p-4">
                  <div className="h-4 bg-stone-100 rounded mb-2" />
                  <div className="h-3 bg-stone-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="font-semibold text-stone-700 mb-1">No products found</h3>
            <p className="text-stone-400 text-sm mb-4">
              Try adjusting your search or filters.
            </p>
            <button onClick={clearFilters} className="btn-secondary">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(product => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-copper-300 hover:shadow-md transition-all group"
              >
                {/* Image */}
                <div className="aspect-square bg-stone-100 overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-stone-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-semibold text-stone-800 text-sm leading-tight line-clamp-2 mb-1">
                    {product.name}
                  </p>
                  <p className="text-xs text-stone-400 mb-2">
                    {product.supplier_profiles?.business_name}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-black text-copper-600">
                        K{parseFloat(product.price).toFixed(2)}
                      </p>
                      <p className="text-xs text-stone-400">per {product.unit}</p>
                    </div>
                    {product.supplier_profiles?.avg_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-stone-500">
                          {product.supplier_profiles.avg_rating}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span className="text-xs text-stone-400">
                      {product.supplier_profiles?.location}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}