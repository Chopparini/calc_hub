import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@shared/hooks/useAuth'
import Layout from './components/layout/Layout'
import CalculatorPage from './pages/CalculatorPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SavedPage from './pages/SavedPage'
import ProfilePage from './pages/ProfilePage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return null
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<CalculatorPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/saved" element={
          <PrivateRoute><SavedPage /></PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute><ProfilePage /></PrivateRoute>
        } />
      </Route>
    </Routes>
  )
}
