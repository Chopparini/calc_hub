import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import CalculatorScreen from './src/screens/CalculatorScreen'
import LoginScreen from './src/screens/LoginScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import SavedScreen from './src/screens/SavedScreen'
import { colors } from './src/theme'

const Tab = createBottomTabNavigator()

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{icon}</Text>
}

function AppNavigator() {
  const { token, loading } = useAuth()
  const [screen, setScreen] = useState<'login' | 'register'>('login')

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgBase, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accentLight} size="large" />
      </View>
    )
  }

  if (!token) {
    return screen === 'login'
      ? <LoginScreen onGoRegister={() => setScreen('register')} />
      : <RegisterScreen onGoLogin={() => setScreen('login')} />
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.borderDefault,
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: colors.accentLight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Kalkulator"
        component={CalculatorScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="⊞" color={color} /> }}
      />
      <Tab.Screen
        name="Zapisane"
        component={SavedScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="☰" color={color} /> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="◉" color={color} /> }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
