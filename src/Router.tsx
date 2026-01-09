import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminLayout from './layouts/AdminLayout'
import StudentRoster from './pages/admin/StudentRoster'
import ExamLibrary from './pages/admin/ExamLibrary'
import ResultsAudit from './pages/admin/ResultsAudit'
import ExamArchitect from './pages/admin/ExamArchitect'
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
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="roster" replace />} />
          <Route path="roster" element={<StudentRoster />} />
          <Route path="library" element={<ExamLibrary />} />
          <Route path="audit" element={<ResultsAudit />} />
          <Route path="architect/:examId" element={<ExamArchitect />} />
        </Route>

        {/* Student Routes */}
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
