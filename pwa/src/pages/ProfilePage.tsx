import { useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { profileApi } from '@shared/api'
import type { UserProfile, ContractType, TaxForm, ZUSVariant } from '@shared/types'

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saved, setSaved] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [loading, setLoading] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const original = useRef<UserProfile | null>(null)

  const blocker = useBlocker(isDirty)

  useEffect(() => {
    profileApi.get().then(p => {
      setProfile(p)
      original.current = p
    }).finally(() => setLoading(false))
  }, [])

  const update = (updater: (p: UserProfile) => UserProfile) => {
    setIsDirty(true)
    setProfile(p => p ? updater(p) : p)
  }

  const setField = <K extends keyof UserProfile>(k: K) => (val: UserProfile[K]) =>
    update(p => ({ ...p, [k]: val }))

  const setContractType = (val: ContractType | null) => {
    setValidationError('')
    update(p => {
      if (!p) return p
      if (val !== 'b2b') {
        // przy UoP lub "brak" nullujemy pola specyficzne dla B2B
        return { ...p, default_contract_type: val, default_tax_form: null, default_zus_variant: null, default_lump_sum_rate: null, default_z_chorobowa: null }
      }
      return { ...p, default_contract_type: val }
    })
  }

  const setTaxForm = (val: TaxForm | null) => {
    setValidationError('')
    update(p => ({
      ...p,
      default_tax_form: val,
      default_lump_sum_rate: null,
      default_vat_rate: null,
    }))
  }

  const validate = (): string => {
    if (!profile || profile.default_contract_type !== 'b2b') return ''
    if (!profile.default_tax_form) return 'Wybierz formę opodatkowania'
    if (profile.default_tax_form === 'lump_sum' && !profile.default_lump_sum_rate) return 'Wybierz stawkę ryczałtu'
    if (!profile.default_vat_rate) return 'Wybierz stawkę VAT'
    if (!profile.default_zus_variant) return 'Wybierz wariant ZUS'
    return ''
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setValidationError(err); return }
    setValidationError('')
    if (!profile) return
    await profileApi.update({
      default_contract_type: profile.default_contract_type,
      default_tax_form: profile.default_tax_form,
      default_zus_variant: profile.default_zus_variant,
      default_lump_sum_rate: profile.default_lump_sum_rate,
      default_z_chorobowa: profile.default_z_chorobowa,
      default_uop_gross: profile.default_uop_gross,
      default_vat_rate: profile.default_vat_rate,
    })
    setIsDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRevert = async () => {
    setLoading(true)
    const fresh = await profileApi.get()
    setProfile(fresh)
    original.current = fresh
    setIsDirty(false)
    setValidationError('')
    setLoading(false)
  }

  const handleClear = async () => {
    if (!profile) return
    const cleared = await profileApi.update({
      default_contract_type: null,
      default_tax_form: null,
      default_zus_variant: null,
      default_lump_sum_rate: null,
      default_z_chorobowa: null,
      default_uop_gross: null,
      default_vat_rate: null,
    })
    setProfile(cleared)
    original.current = cleared
    setIsDirty(false)
    setValidationError('')
  }

  if (loading || !profile) return <div className="px-6 pt-12 text-[#9994b8] text-sm">Ładowanie...</div>

  const isB2B = profile.default_contract_type === 'b2b'
  const taxFormSelected = !!profile.default_tax_form
  const isLumpSum = profile.default_tax_form === 'lump_sum'

  return (
    <div className="px-6 pt-8">
      <h1 className="text-2xl font-medium mb-1">Profil</h1>
      <p className="text-sm text-[#9994b8] mb-6">Twoje dane i domyślne ustawienia kalkulatora</p>

      {/* Konto */}
      <div className="bg-[#16213e] border border-[#2d2d4e] rounded-xl p-5 mb-4">
        <p className="text-xs text-[#9994b8] font-medium tracking-wide mb-4">KONTO</p>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#9994b8]">Login</span>
            <span className="text-sm">{profile.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#9994b8]">Email</span>
            <span className="text-sm">{profile.email}</span>
          </div>
        </div>
      </div>

      {/* Domyślne ustawienia */}
      <div className="bg-[#16213e] border border-[#2d2d4e] rounded-xl p-5 mb-4">
        <p className="text-xs text-[#9994b8] font-medium tracking-wide mb-4">DOMYŚLNE USTAWIENIA KALKULATORA</p>
        <div className="flex flex-col gap-4">

          {/* 1. Forma współpracy — zawsze widoczna */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[#9994b8]">Forma współpracy</span>
            <select
              value={profile.default_contract_type ?? ''}
              onChange={e => setContractType(e.target.value as ContractType || null)}
              className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm">
              <option value="">(brak domyślnej)</option>
              <option value="b2b">JDG / B2B</option>
              <option value="employment">Umowa o pracę</option>
            </select>
          </label>

          {/* Pole UoP — domyślna stawka brutto */}
          {profile.default_contract_type === 'employment' && (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[#9994b8]">Domyślna stawka brutto (zł)</span>
              <input
                type="number"
                min={0}
                placeholder="np. 8000"
                value={profile.default_uop_gross ?? ''}
                onChange={e => setField('default_uop_gross')(e.target.value ? +e.target.value : null)}
                className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm" />
            </label>
          )}

          {/* 2–5. Pola B2B — progressive disclosure */}
          {isB2B && (
            <>
              {/* 2. Forma opodatkowania — wymagana, pusta dopóki nie wybrano */}
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[#9994b8]">
                  Forma opodatkowania <span className="text-[#f87171]">*</span>
                </span>
                <select
                  value={profile.default_tax_form ?? ''}
                  onChange={e => setTaxForm(e.target.value as TaxForm || null)}
                  className={`bg-[#0f0f23] border px-3 py-2 rounded-lg text-sm ${
                    !taxFormSelected
                      ? 'border-[#7c3aed] text-[#9994b8]'
                      : 'border-[#2d2d4e] text-[#e8e6f0]'
                  }`}>
                  <option value="">Wybierz...</option>
                  <option value="linear">Podatek liniowy (19%)</option>
                  <option value="scale">Skala podatkowa</option>
                  <option value="lump_sum">Ryczałt</option>
                </select>
              </label>

              {/* 3. Stawka ryczałtu — pojawia się tylko przy ryczałcie */}
              {isLumpSum && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-[#9994b8]">
                    Stawka ryczałtu <span className="text-[#f87171]">*</span>
                  </span>
                  <select
                    value={profile.default_lump_sum_rate ?? ''}
                    onChange={e => setField('default_lump_sum_rate')(e.target.value ? +e.target.value : null)}
                    className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm">
                    <option value="">Wybierz...</option>
                    {LUMP_SUM_RATES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </label>
              )}

              {/* 4. Stawka VAT — wymagana, wyszarzona dopóki nie wybrano formy opodatkowania */}
              <label className={`flex flex-col gap-1 transition-opacity ${!taxFormSelected ? 'opacity-40' : ''}`}>
                <span className="text-xs text-[#9994b8]">
                  Domyślna stawka VAT <span className="text-[#f87171]">*</span>
                </span>
                <select
                  disabled={!taxFormSelected}
                  value={profile.default_vat_rate ?? ''}
                  onChange={e => setField('default_vat_rate')(e.target.value || null)}
                  className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm disabled:cursor-not-allowed">
                  <option value="">Wybierz...</option>
                  <option value="23">23% (podstawowa)</option>
                  <option value="8">8% (obniżona)</option>
                  <option value="5">5% (obniżona)</option>
                  <option value="0">0%</option>
                  <option value="zw">ZW (zwolniony)</option>
                </select>
              </label>

              {/* 5. Domyślny ZUS — widoczny od razu, odblokowany po wyborze formy opodatkowania */}
              <label className={`flex flex-col gap-1 transition-opacity ${!taxFormSelected ? 'opacity-40' : ''}`}>
                <span className="text-xs text-[#9994b8]">
                  Domyślny ZUS <span className="text-[#f87171]">*</span>
                </span>
                <select
                  disabled={!taxFormSelected}
                  value={profile.default_zus_variant ?? ''}
                  onChange={e => setField('default_zus_variant')(e.target.value as ZUSVariant || null)}
                  className="bg-[#0f0f23] border border-[#2d2d4e] text-[#e8e6f0] px-3 py-2 rounded-lg text-sm disabled:cursor-not-allowed">
                  <option value="">Wybierz...</option>
                  <option value="full">Pełny ZUS</option>
                  <option value="preferential">Mały ZUS (preferencyjna)</option>
                  <option value="ulga_na_start">Ulga na start</option>
                </select>
              </label>

              {/* 5. Dobrowolna chorobowa — pojawia się po wyborze ZUS */}
              {profile.default_zus_variant && (
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={profile.default_z_chorobowa ?? true}
                    onChange={e => setField('default_z_chorobowa')(e.target.checked)}
                    className="accent-[#7c3aed] w-4 h-4" />
                  <span className="text-sm text-[#e8e6f0]">Dobrowolna składka chorobowa</span>
                </label>
              )}
            </>
          )}
        </div>
      </div>

      {validationError && (
        <p className="text-[#f87171] text-sm mb-3 px-1">{validationError}</p>
      )}

      <button onClick={handleSave}
        className="w-full bg-[#7c3aed] text-white py-3 rounded-xl font-medium cursor-pointer mb-3">
        {saved ? '✓ Zapisano' : 'Zapisz ustawienia'}
      </button>

      <div className="flex gap-3 mb-8">
        <button onClick={handleRevert}
          className="flex-1 border border-[#2d2d4e] text-[#c4c2d4] py-2.5 rounded-xl text-sm cursor-pointer">
          Cofnij zmiany
        </button>
        <button onClick={handleClear}
          className="flex-1 border border-[#f87171] text-[#f87171] py-2.5 rounded-xl text-sm cursor-pointer">
          Wyzeruj ustawienia
        </button>
      </div>

      {/* Modal przy próbie opuszczenia z niezapisanymi zmianami */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
          <div className="bg-[#16213e] border border-[#2d2d4e] rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-medium mb-2">Niezapisane zmiany</h2>
            <p className="text-sm text-[#9994b8] mb-6">Masz niezapisane zmiany w profilu. Czy chcesz je porzucić?</p>
            <div className="flex gap-3">
              <button
                onClick={() => blocker.reset()}
                className="flex-1 border border-[#2d2d4e] text-[#e8e6f0] py-2.5 rounded-xl text-sm cursor-pointer">
                Zostań
              </button>
              <button
                onClick={() => blocker.proceed()}
                className="flex-1 bg-[#f87171] text-white py-2.5 rounded-xl text-sm cursor-pointer">
                Porzuć zmiany
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
