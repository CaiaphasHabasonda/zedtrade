import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { ArrowLeft, ShoppingCart, MapPin, Phone, Package, AlertCircle, CheckCircle } from 'lucide-react'

export default function PlaceOrder() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [supplier, setSupplier] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      buyer_name: user?.user_metadata?.full_name || '',
    }
  })

  useEffect(() => {
    const fetchProduct = async () => {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (!productData) {
        setError('Product not found.')
        setFetching(false)
        return
      }

      setProduct(productData)
      setQuantity(productData.min_order_qty || 1)

      const { data: supplierData } = await supabase
        .from('supplier_profiles')
        .select('*')
        .eq('id', productData.supplier_id)
        .single()

      setSupplier(supplierData)
      setFetching(false)
    }

    fetchProduct()
  }, [id])

  const totalPrice = product ? (quantity * parseFloat(product.price)).toFixed(2) : '0.00'

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('orders').insert({
      buyer_id: user.id,
      supplier_id: product.supplier_id,
      product_id: product.id,
      quantity: quantity,
      unit_price: parseFloat(product.price),
      total_price: parseFloat(totalPrice),
      status: 'pending',
      buyer_name: data.buyer_name,
      buyer_phone: data.buyer_phone,
      buyer_location: data.buyer_location,
      notes: data.notes || null,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="font-display text-2xl font-black text-stone-900 mb-2">
            Order Placed!
          </h2>
          <p className="text-stone-500 mb-2 leading-relaxed">
            Your order has been sent to <strong>{supplier?.business_name}</strong>.
            They will confirm it shortly.
          </p>
          <div className="bg-stone-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-stone-500">Product</span>
              <span className="font-medium text-stone-800">{product?.name}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-stone-500">Quantity</span>
              <span className="font-medium text-stone-800">{quantity} {product?.unit}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Total</span>
              <span className="font-bold text-copper-600">K{totalPrice}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard" className="btn-secondary flex-1 text-center">
              Dashboard
            </Link>
            <Link to="/orders" className="btn-primary flex-1 text-center">
              View Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link
            to={`/products/${id}`}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Product</span>
          </Link>
          <h1 className="font-display text-xl font-black text-stone-900">
            Zed<span className="text-copper-500">Trade</span>
          </h1>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-copper-50 border-2 border-copper-200 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-copper-500" />
            </div>
            <h1 className="font-display text-2xl font-black text-stone-900">
              Place Order
            </h1>
          </div>
          <p className="text-stone-500 text-sm">Fill in your details and confirm your order.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Order Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
              <form onSubmit={handleSubmit(onSubmit)} noValidate>

                <h3 className="font-semibold text-stone-900 mb-4">Your Details</h3>

                {/* Buyer Name */}
                <div className="mb-4">
                  <label className="label" htmlFor="buyer_name">Full Name</label>
                  <input
                    id="buyer_name"
                    type="text"
                    className={`input ${errors.buyer_name ? 'input-error' : ''}`}
                    {...register('buyer_name', { required: 'Please enter your name' })}
                  />
                  {errors.buyer_name && <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.buyer_name.message}</p>}
                </div>

                {/* Phone */}
                <div className="mb-4">
                  <label className="label" htmlFor="buyer_phone">Phone Number</label>
                  <input
                    id="buyer_phone"
                    type="tel"
                    placeholder="e.g. 0977 123 456"
                    className={`input ${errors.buyer_phone ? 'input-error' : ''}`}
                    {...register('buyer_phone', { required: 'Please enter your phone number' })}
                  />
                  {errors.buyer_phone && <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.buyer_phone.message}</p>}
                </div>

                {/* Location */}
                <div className="mb-4">
                  <label className="label" htmlFor="buyer_location">Delivery Location</label>
                  <input
                    id="buyer_location"
                    type="text"
                    placeholder="e.g. Lusaka, Chilenje South"
                    className={`input ${errors.buyer_location ? 'input-error' : ''}`}
                    {...register('buyer_location', { required: 'Please enter your delivery location' })}
                  />
                  {errors.buyer_location && <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.buyer_location.message}</p>}
                </div>

                {/* Quantity */}
                <div className="mb-4">
                  <label className="label">Quantity ({product?.unit})</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(product?.min_order_qty || 1, q - 1))}
                      className="w-10 h-10 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 font-bold text-lg"
                    >
                      −
                    </button>
                    <span className="font-display text-2xl font-black text-stone-900 w-16 text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.min(product?.stock_qty || 999, q + 1))}
                      className="w-10 h-10 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 font-bold text-lg"
                    >
                      +
                    </button>
                    <span className="text-stone-400 text-sm">
                      Min: {product?.min_order_qty} · Max: {product?.stock_qty}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="label" htmlFor="notes">
                    Notes <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    placeholder="Any special instructions for the supplier..."
                    className="input resize-none"
                    {...register('notes')}
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing order...</>
                  ) : (
                    <><ShoppingCart className="w-5 h-5" />Confirm Order · K{totalPrice}</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sticky top-24">
              <h3 className="font-semibold text-stone-900 mb-4">Order Summary</h3>

              {/* Product */}
              <div className="flex gap-3 mb-4 pb-4 border-b border-stone-100">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                  {product?.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-stone-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-800 text-sm leading-tight">{product?.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{product?.category}</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 mb-4 pb-4 border-b border-stone-100">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Unit Price</span>
                  <span className="text-stone-800">K{parseFloat(product?.price || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Quantity</span>
                  <span className="text-stone-800">{quantity} {product?.unit}</span>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="font-bold text-stone-900">Total</span>
                <span className="font-display text-xl font-black text-copper-600">K{totalPrice}</span>
              </div>

              {/* Supplier */}
              {supplier && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <p className="text-xs text-stone-400 mb-2 font-medium uppercase tracking-wide">Supplier</p>
                  <p className="font-semibold text-stone-800 text-sm">{supplier.business_name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                    <MapPin className="w-3 h-3" />{supplier.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                    <Phone className="w-3 h-3" />{supplier.phone}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}