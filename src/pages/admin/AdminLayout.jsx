import { NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <>
      <h1>Admin panel</h1>
      <div className="tabs">
        <NavLink end to="/admin" className="tab">Statistika</NavLink>
        <NavLink to="/admin/kitoblar" className="tab">Kitoblar</NavLink>
        <NavLink to="/admin/janrlar" className="tab">Janrlar</NavLink>
        <NavLink to="/admin/sharhlar" className="tab">Sharhlar</NavLink>
        <NavLink to="/admin/shikoyatlar" className="tab">Shikoyatlar</NavLink>
      </div>
      <Outlet />
    </>
  )
}
