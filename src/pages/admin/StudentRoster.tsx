import React, { useState } from 'react'
import axios from 'axios'
import { API_URL } from '../../config'
import { useAuthStore } from '../../store/authStore'
import { useFetch } from '../../hooks/useFetch'
import { Eye, EyeOff, UserPlus, Search, X, Check, Loader2, Edit2, Trash2, RefreshCw } from 'lucide-react'
import { createPortal } from 'react-dom'
import { ConfirmModal, Modal } from '../../components/Modals'

interface Student {
  id: string
  firstName: string
  lastName: string
  username: string
  plainPassword?: string // Added for MVP visibility
  role: string
  createdAt: string
}

export default function StudentRoster() {
  const { token } = useAuthStore()
  // Key matches the one used in Login.tsx prefetch
  const { data: students, loading, error, isSlow, mutate } = useFetch<Student[]>(`${API_URL}/api/admin/students`, 'admin-students')
  
  // Modal States
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  
  // Selection States
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [newStudentName, setNewStudentName] = useState({ first: '', last: '' })
  const [editStudentData, setEditStudentData] = useState({ first: '', last: '' })
  const [createdCredentials, setCreatedCredentials] = useState<any[]>([])
  const [resetCredentials, setResetCredentials] = useState<{id: string, password: string} | null>(null)
  
  // Loading States for Actions
  const [actionLoading, setActionLoading] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())

  const togglePasswordVisibility = (id: string) => {
      setVisiblePasswords(prev => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
      })
  }

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/admin/create-students`, [
        { firstName: newStudentName.first, lastName: newStudentName.last }
      ], {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setCreatedCredentials(prev => [...prev, ...res.data])
      setNewStudentName({ first: '', last: '' })
      mutate()
      setIsEnrollModalOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
      if (!selectedStudent) return
      setActionLoading(true)
      try {
          await axios.delete(`${API_URL}/api/admin/students/${selectedStudent.id}`, {
              headers: { Authorization: `Bearer ${token}` }
          })
          mutate()
          setIsDeleteModalOpen(false)
      } catch (err) {
          console.error(err)
          alert('Failed to delete student')
      } finally {
          setActionLoading(false)
      }
  }

  const handleEdit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!selectedStudent) return
      setActionLoading(true)
      try {
          await axios.put(`${API_URL}/api/admin/students/${selectedStudent.id}`, {
              firstName: editStudentData.first,
              lastName: editStudentData.last
          }, {
              headers: { Authorization: `Bearer ${token}` }
          })
          mutate()
          setIsEditModalOpen(false)
      } catch (err) {
          console.error(err)
          alert('Failed to update student')
      } finally {
          setActionLoading(false)
      }
  }

  const handleResetPassword = async () => {
      if (!selectedStudent) return
      setActionLoading(true)
      try {
          const res = await axios.post(`${API_URL}/api/admin/students/${selectedStudent.id}/reset-password`, {}, {
              headers: { Authorization: `Bearer ${token}` }
          })
          setResetCredentials({ id: selectedStudent.id, password: res.data.password })
          // Auto-hide after 10s
          setTimeout(() => setResetCredentials(null), 10000)
          setIsResetModalOpen(false)
          mutate() // Refresh to get the new plain password if API returns it
      } catch (err) {
          console.error(err)
          alert('Failed to reset password')
      } finally {
          setActionLoading(false)
      }
  }

  // Header Portal for Actions
  const HeaderActions = () => {
    const el = document.getElementById('header-actions')
    if (!el) return null
    return createPortal(
      <button 
        onClick={() => setIsEnrollModalOpen(true)}
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
          <div className="text-3xl font-bold text-brand-dark">{students?.length || 0}</div>
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
                Showing all {students?.length || 0} students
            </div>
        </div>
        
        {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                {isSlow ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
                        <p className="text-sm font-medium text-amber-600 mb-2">Connecting to server...</p>
                        <p className="text-xs text-gray-400 max-w-xs text-center mb-4">This may take a moment if the server is waking up.</p>
                        <button 
                            onClick={() => mutate()}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            Retry Connection
                        </button>
                    </div>
                ) : (
                    <>
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p className="text-sm">Loading Roster...</p>
                    </>
                )}
            </div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
                <p className="text-sm font-bold">Failed to load students.</p>
                <p className="text-xs">{error}</p>
                <button onClick={() => mutate()} className="mt-2 text-brand-accent hover:underline text-xs">Try Again</button>
            </div>
        ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-brand-muted uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Password</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students?.map((student) => {
                // Check if we just created this student to show the password
                const creds = createdCredentials.find(c => c.username === student.username)
                const resetCreds = resetCredentials?.id === student.id ? resetCredentials : null
                const isPasswordVisible = visiblePasswords.has(student.id)
                
                return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-brand-dark">{student.firstName} {student.lastName}</div>
                            <div className="text-xs font-mono text-gray-400">{student.id.substring(0, 8)}...</div>
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
                            ) : resetCreds ? (
                                <div className="flex items-center gap-2 text-sm font-mono bg-blue-50 px-2 py-1 rounded border border-blue-200 text-blue-800 w-fit animate-in fade-in zoom-in">
                                    <span className="font-bold">{resetCreds.password}</span>
                                    <Check className="w-3 h-3" />
                                </div>
                            ) : student.plainPassword ? (
                                <div className="flex items-center gap-2 text-sm">
                                    {isPasswordVisible ? (
                                        <span className="font-mono font-bold text-brand-dark">{student.plainPassword}</span>
                                    ) : (
                                        <span className="text-gray-400">••••••••</span>
                                    )}
                                    <button 
                                        onClick={() => togglePasswordVisibility(student.id)}
                                        className="text-gray-400 hover:text-brand-accent transition-colors"
                                    >
                                        {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 italic">Hidden</div>
                            )}
                        </td>
                        <td className="px-6 py-4 flex items-center gap-2">
                            <button 
                                onClick={() => {
                                    setSelectedStudent(student)
                                    setEditStudentData({ first: student.firstName, last: student.lastName })
                                    setIsEditModalOpen(true)
                                }}
                                className="p-1.5 text-gray-400 hover:text-brand-accent hover:bg-blue-50 rounded transition-colors"
                                title="Edit Student"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => {
                                    setSelectedStudent(student)
                                    setIsResetModalOpen(true)
                                }}
                                className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded transition-colors group relative"
                                title="Reset Password"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => {
                                    setSelectedStudent(student)
                                    setIsDeleteModalOpen(true)
                                }}
                                className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded transition-colors shadow-sm border border-transparent hover:border-red-600"
                                title="Delete Student"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                )
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal 
          isOpen={isDeleteModalOpen} 
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Student"
          message={`Are you sure you want to delete ${selectedStudent?.firstName} ${selectedStudent?.lastName}? This action cannot be undone and will remove all their exam data.`}
          confirmText="Delete Student"
          confirmColor="red"
          loading={actionLoading}
      />

      <ConfirmModal 
          isOpen={isResetModalOpen} 
          onClose={() => setIsResetModalOpen(false)}
          onConfirm={handleResetPassword}
          title="Reset Password"
          message={`This will generate a new password for ${selectedStudent?.username}. The old password will stop working immediately.`}
          confirmText="Generate New Password"
          loading={actionLoading}
      />

      {/* Edit Modal */}
      <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Student Details"
      >
          <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-bold text-brand-muted uppercase mb-1">First Name</label>
                      <input 
                          required
                          value={editStudentData.first}
                          onChange={e => setEditStudentData(p => ({ ...p, first: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Last Name</label>
                      <input 
                          required
                          value={editStudentData.last}
                          onChange={e => setEditStudentData(p => ({ ...p, last: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none"
                      />
                  </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                  <button 
                      type="button" 
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
                  >
                      Cancel
                  </button>
                  <button 
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-2 bg-brand-accent text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm text-sm flex items-center gap-2"
                  >
                      {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                  </button>
              </div>
          </form>
      </Modal>

      {/* Enrollment Modal */}
      <Modal 
          isOpen={isEnrollModalOpen} 
          onClose={() => setIsEnrollModalOpen(false)}
          title="Enroll New Student"
      >
          <form onSubmit={handleEnroll} className="space-y-4">
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
                      onClick={() => setIsEnrollModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
                  >
                      Cancel
                  </button>
                  <button 
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-2 bg-brand-accent text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm text-sm flex items-center gap-2"
                  >
                      {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm Enrollment
                  </button>
              </div>
          </form>
      </Modal>
    </div>
  )
}
