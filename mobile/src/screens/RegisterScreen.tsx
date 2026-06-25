import React, { useState } from 'react'
import {
  ActivityIndicator, Alert, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'

export default function RegisterScreen({ onGoLogin }: { onGoLogin: () => void }) {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!username || !email || !password) return Alert.alert('Błąd', 'Wypełnij wszystkie pola')
    setLoading(true)
    try {
      await register(username, email, password)
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? 'Błąd rejestracji'
      Alert.alert('Błąd', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.logo}>⊞ CalcHub</Text>
        <Text style={s.title}>Rejestracja</Text>

        <TextInput
          style={s.input}
          placeholder="Login (tylko litery i cyfry)"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={s.input}
          placeholder="Hasło (min. 12 znaków)"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Zarejestruj się</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onGoLogin} style={s.link}>
          <Text style={s.linkText}>Masz już konto? Zaloguj się</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bgBase },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo:      { fontSize: 28, fontWeight: '600', color: colors.accentLight, textAlign: 'center', marginBottom: 8 },
  title:     { fontSize: 18, color: colors.textPrimary, textAlign: 'center', marginBottom: 32 },
  input:     {
    backgroundColor: colors.bgInput,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  },
  btn:       {
    backgroundColor: colors.accentPrimary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '500' },
  link:      { marginTop: 20, alignItems: 'center' },
  linkText:  { color: colors.textSecondary, fontSize: 13 },
})
