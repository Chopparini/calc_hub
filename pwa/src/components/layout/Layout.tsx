import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/hooks/useAuth'

export default function Layout() {
  const { isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#e8e6f0] flex flex-col max-w-lg mx-auto relative">
      {/* Navbar */}
      <nav className="bg-[#16213e] border-b border-[#2d2d4e] px-6 h-13 flex items-center justify-between shrink-0">
        <span className="text-[#a78bfa] font-medium text-lg">⊞ CalcHub</span>
        <div className="flex gap-2">
          {isLoggedIn ? (
            <button onClick={handleLogout}
              className="border border-[#4c4c7a] text-[#c4c2d4] px-4 py-1.5 rounded-lg text-sm cursor-pointer">
              Wyloguj
            </button>
          ) : (
            <>
              <NavLink to="/login"
                className="border border-[#4c4c7a] text-[#c4c2d4] px-4 py-1.5 rounded-lg text-sm">
                Zaloguj się
              </NavLink>
              <NavLink to="/register"
                className="bg-[#7c3aed] text-white px-4 py-1.5 rounded-lg text-sm">
                Zarejestruj
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* Treść strony */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Dolna nawigacja */}
      <nav className="bg-[#16213e] border-t border-[#2d2d4e] px-6 py-2.5 flex justify-around fixed bottom-0 w-full max-w-lg">
        <NavLink to="/" end className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-[#a78bfa]' : 'text-[#9994b8]'}`}>
          <span className="text-lg">⊞</span> Kalkulator
        </NavLink>
        <NavLink to="/saved" className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-[#a78bfa]' : 'text-[#9994b8]'}`}>
          <span className="text-lg">☆</span> Zapisane
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-[#a78bfa]' : 'text-[#9994b8]'}`}>
          <span className="text-lg">👤</span> Profil
        </NavLink>
      </nav>
    </div>
  )
}
