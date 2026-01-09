import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import StudentDashboard from './pages/student/Dashboard'
import ExamInterface from './pages/student/ExamInterface'
import { useAuthStore } from './store/authStore'

const ProtectedRoute = ({ children, role }: { children: React.ReactElement, role: 'admin' | 'student' }) => {
  const { token, role: userRole } = useAuthStore()
  if (!token) return <Navigate to="/login" />
  if (userRole !== role) return <Navigate to="/login" />
  return children
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/student" element={
          <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/exam/:examId" element={
          <ProtectedRoute role="student"><ExamInterface /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}
