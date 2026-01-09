import React, { useState } from 'react'
import axios from 'axios'
import { API_URL } from '../../config'
import { useAuthStore } from '../../store/authStore'
import { useFetch } from '../../hooks/useFetch'
import { Plus, Edit3, Trash2, BookOpen, Search, X, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

interface Exam {
  id: string
  code: string
  title: string
  createdAt: string
}

export default function ExamLibrary() {
  const { token } = useAuthStore()
  const navigate = useNavigate()
  // Key matches Login.tsx prefetch
  const { data: exams, loading, error, mutate } = useFetch<Exam[]>(`${API_URL}/api/admin/exams`, 'admin-exams')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newExam, setNewExam] = useState({ title: '', code: '' })

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

  // Header Portal
  const HeaderActions = () => {
    const el = document.getElementById('header-actions')
    if (!el) return null
    return createPortal(
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm"
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
                <div key={exam.id} className="bg-white rounded-xl border border-gray-200 shadow-panel hover:shadow-lg transition-shadow overflow-hidden group">
                    <div className="h-2 bg-brand-primary w-full"></div>
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-brand-secondary rounded-lg text-brand-primary">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDelete(exam.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-brand-dark mb-1">{exam.title}</h3>
                        <p className="text-sm font-mono text-brand-muted bg-gray-50 px-2 py-1 rounded w-fit mb-6">
                            Code: {exam.code}
                        </p>

                        <button 
                            onClick={() => navigate(`/admin/architect/${exam.id}`)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-secondary hover:bg-brand-primary hover:text-white text-brand-dark font-medium rounded-lg transition-all"
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-brand-dark">Create New Exam</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleCreateExam} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Exam Title</label>
                        <input 
                            required
                            value={newExam.title}
                            onChange={e => setNewExam(p => ({ ...p, title: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none"
                            placeholder="e.g. SAT Practice Test #1"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Access Code (6-Digits)</label>
                        <input 
                            required
                            value={newExam.code}
                            onChange={e => setNewExam(p => ({ ...p, code: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none font-mono"
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
                            className="px-4 py-2 bg-brand-accent text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm"
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
