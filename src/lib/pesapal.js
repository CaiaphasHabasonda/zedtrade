import axios from 'axios'

const CONSUMER_KEY = import.meta.env.VITE_PESAPAL_CONSUMER_KEY
const CONSUMER_SECRET = import.meta.env.VITE_PESAPAL_CONSUMER_SECRET

// Use sandbox for testing, change to live when ready
const BASE_URL = 'https://cybqa.pesapal.com/pesapalv3'
// Live URL: 'https://pay.pesapal.com/v3'

// Step 1: Get auth token from Pesapal
export const getPesapalToken = async () => {
  const response = await axios.post(
    `${BASE_URL}/api/Auth/RequestToken`,
    {
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    },
    {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    }
  )
  return response.data.token
}

// Step 2: Register IPN (do this once)
export const registerIPN = async (token) => {
  const response = await axios.post(
    `${BASE_URL}/api/URLSetup/RegisterIPN`,
    {
      url: `${window.location.origin}/payment/callback`,
      ipn_notification_type: 'GET',
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  )
  return response.data.ipn_id
}

// Step 3: Submit order to Pesapal
export const submitOrder = async (token, ipnId, orderData) => {
  const COMMISSION_RATE = 0.04 // 4% platform fee

  const response = await axios.post(
    `${BASE_URL}/api/Transactions/SubmitOrderRequest`,
    {
      id: orderData.orderId,
      currency: 'ZMW',
      amount: orderData.amount,
      description: orderData.description,
      callback_url: `${window.location.origin}/payment/callback?order_id=${orderData.orderId}`,
      notification_id: ipnId,
      billing_address: {
        email_address: orderData.buyerEmail,
        phone_number: orderData.buyerPhone,
        first_name: orderData.buyerName.split(' ')[0],
        last_name: orderData.buyerName.split(' ').slice(1).join(' ') || '',
        line_1: orderData.buyerLocation,
        city: orderData.buyerLocation,
        country_code: 'ZM',
      },
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  )
  return response.data
}

// Step 4: Check transaction status
export const getTransactionStatus = async (token, orderTrackingId) => {
  const response = await axios.get(
    `${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  )
  return response.data
}

// Main function: initiate payment
export const initiatePayment = async (orderData) => {
  try {
    const token = await getPesapalToken()
    const ipnId = await registerIPN(token)
    const result = await submitOrder(token, ipnId, orderData)
    return {
      success: true,
      redirectUrl: result.redirect_url,
      orderTrackingId: result.order_tracking_id,
    }
  } catch (error) {
    console.error('Pesapal error:', error)
    return {
      success: false,
      error: error.response?.data?.message || 'Payment initiation failed',
    }
  }
}