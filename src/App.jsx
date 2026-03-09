import EditProduct from './pages/EditProduct'
import ProductDetail from './pages/ProductDetail'
import AddProduct from './pages/AddProduct'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import SupplierOnboarding from './pages/SupplierOnboarding'
import EditProfile from './pages/EditProfile'
import PlaceOrder from './pages/PlaceOrder'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Browse from './pages/Browse'
import SupplierProfile from './pages/SupplierProfile'
import PaymentCallback from './pages/PaymentCallback'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRoute from './components/AdminRoute'
import AdminSuppliers from './pages/admin/AdminSuppliers'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminDisputes from './pages/admin/AdminDisputes'
import Inbox from './pages/Inbox'


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/signin" state={{ from: location }} replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-copper-500 rounded-full animate-spin" />
      </div>
    )
  }
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function Home() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-5xl font-black text-stone-900 mb-3">
          Zed<span className="text-copper-500">Trade</span>
        </h1>
        <p className="text-stone-500 text-lg mb-8">Zambia's trusted trading platform 🇿🇲</p>
        <div className="flex gap-3 justify-center">
          {user ? (
            <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
          ) : (
            <>
              <a href="/signup" className="btn-primary">Get Started Free</a>
              <a href="/signin" className="btn-secondary">Sign In</a>
            </>
          )}
        </div>
        <div className="mt-10 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-stone-200">
            <div className="text-2xl mb-1">🌿</div>
            <div className="text-xs font-semibold text-stone-700">For Suppliers</div>
            <div className="text-xs text-stone-400 mt-1">List and sell products</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-stone-200">
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-xs font-semibold text-stone-700">Secure Payments</div>
            <div className="text-xs text-stone-400 mt-1">MoMo escrow system</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-stone-200">
            <div className="text-2xl mb-1">🛍️</div>
            <div className="text-xs font-semibold text-stone-700">For Buyers</div>
            <div className="text-xs text-stone-400 mt-1">Browse and order</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
            <Route path="/signin" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><SupplierOnboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/products/new" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="/products/:id/edit" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
            <Route path="/products/:id/order" element={<ProtectedRoute><PlaceOrder /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
            <Route path="/suppliers/:id" element={<ProtectedRoute><SupplierProfile /></ProtectedRoute>} />
            <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/suppliers" element={<AdminRoute><AdminSuppliers /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
           <Route path="/admin/disputes" element={<AdminRoute><AdminDisputes /></AdminRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}