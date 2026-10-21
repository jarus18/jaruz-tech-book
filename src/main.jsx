import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
// Agar boshqa nomdagi CSS faylingiz bo'lsa, quyidagicha yozing (masalan: './App.css')
// Agar CSS shart bo'lmasa, pastdagi import qatorini o'chirib tashlashingiz mumkin:
import './App.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
