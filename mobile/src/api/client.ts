import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

// Automatycznie wykrywa IP hosta dev serwera Expo — działa na fizycznym urządzeniu i emulatorze
const hostUri = Constants.expoConfig?.hostUri
const host = hostUri ? hostUri.split(':')[0] : 'localhost'
export const API_BASE_URL = `http://${host}:8000`

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('token')
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    await AsyncStorage.removeItem('token')
    throw { response: { status: 401 } }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw { response: { status: res.status, data: err } }
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const apiClient = {
  get:    <T>(path: string)               => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown) => request<T>('PUT',    path, body),
  delete: <T>(path: string)               => request<T>('DELETE', path),
}
