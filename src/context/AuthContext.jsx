import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supplierProfile, setSupplierProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const fetchSupplierProfile = async (userId) => {
    setProfileLoading(true)
    const { data } = await supabase
      .from('supplier_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    setSupplierProfile(data || null)
    setProfileLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.user_metadata?.role === 'supplier') {
        fetchSupplierProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user?.user_metadata?.role === 'supplier') {
          fetchSupplierProfile(session.user.id)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({ email, password, fullName, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role: role } },
    })
    return { data, error }
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    setSupplierProfile(null)
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const refreshProfile = () => {
    if (user?.user_metadata?.role === 'supplier') {
      fetchSupplierProfile(user.id)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      supplierProfile,
      profileLoading,
      refreshProfile,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}