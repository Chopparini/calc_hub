import * as Location from 'expo-location'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, ScrollView,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { profileApi } from '../api'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'
import type { TaxForm, UserProfile, ZUSVariant } from '../types'

export default function ProfileScreen() {
  const { token, username, logout } = useAuth()
  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [city, setCity]         = useState<string | null>(null)
  const [locLoading, setLocLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    profileApi.get()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

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

  async function save() {
    if (!profile) return
    setSaving(true)
    try {
      await profileApi.update({
        default_contract_type: profile.default_contract_type,
        default_tax_form: profile.default_tax_form,
        default_zus_variant: profile.default_zus_variant,
        default_z_chorobowa: profile.default_z_chorobowa,
      })
      Alert.alert('Zapisano', 'Ustawienia zostały zaktualizowane')
    } catch {
      Alert.alert('Błąd', 'Nie udało się zapisać ustawień')
    } finally {
      setSaving(false)
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

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Karta użytkownika */}
        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{username?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={s.uname}>{username}</Text>
          {profile && <Text style={s.email}>{profile.email}</Text>}
        </View>

        {/* Geolokalizacja */}
        <View style={s.card}>
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
            <Text style={s.sectionTitle}>DOMYŚLNA FORMA WSPÓŁPRACY</Text>
            <View style={s.pills}>
              {(['b2b', 'employment'] as const).map(v => (
                <TouchableOpacity
                  key={v}
                  style={[s.pill, profile.default_contract_type === v && s.pillActive]}
                  onPress={() => setProfile(p => p ? { ...p, default_contract_type: v } : p)}
                >
                  <Text style={[s.pillText, profile.default_contract_type === v && s.pillTextActive]}>
                    {v === 'b2b' ? 'JDG / B2B' : 'Umowa o pracę'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionTitle}>DOMYŚLNA FORMA OPODATKOWANIA</Text>
            <View style={s.pills}>
              {([['linear', 'Liniowy'], ['scale', 'Skala'], ['lump_sum', 'Ryczałt']] as [TaxForm, string][]).map(([v, l]) => (
                <TouchableOpacity
                  key={v}
                  style={[s.pill, profile.default_tax_form === v && s.pillActive]}
                  onPress={() => setProfile(p => p ? { ...p, default_tax_form: v } : p)}
                >
                  <Text style={[s.pillText, profile.default_tax_form === v && s.pillTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionTitle}>DOMYŚLNY WARIANT ZUS</Text>
            <View style={s.pills}>
              {([['full', 'Pełne'], ['preferential', 'Preferencyjne'], ['ulga_na_start', 'Ulga na start']] as [ZUSVariant, string][]).map(([v, l]) => (
                <TouchableOpacity
                  key={v}
                  style={[s.pill, profile.default_zus_variant === v && s.pillActive]}
                  onPress={() => setProfile(p => p ? { ...p, default_zus_variant: v } : p)}
                >
                  <Text style={[s.pillText, profile.default_zus_variant === v && s.pillTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.switchRow}>
              <Text style={s.switchLabel}>Chorobowe domyślnie</Text>
              <Switch
                value={profile.default_z_chorobowa ?? true}
                onValueChange={v => setProfile(p => p ? { ...p, default_z_chorobowa: v } : p)}
                trackColor={{ true: colors.accentPrimary, false: colors.borderDefault }}
                thumbColor={colors.textPrimary}
              />
            </View>

            <TouchableOpacity style={s.btnPrimary} onPress={save} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Zapisz ustawienia</Text>}
            </TouchableOpacity>
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
  safe:          { flex: 1, backgroundColor: colors.bgBase },
  loader:        { flex: 1 },
  scroll:        { padding: 20, paddingBottom: 40 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText:     { color: colors.textSecondary, textAlign: 'center', fontSize: 14 },
  card:          { backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 0.5, borderColor: colors.borderDefault, padding: 16, marginBottom: 12, alignItems: 'center' },
  avatar:        { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentPrimary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText:    { color: '#fff', fontSize: 26, fontWeight: '600' },
  uname:         { color: colors.textPrimary, fontSize: 18, fontWeight: '500' },
  email:         { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  sectionTitle:  { color: colors.textSecondary, fontSize: 11, fontWeight: '500', letterSpacing: 1, alignSelf: 'flex-start', marginTop: 12, marginBottom: 8 },
  cityText:      { color: colors.textPrimary, fontSize: 16, marginBottom: 10 },
  cityHint:      { color: colors.textSecondary, fontSize: 13, marginBottom: 10 },
  locBtn:        { borderWidth: 1, borderColor: colors.borderAccent, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  locBtnText:    { color: colors.accentLight, fontSize: 13 },
  pills:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'flex-start', marginBottom: 4 },
  pill:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: colors.borderDefault },
  pillActive:    { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
  pillText:      { color: colors.textSecondary, fontSize: 12 },
  pillTextActive:{ color: '#fff' },
  switchRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch', marginTop: 12, marginBottom: 16 },
  switchLabel:   { color: colors.textPrimary, fontSize: 14 },
  btnPrimary:    { backgroundColor: colors.accentPrimary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', alignSelf: 'stretch', marginTop: 4 },
  btnText:       { color: '#fff', fontSize: 14, fontWeight: '500' },
  btnLogout:     { borderWidth: 0.5, borderColor: '#7f1d1d', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  btnLogoutText: { color: colors.error, fontSize: 14 },
})
