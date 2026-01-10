import React, { useEffect } from 'react'
import Router from './Router'
import axios from 'axios'
import { API_URL } from './config'
import { useAuthStore } from './store/authStore'
import { prefetch } from './hooks/useFetch'

function App() {
  const { token, role } = useAuthStore()

  // Pre-warmer: Wake up the backend immediately on mount
  useEffect(() => {
    // Fire and forget - don't await
    axios.get(`${API_URL}/api/health`, { timeout: 5000 }).catch(() => {})
    
    // Proactive prefetch if already logged in (persistence)
    if (token && role === 'admin') {
      prefetch(`${API_URL}/api/admin/students`, 'admin-students', token)
      prefetch(`${API_URL}/api/admin/exams`, 'admin-exams', token)
      prefetch(`${API_URL}/api/admin/results`, 'admin-results', token)
    }
  }, [token, role])

  return (
    <Router />
  )
}

export default App
