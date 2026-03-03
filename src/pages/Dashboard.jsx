import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const role = user?.user_metadata?.role
  const name = user?.user_metadata?.full_name

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">{role === 'supplier' ? '🏪' : '🛍️'}</div>
        <h2 className="font-display text-2xl font-black text-stone-900 mb-1">Welcome, {name}!</h2>
        <p className="text-stone-500 mb-2">
          You are signed in as a <span className="font-semibold text-copper-600 capitalize">{role}</span>
        </p>
        <p className="text-stone-400 text-sm mb-6">{user?.email}</p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-green-700 text-sm font-semibold mb-1">Auth is working!</p>
          <p className="text-green-600 text-xs">Session active. Protected routes working correctly.</p>
        </div>
        <button onClick={handleSignOut} className="btn-secondary w-full">Sign Out</button>
      </div>
    </div>
  )
}