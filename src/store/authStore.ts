import { create } from 'zustand'

interface AuthState {
  token: string | null
  role: 'admin' | 'student' | null
  username: string | null
  login: (token: string, role: 'admin' | 'student', username: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  role: (localStorage.getItem('role') as 'admin' | 'student') || null,
  username: localStorage.getItem('username'),
  login: (token, role, username) => {
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    localStorage.setItem('username', username)
    set({ token, role, username })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    set({ token: null, role: null, username: null })
  },
}))
