import { apiClient } from './client'
import type {
  AuthTokens, CalculateRequest, CalculateResult,
  SavedCalculation, UserProfile,
} from '../types'

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    apiClient.post<AuthTokens>('/auth/register', data),
  login: (username: string, password: string) =>
    apiClient.post<AuthTokens>('/auth/login', { username, password }),
  me: () => apiClient.get<UserProfile>('/auth/me'),
}

export const calculatorApi = {
  calculate: (data: CalculateRequest) =>
    apiClient.post<CalculateResult>('/calculator/calculate', data),
}

export const calculationsApi = {
  list: () => apiClient.get<SavedCalculation[]>('/calculations/'),
  save: (data: {
    contract_type: string
    tax_form?: string
    gross_income: number
    monthly_costs?: number
    name?: string
  }) => apiClient.post<SavedCalculation>('/calculations/', data),
  delete: (id: number) => apiClient.delete<void>(`/calculations/${id}`),
}

export const profileApi = {
  get: () => apiClient.get<UserProfile>('/profile/'),
  update: (data: Partial<UserProfile>) => apiClient.put<UserProfile>('/profile/', data),
}
