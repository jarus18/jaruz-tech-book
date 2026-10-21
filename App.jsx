import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import Shelf from './pages/Shelf'
import BookPage from './pages/BookPage'
import Reader from './pages/Reader'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import SetupNeeded from './pages/SetupNeeded'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBooks from './pages/admin/AdminBooks'
import BookForm from './pages/admin/BookForm'
import AdminGenres from './pages/admin/AdminGenres'
import AdminReviews from './pages/admin/AdminReviews'
import AdminReports from './pages/admin/AdminReports'
import { isConfigured } from './lib/supabase'
import { useAuth } from './context/AuthContext'

function Loading() {
  return <div className="center muted">Yuklanmoqda...</div>
}

// Faqat tizimga kirganlar uchun
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/kirish" replace state={{ from: location.pathname }} />
  return children
}

// Faqat admin uchun
function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/kirish" replace state={{ from: location.pathname }} />
  if (!isAdmin) {
    return (
      <div className="center">
        <h1>Ruxsat yo'q</h1>
        <p className="muted">Bu bo'lim faqat admin uchun.</p>
      </div>
    )
  }
  return children
}

// Eski havolalar (/book/:id) yangi manzilga yo'naltiriladi
function RedirectBook() {
  const { id } = useParams()
  return <Navigate to={`/kitob/${id}`} replace />
}

export default function App() {
  if (!isConfigured) return <SetupNeeded />

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="katalog" element={<Catalog />} />
        <Route path="kitob/:id" element={<BookPage />} />
        <Route path="kirish" element={<Login />} />
        <Route
          path="javonim"
          element={
            <RequireAuth>
              <Shelf />
            </RequireAuth>
          }
        />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="kitoblar" element={<AdminBooks />} />
          <Route path="kitoblar/yangi" element={<BookForm />} />
          <Route path="kitoblar/:id" element={<BookForm />} />
          <Route path="janrlar" element={<AdminGenres />} />
          <Route path="sharhlar" element={<AdminReviews />} />
          <Route path="shikoyatlar" element={<AdminReports />} />
        </Route>

        {/* Eski manzillar */}
        <Route path="login" element={<Navigate to="/kirish" replace />} />
        <Route path="shelf" element={<Navigate to="/javonim" replace />} />
        <Route path="book/:id" element={<RedirectBook />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/oqish/:id"
        element={
          <RequireAuth>
            <Reader />
          </RequireAuth>
        }
      />
    </Routes>
  )
}
