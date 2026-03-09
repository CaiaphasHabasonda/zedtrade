import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  MessageCircle, Search, Package,
  Store, ArrowLeft, Send, CheckCheck
} from 'lucide-react'

export default function Inbox() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState(null)
  const [supplierProfile, setSupplierProfile] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    initRole()
  }, [user])

  useEffect(() => {
    if (role) fetchConversations()
  }, [role])

  useEffect(() => {
    if (selected) {
      fetchMessages(selected.order_id)
      markAsRead(selected.order_id)
    }
  }, [selected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selected) return
    const channel = supabase
      .channel(`inbox:${selected.order_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `order_id=eq.${selected.order_id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        markAsRead(selected.order_id)
        // Update last message in conversations list
        setConversations(prev => prev.map(c =>
          c.order_id === selected.order_id
            ? { ...c, last_message: payload.new.message, last_message_at: payload.new.created_at }
            : c
        ))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [selected])

  const initRole = async () => {
    if (!user) return
    const { data } = await supabase
      .from('supplier_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setRole('supplier')
      setSupplierProfile(data)
    } else {
      setRole('buyer')
    }
  }

  const fetchConversations = async () => {
    setLoading(true)

    // Get all orders that have messages
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        buyer_id,
        buyer_name,
        status,
        products (name, images),
        supplier_profiles (id, business_name, user_id)
      `)

    if (role === 'supplier') {
      ordersQuery = ordersQuery.eq('supplier_id', supplierProfile.id)
    } else {
      ordersQuery = ordersQuery.eq('buyer_id', user.id)
    }

    const { data: orders } = await ordersQuery

    if (!orders?.length) {
      setConversations([])
      setLoading(false)
      return
    }

    // Get last message for each order
    const orderIds = orders.map(o => o.id)
    const { data: lastMessages } = await supabase
      .from('messages')
      .select('order_id, message, created_at, sender_id, read_by_buyer, read_by_supplier')
      .in('order_id', orderIds)
      .order('created_at', { ascending: false })

    // Get unread counts
    const convos = orders.map(order => {
      const orderMessages = (lastMessages || []).filter(m => m.order_id === order.id)
      const lastMsg = orderMessages[0]
      const unreadCount = orderMessages.filter(m => {
        if (role === 'supplier') return !m.read_by_supplier && m.sender_id !== user.id
        return !m.read_by_buyer && m.sender_id !== user.id
      }).length

      return {
        order_id: order.id,
        buyer_id: order.buyer_id,
        buyer_name: order.buyer_name,
        order_status: order.status,
        product_name: order.products?.name,
        product_image: order.products?.images?.[0],
        supplier_name: order.supplier_profiles?.business_name,
        supplier_user_id: order.supplier_profiles?.user_id,
        last_message: lastMsg?.message || null,
        last_message_at: lastMsg?.created_at || order.created_at,
        unread: unreadCount,
        has_messages: orderMessages.length > 0,
      }
    })
    .filter(c => c.has_messages)
    .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))

    setConversations(convos)
    setLoading(false)
  }

  const fetchMessages = async (orderId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const markAsRead = async (orderId) => {
    const field = role === 'supplier' ? 'read_by_supplier' : 'read_by_buyer'
    await supabase
      .from('messages')
      .update({ [field]: true })
      .eq('order_id', orderId)
      .neq('sender_id', user.id)

    setConversations(prev => prev.map(c =>
      c.order_id === orderId ? { ...c, unread: 0 } : c
    ))
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selected) return
    setSending(true)
    await supabase.from('messages').insert({
      order_id: selected.order_id,
      sender_id: user.id,
      message: newMessage.trim(),
      read_by_buyer: role === 'buyer',
      read_by_supplier: role === 'supplier',
    })
    setNewMessage('')
    setSending(false)
  }

  const filtered = conversations.filter(c =>
    search === '' ||
    c.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.supplier_name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  const formatTime = (ts) => {
    const date = new Date(ts)
    const now = new Date()
    const diff = now - date
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' })
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
  }

  return (
    <div className="h-screen bg-stone-50 flex flex-col">

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 z-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <h1 className="font-display text-xl font-black text-stone-900">
            Zed<span className="text-copper-500">Trade</span>
          </h1>
          <div className="w-24" />
        </div>
      </nav>

      <div className="flex-1 overflow-hidden max-w-7xl w-full mx-auto flex">

        {/* Sidebar */}
        <div className={`w-full sm:w-80 lg:w-96 flex-shrink-0 border-r border-stone-200 bg-white flex flex-col ${selected ? 'hidden sm:flex' : 'flex'}`}>

          {/* Sidebar Header */}
          <div className="p-4 border-b border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-black text-stone-900">
                Inbox
                {totalUnread > 0 && (
                  <span className="ml-2 text-sm bg-copper-500 text-white px-2 py-0.5 rounded-full font-bold">
                    {totalUnread}
                  </span>
                )}
              </h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 py-2 text-sm w-full"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-7 h-7 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <MessageCircle className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-400 text-sm font-medium">No conversations yet</p>
                <p className="text-stone-300 text-xs mt-1">Messages from orders will appear here</p>
              </div>
            ) : (
              filtered.map(convo => (
                <button
                  key={convo.order_id}
                  onClick={() => setSelected(convo)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-stone-50 transition-colors ${
                    selected?.order_id === convo.order_id ? 'bg-copper-50 border-r-2 border-copper-500' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {convo.product_image ? (
                      <img src={convo.product_image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-forest-50 flex items-center justify-center">
                        {role === 'supplier'
                          ? <Store className="w-5 h-5 text-forest-600" />
                          : <Package className="w-5 h-5 text-forest-600" />
                        }
                      </div>
                    )}
                    {convo.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-copper-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {convo.unread}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm truncate ${convo.unread > 0 ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>
                        {role === 'supplier' ? convo.buyer_name : convo.supplier_name}
                      </p>
                      <span className="text-xs text-stone-400 flex-shrink-0 ml-2">
                        {formatTime(convo.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 truncate mb-1">{convo.product_name}</p>
                    {convo.last_message && (
                      <p className={`text-xs truncate ${convo.unread > 0 ? 'text-stone-700 font-medium' : 'text-stone-400'}`}>
                        {convo.last_message}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex flex-col ${!selected ? 'hidden sm:flex' : 'flex'}`}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                <p className="text-stone-400 font-medium">Select a conversation</p>
                <p className="text-stone-300 text-sm mt-1">Choose from your inbox on the left</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="sm:hidden p-1 text-stone-500"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {selected.product_image ? (
                    <img src={selected.product_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-forest-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 text-sm">
                    {role === 'supplier' ? selected.buyer_name : selected.supplier_name}
                  </p>
                  <p className="text-xs text-stone-400 truncate">{selected.product_name}</p>
                </div>
                <button
                  onClick={() => navigate(`/orders/${selected.order_id}`)}
                  className="text-xs text-copper-600 font-medium border border-copper-200 px-3 py-1.5 rounded-lg hover:bg-copper-50 transition-colors flex-shrink-0"
                >
                  View Order
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-stone-400 text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_id === user.id
                    const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i-1].created_at).toDateString()
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="text-center my-3">
                            <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
                              {new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                            isMe
                              ? 'bg-copper-500 text-white rounded-br-sm'
                              : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-xs ${isMe ? 'text-copper-200' : 'text-stone-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                <CheckCheck className={`w-3 h-3 ${
                                  (role === 'supplier' ? msg.read_by_buyer : msg.read_by_supplier)
                                    ? 'text-blue-300'
                                    : 'text-copper-300'
                                }`} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-stone-200 p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="input flex-1 py-2.5"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="w-11 h-11 bg-copper-500 hover:bg-copper-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}