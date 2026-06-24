import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@shared/api'
import { useAuth } from '@shared/hooks/useAuth'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.register(form)
      await login(form.username, form.password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Błąd rejestracji')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-6 pt-12">
      <h1 className="text-2xl font-medium mb-1">Zarejestruj się</h1>
      <p className="text-sm text-[#9994b8] mb-8">Zapisuj i śledź swoje kalkulacje</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { key: 'username', label: 'Login', placeholder: 'tylko litery i cyfry' },
          { key: 'email', label: 'Email', placeholder: 'nazwa@domena.pl' },
          { key: 'password', label: 'Hasło', placeholder: 'min. 12 znaków' },
        ].map(({ key, label, placeholder }) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-xs text-[#9994b8]">{label}</span>
            <input
              type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
              value={form[key as keyof typeof form]}
              onChange={set(key as keyof typeof form)}
              placeholder={placeholder}
              className="bg-[#16213e] border border-[#2d2d4e] text-[#e8e6f0] px-4 py-3 rounded-xl text-sm" />
          </label>
        ))}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={loading}
          className="bg-[#7c3aed] text-white py-3 rounded-xl font-medium disabled:opacity-50 cursor-pointer">
          {loading ? 'Rejestracja...' : 'Zarejestruj się'}
        </button>
      </form>

      <p className="text-sm text-[#9994b8] text-center mt-6">
        Masz już konto?{' '}
        <Link to="/login" className="text-[#a78bfa]">Zaloguj się</Link>
      </p>
    </div>
  )
}
