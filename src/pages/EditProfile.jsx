import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Store, MapPin, Phone, Tag, AlertCircle, CheckCircle } from 'lucide-react'

const CATEGORIES = [
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
  'Lusaka', 'Kitwe', 'Ndola', 'Livingstone', 'Kabwe',
  'Chipata', 'Solwezi', 'Kasama', 'Mongu', 'Chingola',
  'Mufulira', 'Luanshya', 'Other',
]

export default function EditProfile() {
  const { user, supplierProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [selectedCategories, setSelectedCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  useEffect(() => {
    if (supplierProfile) {
      reset({
        businessName: supplierProfile.business_name,
        location: supplierProfile.location,
        phone: supplierProfile.phone,
        description: supplierProfile.description || '',
      })
      setSelectedCategories(supplierProfile.category || [])
    }
  }, [supplierProfile])

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const onSubmit = async (data) => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one category.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('supplier_profiles')
      .update({
        business_name: data.businessName,
        location: data.location,
        phone: data.phone,
        description: data.description || null,
        category: selectedCategories,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      refreshProfile()
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 text-stone-500 hover:text-stone-700">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
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
              <Store className="w-5 h-5 text-copper-500" />
            </div>
            <h1 className="font-display text-2xl font-black text-stone-900">
              Edit Business Profile
            </h1>
          </div>
          <p className="text-stone-500 text-sm">Update your business details below.</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700 font-medium">Profile updated! Redirecting to dashboard...</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Business Name */}
            <div className="mb-5">
              <label className="label" htmlFor="businessName">Business Name</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="businessName"
                  type="text"
                  className={`input pl-10 ${errors.businessName ? 'input-error' : ''}`}
                  {...register('businessName', { required: 'Please enter your business name' })}
                />
              </div>
              {errors.businessName && <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.businessName.message}</p>}
            </div>

            {/* Location */}
            <div className="mb-5">
              <label className="label" htmlFor="location">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <select
                  id="location"
                  className={`input pl-10 ${errors.location ? 'input-error' : ''}`}
                  {...register('location', { required: 'Please select your location' })}
                >
                  <option value="">Select location...</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              {errors.location && <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.location.message}</p>}
            </div>

            {/* Phone */}
            <div className="mb-5">
              <label className="label" htmlFor="phone">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="phone"
                  type="tel"
                  className={`input pl-10 ${errors.phone ? 'input-error' : ''}`}
                  {...register('phone', { required: 'Please enter your phone number' })}
                />
              </div>
              {errors.phone && <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.phone.message}</p>}
            </div>

            {/* Categories */}
            <div className="mb-5">
              <label className="label">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  What do you sell?
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-all duration-150 flex items-center gap-2 ${
                      selectedCategories.includes(cat)
                        ? 'border-copper-500 bg-orange-50 text-copper-700 font-medium'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {selectedCategories.includes(cat) && (
                      <CheckCircle className="w-3.5 h-3.5 text-copper-500 flex-shrink-0" />
                    )}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="label" htmlFor="description">
                Description <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                className="input resize-none"
                {...register('description')}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Link to="/dashboard" className="btn-secondary flex-1 text-center">Cancel</Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}