import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Package, MapPin, Phone,
  Star, ShoppingCart, Edit, Trash2,
  AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [supplier, setSupplier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  const isOwner = user?.id === product?.user_id

  useEffect(() => {
    const fetchProduct = async () => {
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !productData) {
        setError('Product not found.')
        setLoading(false)
        return
      }

      setProduct(productData)

      const { data: supplierData } = await supabase
        .from('supplier_profiles')
        .select('*')
        .eq('id', productData.supplier_id)
        .single()

      setSupplier(supplierData)
      setLoading(false)
    }

    fetchProduct()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setDeleting(true)
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
    if (error) {
      setError(error.message)
      setDeleting(false)
    } else {
      navigate('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="font-display text-xl font-black text-stone-900 mb-2">Product not found</h2>
          <p className="text-stone-500 mb-5 text-sm">{error}</p>
          <Link to="/dashboard" className="btn-primary inline-block">Back to Dashboard</Link>
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
            to="/dashboard"
            className="flex items-center gap-2 text-stone-500 hover:text-stone-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <h1 className="font-display text-xl font-black text-stone-900">
            Zed<span className="text-copper-500">Trade</span>
          </h1>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Link
                to={`/products/${id}/edit`}
                className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 border border-red-200 hover:bg-red-50 rounded-lg px-3 py-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Images */}
          <div>
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden aspect-square mb-3">
              {product.images?.length > 0 ? (
                <img
                  src={product.images[activeImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-50">
                  <Package className="w-16 h-16 text-stone-300" />
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === i ? 'border-copper-500' : 'border-stone-200'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-2">
              <span className="text-xs font-medium text-copper-600 bg-orange-50 px-2.5 py-1 rounded-full">
                {product.category}
              </span>
            </div>

            <h1 className="font-display text-3xl font-black text-stone-900 mt-3 mb-2">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="font-display text-4xl font-black text-copper-600">
                K{parseFloat(product.price).toFixed(2)}
              </span>
              <span className="text-stone-400 text-sm">per {product.unit}</span>
            </div>

            {/* Stock status */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium mb-5 ${
              product.stock_qty > 0
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${product.stock_qty > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              {product.stock_qty > 0
                ? `${product.stock_qty} ${product.unit}s available`
                : 'Out of stock'}
            </div>

            <div className="bg-stone-50 rounded-xl p-4 mb-5 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Minimum Order</p>
                <p className="font-semibold text-stone-800">
                  {product.min_order_qty} {product.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Total Orders</p>
                <p className="font-semibold text-stone-800">{product.total_orders}</p>
              </div>
            </div>

            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-stone-700 mb-2 text-sm">Description</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Order button - for non-owners */}
            {!isOwner && (
              <Link
               to={`/products/${id}/order`}
                className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
>
  <ShoppingCart className="w-5 h-5" />
  Place Order
</Link>
            )}

            {/* Supplier info */}
            {supplier && (
              <div className="mt-6 bg-white rounded-xl border border-stone-200 p-4">
                <p className="text-xs text-stone-400 mb-2 font-medium uppercase tracking-wide">Sold by</p>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-stone-800">{supplier.business_name}</p>
                  <Link
                    to={`/suppliers/${supplier.id}`}
                    className="text-xs text-copper-600 hover:text-copper-700 font-medium"
                  >
                    View Store →
                  </Link>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 text-sm text-stone-500">
                    <MapPin className="w-3.5 h-3.5" />{supplier.location}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-stone-500">
                    <Phone className="w-3.5 h-3.5" />{supplier.phone}
                  </span>
                  {supplier.avg_rating > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-stone-500">
                      <Star className="w-3.5 h-3.5 text-yellow-400" />{supplier.avg_rating} rating
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}