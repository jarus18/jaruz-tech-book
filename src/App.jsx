import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import Shelf from './pages/Shelf'
import BookPage from './pages/BookPage'
import Reader from './pages/Reader'
import Login from './pages/Login'
import Admin from './pages/admin/admin'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="katalog" element={<Catalog />} />
        <Route path="shelf" element={<Shelf />} />
        <Route path="book/:id" element={<BookPage />} />
        <Route path="login" element={<Login />} />
        <Route path="kirish" element={<Login />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="/oqish/:id" element={<Reader />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
