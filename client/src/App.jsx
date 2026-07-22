import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PageLayout from './components/PageLayout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Vendors from './pages/Vendors'
import Shipping from './pages/Shipping'
import Accounts from './pages/Accounts'
import Reports from './pages/Reports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
