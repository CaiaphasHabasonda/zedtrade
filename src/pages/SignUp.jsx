import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Store, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react'

export default function SignUp() {
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    if (!selectedRole) {
      setAuthError('Please select whether you are a Supplier or Buyer.')
      return
    }
    setLoading(true)
    setAuthError(null)
    const { error } = await signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: selectedRole,
    })
    setLoading(false)
    if (error) {
      setAuthError(error.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="font-display text-2xl font-black text-stone-900 mb-2">
            Check your email!
          </h2>
          <p className="text-stone-500 mb-6 leading-relaxed">
            We sent a confirmation link to your email. Click it to activate
            your account, then come back to sign in.
          </p>
          <Link to="/signin" className="btn-primary inline-block">
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="font-display text-4xl font-black text-stone-900">
              Zed<span className="text-copper-500">Trade</span>
            </h1>
          </Link>
          <p className="text-stone-500 mt-1">Zambia's trading platform</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <h2 className="font-display text-2xl font-black text-stone-900 mb-1">
            Create your account
          </h2>
          <p className="text-stone-500 text-sm mb-6">
            Already have an account?{' '}
            <Link to="/signin" className="text-copper-600 font-semibold hover:text-copper-700">
              Sign in
            </Link>
          </p>

          <div className="mb-6">
            <label className="label">I want to...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('supplier')}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedRole === 'supplier'
                    ? 'border-copper-500 bg-orange-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <Store className={`w-6 h-6 mb-2 ${
                  selectedRole === 'supplier' ? 'text-copper-500' : 'text-stone-400'
                }`} />
                <div className={`font-bold text-sm ${
                  selectedRole === 'supplier' ? 'text-copper-700' : 'text-stone-700'
                }`}>
                  Sell Products
                </div>
                <div className="text-xs text-stone-500 mt-0.5">I am a supplier</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('buyer')}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedRole === 'buyer'
                    ? 'border-copper-500 bg-orange-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <ShoppingBag className={`w-6 h-6 mb-2 ${
                  selectedRole === 'buyer' ? 'text-copper-500' : 'text-stone-400'
                }`} />
                <div className={`font-bold text-sm ${
                  selectedRole === 'buyer' ? 'text-copper-700' : 'text-stone-700'
                }`}>
                  Buy Products
                </div>
                <div className="text-xs text-stone-500 mt-0.5">I am a buyer</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-4">
              <label className="label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="e.g. Chanda Mwila"
                className={`input ${errors.fullName ? 'input-error' : ''}`}
                {...register('fullName', {
                  required: 'Please enter your full name',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
              />
              {errors.fullName && (
                <p className="error-msg">
                  <AlertCircle className="w-3 h-3" />
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
                {...register('email', {
                  required: 'Please enter your email',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="error-msg">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', {
                    required: 'Please enter a password',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="error-msg">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{authError}</p>
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-stone-400 text-xs mt-6">
          By signing up you agree to our Terms of Service.
        </p>
      </div>
    </div>
  )
}
