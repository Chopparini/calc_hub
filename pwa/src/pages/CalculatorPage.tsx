import { useState, useEffect } from 'react'
import { useCalculator } from '@shared/hooks/useCalculator'
import type { TaxForm, ZUSVariant } from '@shared/types'
import { calculationsApi, profileApi } from '@shared/api'
import { useAuth } from '@shared/hooks/useAuth'

type Tab = 'b2b' | 'uop' | 'compare'

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

export default function CalculatorPage() {
  const [tab, setTab] = useState<Tab>('b2b')
  const { result, compareResult, loading, error, calculate, compare, reset } = useCalculator()
  const { isLoggedIn } = useAuth()
  const [saved, setSaved] = useState(false)

  // B2B fields
  const [income, setIncome] = useState('')
  const [costs, setCosts] = useState('')
  const [taxForm, setTaxForm] = useState<TaxForm>('linear')
  const [lumpSumRate, setLumpSumRate] = useState(0.12)
  const [vatRate, setVatRate] = useState('23')
  const [zusVariant, setZusVariant] = useState<ZUSVariant>('full')
  const [zChorobowa, setZChorobowa] = useState(true)

  // UoP fields
  const [uopIncome, setUopIncome] = useState('')

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
      if (p.default_uop_gross) setUopIncome(String(p.default_uop_gross))
    }).catch(() => {})
  }, [isLoggedIn])

  // Compare
  const [cmpB2b, setCmpB2b] = useState('')
  const [cmpUop, setCmpUop] = useState('')
  const [cmpCosts, setCmpCosts] = useState('')

  const handleCalculate = () => {
    setSaved(false)
    if (tab === 'b2b') {
      calculate({ contract_type: 'b2b', gross_income: +income, monthly_costs: +costs,
        tax_form: taxForm, lump_sum_rate: lumpSumRate, zus_variant: zusVariant, z_chorobowa: zChorobowa, vat_rate: vatRate })
    } else if (tab === 'uop') {
      calculate({ contract_type: 'employment', gross_income: +uopIncome })
    } else {
      compare({ b2b_income: +cmpB2b, monthly_costs: +cmpCosts,
        tax_form: taxForm, zus_variant: zusVariant, uop_gross: +cmpUop })
    }
  }

  const handleSave = async () => {
    if (!result) return
    await calculationsApi.save({
      contract_type: tab === 'uop' ? 'employment' : 'b2b',
      tax_form: tab === 'b2b' ? taxForm : undefined,
      zus_variant: tab === 'b2b' ? zusVariant : undefined,
      gross_income: tab === 'uop' ? +uopIncome : +income,
      monthly_costs: tab === 'b2b' ? +costs : undefined,
    })
    setSaved(true)
  }

  const currentResult = tab === 'compare' ? null : result
  const showResult = tab === 'compare' ? !!compareResult : !!currentResult

  return (
    <div>
      <div className="px-6 pt-8 pb-6 text-center">
        <h1 className="text-2xl font-medium mb-2">Ile zarobisz na rękę?</h1>
        <p className="text-sm text-[#9994b8]">Oblicz i porównaj JDG i umowę o pracę</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#16213e] rounded-xl p-1 mx-6 mb-5">
        {(['b2b', 'uop', 'compare'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); reset(); setSaved(false) }}
            className={`flex-1 py-2 text-xs rounded-lg font-medium transition-colors cursor-pointer
              ${tab === t ? 'bg-[#7c3aed] text-white' : 'text-[#9994b8]'}`}>
            {t === 'b2b' ? 'JDG / B2B' : t === 'uop' ? 'Umowa o pracę' : 'Porównaj'}
          </button>
        ))}
      </div>

      {/* Formularz */}
      <div className="bg-[#16213e] border border-[#2d2d4e] rounded-xl p-5 mx-6 mb-4">
        <p className="text-xs text-[#9994b8] font-medium tracking-wide mb-4">
          {tab === 'b2b' ? 'PARAMETRY JDG' : tab === 'uop' ? 'PARAMETRY UoP' : 'PORÓWNANIE'}
        </p>

        {tab === 'b2b' && (
          <>
            <div className={`gap-3 mb-3 ${taxForm === 'lump_sum' ? 'flex flex-col' : 'grid grid-cols-2'}`}>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[#9994b8]">Miesięczna suma netto z faktur (zł)</span>
                <input type="number" value={income} onChange={e => setIncome(e.target.value)}
                  placeholder="np. 15000"
                  className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm" />
              </label>
              {taxForm !== 'lump_sum' && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-[#9994b8]">Koszty uzyskania netto (zł)</span>
                  <input type="number" value={costs} onChange={e => setCosts(e.target.value)}
                    placeholder="np. 2000"
                    className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm" />
                </label>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[#9994b8]">Forma opodatkowania</span>
                <select value={taxForm} onChange={e => setTaxForm(e.target.value as TaxForm)}
                  className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm">
                  <option value="linear">Podatek liniowy (19%)</option>
                  <option value="scale">Skala podatkowa</option>
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
            <label className="flex flex-col gap-1 mb-3">
              <span className="text-xs text-[#9994b8]">Wynagrodzenie brutto (zł)</span>
              <input type="number" value={uopIncome} onChange={e => setUopIncome(e.target.value)}
                placeholder="np. 10000"
                className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm" />
            </label>
          </>
        )}

        {tab === 'compare' && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[#9994b8]">Przychód B2B (zł)</span>
                <input type="number" value={cmpB2b} onChange={e => setCmpB2b(e.target.value)}
                  className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[#9994b8]">Brutto UoP (zł)</span>
                <input type="number" value={cmpUop} onChange={e => setCmpUop(e.target.value)}
                  className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm" />
              </label>
            </div>
            <label className="flex flex-col gap-1 mb-3">
              <span className="text-xs text-[#9994b8]">Koszty B2B (zł)</span>
              <input type="number" value={cmpCosts} onChange={e => setCmpCosts(e.target.value)}
                className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm" />
            </label>
          </>
        )}

        <button onClick={handleCalculate} disabled={loading}
          className="w-full bg-[#7c3aed] text-white py-3 rounded-lg text-sm font-medium mt-3 disabled:opacity-50 cursor-pointer">
          {loading ? 'Obliczam...' : '⊞ Oblicz'}
        </button>

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        {/* Wyniki B2B / UoP */}
        {showResult && tab !== 'compare' && currentResult && (
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
                  <p className="text-base font-medium text-[#fbbf24]">{fmt(+currentResult.income_tax)} zł</p>
                </div>
                <div className="bg-[#16213e] rounded-lg p-3">
                  <p className="text-xs text-[#9994b8] mb-1">ZUS społeczny</p>
                  <p className="text-base font-medium text-[#fbbf24]">{fmt(+currentResult.zus_social)} zł</p>
                </div>
                <div className="bg-[#16213e] rounded-lg p-3">
                  <p className="text-xs text-[#9994b8] mb-1">Zdrowotna</p>
                  <p className="text-base font-medium text-[#fbbf24]">{fmt(+currentResult.health_insurance)} zł</p>
                </div>
                <div className="bg-[#16213e] rounded-lg p-3">
                  <p className="text-xs text-[#9994b8] mb-1">VAT należny</p>
                  <p className="text-base font-medium text-[#f87171]">{fmt(+(currentResult.vat_monthly ?? 0))} zł</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-[#16213e] rounded-lg p-3">
                  <p className="text-xs text-[#9994b8] mb-1">Podatek</p>
                  <p className="text-base font-medium text-[#fbbf24]">{fmt(+currentResult.income_tax)} zł</p>
                </div>
                <div className="bg-[#16213e] rounded-lg p-3">
                  <p className="text-xs text-[#9994b8] mb-1">ZUS</p>
                  <p className="text-base font-medium text-[#fbbf24]">{fmt(+currentResult.zus_social)} zł</p>
                </div>
                <div className="bg-[#16213e] rounded-lg p-3">
                  <p className="text-xs text-[#9994b8] mb-1">Zdrowotna</p>
                  <p className="text-base font-medium text-[#fbbf24]">{fmt(+currentResult.health_insurance)} zł</p>
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
                className="w-full border border-[#7c3aed] text-[#a78bfa] py-2.5 rounded-lg text-sm cursor-pointer disabled:opacity-50">
                {saved ? '✓ Zapisano' : '☆ Zapisz kalkulację'}
              </button>
            )}
          </div>
        )}

        {/* Wyniki porównania */}
        {tab === 'compare' && compareResult && (
          <div className="bg-[#0f0f23] border border-[#2d2d4e] rounded-xl p-4 mt-4">
            <p className="text-xs text-[#9994b8] mb-3">PORÓWNANIE</p>
            <div className={`text-center mb-4 p-3 rounded-xl border ${+compareResult.roznica_netto >= 0 ? 'bg-[#14291b] border-[#22c55e]' : 'bg-[#2d1b1b] border-[#f87171]'}`}>
              <p className="text-xs text-[#9994b8] mb-1">B2B vs UoP — różnica netto</p>
              <p className={`text-2xl font-medium ${+compareResult.roznica_netto >= 0 ? 'text-[#22c55e]' : 'text-[#f87171]'}`}>
                {+compareResult.roznica_netto >= 0 ? '+' : ''}{fmt(+compareResult.roznica_netto)} zł
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['b2b', 'uop'] as const).map(side => (
                <div key={side} className="bg-[#16213e] rounded-xl p-3">
                  <p className="text-xs text-[#9994b8] mb-2 font-medium">{side === 'b2b' ? 'JDG / B2B' : 'Umowa o pracę'}</p>
                  <p className="text-xl font-medium text-[#a78bfa] mb-2">{fmt(+compareResult[side].net_monthly)} zł</p>
                  <p className="text-xs text-[#9994b8]">Podatek: {fmt(+compareResult[side].income_tax)} zł</p>
                  <p className="text-xs text-[#9994b8]">ZUS: {fmt(+compareResult[side].zus_social)} zł</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
