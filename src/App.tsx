import React, { useEffect } from 'react'
import Router from './Router'
import axios from 'axios'
import { API_URL } from './config'

function App() {
  // Pre-warmer: Wake up the backend immediately on mount
  useEffect(() => {
    const wakeUp = async () => {
        try {
            // Fire and forget - we don't care about the result, just hitting the server
            // Using a non-existent endpoint or a health check is fine, it just needs to hit the API
            await axios.get(`${API_URL}/api/health`, { timeout: 3000 })
        } catch (e) {
            // Ignore errors (e.g. 404), the goal is just to wake the server
        }
    }
    wakeUp()
  }, [])

  return (
    <Router />
  )
}

export default App
