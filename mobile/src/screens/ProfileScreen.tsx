import * as Location from 'expo-location'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { profileApi } from '../api'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'
import type { ContractType, TaxForm, UserProfile, ZUSVariant } from '../types'

const LUMP_SUM_RATES = [
  { label: '2%', value: 0.02 },
  { label: '3%', value: 0.03 },
  { label: '5,5%', value: 0.055 },
  { label: '8,5%', value: 0.085 },
  { label: '10%', value: 0.10 },
  { label: '12%', value: 0.12 },
  { label: '12,5%', value: 0.125 },
  { label: '14%', value: 0.14 },
  { label: '15%', value: 0.15 },
  { label: '17%', value: 0.17 },
]

function sanitizeDecimalInput(v: string): string {
  let s = v.replace(/\./g, ',').replace(/[^0-9,]/g, '')
  const i = s.indexOf(',')
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/,/g, '')
  return s
}

function grossToRaw(n: number | null | undefined): string {
  if (n == null) return ''
  return String(n).replace('.', ',')
}

export default function ProfileScreen() {
  const { token, username, logout } = useAuth()
  const [profile, setProfile]       = useState<UserProfile | null>(null)
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [isDirty, setIsDirty]       = useState(false)
  const [validationError, setValidationError] = useState('')
  const [uopGrossRaw, setUopGrossRaw] = useState('')
  const [city, setCity]             = useState<string | null>(null)
  const [locLoading, setLocLoading] = useState(false)
  const original = useRef<UserProfile | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    profileApi.get()
      .then(p => {
        setProfile(p)
        original.current = p
        setUopGrossRaw(grossToRaw(p.default_uop_gross))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  function update(updater: (p: UserProfile) => UserProfile) {
    setIsDirty(true)
    setValidationError('')
    setSaved(false)
    setProfile(p => p ? updater(p) : p)
  }

  function setContractType(val: ContractType | null) {
    update(p => {
      if (val !== 'b2b') {
        return { ...p, default_contract_type: val, default_tax_form: null, default_zus_variant: null, default_lump_sum_rate: null, default_z_chorobowa: null }
      }
      return { ...p, default_contract_type: val }
    })
  }

  function setTaxForm(val: TaxForm | null) {
    update(p => ({ ...p, default_tax_form: val, default_lump_sum_rate: null, default_vat_rate: null }))
  }

  function validate(): string {
    if (!profile || profile.default_contract_type !== 'b2b') return ''
    if (!profile.default_tax_form) return 'Wybierz formę opodatkowania'
    if (profile.default_tax_form === 'lump_sum' && !profile.default_lump_sum_rate) return 'Wybierz stawkę ryczałtu'
    if (!profile.default_vat_rate) return 'Wybierz stawkę VAT'
    if (!profile.default_zus_variant) return 'Wybierz wariant ZUS'
    return ''
  }

  async function save() {
    const err = validate()
    if (err) { setValidationError(err); return }
    if (!profile) return
    setSaving(true)
    try {
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
    } catch {
      Alert.alert('Błąd', 'Nie udało się zapisać ustawień')
    } finally {
      setSaving(false)
    }
  }

  async function revert() {
    setLoading(true)
    try {
      const fresh = await profileApi.get()
      setProfile(fresh)
      original.current = fresh
      setUopGrossRaw(grossToRaw(fresh.default_uop_gross))
      setIsDirty(false)
      setValidationError('')
      setSaved(false)
    } finally {
      setLoading(false)
    }
  }

  async function clear() {
    Alert.alert('Wyzeruj ustawienia', 'Na pewno usunąć wszystkie domyślne ustawienia?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Wyzeruj', style: 'destructive',
        onPress: async () => {
          const cleared = await profileApi.update({
            default_contract_type: null, default_tax_form: null,
            default_zus_variant: null, default_lump_sum_rate: null,
            default_z_chorobowa: null, default_uop_gross: null, default_vat_rate: null,
          })
          setProfile(cleared)
          original.current = cleared
          setUopGrossRaw('')
          setIsDirty(false)
          setValidationError('')
          setSaved(false)
        },
      },
    ])
  }

  async function fetchLocation() {
    setLocLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Brak uprawnień', 'Zezwól na dostęp do lokalizacji w ustawieniach')
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const [geo] = await Location.reverseGeocodeAsync(pos.coords)
      setCity(geo?.city ?? geo?.subregion ?? geo?.region ?? 'Nieznane miasto')
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać lokalizacji')
    } finally {
      setLocLoading(false)
    }
  }

  if (!token) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.emptyText}>Zaloguj się, aby zobaczyć profil</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator style={s.loader} color={colors.accentLight} size="large" />
      </SafeAreaView>
    )
  }

  const isB2B = profile?.default_contract_type === 'b2b'
  const isUoP = profile?.default_contract_type === 'employment'
  const taxFormSelected = !!profile?.default_tax_form
  const isLumpSum = profile?.default_tax_form === 'lump_sum'

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Karta użytkownika */}
        <View style={[s.card, s.cardCenter]}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{username?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={s.uname}>{username}</Text>
          {profile && <Text style={s.email}>{profile.email}</Text>}
        </View>

        {/* Geolokalizacja */}
        <View style={[s.card, s.cardCenter]}>
          <Text style={s.sectionTitle}>LOKALIZACJA</Text>
          {city
            ? <Text style={s.cityText}>📍 {city}</Text>
            : <Text style={s.cityHint}>Pobierz miasto na podstawie GPS</Text>}
          <TouchableOpacity style={s.locBtn} onPress={fetchLocation} disabled={locLoading}>
            {locLoading
              ? <ActivityIndicator color={colors.accentLight} />
              : <Text style={s.locBtnText}>Wykryj lokalizację</Text>}
          </TouchableOpacity>
        </View>

        {/* Domyślne ustawienia */}
        {profile && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>DOMYŚLNE USTAWIENIA KALKULATORA</Text>

            {/* Forma współpracy */}
            <Text style={s.fieldLabel}>Forma współpracy</Text>
            <View style={s.pills}>
              {([
                [null, '(brak)'],
                ['b2b', 'JDG / B2B'],
                ['employment', 'Umowa o pracę'],
              ] as [ContractType | null, string][]).map(([v, l]) => (
                <TouchableOpacity
                  key={String(v)}
                  style={[s.pill, profile.default_contract_type === v && s.pillActive]}
                  onPress={() => setContractType(v)}
                >
                  <Text style={[s.pillText, profile.default_contract_type === v && s.pillTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* UoP — domyślna stawka brutto */}
            {isUoP && (
              <>
                <Text style={s.fieldLabel}>Domyślna stawka brutto (zł)</Text>
                <TextInput
                  style={s.input}
                  keyboardType="decimal-pad"
                  placeholder="np. 8000"
                  placeholderTextColor={colors.textSecondary}
                  value={uopGrossRaw}
                  onChangeText={v => {
                    const s2 = sanitizeDecimalInput(v)
                    setUopGrossRaw(s2)
                    const num = s2 ? parseFloat(s2.replace(',', '.')) || null : null
                    update(p => ({ ...p, default_uop_gross: num }))
                  }}
                />
              </>
            )}

            {/* Pola B2B — progressive disclosure */}
            {isB2B && (
              <>
                <Text style={s.fieldLabel}>
                  Forma opodatkowania <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <View style={s.pills}>
                  {([['linear', 'Liniowy'], ['scale', 'Skala'], ['lump_sum', 'Ryczałt']] as [TaxForm, string][]).map(([v, l]) => (
                    <TouchableOpacity
                      key={v}
                      style={[s.pill, profile.default_tax_form === v && s.pillActive]}
                      onPress={() => setTaxForm(v)}
                    >
                      <Text style={[s.pillText, profile.default_tax_form === v && s.pillTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {isLumpSum && (
                  <>
                    <Text style={s.fieldLabel}>
                      Stawka ryczałtu <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <View style={s.pills}>
                      {LUMP_SUM_RATES.map(r => (
                        <TouchableOpacity
                          key={r.value}
                          style={[s.pill, profile.default_lump_sum_rate === r.value && s.pillActive]}
                          onPress={() => update(p => ({ ...p, default_lump_sum_rate: r.value }))}
                        >
                          <Text style={[s.pillText, profile.default_lump_sum_rate === r.value && s.pillTextActive]}>{r.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <View style={!taxFormSelected ? s.dimmed : undefined}>
                  <Text style={s.fieldLabel}>
                    Domyślna stawka VAT <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <View style={s.pills}>
                    {(['23', '8', '5', '0', 'zw'] as const).map(v => (
                      <TouchableOpacity
                        key={v}
                        style={[s.pill, profile.default_vat_rate === v && s.pillActive]}
                        onPress={() => taxFormSelected && update(p => ({ ...p, default_vat_rate: v }))}
                      >
                        <Text style={[s.pillText, profile.default_vat_rate === v && s.pillTextActive]}>
                          {v === 'zw' ? 'ZW' : `${v}%`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={!taxFormSelected ? s.dimmed : undefined}>
                  <Text style={s.fieldLabel}>
                    Domyślny ZUS <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <View style={s.pills}>
                    {([['full', 'Pełne'], ['preferential', 'Preferencyjne'], ['ulga_na_start', 'Ulga na start']] as [ZUSVariant, string][]).map(([v, l]) => (
                      <TouchableOpacity
                        key={v}
                        style={[s.pill, profile.default_zus_variant === v && s.pillActive]}
                        onPress={() => taxFormSelected && update(p => ({ ...p, default_zus_variant: v }))}
                      >
                        <Text style={[s.pillText, profile.default_zus_variant === v && s.pillTextActive]}>{l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={s.switchRow}>
                  <Text style={s.switchLabel}>Dobrowolna składka chorobowa</Text>
                  <Switch
                    value={profile.default_z_chorobowa ?? false}
                    onValueChange={v => update(p => ({ ...p, default_z_chorobowa: v }))}
                    trackColor={{ true: colors.accentPrimary, false: colors.borderDefault }}
                    thumbColor={colors.textPrimary}
                  />
                </View>
              </>
            )}

            {validationError ? (
              <Text style={s.errorText}>{validationError}</Text>
            ) : null}

            <TouchableOpacity style={s.btnPrimary} onPress={save} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>{saved ? '✓ Zapisano' : 'Zapisz ustawienia'}</Text>}
            </TouchableOpacity>

            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.btnSecondary, { flex: 1 }]}
                onPress={revert}
                disabled={!isDirty}
              >
                <Text style={[s.btnSecondaryText, !isDirty && s.btnSecondaryDisabled]}>Cofnij zmiany</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnDanger, { flex: 1 }]}
                onPress={clear}
              >
                <Text style={s.btnDangerText}>Wyzeruj ustawienia</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Wyloguj */}
        <TouchableOpacity style={s.btnLogout} onPress={logout}>
          <Text style={s.btnLogoutText}>Wyloguj się</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: colors.bgBase },
  loader:             { flex: 1 },
  scroll:             { padding: 20, paddingBottom: 40 },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText:          { color: colors.textSecondary, textAlign: 'center', fontSize: 14 },
  card:               { backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 0.5, borderColor: colors.borderDefault, padding: 16, marginBottom: 12 },
  cardCenter:         { alignItems: 'center' },
  avatar:             { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentPrimary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText:         { color: '#fff', fontSize: 26, fontWeight: '600' },
  uname:              { color: colors.textPrimary, fontSize: 18, fontWeight: '500' },
  email:              { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  sectionTitle:       { color: colors.textSecondary, fontSize: 11, fontWeight: '500', letterSpacing: 1, alignSelf: 'flex-start', marginTop: 4, marginBottom: 8 },
  cityText:           { color: colors.textPrimary, fontSize: 16, marginBottom: 10 },
  cityHint:           { color: colors.textSecondary, fontSize: 13, marginBottom: 10 },
  locBtn:             { borderWidth: 1, borderColor: colors.borderAccent, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  locBtnText:         { color: colors.accentLight, fontSize: 13 },
  fieldLabel:         { color: colors.textSecondary, fontSize: 12, marginTop: 14, marginBottom: 6 },
  input:              { backgroundColor: colors.bgInput, borderWidth: 0.5, borderColor: colors.borderDefault, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary, fontSize: 14, marginBottom: 4 },
  pills:              { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill:               { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: colors.borderDefault },
  pillActive:         { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
  pillText:           { color: colors.textSecondary, fontSize: 12 },
  pillTextActive:     { color: '#fff' },
  dimmed:             { opacity: 0.4 },
  switchRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 4 },
  switchLabel:        { color: colors.textPrimary, fontSize: 14, flex: 1, marginRight: 8 },
  errorText:          { color: colors.error, fontSize: 13, marginTop: 8, marginBottom: 4 },
  btnPrimary:         { backgroundColor: colors.accentPrimary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  btnText:            { color: '#fff', fontSize: 14, fontWeight: '500' },
  actionRow:          { flexDirection: 'row', gap: 10, marginTop: 10 },
  btnSecondary:       { borderWidth: 0.5, borderColor: colors.borderDefault, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnSecondaryText:   { color: colors.textPrimary, fontSize: 13 },
  btnSecondaryDisabled: { color: colors.textSecondary },
  btnDanger:          { borderWidth: 0.5, borderColor: colors.error, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnDangerText:      { color: colors.error, fontSize: 13 },
  btnLogout:          { borderWidth: 0.5, borderColor: '#7f1d1d', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  btnLogoutText:      { color: colors.error, fontSize: 14 },
})
