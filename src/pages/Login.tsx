import React, { useState } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password })
      login(res.data.token, res.data.role, res.data.username)
      if (res.data.role === 'admin') navigate('/admin')
      else navigate('/student')
    } catch (err) {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Username</label>
            <input 
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
