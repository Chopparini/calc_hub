import { apiClient } from './client'
import type {
  AuthTokens,
  CalculateRequest,
  CalculateResult,
  CompareRequest,
  CompareResult,
  SavedCalculation,
  UserProfile,
} from '../types'

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    apiClient.post<AuthTokens>('/auth/register', data),

  login: (username: string, password: string) =>
    apiClient.post<AuthTokens>('/auth/login', { username, password }),

  me: () =>
    apiClient.get<UserProfile>('/auth/me'),
}

export const calculatorApi = {
  calculate: (data: CalculateRequest) =>
    apiClient.post<CalculateResult>('/calculator/calculate', data),

  compare: (data: CompareRequest) =>
    apiClient.post<CompareResult>('/calculator/compare', data),
}

export const calculationsApi = {
  list: () =>
    apiClient.get<SavedCalculation[]>('/calculations/'),

  save: (data: {
    contract_type: string
    tax_form?: string
    zus_variant?: string
    gross_income: number
    monthly_costs?: number
    name?: string
  }) => apiClient.post<SavedCalculation>('/calculations/', data),

  delete: (id: number) =>
    apiClient.delete<void>(`/calculations/${id}`),
}

export const profileApi = {
  get: () =>
    apiClient.get<UserProfile>('/profile/').then(p => ({
      ...p,
      default_lump_sum_rate: p.default_lump_sum_rate !== null ? Number(p.default_lump_sum_rate) : null,
    })),

  update: (data: Partial<UserProfile>) =>
    apiClient.put<UserProfile>('/profile/', data),
}
