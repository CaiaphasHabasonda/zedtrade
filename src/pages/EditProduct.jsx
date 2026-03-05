import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Package, ArrowLeft, AlertCircle, Upload, X, CheckCircle } from 'lucide-react'

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

const UNITS = ['item', 'kg', 'g', 'litre', 'ml', 'box', 'bag', 'crate', 'dozen', 'pack']

export default function EditProduct() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setError('Product not found.')
        setFetching(false)
        return
      }

      // Make sure only the owner can edit
      if (data.user_id !== user.id) {
        navigate('/dashboard')
        return
      }

      reset({
        name: data.name,
        category: data.category,
        price: data.price,
        unit: data.unit,
        stock_qty: data.stock_qty,
        min_order_qty: data.min_order_qty,
        description: data.description || '',
      })

      setImages(data.images || [])
      setFetching(false)
    }

    fetchProduct()
  }, [id])

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 4) {
      setError('Maximum 4 images allowed.')
      return
    }
    setUploading(true)
    setError(null)

    const uploaded = []
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be under 5MB.')
        continue
      }
      const ext = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)
        uploaded.push(publicUrl)
      }
    }
    setImages(prev => [...prev, ...uploaded])
    setUploading(false)
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('products')
      .update({
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        unit: data.unit,
        stock_qty: parseInt(data.stock_qty),
        min_order_qty: parseInt(data.min_order_qty),
        category: data.category,
        images: images,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate(`/products/${id}`), 1500)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
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
              <Package className="w-5 h-5 text-copper-500" />
            </div>
            <h1 className="font-display text-2xl font-black text-stone-900">
              Edit Product
            </h1>
          </div>
          <p className="text-stone-500 text-sm">Update your product details below.</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700 font-medium">Product updated! Redirecting...</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Product Name */}
            <div className="mb-5">
              <label className="label" htmlFor="name">Product Name</label>
              <input
                id="name"
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                {...register('name', { required: 'Please enter a product name' })}
              />
              {errors.name && <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.name.message}</p>}
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="label" htmlFor="category">Category</label>
              <select
                id="category"
                className={`input ${errors.category ? 'input-error' : ''}`}
                {...register('category', { required: 'Please select a category' })}
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.category.message}</p>}
            </div>

            {/* Price and Unit */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="label" htmlFor="price">Price (ZMW)</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`input ${errors.price ? 'input-error' : ''}`}
                  {...register('price', {
                    required: 'Please enter a price',
                    min: { value: 0.01, message: 'Price must be greater than 0' },
                  })}
                />
                {errors.price && <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.price.message}</p>}
              </div>
              <div>
                <label className="label" htmlFor="unit">Price Per</label>
                <select id="unit" className="input" {...register('unit')}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Stock and Min Order */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="label" htmlFor="stock_qty">Stock Available</label>
                <input
                  id="stock_qty"
                  type="number"
                  min="0"
                  className={`input ${errors.stock_qty ? 'input-error' : ''}`}
                  {...register('stock_qty', { required: 'Required' })}
                />
              </div>
              <div>
                <label className="label" htmlFor="min_order_qty">Minimum Order</label>
                <input
                  id="min_order_qty"
                  type="number"
                  min="1"
                  className={`input ${errors.min_order_qty ? 'input-error' : ''}`}
                  {...register('min_order_qty', { required: 'Required' })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
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

            {/* Images */}
            <div className="mb-8">
              <label className="label">
                Product Photos <span className="text-stone-400 font-normal">(up to 4)</span>
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {images.length < 4 && (
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-copper-300 bg-orange-50' : 'border-stone-300 hover:border-copper-400 hover:bg-orange-50'}`}>
                  <Upload className={`w-6 h-6 mb-2 ${uploading ? 'text-copper-400' : 'text-stone-400'}`} />
                  <span className="text-sm text-stone-500">{uploading ? 'Uploading...' : 'Click to upload photos'}</span>
                  <span className="text-xs text-stone-400 mt-1">PNG, JPG up to 5MB each</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Link to={`/products/${id}`} className="btn-secondary flex-1 text-center">Cancel</Link>
              <button
                type="submit"
                disabled={loading || uploading}
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