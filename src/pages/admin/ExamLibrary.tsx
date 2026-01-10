import React, { useState } from 'react'
import axios from 'axios'
import { API_URL } from '../../config'
import { useAuthStore } from '../../store/authStore'
import { useFetch } from '../../hooks/useFetch'
import { Plus, Edit3, Trash2, BookOpen, X, Loader2, Users, Check, GraduationCap, Play, StopCircle } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../../components/Modals'
import clsx from 'clsx'

interface Exam {
  id: string
  code: string
  title: string
  createdAt: string
  isRestricted: boolean
  type: 'mock' | 'practice'
  status: 'draft' | 'live' | 'archived'
}

interface Student {
  id: string
  firstName: string
  lastName: string
  username: string
}

interface Classroom {
  id: string
  name: string
}

export default function ExamLibrary() {
  const { token } = useAuthStore()
  const navigate = useNavigate()
  const { data: exams, loading, error, mutate } = useFetch<Exam[]>(`${API_URL}/api/admin/exams`, 'admin-exams')
  
  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newExam, setNewExam] = useState({ title: '', code: '', type: 'mock' })

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  
  // Assignment Data
  const [students, setStudents] = useState<Student[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null)
  
  // Loading States
  const [loadingData, setLoadingData] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [activeTab, setActiveTab] = useState<'students' | 'classrooms'>('students')

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API_URL}/api/admin/upload-exam`, newExam, {
        headers: { Authorization: `Bearer ${token}` }
      })
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
      mutate()
    } catch (err) {
      console.error(err)
    }
  }
  
  const handleToggleStatus = async (exam: Exam) => {
    const newStatus = exam.status === 'live' ? 'draft' : 'live'
    
    try {
      await axios.put(`${API_URL}/api/admin/exams/${exam.id}`, { 
        code: exam.code, 
        title: exam.title, 
        status: newStatus 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      mutate() // Re-fetch to confirm
    } catch (err) {
      console.error(err)
      mutate() // Revert on error
    }
  }

  const openAssignModal = async (exam: Exam) => {
      setSelectedExam(exam)
      setIsAssignModalOpen(true)
      setLoadingData(true)
      try {
          const [studentsRes, classroomsRes] = await Promise.all([
            axios.get(`${API_URL}/api/admin/students`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/api/admin/classrooms`, { headers: { Authorization: `Bearer ${token}` } })
          ])
          setStudents(studentsRes.data)
          setClassrooms(classroomsRes.data)
      } catch (err) {
          console.error(err)
          alert("Failed to load data")
      } finally {
          setLoadingData(false)
      }
  }

  const handleAssignStudents = async () => {
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

  const handleAssignClassroom = async () => {
    if (!selectedExam || !selectedClassroomId) return
    setAssigning(true)
    try {
      await axios.post(`${API_URL}/api/admin/exams/${selectedExam.id}/assign-classroom/${selectedClassroomId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert("Classroom assigned successfully!")
      setIsAssignModalOpen(false)
      mutate()
    } catch (err) {
      console.error(err)
      alert("Failed to assign classroom")
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

  const HeaderActions = () => {
    const el = document.getElementById('header-actions')
    if (!el) return null
    return createPortal(
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-accent/90 transition-colors shadow-sm"
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
            <button onClick={() => mutate()} className="mt-2 text-brand-accent hover:underline text-xs">Try Again</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams?.map(exam => (
                <div key={exam.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group flex flex-col h-full">
                    {/* Status Bar */}
                    <div className={clsx("h-1.5 w-full", {
                      'bg-green-500': exam.status === 'live',
                      'bg-gray-300': exam.status === 'draft',
                      'bg-amber-500': exam.status === 'archived'
                    })}></div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className={clsx("p-2 rounded-lg", {
                              'bg-green-50 text-green-700': exam.status === 'live',
                              'bg-gray-100 text-gray-600': exam.status !== 'live'
                            })}>
                                <BookOpen className="w-6 h-6" />
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => handleToggleStatus(exam)}
                                    className={clsx("p-1.5 rounded transition-colors", {
                                      "text-green-600 hover:bg-green-50": exam.status !== 'live',
                                      "text-red-500 hover:bg-red-50": exam.status === 'live'
                                    })}
                                    title={exam.status === 'live' ? "Stop Exam" : "Go Live"}
                                >
                                    {exam.status === 'live' ? <StopCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
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
                        
                        <div className="flex flex-wrap gap-2 mb-6 mt-2">
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {exam.code}
                            </span>
                            <span className={clsx("text-xs font-medium px-2 py-0.5 rounded border capitalize", {
                              'bg-green-50 text-green-700 border-green-100': exam.status === 'live',
                              'bg-gray-50 text-gray-600 border-gray-200': exam.status !== 'live'
                            })}>
                              {exam.status}
                            </span>
                            <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 capitalize">
                              {exam.type}
                            </span>
                            {exam.isRestricted && (
                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                    Restricted
                                </span>
                            )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-50">
                          <button 
                              onClick={() => navigate(`/admin/architect/${exam.id}`)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-all border border-gray-200 hover:border-gray-300"
                          >
                              <Edit3 className="w-4 h-4" />
                              Edit Content
                          </button>
                        </div>
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
          title={`Assign Access: ${selectedExam?.title}`}
      >
          <div className="space-y-4">
              <div className="flex border-b border-gray-200">
                <button 
                  onClick={() => setActiveTab('students')}
                  className={clsx("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === 'students' ? "border-brand-accent text-brand-accent" : "border-transparent text-gray-500 hover:text-gray-700")}
                >
                  Individual Students
                </button>
                <button 
                  onClick={() => setActiveTab('classrooms')}
                  className={clsx("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === 'classrooms' ? "border-brand-accent text-brand-accent" : "border-transparent text-gray-500 hover:text-gray-700")}
                >
                  By Classroom
                </button>
              </div>

              {loadingData ? (
                  <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400"/></div>
              ) : (
                <div className="min-h-[200px]">
                  {activeTab === 'students' ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">Select individual students to grant access.</p>
                      <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                          {students.map(student => (
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
                          ))}
                      </div>
                      <button 
                        onClick={handleAssignStudents}
                        disabled={assigning || selectedStudentIds.size === 0}
                        className="w-full py-2 bg-brand-accent text-white rounded-lg text-sm font-medium hover:bg-brand-accent/90 disabled:opacity-50"
                      >
                        {assigning ? 'Saving...' : `Assign ${selectedStudentIds.size} Students`}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">Assign this exam to an entire classroom.</p>
                      <div className="space-y-2">
                        {classrooms.map(classroom => (
                          <label key={classroom.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input 
                              type="radio" 
                              name="classroom" 
                              value={classroom.id}
                              checked={selectedClassroomId === classroom.id}
                              onChange={() => setSelectedClassroomId(classroom.id)}
                              className="text-brand-accent focus:ring-brand-accent mr-3"
                            />
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900">{classroom.name}</span>
                            </div>
                          </label>
                        ))}
                        {classrooms.length === 0 && (
                          <div className="text-center py-4 text-sm text-gray-400 italic">No classrooms available.</div>
                        )}
                      </div>
                      <button 
                        onClick={handleAssignClassroom}
                        disabled={assigning || !selectedClassroomId}
                        className="w-full py-2 bg-brand-accent text-white rounded-lg text-sm font-medium hover:bg-brand-accent/90 disabled:opacity-50"
                      >
                        {assigning ? 'Assigning...' : 'Assign to Classroom'}
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Access Code</label>
                          <input 
                              required
                              value={newExam.code}
                              onChange={e => setNewExam(p => ({ ...p, code: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                              placeholder="e.g. 982103"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                          <select 
                            value={newExam.type}
                            onChange={e => setNewExam(p => ({ ...p, type: e.target.value as 'mock' | 'practice' }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          >
                            <option value="mock">Full Mock</option>
                            <option value="practice">Practice</option>
                          </select>
                      </div>
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
                            className="px-4 py-2 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-accent/90 transition-colors shadow-sm"
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
