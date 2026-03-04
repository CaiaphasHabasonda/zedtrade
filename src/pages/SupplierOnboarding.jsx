import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Store, MapPin, Phone, Tag, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'

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
  'Lusaka',
  'Kitwe',
  'Ndola',
  'Livingstone',
  'Kabwe',
  'Chipata',
  'Solwezi',
  'Kasama',
  'Mongu',
  'Chingola',
  'Mufulira',
  'Luanshya',
  'Other',
]

export default function SupplierOnboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedCategories, setSelectedCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
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
      .insert({
        user_id: user.id,
        business_name: data.businessName,
        location: data.location,
        phone: data.phone,
        description: data.description || null,
        category: selectedCategories,
      })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-copper-50 border-2 border-copper-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-7 h-7 text-copper-500" />
          </div>
          <h1 className="font-display text-3xl font-black text-stone-900 mb-2">
            Set up your supplier profile
          </h1>
          <p className="text-stone-500">
            This is how buyers will find and trust your business on ZedTrade.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-copper-500 text-white text-xs font-bold flex items-center justify-center">1</div>
            <span className="text-sm font-medium text-copper-600">Account created</span>
          </div>
          <div className="w-8 h-px bg-stone-300" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-copper-500 text-white text-xs font-bold flex items-center justify-center">2</div>
            <span className="text-sm font-medium text-copper-600">Business profile</span>
          </div>
          <div className="w-8 h-px bg-stone-300" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-500 text-xs font-bold flex items-center justify-center">3</div>
            <span className="text-sm text-stone-400">List products</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Business Name */}
            <div className="mb-5">
              <label className="label" htmlFor="businessName">
                Business Name
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="businessName"
                  type="text"
                  placeholder="e.g. Mwape & Sons Traders"
                  className={`input pl-10 ${errors.businessName ? 'input-error' : ''}`}
                  {...register('businessName', {
                    required: 'Please enter your business name',
                    minLength: { value: 2, message: 'Must be at least 2 characters' },
                  })}
                />
              </div>
              {errors.businessName && (
                <p className="error-msg">
                  <AlertCircle className="w-3 h-3" />{errors.businessName.message}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="mb-5">
              <label className="label" htmlFor="location">
                Location (Town / City)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <select
                  id="location"
                  className={`input pl-10 ${errors.location ? 'input-error' : ''}`}
                  {...register('location', { required: 'Please select your location' })}
                >
                  <option value="">Select your town or city...</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              {errors.location && (
                <p className="error-msg">
                  <AlertCircle className="w-3 h-3" />{errors.location.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="mb-5">
              <label className="label" htmlFor="phone">
                Business Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 0977 123 456"
                  className={`input pl-10 ${errors.phone ? 'input-error' : ''}`}
                  {...register('phone', {
                    required: 'Please enter your phone number',
                    pattern: {
                      value: /^[0-9\s\+\-]{9,15}$/,
                      message: 'Please enter a valid phone number',
                    },
                  })}
                />
              </div>
              {errors.phone && (
                <p className="error-msg">
                  <AlertCircle className="w-3 h-3" />{errors.phone.message}
                </p>
              )}
            </div>

            {/* Categories */}
            <div className="mb-5">
              <label className="label">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  What do you sell? (select all that apply)
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
              {selectedCategories.length === 0 && error?.includes('category') && (
                <p className="error-msg mt-2">
                  <AlertCircle className="w-3 h-3" /> Please select at least one category
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="label" htmlFor="description">
                Business Description{' '}
                <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Tell buyers what makes your business special..."
                className="input resize-none"
                {...register('description')}
              />
            </div>

            {error && !error.includes('category') && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving profile...
                </>
              ) : (
                <>
                  Save and Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-stone-400 text-xs mt-4">
          You can update these details anytime from your dashboard.
        </p>
      </div>
    </div>
  )
}