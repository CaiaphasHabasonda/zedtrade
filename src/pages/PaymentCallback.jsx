import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState('checking')
  const [order, setOrder] = useState(null)

  const orderId = searchParams.get('order_id')
  const orderTrackingId = searchParams.get('OrderTrackingId')

  useEffect(() => {
    if (orderId && orderTrackingId) {
      verifyPayment()
    }
  }, [orderId, orderTrackingId])

 const verifyPayment = async () => {
    try {
      const { data: tokenData } = await supabase.functions.invoke('pesapal-payment', {
        body: { action: 'get_token', payload: {} }
      })

      const response = await fetch(
        `https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${tokenData?.token}`,
          },
        }
      )
      const result = await response.json()

      const totalPrice = parseFloat(result.amount || 0)
      const platformFee = totalPrice * 0.04
      const supplierAmount = totalPrice - platformFee

      if (result.payment_status_description === 'Completed') {
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_ref: result.merchant_reference,
            payment_method: result.payment_method,
            flw_transaction_id: orderTrackingId,
            platform_fee: platformFee,
            supplier_amount: supplierAmount,
            status: 'confirmed',
          })
          .eq('id', orderId)

        await supabase.from('payments').insert({
          order_id: orderId,
          buyer_id: user.id,
          amount: totalPrice,
          platform_fee: platformFee,
          supplier_amount: supplierAmount,
          status: 'completed',
          flw_transaction_id: orderTrackingId,
          flw_ref: result.merchant_reference,
          payment_method: result.payment_method,
        })

        setStatus('success')
      } else if (result.payment_status_description === 'Failed') {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', orderId)
        setStatus('failed')
      } else {
        setStatus('pending')
      }

      const { data } = await supabase
        .from('orders')
        .select('*, products(name), supplier_profiles(business_name)')
        .eq('id', orderId)
        .single()
      setOrder(data)

    } catch (error) {
      console.error('Verification error:', error)
      setStatus('failed')
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 max-w-md w-full text-center">

        {status === 'checking' && (
          <>
            <div className="w-16 h-16 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="font-display text-xl font-black text-stone-900 mb-2">
              Verifying Payment...
            </h2>
            <p className="text-stone-500 text-sm">Please wait while we confirm your payment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="font-display text-2xl font-black text-stone-900 mb-2">
              Payment Successful! 🎉
            </h2>
            <p className="text-stone-500 mb-2">
              Your order from <strong>{order?.supplier_profiles?.business_name}</strong> has been confirmed.
            </p>
            <p className="text-stone-400 text-sm mb-6">
              {order?.products?.name} · K{parseFloat(order?.total_price || 0).toFixed(2)}
            </p>
            <div className="flex gap-3">
              <Link to="/orders" className="btn-primary flex-1 text-center">View Order</Link>
              <Link to="/browse" className="btn-secondary flex-1 text-center">Browse More</Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="font-display text-2xl font-black text-stone-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-stone-500 mb-6">
              Your payment could not be processed. Please try again.
            </p>
            <div className="flex gap-3">
              <Link to={`/orders/${orderId}`} className="btn-primary flex-1 text-center">Try Again</Link>
              <Link to="/dashboard" className="btn-secondary flex-1 text-center">Dashboard</Link>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="font-display text-2xl font-black text-stone-900 mb-2">
              Payment Pending
            </h2>
            <p className="text-stone-500 mb-6">
              Your payment is being processed. We'll update your order once confirmed.
            </p>
            <Link to="/orders" className="btn-primary inline-block">View Orders</Link>
          </>
        )}
      </div>
    </div>
  )
}