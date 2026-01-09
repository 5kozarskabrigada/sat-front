import React, { useState } from 'react'
import axios from 'axios'
import { API_URL } from '../../config'
import { useAuthStore } from '../../store/authStore'
import { useFetch } from '../../hooks/useFetch'
import { Plus, Edit3, Trash2, BookOpen, Search, X, Loader2, Users } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../../components/Modals'

interface Exam {
  id: string
  code: string
  title: string
  createdAt: string
  isRestricted: boolean
}

interface Student {
  id: string
  firstName: string
  lastName: string
  username: string
}

export default function ExamLibrary() {
  const { token } = useAuthStore()
  const navigate = useNavigate()
  // Key matches Login.tsx prefetch
  const { data: exams, loading, error, mutate } = useFetch<Exam[]>(`${API_URL}/api/admin/exams`, 'admin-exams')
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newExam, setNewExam] = useState({ title: '', code: '' })

  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API_URL}/api/admin/upload-exam`, newExam, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Redirect to Architect immediately
      navigate(`/admin/architect/${res.data.id}`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return
    try {
      await axios.delete(`${API_URL}/api/admin/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      mutate() // Refresh list
    } catch (err) {
      console.error(err)
    }
  }
  
  const openAssignModal = async (exam: Exam) => {
      setSelectedExam(exam)
      setIsAssignModalOpen(true)
      setLoadingStudents(true)
      try {
          const res = await axios.get(`${API_URL}/api/admin/students`, {
              headers: { Authorization: `Bearer ${token}` }
          })
          setStudents(res.data)
      } catch (err) {
          console.error(err)
          alert("Failed to load students")
      } finally {
          setLoadingStudents(false)
      }
  }

  const handleAssignSubmit = async () => {
      if (!selectedExam) return
      setAssigning(true)
      try {
          await axios.post(`${API_URL}/api/admin/exams/${selectedExam.id}/assign`, Array.from(selectedStudentIds), {
              headers: { Authorization: `Bearer ${token}` }
          })
          alert("Assignments updated successfully!")
          setIsAssignModalOpen(false)
          mutate()
      } catch (err) {
          console.error(err)
          alert("Failed to assign students")
      } finally {
          setAssigning(false)
      }
  }

  const toggleStudentSelection = (id: string) => {
      setSelectedStudentIds(prev => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
      })
  }

  // Header Portal
  const HeaderActions = () => {
    const el = document.getElementById('header-actions')
    if (!el) return null
    return createPortal(
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        New Exam
      </button>,
      el
    )
  }

  return (
    <div>
      <HeaderActions />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Loading Exams...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-red-500">
            <p className="text-sm font-bold">Failed to load exams.</p>
            <p className="text-xs">{error}</p>
            <button onClick={() => mutate()} className="mt-2 text-indigo-600 hover:underline text-xs">Try Again</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams?.map(exam => (
                <div key={exam.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    <div className={`h-1 w-full ${exam.isRestricted ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg ${exam.isRestricted ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => openAssignModal(exam)}
                                    className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                    title="Assign Students"
                                >
                                    <Users className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(exam.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">{exam.title}</h3>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {exam.code}
                            </span>
                            {exam.isRestricted && (
                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                    Restricted
                                </span>
                            )}
                        </div>

                        <button 
                            onClick={() => navigate(`/admin/architect/${exam.id}`)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-all border border-gray-200"
                        >
                            <Edit3 className="w-4 h-4" />
                            Launch Architect
                        </button>
                    </div>
                </div>
            ))}

            {exams?.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                    <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Exams Created</h3>
                    <p className="text-gray-500 mt-1">Click "New Exam" to start building.</p>
                </div>
            )}
        </div>
      )}

      {/* Assignment Modal */}
      <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign Students to ${selectedExam?.title}`}
      >
          <div className="space-y-4">
              <p className="text-sm text-gray-500">
                  Select students who should have access to this exam. If any students are selected, the exam becomes <strong>Restricted</strong>.
              </p>
              
              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {loadingStudents ? (
                      <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400"/></div>
                  ) : (
                      students.map(student => (
                          <div 
                              key={student.id} 
                              className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${selectedStudentIds.has(student.id) ? 'bg-indigo-50' : ''}`}
                              onClick={() => toggleStudentSelection(student.id)}
                          >
                              <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${selectedStudentIds.has(student.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                  {selectedStudentIds.has(student.id) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div>
                                  <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                                  <div className="text-xs text-gray-500">@{student.username}</div>
                              </div>
                          </div>
                      ))
                  )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
                  <button 
                      onClick={handleAssignSubmit}
                      disabled={assigning}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                      {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Assignments
                  </button>
              </div>
          </div>
      </Modal>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Create New Exam</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleCreateExam} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exam Title</label>
                        <input 
                            required
                            value={newExam.title}
                            onChange={e => setNewExam(p => ({ ...p, title: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. SAT Practice Test #1"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Access Code (6-Digits)</label>
                        <input 
                            required
                            value={newExam.code}
                            onChange={e => setNewExam(p => ({ ...p, code: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                            placeholder="e.g. 982103"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Create & Launch Architect
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}
