import { useState, useEffect,  } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Package, MapPin, Phone,
  Clock, CheckCircle, XCircle, Truck,
  AlertCircle, User, Trash2
} from 'lucide-react'


const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: CheckCircle },
  rejected:  { label: 'Rejected',  color: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle },
  delivered: { label: 'Delivered', color: 'bg-green-50 text-green-700 border-green-200',    icon: Truck },
  cancelled: { label: 'Cancelled', color: 'bg-stone-50 text-stone-500 border-stone-200',    icon: XCircle },
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${config.color}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  )
}
function ReviewForm({ orderId, productId, supplierId, buyerId }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [existing, setExisting] = useState(false)

  useEffect(() => {
    // Check if review already exists
    supabase
      .from('reviews')
      .select('id')
      .eq('order_id', orderId)
      .single()
      .then(({ data }) => {
        if (data) setSubmitted(true)
        setExisting(!!data)
      })
  }, [orderId])

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('reviews').insert({
      order_id: orderId,
      product_id: productId,
      supplier_id: supplierId,
      buyer_id: buyerId,
      rating,
      comment: comment || null,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <p className="font-semibold">
            {existing ? 'You already reviewed this order.' : 'Review submitted! Thank you.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <h3 className="font-semibold text-stone-700 text-sm mb-4 uppercase tracking-wide">
        Leave a Review
      </h3>

      {/* Star Rating */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-3xl transition-transform hover:scale-110 ${
              star <= rating ? 'text-yellow-400' : 'text-stone-200'
            }`}
          >
            ★
          </button>
        ))}
        {rating > 0 && (
          <span className="text-sm text-stone-500 self-center ml-1">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        rows={3}
        placeholder="Share your experience with this supplier... (optional)"
        className="input resize-none mb-4"
        value={comment}
        onChange={e => setComment(e.target.value)}
      />

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
        ) : 'Submit Review'}
      </button>
    </div>
  )
}
// Dispute Form Component
function DisputeForm({ orderId, supplierId, buyerId }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existing, setExisting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('disputes')
      .select('id')
      .eq('order_id', orderId)
      .single()
      .then(({ data }) => {
        if (data) setSubmitted(true)
        setExisting(!!data)
      })
  }, [orderId])

  const handleSubmit = async () => {
    if (!reason) { setError('Please select a reason.'); return }
    if (!description) { setError('Please describe the issue.'); return }
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('disputes').insert({
      order_id: orderId,
      buyer_id: buyerId,
      supplier_id: supplierId,
      reason,
      description,
      status: 'open',
    })

    if (!error) {
      // Notify admin
      await supabase.from('notifications').insert({
        user_id: buyerId,
        title: 'Dispute Submitted',
        message: 'Your dispute has been submitted. Our team will review it shortly.',
        type: 'dispute',
        link: `/orders/${orderId}`,
      })
    }

    setLoading(false)
    if (error) { setError(error.message) } else { setSubmitted(true) }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="w-5 h-5" />
          <p className="font-semibold">
            {existing ? 'Dispute already submitted for this order.' : 'Dispute submitted! Our team will review it.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-red-200 p-5">
      <h3 className="font-semibold text-red-700 text-sm mb-4 uppercase tracking-wide flex items-center gap-2">
        <AlertCircle className="w-4 h-4" /> Raise a Dispute
      </h3>

      <div className="mb-4">
        <label className="label">Reason</label>
        <select
          className="input"
          value={reason}
          onChange={e => setReason(e.target.value)}
        >
          <option value="">Select a reason...</option>
          <option value="item_not_received">Item not received</option>
          <option value="item_not_as_described">Item not as described</option>
          <option value="wrong_item">Wrong item delivered</option>
          <option value="damaged_item">Item arrived damaged</option>
          <option value="partial_delivery">Partial delivery</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="label">Describe the issue</label>
        <textarea
          rows={3}
          placeholder="Please provide details about the problem..."
          className="input resize-none"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />Submitting...</>
        ) : 'Submit Dispute'}
      </button>
    </div>
  )
}


export default function OrderDetail() {
  const { id } = useParams()
  const { user, supplierProfile } = useAuth()
  const navigate = useNavigate()
  const role = user?.user_metadata?.role
  const [order, setOrder] = useState(null)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)

  const isSupplier = role === 'supplier'

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (name, images, unit, price),
          supplier_profiles (business_name, phone, location)
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        setError('Order not found.')
        setLoading(false)
        return
      }

      setOrder(data)
      setProduct(data.products)
      setLoading(false)
    }

    fetchOrder()
  }, [id])
 const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this order from your history?')) return
    setUpdating(true)
    const updateField = isSupplier ? 'deleted_by_supplier' : 'deleted_by_buyer'
    
    console.log('Deleting order:', id, 'as', isSupplier ? 'supplier' : 'buyer', 'field:', updateField)
    
    const { data, error } = await supabase
      .from('orders')
      .update({ [updateField]: true })
      .eq('id', id)
      .select()

    console.log('Result:', { data, error })

    if (error) {
      setError(error.message)
      setUpdating(false)
    } else {
      navigate('/orders')
    }
  }
  const updateStatus = async (newStatus) => {
    setUpdating(true)
    setError(null)

    const { error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setUpdating(false)
    } else {
      setOrder(prev => ({ ...prev, status: newStatus }))

      // Notify the other party
      const notifyUserId = isSupplier ? order.buyer_id : order.supplier_profiles?.user_id
      const statusMessages = {
        confirmed: { title: 'Order Confirmed! 🎉', message: `Your order for ${order.products?.name} has been confirmed by the supplier.` },
        rejected:  { title: 'Order Rejected', message: `Your order for ${order.products?.name} was rejected by the supplier.` },
        delivered: { title: 'Order Delivered! 📦', message: `Your order for ${order.products?.name} has been marked as delivered.` },
        cancelled: { title: 'Order Cancelled', message: `Your order for ${order.products?.name} has been cancelled.` },
      }

      if (notifyUserId && statusMessages[newStatus]) {
        await supabase.from('notifications').insert({
          user_id: notifyUserId,
          title: statusMessages[newStatus].title,
          message: statusMessages[newStatus].message,
          type: 'order',
          link: `/orders/${id}`,
        })
      }

      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="font-display text-xl font-black text-stone-900 mb-2">Order not found</h2>
          <Link to="/orders" className="btn-primary inline-block mt-4">Back to Orders</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/orders" className="flex items-center gap-2 text-stone-500 hover:text-stone-700">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Orders</span>
          </Link>
          <h1 className="font-display text-xl font-black text-stone-900">
            Zed<span className="text-copper-500">Trade</span>
          </h1>
          <div className="w-24" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-stone-900 mb-1">
              Order Details
            </h1>
            <p className="text-stone-400 text-xs font-mono">#{id.slice(0, 8).toUpperCase()}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="space-y-4">

          {/* Product */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h3 className="font-semibold text-stone-700 text-sm mb-3 uppercase tracking-wide">Product</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                {product?.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-7 h-7 text-stone-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-stone-900">{product?.name}</p>
                <p className="text-sm text-stone-500 mt-0.5">
                  {order.quantity} {product?.unit} × K{parseFloat(order.unit_price).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-black text-copper-600">
                  K{parseFloat(order.total_price).toFixed(2)}
                </p>
                <p className="text-xs text-stone-400">Total</p>
              </div>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h3 className="font-semibold text-stone-700 text-sm mb-3 uppercase tracking-wide">
              {isSupplier ? 'Buyer Details' : 'Your Details'}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-stone-600">
                <User className="w-4 h-4 text-stone-400" />
                <span className="text-sm">{order.buyer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <Phone className="w-4 h-4 text-stone-400" />
                <span className="text-sm">{order.buyer_phone}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <MapPin className="w-4 h-4 text-stone-400" />
                <span className="text-sm">{order.buyer_location}</span>
              </div>
            </div>
            {order.notes && (
              <div className="mt-3 pt-3 border-t border-stone-100">
                <p className="text-xs text-stone-400 mb-1">Notes from buyer</p>
                <p className="text-sm text-stone-600">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Supplier Details - shown to buyers */}
          {!isSupplier && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h3 className="font-semibold text-stone-700 text-sm mb-3 uppercase tracking-wide">Supplier</h3>
              <div className="space-y-2">
                <p className="font-semibold text-stone-800">{order.supplier_profiles?.business_name}</p>
                <div className="flex items-center gap-2 text-stone-600">
                  <Phone className="w-4 h-4 text-stone-400" />
                  <span className="text-sm">{order.supplier_profiles?.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-600">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  <span className="text-sm">{order.supplier_profiles?.location}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Timeline */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h3 className="font-semibold text-stone-700 text-sm mb-3 uppercase tracking-wide">Timeline</h3>
            <div className="text-sm text-stone-500">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Order placed on {new Date(order.created_at).toLocaleDateString('en-ZM', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Supplier Actions */}
          {isSupplier && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h3 className="font-semibold text-stone-700 text-sm mb-4 uppercase tracking-wide">
                Update Order Status
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateStatus('confirmed')}
                      disabled={updating}
                      className="flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {updating ? 'Updating...' : 'Confirm Order'}
                    </button>
                    <button
                      onClick={() => updateStatus('rejected')}
                      disabled={updating}
                      className="flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      {updating ? 'Updating...' : 'Reject Order'}
                    </button>
                  </>
                )}

                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateStatus('delivered')}
                    disabled={updating}
                    className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 font-semibold rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <Truck className="w-4 h-4" />
                    {updating ? 'Updating...' : 'Mark as Delivered'}
                  </button>
                )}

                {(order.status === 'delivered' || order.status === 'rejected') && (
                  <div className="text-center py-3 text-stone-400 text-sm">
                    This order is {order.status}. No further actions needed.
                  </div>
                )}
              </div>
            </div>
          )}
    
          {/* Dispute - buyers only on delivered orders */}
          {!isSupplier && order.status === 'delivered' && (
            <DisputeForm
              orderId={id}
              supplierId={order.supplier_id}
              buyerId={user.id}
            />
          )}



          {/* Buyer cancel option */}
          {/* Buyer review - only for delivered orders */}
          {!isSupplier && order.status === 'delivered' && (
            <ReviewForm orderId={id} productId={order.product_id} supplierId={order.supplier_id} buyerId={user.id} />
          )}
          {/* Delete order - available to both roles for completed orders */}
          {(['delivered', 'rejected', 'cancelled'].includes(order.status)) && (
            <button
  onClick={handleDelete}
  disabled={updating}
  className="..."
>
  Delete
</button>
          )}
          {!isSupplier && order.status === 'pending' && (
            <button
              onClick={() => updateStatus('cancelled')}
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 p-3 bg-stone-50 border border-stone-200 text-stone-600 font-semibold rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {updating ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}

        </div>
      </div>
    </div>
  )
}