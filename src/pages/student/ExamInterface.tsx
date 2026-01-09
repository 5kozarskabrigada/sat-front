import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { ChevronLeft, ChevronRight, Clock, Calculator } from 'lucide-react'
import { API_URL } from '../../config'

export default function ExamInterface() {
  const { examId } = useParams()
  const { token } = useAuthStore()
  const navigate = useNavigate()
  const [examData, setExamData] = useState<any>(null)
  const [studentExamId, setStudentExamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  
  // Start Exam on mount
  useEffect(() => {
    const startExam = async () => {
      try {
        const res = await axios.post(`${API_URL}/api/student/exams/${examId}/start`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setExamData(res.data.exam)
        setStudentExamId(res.data.studentExamId)
        // Load saved answers if any (not implemented in backend properly yet for resume, but startExam returns fresh)
        setLoading(false)
      } catch (err) {
        console.error(err)
        alert('Failed to start exam')
        navigate('/student')
      }
    }
    startExam()
  }, [examId, token, navigate])

  const handleAnswer = async (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }))
    // Auto-save
    if (!studentExamId) return
    try {
        await axios.post(`${API_URL}/api/student/exams/attempt/${studentExamId}/submit-answer`, {
            questionId,
            selectedAnswer: answer,
            timeSpentSeconds: 0 // TODO: Track time
        }, { headers: { Authorization: `Bearer ${token}` } })
    } catch (err) {
        console.error("Auto-save failed", err)
    }
  }

  // Correction: backend returns StartExamResponse { studentExamId, exam: ExamDetailsDto }
  // I need to store studentExamId.
  // I'll fix the state.
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading Exam...</div>

  const question = examData?.questions[currentQuestionIndex]

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-gray-50">
        <div className="font-bold text-lg">Section 1: Reading and Writing</div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-mono bg-gray-200 px-3 py-1 rounded">
                <Clock size={16} />
                <span>32:00</span>
            </div>
            <button className="flex items-center gap-2 px-3 py-1 hover:bg-gray-200 rounded">
                <Calculator size={16} />
                Calculator
            </button>
            <button className="bg-blue-600 text-white px-4 py-1 rounded">Submit</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Passage (if applicable) - For now just Question Text */}
        <div className="w-1/2 border-r p-8 overflow-y-auto">
            <p className="text-lg leading-relaxed">{question?.text}</p>
        </div>

        {/* Right: Question & Choices */}
        <div className="w-1/2 p-8 overflow-y-auto bg-gray-50">
            <div className="mb-6 font-semibold text-gray-500">Question {currentQuestionIndex + 1} of {examData?.questions.length}</div>
            <div className="space-y-4">
                {question?.choices.map((choice: string, idx: number) => (
                    <button 
                        key={idx}
                        onClick={() => handleAnswer(question.id, choice)}
                        className={`w-full text-left p-4 rounded border-2 transition ${
                            selectedAnswers[question.id] === choice 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                        <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}</span>
                        {choice}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="h-16 border-t flex items-center justify-between px-6 bg-gray-50">
        <div className="font-bold">{localStorage.getItem('username')}</div>
        <div className="flex gap-2">
            <button 
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(p => p - 1)}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 flex items-center gap-2"
            >
                <ChevronLeft size={20} /> Back
            </button>
            <button 
                disabled={currentQuestionIndex === (examData?.questions.length || 0) - 1}
                onClick={() => setCurrentQuestionIndex(p => p + 1)}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 flex items-center gap-2"
            >
                Next <ChevronRight size={20} />
            </button>
        </div>
      </div>
    </div>
  )
}
