import { useEffect, useState } from 'react'
import { calculationsApi } from '@shared/api'
import type { SavedCalculation } from '@shared/types'

function fmt(n: number) {
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function SavedPage() {
  const [items, setItems] = useState<SavedCalculation[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    calculationsApi.list()
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: number) => {
    await calculationsApi.delete(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  if (loading) return <div className="px-6 pt-12 text-[#9994b8] text-sm">Ładowanie...</div>

  return (
    <div className="px-6 pt-8">
      <h1 className="text-2xl font-medium mb-1">Zapisane kalkulacje</h1>
      <p className="text-sm text-[#9994b8] mb-6">Twoja historia obliczeń</p>

      {items.length === 0 ? (
        <div className="bg-[#16213e] border border-[#2d2d4e] rounded-xl p-8 text-center">
          <p className="text-[#9994b8] text-sm">Brak zapisanych kalkulacji</p>
          <p className="text-xs text-[#9994b8] mt-1">Oblicz coś i kliknij „Zapisz kalkulację"</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => {
            const result = JSON.parse(item.result_json)
            return (
              <div key={item.id} className="bg-[#16213e] border border-[#2d2d4e] rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-medium">{item.name || 'Kalkulacja'}</p>
                    <p className="text-xs text-[#9994b8] mt-0.5">
                      {item.contract_type === 'b2b' ? 'JDG / B2B' : 'Umowa o pracę'} ·{' '}
                      {new Date(item.created_at).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(item.id)}
                    className="text-[#9994b8] text-xs hover:text-red-400 cursor-pointer">
                    Usuń
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-[#9994b8]">Brutto</p>
                    <p className="text-sm font-medium">{fmt(+item.gross_income)} zł</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9994b8]">Netto</p>
                    <p className="text-sm font-medium text-[#a78bfa]">{fmt(+result.net_monthly)} zł</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9994b8]">Podatek</p>
                    <p className="text-sm font-medium text-[#fbbf24]">{fmt(+result.income_tax)} zł</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
