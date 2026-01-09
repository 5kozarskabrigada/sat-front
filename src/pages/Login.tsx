import React, { useState } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'
import { ShieldCheck, ArrowRight } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password })
      login(res.data.token, res.data.role, res.data.username)
      if (res.data.role === 'admin') navigate('/admin')
      else navigate('/student')
    } catch (err) {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark p-4">
      <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-brand-accent rounded-full flex items-center justify-center mb-4 shadow-lg shadow-brand-accent/20">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">SAT Simulation Platform</h2>
          <p className="text-brand-muted text-sm mt-2">Secure Testing Environment</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg mb-6 text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-brand-muted text-xs font-semibold uppercase tracking-wider mb-2">Username</label>
            <input 
              className="w-full bg-brand-primary/50 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all placeholder-brand-muted/30"
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-brand-muted text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              className="w-full bg-brand-primary/50 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all placeholder-brand-muted/30"
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-brand-accent hover:bg-blue-600 text-white font-medium p-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-brand-muted text-xs">
            Restricted Access. Authorized Personnel Only.
          </p>
        </div>
      </div>
    </div>
  )
}
