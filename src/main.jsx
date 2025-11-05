import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LitecoinApp from './LitecoinApp.jsx'
import MixedPool from './MixedPool.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/uifhiusdhfui">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/litecoin" element={<LitecoinApp />} />
        <Route path="/mixed" element={<MixedPool />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
