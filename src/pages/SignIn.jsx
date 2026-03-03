import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  const { register, handleSubmit, formState: { errors } } = useForm()
  const from = location.state?.from?.pathname || '/dashboard'

  const onSubmit = async (data) => {
    setLoading(true)
    setAuthError(null)
    const { error } = await signIn({ email: data.email, password: data.password })
    setLoading(false)
    if (error) { setAuthError(error.message) } else { navigate(from, { replace: true }) }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><h1 className="font-display text-4xl font-black text-stone-900">Zed<span className="text-copper-500">Trade</span></h1></Link>
          <p className="text-stone-500 mt-1">Zambia's trading platform</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <h2 className="font-display text-2xl font-black text-stone-900 mb-1">Welcome back</h2>
          <p className="text-stone-500 text-sm mb-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-copper-600 font-semibold hover:text-copper-700">Sign up free</Link>
          </p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-4">
              <label className="label" htmlFor="email">Email Address</label>
              <input id="email" type="email" placeholder="you@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
                {...register('email', { required: 'Please enter your email' })} />
              {errors.email && <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.email.message}</p>}
            </div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <label className="label !mb-0" htmlFor="password">Password</label>
              </div>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Your password"
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', { required: 'Please enter your password' })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-msg"><AlertCircle className="w-3 h-3" />{errors.password.message}</p>}
            </div>
            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{authError}</p>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>) : (<>Sign In <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}