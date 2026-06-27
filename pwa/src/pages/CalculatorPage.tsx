import { useState, useEffect } from 'react'
import { useCalculator } from '@shared/hooks/useCalculator'
import type { TaxForm, ZUSVariant, CalculateResult } from '@shared/types'
import { calculationsApi, profileApi, calculatorApi } from '@shared/api'
import { useAuth } from '@shared/hooks/useAuth'
import { MINIMALNE_WYNAGRODZENIE } from '@shared/constants/tax'

type Tab = 'b2b' | 'uop'

const LUMP_SUM_RATES = [
  { label: '2% (handel)', value: 0.02 },
  { label: '3% (działalność handlowa)', value: 0.03 },
  { label: '5,5% (produkcja)', value: 0.055 },
  { label: '8,5% (usługi)', value: 0.085 },
  { label: '10% (świadczenie usług)', value: 0.10 },
  { label: '12% (IT / programowanie)', value: 0.12 },
  { label: '12,5% (najem powyżej 100 tys.)', value: 0.125 },
  { label: '14% (usługi medyczne)', value: 0.14 },
  { label: '15% (usługi finansowe)', value: 0.15 },
  { label: '17% (wolne zawody)', value: 0.17 },
]

function fmt(n: number) {
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parse(v: string): number {
  return parseFloat(v.replace(',', '.')) || 0
}

function sanitizeDecimalInput(v: string): string {
  let s = v.replace(/\./g, ',').replace(/[^0-9,]/g, '')
  const i = s.indexOf(',')
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/,/g, '')
  return s
}

export default function CalculatorPage() {
  const [tab, setTab] = useState<Tab>('b2b')
  const { result, loading, error, calculate, reset } = useCalculator()
  const { isLoggedIn } = useAuth()
  const [saved, setSaved] = useState(false)

  // B2B fields
  const [income, setIncome] = useState('')
  const [costs, setCosts] = useState('')
  const [taxForm, setTaxForm] = useState<TaxForm>('linear')
  const [lumpSumRate, setLumpSumRate] = useState(0.12)
  const [vatRate, setVatRate] = useState('23')
  const [zusVariant, setZusVariant] = useState<ZUSVariant>('full')
  const [zChorobowa, setZChorobowa] = useState(false)

  // UoP fields
  const [uopIncome, setUopIncome] = useState('')

  // B2B comparison (z kosztu pracodawcy UoP)
  const [b2bCompare, setB2bCompare] = useState<{
    linear: CalculateResult
    scale: CalculateResult
    lump_sum: CalculateResult
  } | null>(null)
  const [b2bCompareLoading, setB2bCompareLoading] = useState(false)

  // Prefill z profilu po zalogowaniu
  useEffect(() => {
    if (!isLoggedIn) return
    profileApi.get().then(p => {
      if (p.default_contract_type) setTab(p.default_contract_type === 'employment' ? 'uop' : 'b2b')
      if (p.default_tax_form) setTaxForm(p.default_tax_form)
      if (p.default_lump_sum_rate) setLumpSumRate(p.default_lump_sum_rate)
      if (p.default_zus_variant) setZusVariant(p.default_zus_variant)
      if (p.default_z_chorobowa !== null) setZChorobowa(p.default_z_chorobowa ?? true)
      if (p.default_vat_rate) setVatRate(p.default_vat_rate)
      if (p.default_uop_gross) setUopIncome(String(p.default_uop_gross).replace('.', ','))
    }).catch(() => {})
  }, [isLoggedIn])

  const handleB2BCompare = async (kostPracodawcy: number) => {
    setB2bCompareLoading(true)
    const base = { contract_type: 'b2b' as const, gross_income: kostPracodawcy, monthly_costs: 0, zus_variant: 'full' as const, z_chorobowa: false, vat_rate: '23' }
    const [linear, scale, lump_sum] = await Promise.all([
      calculatorApi.calculate({ ...base, tax_form: 'linear' }),
      calculatorApi.calculate({ ...base, tax_form: 'scale' }),
      calculatorApi.calculate({ ...base, tax_form: 'lump_sum', lump_sum_rate: 0.12 }),
    ])
    setB2bCompare({ linear, scale, lump_sum })
    setB2bCompareLoading(false)
  }

  const handleCalculate = () => {
    setSaved(false)
    setB2bCompare(null)
    if (tab === 'b2b') {
      calculate({ contract_type: 'b2b', gross_income: parse(income), monthly_costs: parse(costs),
        tax_form: taxForm, lump_sum_rate: lumpSumRate, zus_variant: zusVariant, z_chorobowa: zChorobowa, vat_rate: vatRate })
    } else {
      calculate({ contract_type: 'employment', gross_income: parse(uopIncome) })
    }
  }

  const handleSave = async () => {
    if (!result) return
    await calculationsApi.save({
      contract_type: tab === 'uop' ? 'employment' : 'b2b',
      tax_form: tab === 'b2b' ? taxForm : undefined,
      zus_variant: tab === 'b2b' ? zusVariant : undefined,
      gross_income: tab === 'uop' ? parse(uopIncome) : parse(income),
      monthly_costs: tab === 'b2b' ? parse(costs) : undefined,
    })
    setSaved(true)
  }

  const currentResult = result
  const showResult = !!currentResult

  return (
    <div>
      <div className="px-6 pt-8 pb-6 text-center">
        <h1 className="text-2xl font-medium mb-2">Ile zarobisz na rękę?</h1>
        <p className="text-sm text-[#9994b8]">Oblicz i porównaj JDG i umowę o pracę</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#16213e] rounded-xl p-1 mx-6 mb-5">
        {(['b2b', 'uop'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); reset(); setSaved(false); setB2bCompare(null) }}
            className={`flex-1 py-2 text-xs rounded-lg font-medium transition-colors cursor-pointer
              ${tab === t ? 'bg-[#7c3aed] text-white' : 'text-[#9994b8]'}`}>
            {t === 'b2b' ? 'JDG / B2B' : 'Umowa o pracę'}
          </button>
        ))}
      </div>

      {/* Formularz */}
      <div className="bg-[#16213e] border border-[#2d2d4e] rounded-xl p-5 mx-6 mb-4">
        <p className="text-xs text-[#9994b8] font-medium tracking-wide mb-4">
          {tab === 'b2b' ? 'PARAMETRY JDG' : 'PARAMETRY UoP'}
        </p>

        {tab === 'b2b' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[#9994b8]">Miesięczna suma netto z faktur (zł)</span>
                <input type="text" inputMode="decimal" value={income} onChange={e => setIncome(sanitizeDecimalInput(e.target.value))}
                  placeholder="np. 15000"
                  className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[#9994b8]">Koszty uzyskania netto (zł)</span>
                <input type="text" inputMode="decimal" value={costs} onChange={e => setCosts(sanitizeDecimalInput(e.target.value))}
                  placeholder="np. 2000"
                  className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm" />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[#9994b8]">Forma opodatkowania</span>
                <select value={taxForm} onChange={e => setTaxForm(e.target.value as TaxForm)}
                  className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm">
                  <option value="linear">Podatek liniowy (19%)</option>
                  <option value="scale">Skala podatkowa (12%/32%)</option>
                  <option value="lump_sum">Ryczałt</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[#9994b8]">Składki ZUS</span>
                <select value={zusVariant} onChange={e => setZusVariant(e.target.value as ZUSVariant)}
                  className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm">
                  <option value="full">Pełny ZUS</option>
                  <option value="preferential">Mały ZUS (preferencyjna)</option>
                  <option value="ulga_na_start">Ulga na start</option>
                </select>
              </label>
            </div>
            {taxForm === 'lump_sum' && (
              <label className="flex flex-col gap-1 mb-3">
                <span className="text-xs text-[#9994b8]">Stawka ryczałtu</span>
                <select value={lumpSumRate} onChange={e => setLumpSumRate(+e.target.value)}
                  className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm">
                  {LUMP_SUM_RATES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1 mb-3">
              <span className="text-xs text-[#9994b8]">Stawka VAT</span>
              <select value={vatRate} onChange={e => setVatRate(e.target.value)}
                className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm">
                <option value="23">23% (podstawowa)</option>
                <option value="8">8% (obniżona)</option>
                <option value="5">5% (obniżona)</option>
                <option value="0">0%</option>
                <option value="zw">ZW (zwolniony)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-[#9994b8] mb-1">
              <input type="checkbox" checked={zChorobowa} onChange={e => setZChorobowa(e.target.checked)}
                className="accent-[#7c3aed]" />
              Dobrowolna składka chorobowa
            </label>
          </>
        )}

        {tab === 'uop' && (
          <>
            {(() => {
              const invalid = !!uopIncome && parse(uopIncome) < MINIMALNE_WYNAGRODZENIE
              return (
                <>
                  <label className="flex flex-col gap-1 mb-1">
                    <span className="text-xs text-[#9994b8]">Wynagrodzenie brutto (zł)</span>
                    <input type="text" inputMode="decimal" value={uopIncome} onChange={e => setUopIncome(sanitizeDecimalInput(e.target.value))}
                      placeholder="np. 10000"
                      className={`bg-[#0f0f23] border text-[#e8e6f0] px-3 py-2 rounded-lg text-sm ${invalid ? 'border-[#f87171]' : 'border-[#2d2d4e]'}`} />
                  </label>
                  {invalid
                    ? <p className="text-xs text-[#f87171] mb-3">Minimalne wynagrodzenie w 2026 r. to {MINIMALNE_WYNAGRODZENIE} zł brutto</p>
                    : <div className="mb-3" />
                  }
                </>
              )
            })()}
          </>
        )}

        <button onClick={handleCalculate} disabled={loading || (tab === 'uop' && (!uopIncome || parse(uopIncome) < MINIMALNE_WYNAGRODZENIE))}
          className="w-full bg-[#7c3aed] text-white py-3 rounded-lg text-sm font-medium mt-3 disabled:opacity-50 cursor-pointer">
          {loading ? 'Obliczam...' : '⊞ Oblicz'}
        </button>

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        {/* Wyniki B2B / UoP */}
        {showResult && currentResult && (
          <div className="bg-[#0f0f23] border border-[#2d2d4e] rounded-xl p-4 mt-4">
            <p className="text-xs text-[#9994b8] mb-3">WYNIK KALKULACJI</p>
            <div className="bg-[#2d1b69] border border-[#7c3aed] rounded-xl p-4 text-center mb-4">
              <p className="text-xs text-[#c4b5fd] mb-1">Netto miesięcznie</p>
              <p className="text-4xl font-medium text-[#a78bfa]">{fmt(+currentResult.net_monthly)} zł</p>
            </div>

            {tab === 'b2b' ? (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#16213e] rounded-lg p-3">
                  <p className="text-xs text-[#9994b8] mb-1">Podatek</p>
                  <p className="text-base font-medium text-[#fbbf24] whitespace-nowrap">{fmt(+currentResult.income_tax)} zł</p>
                </div>
                <div className="bg-[#16213e] rounded-lg p-3">
                  <p className="text-xs text-[#9994b8] mb-1">ZUS społeczny</p>
                  <p className="text-base font-medium text-[#fbbf24] whitespace-nowrap">{fmt(+currentResult.zus_social)} zł</p>
                </div>
                <div className="bg-[#16213e] rounded-lg p-3">
                  <p className="text-xs text-[#9994b8] mb-1">Zdrowotna</p>
                  <p className="text-base font-medium text-[#fbbf24] whitespace-nowrap">{fmt(+currentResult.health_insurance)} zł</p>
                </div>
                <div className="bg-[#16213e] rounded-lg p-3">
                  <p className="text-xs text-[#9994b8] mb-1">VAT należny</p>
                  <p className="text-base font-medium text-[#f87171] whitespace-nowrap">{fmt(+(currentResult.vat_monthly ?? 0))} zł</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:grid md:grid-cols-3 gap-2 mb-3">
                <div className="bg-[#16213e] rounded-lg p-3 flex justify-between items-center md:flex-col md:items-start md:justify-between md:h-full">
                  <p className="text-xs text-[#9994b8] md:mb-1">Podatek</p>
                  <p className="text-sm sm:text-base font-medium text-[#fbbf24] whitespace-nowrap">{fmt(+currentResult.income_tax)} zł</p>
                </div>
                <div className="bg-[#16213e] rounded-lg p-3 flex justify-between items-center md:flex-col md:items-start md:justify-between md:h-full">
                  <p className="text-xs text-[#9994b8] md:mb-1">ZUS</p>
                  <p className="text-sm sm:text-base font-medium text-[#fbbf24] whitespace-nowrap">{fmt(+currentResult.zus_social)} zł</p>
                </div>
                <div className="bg-[#16213e] rounded-lg p-3 flex justify-between items-center md:flex-col md:items-start md:justify-between md:h-full">
                  <p className="text-xs text-[#9994b8] md:mb-1">Zdrowotna</p>
                  <p className="text-sm sm:text-base font-medium text-[#fbbf24] whitespace-nowrap">{fmt(+currentResult.health_insurance)} zł</p>
                </div>
              </div>
            )}

            {tab === 'uop' && currentResult.koszt_pracodawcy && (
              <div className="bg-[#16213e] rounded-lg p-3 mb-3">
                <p className="text-xs text-[#9994b8] mb-1">Całkowity koszt pracodawcy</p>
                <p className="text-base font-medium text-[#e8e6f0]">{fmt(+currentResult.koszt_pracodawcy)} zł</p>
              </div>
            )}
            {isLoggedIn && (
              <button onClick={handleSave} disabled={saved}
                className="w-full border border-[#7c3aed] text-[#a78bfa] py-2.5 rounded-lg text-sm cursor-pointer disabled:opacity-50 mb-2">
                {saved ? '✓ Zapisano' : '☆ Zapisz kalkulację'}
              </button>
            )}
            {tab === 'uop' && currentResult.koszt_pracodawcy && (
              <>
                <button
                  onClick={() => handleB2BCompare(+currentResult.koszt_pracodawcy!)}
                  disabled={b2bCompareLoading}
                  className="w-full border border-[#7c3aed] text-[#a78bfa] py-2.5 rounded-lg text-sm cursor-pointer disabled:opacity-50">
                  {b2bCompareLoading ? 'Obliczam...' : 'Szukasz pracy w IT? Porównaj z B2B'}
                </button>
                {b2bCompare && (
                  <div className="bg-[#16213e] border border-[#7c3aed] rounded-xl p-4 mt-3">
                    <p className="text-xs text-[#9994b8] mb-1">GDYBYŚ BYŁ/A NA B2B</p>
                    <p className="text-xs text-[#9994b8] mb-3">
                      Pracodawca płaci {fmt(+currentResult.koszt_pracodawcy)} zł = kwota faktury netto. Pełny ZUS, bez chorobowej, VAT 23%.
                    </p>
                    <div className="flex flex-col gap-2">
                      {([
                        { key: 'linear', label: 'Liniowy 19%' },
                        { key: 'scale', label: 'Skala 12/32%' },
                        { key: 'lump_sum', label: 'Ryczałt 12% (IT)' },
                      ] as const).map(({ key, label }) => {
                        const r = b2bCompare[key]
                        const diff = +r.net_monthly - +currentResult.net_monthly
                        return (
                          <div key={key} className="w-full bg-[#0f0f23] rounded-lg p-3 grid grid-cols-[1fr_auto] items-center gap-2">
                            <div className="min-w-0">
                              <p className="text-xs text-[#9994b8] truncate">{label}</p>
                              <p className="text-sm font-medium text-[#a78bfa] whitespace-nowrap">{fmt(+r.net_monthly)} zł</p>
                            </div>
                            <span className={`text-xs font-medium whitespace-nowrap ${diff >= 0 ? 'text-[#22c55e]' : 'text-[#f87171]'}`}>
                              {diff >= 0 ? '+' : ''}{fmt(diff)} zł
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
