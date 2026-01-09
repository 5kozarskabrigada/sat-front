import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { API_URL } from '../../config'
import { useAuthStore } from '../../store/authStore'
import { Eye, EyeOff, UserPlus, Search, X, Check } from 'lucide-react'
import { createPortal } from 'react-dom'

interface Student {
  id: string
  username: string
  role: string
  createdAt: string
  // For UI state (not from API directly unless we store credentials separately, 
  // but usually admin creates them and gets them once. 
  // However, for this simplified mock platform, we might not be able to retrieve passwords 
  // unless we store them or the API returns them on creation.
  // The API "GetStudents" usually doesn't return passwords. 
  // The requirement says "Visibility button... reveals unique password". 
  // This implies the admin can SEE the password later. 
  // REAL WORLD: Bad practice. 
  // MOCK WORLD: We will assume we can't see OLD passwords, only NEW ones upon creation. 
  // OR, we store them in a separate "StudentCredentials" table for the admin to see.
  // Let's assume for this session, we only see them upon creation, OR we mock it.
  // Wait, the prompt says "The Key Column... reveals the student's unique password".
  // I'll stick to showing a placeholder or "Reset" functionality if real security.
  // But since the user wants exactly this feature, I will assume the API *should* return it 
  // OR I will simulate it for the demo. 
  // Given the backend uses BCrypt, we CANNOT retrieve passwords.
  // I will implement it such that the "Key" column allows resetting or is only available for newly created students.
  // actually, let's just show a "Hidden" state and if they click it, maybe we show a "Cannot retrieve" or 
  // we just simulate it for the sake of the UI demo if it's a mock platform.
  // Let's go with: Only show for newly created, or show "******" and allow reset.
  // RE-READING PROMPT: "manage the individuals... reveals the student's unique password".
  // Okay, I'll store the plain password in the frontend state for *this session* if created, 
  // but for persistent students, I can't show it. 
  // I'll add a note in the UI about this security limitation.
}

export default function StudentRoster() {
  const { token } = useAuthStore()
  const [students, setStudents] = useState<Student[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newStudentName, setNewStudentName] = useState({ first: '', last: '' })
  const [createdCredentials, setCreatedCredentials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStudents(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API_URL}/api/admin/create-students`, [
        { firstName: newStudentName.first, lastName: newStudentName.last }
      ], {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCreatedCredentials(prev => [...prev, ...res.data])
      setNewStudentName({ first: '', last: '' })
      fetchStudents()
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  // Header Portal for Actions
  const HeaderActions = () => {
    const el = document.getElementById('header-actions')
    if (!el) return null
    return createPortal(
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm"
      >
        <UserPlus className="w-4 h-4" />
        Enroll Student
      </button>,
      el
    )
  }

  return (
    <div>
      <HeaderActions />

      {/* Stats / Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-panel">
          <div className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-1">Total Enrollment</div>
          <div className="text-3xl font-bold text-brand-dark">{students.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-panel">
          <div className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-1">Active Sessions</div>
          <div className="text-3xl font-bold text-brand-dark">0</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-panel">
            <div className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-1">Recent Activity</div>
            <div className="text-sm text-brand-dark">New student enrolled 2m ago</div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-panel overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    placeholder="Search students..." 
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                />
            </div>
            <div className="text-sm text-brand-muted">
                Showing all {students.length} students
            </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-brand-muted uppercase tracking-wider">
              <th className="px-6 py-4">Student ID</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Password Key</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student) => {
                // Check if we just created this student to show the password
                const creds = createdCredentials.find(c => c.username === student.username)
                
                return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-gray-500">
                            {student.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 font-medium text-brand-dark">
                            {student.username}
                        </td>
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            {creds ? (
                                <div className="flex items-center gap-2 text-sm font-mono bg-yellow-50 px-2 py-1 rounded border border-yellow-200 text-yellow-800 w-fit">
                                    <span className="font-bold">{creds.password}</span>
                                    <Check className="w-3 h-3" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-400 italic text-sm">
                                    <span>••••••••</span>
                                    <button className="hover:text-brand-accent transition-colors" title="Cannot reveal hashed password">
                                        <EyeOff className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </td>
                    </tr>
                )
            })}
          </tbody>
        </table>
      </div>

      {/* Enrollment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-brand-dark">Enroll New Student</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleEnroll} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-brand-muted uppercase mb-1">First Name</label>
                            <input 
                                required
                                value={newStudentName.first}
                                onChange={e => setNewStudentName(p => ({ ...p, first: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none"
                                placeholder="Jane"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Last Name</label>
                            <input 
                                required
                                value={newStudentName.last}
                                onChange={e => setNewStudentName(p => ({ ...p, last: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none"
                                placeholder="Doe"
                            />
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 flex gap-2">
                        <div className="shrink-0 mt-0.5"><Check className="w-4 h-4" /></div>
                        <p>Credentials will be auto-generated upon enrollment. Be sure to copy the password immediately.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 bg-brand-accent text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            Confirm Enrollment
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}
