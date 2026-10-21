import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="center">
      <h1>Sahifa topilmadi</h1>
      <Link to="/">Bosh sahifaga qaytish</Link>
    </div>
  )
}
