import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  MapPin, Phone, Star, Package,
  ShoppingCart, ArrowLeft, Store, Tag
} from 'lucide-react'

export default function SupplierProfile() {
  const { id } = useParams()
  const [supplier, setSupplier] = useState(null)
  const [products, setProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: supplierData, error } = await supabase
        .from('supplier_profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !supplierData) {
        setError('Supplier not found.')
        setLoading(false)
        return
      }

      setSupplier(supplierData)

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', id)
        .eq('is_active', true)
        .gt('stock_qty', 0)
        .order('created_at', { ascending: false })

      setProducts(productsData || [])

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('supplier_id', id)
        .order('created_at', { ascending: false })
        .limit(10)

      setReviews(reviewsData || [])
      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 max-w-md w-full text-center">
          <Store className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h2 className="font-display text-xl font-black text-stone-900 mb-2">
            Supplier not found
          </h2>
          <Link to="/browse" className="btn-primary inline-block mt-4">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link
            to="/browse"
            className="flex items-center gap-2 text-stone-500 hover:text-stone-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Browse</span>
          </Link>
          <h1 className="font-display text-xl font-black text-stone-900">
            Zed<span className="text-copper-500">Trade</span>
          </h1>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Supplier Header */}
        <div className="bg-gradient-to-r from-forest-600 to-forest-500 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-black">
                    {supplier.business_name}
                  </h1>
                  {supplier.is_verified && (
                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-green-200 text-sm mt-3">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />{supplier.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />{supplier.phone}
                </span>
                {supplier.avg_rating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-yellow-300" />
                    {supplier.avg_rating} rating
                  </span>
                )}
              </div>

              {supplier.description && (
                <p className="text-green-100 text-sm mt-3 max-w-lg leading-relaxed">
                  {supplier.description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="hidden sm:flex flex-col items-end gap-2 text-right">
              <div className="bg-white/10 rounded-xl px-4 py-2">
                <p className="font-display text-2xl font-black">{products.length}</p>
                <p className="text-green-200 text-xs">Products</p>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2">
                <p className="font-display text-2xl font-black">{supplier.total_orders}</p>
                <p className="text-green-200 text-xs">Orders</p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mt-4">
            {supplier.category?.map(cat => (
              <span
                key={cat}
                className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />{cat}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Products */}
          <div className="lg:col-span-2">
            <h2 className="font-display text-xl font-black text-stone-900 mb-4">
              Products ({products.length})
            </h2>

            {products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <Package className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">No products listed yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {products.map(product => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-copper-300 hover:shadow-md transition-all group"
                  >
                    <div className="aspect-square bg-stone-100 overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-stone-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-stone-800 text-sm line-clamp-2 mb-1">
                        {product.name}
                      </p>
                      <p className="font-display font-black text-copper-600">
                        K{parseFloat(product.price).toFixed(2)}
                        <span className="text-xs text-stone-400 font-normal ml-1">
                          /{product.unit}
                        </span>
                      </p>
                      <p className={`text-xs mt-1 ${product.stock_qty > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {product.stock_qty > 0 ? `${product.stock_qty} in stock` : 'Out of stock'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2 className="font-display text-xl font-black text-stone-900 mb-4">
              Reviews ({reviews.length})
            </h2>

            {supplier.avg_rating > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4 text-center">
                <p className="font-display text-5xl font-black text-stone-900 mb-1">
                  {supplier.avg_rating}
                </p>
                <div className="flex justify-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`text-xl ${
                        star <= Math.round(supplier.avg_rating)
                          ? 'text-yellow-400'
                          : 'text-stone-200'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-stone-400 text-sm">
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                <Star className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-400 text-sm">No reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(review => (
                  <div
                    key={review.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span
                            key={star}
                            className={`text-sm ${
                              star <= review.rating
                                ? 'text-yellow-400'
                                : 'text-stone-200'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-stone-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-stone-600 text-sm leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}