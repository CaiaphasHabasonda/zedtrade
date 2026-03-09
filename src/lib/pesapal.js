import { supabase } from './supabase'

const COMMISSION_RATE = 0.04 // 4% platform fee

export const initiatePayment = async (orderData) => {
  try {
    const { data, error } = await supabase.functions.invoke('pesapal-payment', {
      body: {
        payload: {
          orderId: orderData.orderId,
          amount: orderData.amount,
          description: orderData.description,
          buyerEmail: orderData.buyerEmail,
          buyerPhone: orderData.buyerPhone,
          buyerName: orderData.buyerName,
          buyerLocation: orderData.buyerLocation,
          origin: window.location.origin,
        },
      },
    })

    if (error) throw new Error(error.message)
    if (!data.success) throw new Error(data.error)

    return {
      success: true,
      redirectUrl: data.redirectUrl,
      orderTrackingId: data.orderTrackingId,
    }

  } catch (error) {
    console.error('Pesapal error:', error)
    return {
      success: false,
      error: error.message || 'Payment initiation failed',
    }
  }
}

export const calculateFees = (totalPrice) => {
  const platformFee = totalPrice * COMMISSION_RATE
  const supplierAmount = totalPrice - platformFee
  return { platformFee, supplierAmount }
}