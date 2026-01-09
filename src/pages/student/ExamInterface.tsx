import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { ChevronLeft, ChevronRight, Clock, Calculator, Map, MoreVertical, Flag, PenTool, X } from 'lucide-react'
import { API_URL } from '../../config'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import clsx from 'clsx'

export default function ExamInterface() {
  const { examId } = useParams()
  const { token } = useAuthStore()
  const navigate = useNavigate()
  
  const [examData, setExamData] = useState<any>(null)
  const [studentExamId, setStudentExamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [showNavigator, setShowNavigator] = useState(false)
  const [timeLeft, setTimeLeft] = useState(32 * 60) // 32 mins default
  
  // Start Exam on mount
  useEffect(() => {
    const startExam = async () => {
      try {
        const res = await axios.post(`${API_URL}/api/student/exams/${examId}/start`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setExamData(res.data.exam)
        setStudentExamId(res.data.studentExamId)
        setLoading(false)
      } catch (err) {
        console.error(err)
        alert('Failed to start exam')
        navigate('/student')
      }
    }
    startExam()
  }, [examId, token, navigate])

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleAnswer = async (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }))
    if (!studentExamId) return
    try {
        await axios.post(`${API_URL}/api/student/exams/attempt/${studentExamId}/submit-answer`, {
            questionId,
            selectedAnswer: answer,
            timeSpentSeconds: 0 
        }, { headers: { Authorization: `Bearer ${token}` } })
    } catch (err) { console.error("Auto-save failed", err) }
  }

  const toggleMarkReview = (questionId: string) => {
    const newSet = new Set(markedForReview)
    if (newSet.has(questionId)) newSet.delete(questionId)
    else newSet.add(questionId)
    setMarkedForReview(newSet)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-brand-dark text-white">
      <div className="animate-spin w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full mb-4"></div>
      <p>Preparing Exam Environment...</p>
    </div>
  )

  const question = examData?.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === (examData?.questions.length || 0) - 1

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans text-brand-dark">
      
      {/* --- HEADER --- */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 select-none">
        
        {/* Left: Section Info */}
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight">Section 1: Reading and Writing</span>
          <span className="text-xs text-gray-500 font-medium">Questions {currentQuestionIndex + 1} of {examData?.questions.length}</span>
        </div>

        {/* Center: Tools & Timer */}
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 font-mono text-sm font-medium border border-gray-200 shadow-inner">
             <Clock size={16} className="text-brand-primary" />
             {timeLeft < 300 ? <span className="text-red-600 animate-pulse">{formatTime(timeLeft)}</span> : <span>{formatTime(timeLeft)}</span>}
             <span className="text-xs text-gray-400 ml-1">| Hide</span>
           </div>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded text-brand-primary flex flex-col items-center gap-0.5" title="Annotate">
                <PenTool size={18} />
                <span className="text-[10px] font-bold">Annotate</span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded text-brand-primary flex flex-col items-center gap-0.5" title="Calculator">
                <Calculator size={18} />
                <span className="text-[10px] font-bold">Calc</span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded text-brand-primary flex flex-col items-center gap-0.5" title="More">
                <MoreVertical size={18} />
                <span className="text-[10px] font-bold">More</span>
            </button>
        </div>
      </header>


      {/* --- SPLITTER CONTENT --- */}
      <div className="flex-1 overflow-hidden relative">
        <PanelGroup direction="horizontal">
            
            {/* LEFT PANEL: PASSAGE */}
            <Panel defaultSize={50} minSize={30} className="flex flex-col">
                <div className="flex-1 overflow-y-auto p-8 font-serif text-lg leading-loose text-gray-800 selection:bg-brand-exam-highlight selection:text-black">
                    {/* Placeholder for real passage content if API had it */}
                    <div className="mb-4 text-sm font-sans text-gray-500 bg-gray-50 border p-2 rounded">
                        <strong>Passage</strong> • Read the text and answer the question.
                    </div>
                    <p>
                        {question?.text || "The passage content would appear here. Since the current mock data combines question and passage, imagine a long academic text here about the migration patterns of monarch butterflies or the economic theories of Adam Smith."}
                    </p>
                    <p className="mt-4">
                        "Ideally, the question stem below would refer back to this text, asking for the main idea, a specific detail, or an inference based on the author's tone."
                    </p>
                </div>
            </Panel>

            <PanelResizeHandle className="w-2 bg-gray-100 border-l border-r border-gray-200 hover:bg-brand-accent/20 transition-colors flex items-center justify-center cursor-col-resize group">
                <div className="h-8 w-1 bg-gray-300 rounded-full group-hover:bg-brand-accent"></div>
            </PanelResizeHandle>

            {/* RIGHT PANEL: QUESTION */}
            <Panel defaultSize={50} minSize={30} className="flex flex-col bg-gray-50/50">
                <div className="flex-1 overflow-y-auto p-8">
                     {/* Question Stem */}
                    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm mb-6">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-brand-dark text-white text-xs font-bold px-2 py-1 rounded">Question {currentQuestionIndex + 1}</span>
                            <button 
                                onClick={() => toggleMarkReview(question?.id)}
                                className={clsx(
                                    "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border transition-colors",
                                    markedForReview.has(question?.id) 
                                        ? "bg-brand-exam-review text-white border-brand-exam-review" 
                                        : "text-gray-500 border-gray-300 hover:border-gray-400"
                                )}
                            >
                                <Flag size={12} fill={markedForReview.has(question?.id) ? "currentColor" : "none"} />
                                {markedForReview.has(question?.id) ? "Marked" : "Mark for Review"}
                            </button>
                        </div>
                        <p className="text-gray-900 font-medium text-lg">{question?.text}</p>
                    </div>

                    {/* Choices */}
                    <div className="space-y-3">
                        {question?.choices.map((choice: string, idx: number) => {
                            const isSelected = selectedAnswers[question.id] === choice
                            const letter = String.fromCharCode(65 + idx)
                            return (
                                <button 
                                    key={idx}
                                    onClick={() => handleAnswer(question.id, choice)}
                                    className={clsx(
                                        "w-full text-left p-4 rounded-lg border-2 flex items-center gap-4 group transition-all duration-200",
                                        isSelected 
                                            ? "border-brand-primary bg-brand-primary/5 shadow-md" 
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors",
                                        isSelected
                                            ? "bg-brand-primary text-white border-brand-primary"
                                            : "bg-white text-gray-500 border-gray-300 group-hover:border-gray-400"
                                    )}>
                                        {letter}
                                    </div>
                                    <span className={clsx("text-base", isSelected ? "font-semibold text-brand-primary" : "text-gray-700")}>
                                        {choice}
                                    </span>
                                    {isSelected && (
                                        <div className="ml-auto w-3 h-3 rounded-full bg-brand-primary"></div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </Panel>

        </PanelGroup>

        {/* --- NAVIGATOR POPUP --- */}
        {showNavigator && (
            <div className="absolute inset-x-0 bottom-0 top-16 bg-white/90 backdrop-blur-sm z-50 p-8 flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-200">
                <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col h-full max-h-[600px]">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Map className="w-5 h-5" /> Question Navigator
                        </h3>
                        <button onClick={() => setShowNavigator(false)} className="p-2 hover:bg-gray-200 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-8 overflow-y-auto grid grid-cols-5 sm:grid-cols-10 gap-4">
                        {examData?.questions.map((q: any, i: number) => {
                            const isAns = !!selectedAnswers[q.id]
                            const isMarked = markedForReview.has(q.id)
                            const isCurrent = i === currentQuestionIndex
                            return (
                                <button 
                                    key={q.id}
                                    onClick={() => { setCurrentQuestionIndex(i); setShowNavigator(false) }}
                                    className={clsx(
                                        "relative h-12 w-full rounded border flex items-center justify-center font-bold text-sm transition-all",
                                        isCurrent ? "ring-2 ring-brand-accent ring-offset-2 border-brand-primary" : "",
                                        isAns ? "bg-brand-exam-answered text-white border-brand-exam-answered" : "bg-white text-brand-primary border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    {i + 1}
                                    {isMarked && (
                                        <div className="absolute -top-1.5 -right-1.5 text-brand-exam-review drop-shadow-sm">
                                            <Flag size={14} fill="currentColor" />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                    <div className="p-4 bg-gray-50 border-t text-xs text-gray-500 flex gap-6 justify-center rounded-b-xl">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-brand-exam-answered rounded border"></div> Answered</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border border-gray-300 rounded"></div> Unanswered</div>
                        <div className="flex items-center gap-2"><div className="flex items-center justify-center w-4 h-4"><Flag size={12} className="text-brand-exam-review" fill="currentColor"/></div> Marked</div>
                    </div>
                </div>
            </div>
        )}
      </div>


      {/* --- FOOTER --- */}
      <footer className="h-16 border-t bg-white flex items-center justify-between px-6 shrink-0 relative z-40">
        <div className="font-bold text-brand-primary flex flex-col">
            <span className="text-xs uppercase text-gray-400 tracking-wider">Student</span>
            {localStorage.getItem('username') || 'Guest'}
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2">
            <button 
                onClick={() => setShowNavigator(!showNavigator)}
                className={clsx(
                    "px-6 py-2 rounded-full font-bold text-sm border transition-all",
                    showNavigator 
                        ? "bg-brand-primary text-white border-brand-primary shadow-lg" 
                        : "bg-white text-brand-primary border-gray-300 hover:bg-gray-50 shadow-sm"
                )}
            >
                {showNavigator ? "Close Navigator" : "Question Navigator"}
            </button>
        </div>

        <div className="flex gap-3">
            <button 
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(p => p - 1)}
                className="px-5 py-2.5 rounded-lg bg-brand-primary text-white font-bold text-sm hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Back
            </button>
            <button 
                disabled={isLastQuestion}
                onClick={() => isLastQuestion ? null : setCurrentQuestionIndex(p => p + 1)}
                className={clsx(
                    "px-8 py-2.5 rounded-lg font-bold text-sm transition-colors",
                    isLastQuestion 
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                        : "bg-brand-accent text-white hover:bg-blue-600 shadow-md hover:shadow-lg"
                )}
            >
                Next
            </button>
        </div>
      </footer>
    </div>
  )
}
