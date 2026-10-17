import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import BookPage from './pages/BookPage'
const Reader = lazy(() => import('./pages/Reader'))
import Shelf from './pages/Shelf'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminBooks = lazy(() => import('./pages/admin/AdminBooks'))
const BookForm = lazy(() => import('./pages/admin/BookForm'))
const AdminGenres = lazy(() => import('./pages/admin/AdminGenres'))
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))

function RequireAuth({ children, admin = false }) {
  const { user, profile, isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading || (admin && user && !profile)) return <div className="center muted">Yuklanmoqda...</div>
  if (!user) return <Navigate to="/kirish" replace state={{ from: location.pathname }} />
  if (admin && !isAdmin) return <div className="center">Bu sahifa faqat admin uchun.</div>
  return children
}

export default function App() {
  return (
    <Suspense fallback={<div className="center muted">Yuklanmoqda...</div>}>
    <Routes>
      <Route path="/oqish/:id" element={<RequireAuth><Reader /></RequireAuth>} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="katalog" element={<Catalog />} />
        <Route path="kitob/:id" element={<BookPage />} />
        <Route path="javonim" element={<RequireAuth><Shelf /></RequireAuth>} />
        <Route path="kirish" element={<Login />} />
        <Route path="admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
          <Route index element={<AdminDashboard />} />
          <Route path="kitoblar" element={<AdminBooks />} />
          <Route path="kitoblar/yangi" element={<BookForm />} />
          <Route path="kitoblar/:id" element={<BookForm />} />
          <Route path="janrlar" element={<AdminGenres />} />
          <Route path="sharhlar" element={<AdminReviews />} />
          <Route path="shikoyatlar" element={<AdminReports />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
  )
}
