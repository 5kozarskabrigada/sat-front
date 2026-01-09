import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../config'
import { LogOut, PlayCircle, Clock, BookOpen, AlertCircle } from 'lucide-react'

export default function StudentDashboard() {
  const { token, logout } = useAuthStore()
  const navigate = useNavigate()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/student/exams`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setExams(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [token])

  const startExam = async (examId: string) => {
    navigate(`/exam/${examId}`)
  }

  return (
    <div className="min-h-screen bg-brand-secondary/5">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-dark rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">SAT</span>
            </div>
            <h1 className="text-xl font-bold text-brand-dark font-sans">Student Portal</h1>
          </div>
          <button 
            onClick={() => { logout(); navigate('/login') }} 
            className="flex items-center gap-2 text-brand-muted hover:text-brand-dark transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-brand-dark mb-2">Welcome Back</h2>
          <p className="text-brand-muted">Your simulation environment is ready.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white h-64 rounded-xl border border-gray-200"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => (
              <div key={exam.id} className="group bg-white rounded-xl shadow-panel border border-gray-200 overflow-hidden hover:border-brand-accent/50 transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-brand-secondary rounded-lg">
                      <BookOpen className="w-6 h-6 text-brand-primary" />
                    </div>
                    {exam.status === 'completed' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {exam.status === 'in_progress' ? 'In Progress' : 'Ready'}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-brand-dark mb-1 group-hover:text-brand-accent transition-colors">{exam.title}</h3>
                  <p className="text-sm text-brand-muted mb-6 font-mono">{exam.code}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-brand-muted mb-6">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>~134 mins</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>High Stakes</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => startExam(exam.id)}
                    className="w-full bg-brand-dark text-white px-4 py-3 rounded-lg font-medium hover:bg-brand-primary transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-brand-accent/20"
                  >
                    <PlayCircle className="w-5 h-5" />
                    {exam.status === 'not_started' ? 'Begin Simulation' : 'Resume Simulation'}
                  </button>
                </div>
                <div className="h-1 w-full bg-brand-secondary">
                  <div className="h-full bg-brand-accent w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
                </div>
              </div>
            ))}
            
            {exams.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-300 rounded-xl">
                <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Exams Available</h3>
                <p className="text-gray-500 mt-1">Check back later or contact your administrator.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
