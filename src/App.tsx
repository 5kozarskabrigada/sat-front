import React, { useEffect } from 'react'
import Router from './Router'
import axios from 'axios'
import { API_URL } from './config'

function App() {
  // Pre-warmer: Wake up the backend immediately on mount
  useEffect(() => {
    // Fire and forget - don't await
    axios.get(`${API_URL}/api/health`, { timeout: 5000 }).catch(() => {})
  }, [])

  return (
    <Router />
  )
}

export default App
