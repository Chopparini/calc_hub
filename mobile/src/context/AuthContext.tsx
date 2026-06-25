import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api'

interface AuthContextValue {
  token: string | null
  username: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'username']).then(([t, u]) => {
      if (t[1]) setToken(t[1])
      if (u[1]) setUsername(u[1])
      setLoading(false)
    })
  }, [])

  async function login(user: string, password: string) {
    const data = await authApi.login(user, password)
    await AsyncStorage.multiSet([['token', data.access_token], ['username', user]])
    setToken(data.access_token)
    setUsername(user)
  }

  async function register(user: string, email: string, password: string) {
    await authApi.register({ username: user, email, password })
    await login(user, password)
  }

  async function logout() {
    await AsyncStorage.multiRemove(['token', 'username'])
    setToken(null)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ token, username, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth poza AuthProvider')
  return ctx
}
