import React, { useState } from 'react'
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { calculationsApi, calculatorApi } from '../api'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'
import type { CalculateResult, TaxForm, ZUSVariant } from '../types'

const fmt = (n: number) =>
  n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Tab = 'b2b' | 'uop'

export default function CalculatorScreen() {
  const { token } = useAuth()
  const [tab, setTab] = useState<Tab>('b2b')

  // B2B fields
  const [b2bIncome, setB2bIncome]       = useState('')
  const [b2bCosts, setB2bCosts]         = useState('')
  const [taxForm, setTaxForm]           = useState<TaxForm>('linear')
  const [zusVariant, setZusVariant]     = useState<ZUSVariant>('full')

  // UoP fields
  const [uopGross, setUopGross] = useState('')

  const [result, setResult]   = useState<CalculateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)

  async function calculate() {
    setLoading(true)
    setResult(null)
    try {
      const req = tab === 'b2b'
        ? {
            contract_type: 'b2b' as const,
            tax_form: taxForm,
            gross_income: parseFloat(b2bIncome) || 0,
            monthly_costs: parseFloat(b2bCosts) || 0,
            zus_variant: zusVariant,
          }
        : {
            contract_type: 'employment' as const,
            gross_income: parseFloat(uopGross) || 0,
          }
      const res = await calculatorApi.calculate(req)
      setResult(res)
    } catch {
      Alert.alert('Błąd', 'Nie udało się obliczyć')
    } finally {
      setLoading(false)
    }
  }

  async function saveCalc() {
    if (!result || !token) return
    setSaving(true)
    try {
      await calculationsApi.save({
        contract_type: tab === 'b2b' ? 'b2b' : 'employment',
        tax_form: tab === 'b2b' ? taxForm : undefined,
        gross_income: tab === 'b2b' ? (parseFloat(b2bIncome) || 0) : (parseFloat(uopGross) || 0),
        monthly_costs: tab === 'b2b' ? (parseFloat(b2bCosts) || 0) : 0,
      })
      Alert.alert('Zapisano', 'Kalkulacja została zapisana')
    } catch {
      Alert.alert('Błąd', 'Nie udało się zapisać')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.heading}>Ile zarobisz na rękę?</Text>

        {/* Zakładki */}
        <View style={s.tabs}>
          {(['b2b', 'uop'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tab, tab === t && s.tabActive]}
              onPress={() => { setTab(t); setResult(null) }}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === 'b2b' ? 'JDG / B2B' : 'Umowa o pracę'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Formularz B2B */}
        {tab === 'b2b' && (
          <View style={s.card}>
            <Text style={s.label}>Przychód miesięczny netto (zł)</Text>
            <TextInput
              style={s.input} keyboardType="numeric"
              placeholder="np. 15000" placeholderTextColor={colors.textSecondary}
              value={b2bIncome} onChangeText={setB2bIncome}
            />
            <Text style={s.label}>Koszty netto (zł)</Text>
            <TextInput
              style={s.input} keyboardType="numeric"
              placeholder="np. 500" placeholderTextColor={colors.textSecondary}
              value={b2bCosts} onChangeText={setB2bCosts}
            />

            <Text style={s.label}>Forma opodatkowania</Text>
            <View style={s.pills}>
              {([['linear', 'Liniowy'], ['scale', 'Skala'], ['lump_sum', 'Ryczałt']] as [TaxForm, string][]).map(([v, l]) => (
                <TouchableOpacity key={v} style={[s.pill, taxForm === v && s.pillActive]} onPress={() => setTaxForm(v)}>
                  <Text style={[s.pillText, taxForm === v && s.pillTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Składki ZUS</Text>
            <View style={s.pills}>
              {([['full', 'Pełne'], ['preferential', 'Preferencyjne'], ['ulga_na_start', 'Ulga na start']] as [ZUSVariant, string][]).map(([v, l]) => (
                <TouchableOpacity key={v} style={[s.pill, zusVariant === v && s.pillActive]} onPress={() => setZusVariant(v)}>
                  <Text style={[s.pillText, zusVariant === v && s.pillTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Formularz UoP */}
        {tab === 'uop' && (
          <View style={s.card}>
            <Text style={s.label}>Wynagrodzenie brutto (zł)</Text>
            <TextInput
              style={s.input} keyboardType="numeric"
              placeholder="np. 8000" placeholderTextColor={colors.textSecondary}
              value={uopGross} onChangeText={setUopGross}
            />
          </View>
        )}

        <TouchableOpacity style={s.btnPrimary} onPress={calculate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Oblicz</Text>}
        </TouchableOpacity>

        {/* Wynik */}
        {result && (
          <View style={s.result}>
            <View style={s.heroCard}>
              <Text style={s.heroLabel}>Netto miesięcznie</Text>
              <Text style={s.heroValue}>{fmt(+result.net_monthly)} zł</Text>
            </View>

            <View style={s.grid}>
              <View style={s.tile}>
                <Text style={s.tileLabel}>Podatek</Text>
                <Text style={[s.tileValue, { color: colors.warning }]}>{fmt(+result.income_tax)} zł</Text>
              </View>
              <View style={s.tile}>
                <Text style={s.tileLabel}>ZUS</Text>
                <Text style={[s.tileValue, { color: colors.warning }]}>{fmt(+result.zus_social)} zł</Text>
              </View>
              <View style={s.tile}>
                <Text style={s.tileLabel}>Zdrowotna</Text>
                <Text style={[s.tileValue, { color: colors.warning }]}>{fmt(+result.health_insurance)} zł</Text>
              </View>
              {result.vat_monthly != null && (
                <View style={s.tile}>
                  <Text style={s.tileLabel}>VAT należny</Text>
                  <Text style={[s.tileValue, { color: colors.error }]}>{fmt(+result.vat_monthly)} zł</Text>
                </View>
              )}
              {result.koszt_pracodawcy != null && (
                <View style={s.tile}>
                  <Text style={s.tileLabel}>Koszt pracodawcy</Text>
                  <Text style={s.tileValue}>{fmt(+result.koszt_pracodawcy)} zł</Text>
                </View>
              )}
            </View>

            {token && (
              <TouchableOpacity style={s.btnOutline} onPress={saveCalc} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={colors.accentLight} />
                  : <Text style={s.btnOutlineText}>Zapisz kalkulację</Text>}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bgBase },
  scroll:        { padding: 20, paddingBottom: 40 },
  heading:       { fontSize: 20, fontWeight: '500', color: colors.textPrimary, textAlign: 'center', marginBottom: 20 },
  tabs:          { flexDirection: 'row', backgroundColor: colors.bgSurface, borderRadius: 10, padding: 4, marginBottom: 16 },
  tab:           { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive:     { backgroundColor: colors.accentPrimary },
  tabText:       { color: colors.textSecondary, fontSize: 13 },
  tabTextActive: { color: '#fff', fontWeight: '500' },
  card:          { backgroundColor: colors.bgSurface, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: colors.borderDefault, marginBottom: 16 },
  label:         { color: colors.textSecondary, fontSize: 12, marginBottom: 6, marginTop: 10 },
  input:         { backgroundColor: colors.bgInput, borderWidth: 0.5, borderColor: colors.borderDefault, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary, fontSize: 14 },
  pills:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: colors.borderDefault },
  pillActive:    { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
  pillText:      { color: colors.textSecondary, fontSize: 12 },
  pillTextActive:{ color: '#fff' },
  btnPrimary:    { backgroundColor: colors.accentPrimary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnText:       { color: '#fff', fontSize: 15, fontWeight: '500' },
  result:        { marginTop: 20 },
  heroCard:      { backgroundColor: colors.bgAccentSubtle, borderWidth: 0.5, borderColor: colors.borderAccent, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  heroLabel:     { color: colors.accentLight, fontSize: 12, marginBottom: 6 },
  heroValue:     { color: colors.accentLight, fontSize: 36, fontWeight: '500' },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tile:          { flex: 1, minWidth: '45%', backgroundColor: colors.bgSurface, borderRadius: 8, padding: 12 },
  tileLabel:     { color: colors.textSecondary, fontSize: 11, marginBottom: 4 },
  tileValue:     { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  btnOutline:    { borderWidth: 1, borderColor: colors.borderAccent, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnOutlineText:{ color: colors.accentLight, fontSize: 14 },
})
