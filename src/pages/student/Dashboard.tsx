import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../config'

export default function StudentDashboard() {
  const { token, logout } = useAuthStore()
  const navigate = useNavigate()
  const [exams, setExams] = useState<any[]>([])

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/student/exams`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setExams(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchExams()
  }, [token])

  const startExam = async (examId: string) => {
    navigate(`/exam/${examId}`)
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Exams</h1>
        <button onClick={() => { logout(); navigate('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(exam => (
          <div key={exam.id} className="bg-white p-6 rounded shadow border">
            <h3 className="text-xl font-bold mb-2">{exam.title}</h3>
            <p className="text-gray-600 mb-4">{exam.code}</p>
            <div className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-sm ${exam.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {exam.status}
                </span>
                <button 
                    onClick={() => startExam(exam.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    {exam.status === 'not_started' ? 'Start' : 'Resume'}
                </button>
            </div>
          </div>
        ))}
        {exams.length === 0 && <p className="text-gray-500">No exams assigned yet.</p>}
      </div>
    </div>
  )
}
