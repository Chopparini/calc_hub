import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api'
import type { UserProfile } from '../types'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    authApi.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const tokens = await authApi.login(username, password)
    localStorage.setItem('token', tokens.access_token)
    const me = await authApi.me()
    setUser(me)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth musi być użyty wewnątrz AuthProvider')
  return ctx
}
