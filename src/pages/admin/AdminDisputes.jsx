import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  AlertCircle, ArrowLeft, Search,
  CheckCircle, XCircle, Clock, Eye
} from 'lucide-react'

const STATUS_CONFIG = {
  open:               { label: 'Open',               color: 'bg-red-50 text-red-700 border-red-200',         icon: AlertCircle },
  under_review:       { label: 'Under Review',        color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  resolved_buyer:     { label: 'Resolved (Buyer)',    color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: CheckCircle },
  resolved_supplier:  { label: 'Resolved (Supplier)', color: 'bg-green-50 text-green-700 border-green-200',    icon: CheckCircle },
  closed:             { label: 'Closed',              color: 'bg-stone-50 text-stone-500 border-stone-200',    icon: XCircle },
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [resolution, setResolution] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchDisputes()
  }, [])

  const fetchDisputes = async () => {
    const { data } = await supabase
      .from('disputes')
      .select(`
        *,
        orders (
          id, buyer_name, buyer_phone, buyer_location,
          total_price, quantity, status,
          products (name, images, unit),
          supplier_profiles (business_name, location, phone)
        )
      `)
      .order('created_at', { ascending: false })
    setDisputes(data || [])
    setLoading(false)
  }

  const updateDispute = async (disputeId, newStatus) => {
    setUpdating(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('disputes')
      .update({
        status: newStatus,
        admin_notes: adminNotes || null,
        resolution: resolution || null,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId)

    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'update_dispute',
      target_type: 'dispute',
      target_id: disputeId,
      details: `Updated dispute status to: ${newStatus}`,
    })

    // Notify buyer
    if (selected) {
      await supabase.from('notifications').insert({
        user_id: selected.buyer_id,
        title: 'Dispute Update',
        message: resolution || `Your dispute status has been updated to: ${newStatus.replace('_', ' ')}.`,
        type: 'dispute',
        link: `/orders/${selected.order_id}`,
      })
    }

    setDisputes(prev => prev.map(d =>
      d.id === disputeId
        ? { ...d, status: newStatus, admin_notes: adminNotes, resolution }
        : d
    ))

    setSelected(prev => prev ? { ...prev, status: newStatus } : null)
    setUpdating(false)
  }

  const filtered = disputes.filter(d => {
    const matchesSearch =
      search === '' ||
      d.orders?.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.orders?.products?.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.orders?.supplier_profiles?.business_name?.toLowerCase().includes(search.toLowerCase())

    const matchesFilter = filter === 'all' || d.status === filter

    return matchesSearch && matchesFilter
  })

  const tabs = [
    { key: 'all', label: 'All', count: disputes.length },
    { key: 'open', label: 'Open', count: disputes.filter(d => d.status === 'open').length },
    { key: 'under_review', label: 'Under Review', count: disputes.filter(d => d.status === 'under_review').length },
    { key: 'resolved_buyer', label: 'Resolved', count: disputes.filter(d => ['resolved_buyer', 'resolved_supplier'].includes(d.status)).length },
    { key: 'closed', label: 'Closed', count: disputes.filter(d => d.status === 'closed').length },
  ]

  const REASON_LABELS = {
    item_not_received: 'Item not received',
    item_not_as_described: 'Item not as described',
    wrong_item: 'Wrong item delivered',
    damaged_item: 'Item arrived damaged',
    partial_delivery: 'Partial delivery',
    other: 'Other',
  }

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

        <div className="mb-6">
          <h1 className="font-display text-2xl font-black text-stone-900">Disputes</h1>
          <p className="text-stone-500 text-sm mt-0.5">{disputes.length} total disputes</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by buyer, product or supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 w-full max-w-md"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-6 w-fit overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Disputes List */}
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
                <AlertCircle className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">No disputes found.</p>
              </div>
            ) : (
              filtered.map(dispute => (
                <div
                  key={dispute.id}
                  onClick={() => {
                    setSelected(dispute)
                    setAdminNotes(dispute.admin_notes || '')
                    setResolution(dispute.resolution || '')
                  }}
                  className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-sm ${
                    selected?.id === dispute.id
                      ? 'border-copper-400 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-stone-800">
                        {dispute.orders?.products?.name}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Buyer: {dispute.orders?.buyer_name} ·
                        Supplier: {dispute.orders?.supplier_profiles?.business_name}
                      </p>
                    </div>
                    <StatusBadge status={dispute.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-lg">
                      {REASON_LABELS[dispute.reason] || dispute.reason}
                    </span>
                    <span className="text-xs text-stone-400">
                      {new Date(dispute.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Dispute Detail Panel */}
          <div>
            {selected ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-5 sticky top-24 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-900">Dispute Detail</h3>
                  <StatusBadge status={selected.status} />
                </div>

                {/* Order Info */}
                <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm">
                  <p className="font-semibold text-stone-800">{selected.orders?.products?.name}</p>
                  <p className="text-stone-500">K{parseFloat(selected.orders?.total_price || 0).toFixed(2)} · {selected.orders?.quantity} {selected.orders?.products?.unit}</p>
                  <Link to={`/orders/${selected.order_id}`} className="text-copper-600 text-xs font-medium hover:underline flex items-center gap-1">
                    <Eye className="w-3 h-3" /> View Order
                  </Link>
                </div>

                {/* Buyer Info */}
                <div className="text-sm space-y-1">
                  <p className="font-medium text-stone-700">Buyer</p>
                  <p className="text-stone-500">{selected.orders?.buyer_name}</p>
                  <p className="text-stone-500">{selected.orders?.buyer_phone}</p>
                  <p className="text-stone-500">{selected.orders?.buyer_location}</p>
                </div>

                {/* Dispute Reason */}
                <div className="text-sm space-y-1">
                  <p className="font-medium text-stone-700">Reason</p>
                  <p className="text-stone-500">{REASON_LABELS[selected.reason]}</p>
                  <p className="text-stone-600 bg-stone-50 rounded-lg p-3 text-xs leading-relaxed">
                    {selected.description}
                  </p>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="label">Admin Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Internal notes..."
                    className="input resize-none text-sm"
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                  />
                </div>

                {/* Resolution */}
                <div>
                  <label className="label">Resolution Message (sent to buyer)</label>
                  <textarea
                    rows={2}
                    placeholder="Explain the resolution..."
                    className="input resize-none text-sm"
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {selected.status === 'open' && (
                    <button
                      onClick={() => updateDispute(selected.id, 'under_review')}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 p-2.5 bg-yellow-50 border border-yellow-200 text-yellow-700 font-semibold rounded-xl hover:bg-yellow-100 transition-colors disabled:opacity-50 text-sm"
                    >
                      <Clock className="w-4 h-4" />
                      Mark Under Review
                    </button>
                  )}
                  {['open', 'under_review'].includes(selected.status) && (
                    <>
                      <button
                        onClick={() => updateDispute(selected.id, 'resolved_buyer')}
                        disabled={updating}
                        className="w-full flex items-center justify-center gap-2 p-2.5 bg-blue-50 border border-blue-200 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Resolve in Buyer's Favour
                      </button>
                      <button
                        onClick={() => updateDispute(selected.id, 'resolved_supplier')}
                        disabled={updating}
                        className="w-full flex items-center justify-center gap-2 p-2.5 bg-green-50 border border-green-200 text-green-700 font-semibold rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Resolve in Supplier's Favour
                      </button>
                      <button
                        onClick={() => updateDispute(selected.id, 'closed')}
                        disabled={updating}
                        className="w-full flex items-center justify-center gap-2 p-2.5 bg-stone-50 border border-stone-200 text-stone-600 font-semibold rounded-xl hover:bg-stone-100 transition-colors disabled:opacity-50 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Close Dispute
                      </button>
                    </>
                  )}
                  {['resolved_buyer', 'resolved_supplier', 'closed'].includes(selected.status) && (
                    <div className="text-center py-2 text-stone-400 text-sm">
                      This dispute has been {selected.status.replace('_', ' ')}.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center sticky top-24">
                <AlertCircle className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-400 text-sm">Select a dispute to review it</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}