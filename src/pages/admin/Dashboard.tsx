import React from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <p className="text-gray-700">Welcome, Admin. Use the API to manage students and exams for now.</p>
        <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
            <ul className="list-disc list-inside text-gray-600">
                <li>Upload Students (CSV) - <i>API Only</i></li>
                <li>Create Exam - <i>API Only</i></li>
                <li>View Analytics - <i>Coming Soon</i></li>
            </ul>
        </div>
      </div>
    </div>
  )
}
