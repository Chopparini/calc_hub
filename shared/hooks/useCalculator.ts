import { useState } from 'react'
import { calculatorApi } from '../api'
import type { CalculateRequest, CalculateResult, CompareRequest, CompareResult } from '../types'

export function useCalculator() {
  const [result, setResult] = useState<CalculateResult | null>(null)
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = async (data: CalculateRequest) => {
    setLoading(true)
    setError(null)
    try {
      const res = await calculatorApi.calculate(data)
      setResult(res)
    } catch {
      setError('Błąd obliczenia. Sprawdź dane i spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  const compare = async (data: CompareRequest) => {
    setLoading(true)
    setError(null)
    try {
      const res = await calculatorApi.compare(data)
      setCompareResult(res)
    } catch {
      setError('Błąd porównania. Sprawdź dane i spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setResult(null); setCompareResult(null); setError(null) }

  return { result, compareResult, loading, error, calculate, compare, reset }
}
