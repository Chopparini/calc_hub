import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@shared/hooks/useAuth'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('Nieprawidłowy login lub hasło')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-6 pt-12">
      <h1 className="text-2xl font-medium mb-1">Zaloguj się</h1>
      <p className="text-sm text-[#9994b8] mb-8">Wróć do swoich kalkulacji</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[#9994b8]">Login</span>
          <input value={username} onChange={e => setUsername(e.target.value)}
            className="bg-[#16213e] border border-[#2d2d4e] text-[#e8e6f0] px-4 py-3 rounded-xl text-sm"
            placeholder="twój login" autoComplete="username" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[#9994b8]">Hasło</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="bg-[#16213e] border border-[#2d2d4e] text-[#e8e6f0] px-4 py-3 rounded-xl text-sm"
            placeholder="••••••••••••" autoComplete="current-password" />
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={loading}
          className="bg-[#7c3aed] text-white py-3 rounded-xl font-medium disabled:opacity-50 cursor-pointer">
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </button>
      </form>

      <p className="text-sm text-[#9994b8] text-center mt-6">
        Nie masz konta?{' '}
        <Link to="/register" className="text-[#a78bfa]">Zarejestruj się</Link>
      </p>
    </div>
  )
}
