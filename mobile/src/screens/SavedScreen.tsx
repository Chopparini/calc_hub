import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { calculationsApi } from '../api'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'
import type { SavedCalculation } from '../types'

const fmt = (n: number) =>
  Number(n).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const contractLabel: Record<string, string> = { b2b: 'JDG / B2B', employment: 'Umowa o pracę' }
const taxLabel: Record<string, string> = { linear: 'Liniowy', scale: 'Skala', lump_sum: 'Ryczałt' }

export default function SavedScreen() {
  const { token } = useAuth()
  const [items, setItems]     = useState<SavedCalculation[]>([])
  const [loading, setLoading] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      setLoading(true)
      calculationsApi.list()
        .then(setItems)
        .catch(() => Alert.alert('Błąd', 'Nie udało się pobrać kalkulacji'))
        .finally(() => setLoading(false))
    }, [token])
  )

  async function remove(id: number) {
    Alert.alert('Usuń', 'Na pewno usunąć tę kalkulację?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive',
        onPress: async () => {
          await calculationsApi.delete(id)
          setItems(prev => prev.filter(i => i.id !== id))
        },
      },
    ])
  }

  if (!token) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.emptyText}>Zaloguj się, aby zobaczyć zapisane kalkulacje</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      {loading
        ? <ActivityIndicator style={s.loader} color={colors.accentLight} size="large" />
        : (
          <FlatList
            data={items}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <View style={s.center}>
                <Text style={s.emptyText}>Brak zapisanych kalkulacji</Text>
              </View>
            }
            renderItem={({ item }) => {
              const result = JSON.parse(item.result_json)
              return (
                <View style={s.card}>
                  <View style={s.cardHeader}>
                    <View>
                      <Text style={s.cardTitle}>{item.name ?? contractLabel[item.contract_type]}</Text>
                      <Text style={s.cardSub}>
                        {contractLabel[item.contract_type]}
                        {item.tax_form ? ` · ${taxLabel[item.tax_form]}` : ''}
                        {' · '}{new Date(item.created_at).toLocaleDateString('pl-PL')}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => remove(item.id)}>
                      <Text style={s.deleteBtn}>Usuń</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.row}>
                    <View style={s.stat}>
                      <Text style={s.statLabel}>Brutto</Text>
                      <Text style={s.statValue}>
                        {fmt(+item.gross_income)} zł
                      </Text>
                    </View>
                    <View style={s.stat}>
                      <Text style={s.statLabel}>Netto</Text>
                      <Text style={[s.statValue, { color: colors.accentLight }]}>
                        {fmt(+result.net_monthly)} zł
                      </Text>
                    </View>
                    <View style={s.stat}>
                      <Text style={s.statLabel}>Podatek</Text>
                      <Text style={[s.statValue, { color: colors.warning }]}>
                        {fmt(+result.income_tax)} zł
                      </Text>
                    </View>
                    <View style={s.stat}>
                      <Text style={s.statLabel}>ZUS+Zdrowotna</Text>
                      <Text style={[s.statValue, { color: colors.warning }]}>
                        {fmt(+result.zus_social + +result.health_insurance)} zł
                      </Text>
                    </View>
                  </View>
                </View>
              )
            }}
          />
        )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.bgBase },
  loader:     { flex: 1 },
  list:       { padding: 16, paddingBottom: 40 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText:  { color: colors.textSecondary, textAlign: 'center', fontSize: 14 },
  card:       { backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 0.5, borderColor: colors.borderDefault, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle:  { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  cardSub:    { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  deleteBtn:  { color: colors.error, fontSize: 13 },
  row:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat:       { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.bgInput, borderRadius: 8, padding: 10 },
  statLabel:  { color: colors.textSecondary, fontSize: 11, marginBottom: 2 },
  statValue:  { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
})
