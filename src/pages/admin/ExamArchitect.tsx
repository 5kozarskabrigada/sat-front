import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../../config'
import { useAuthStore } from '../../store/authStore'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { 
    ChevronLeft, Save, Plus, Trash2, Layout, FileText, 
    CheckCircle2, X, MoreVertical, Settings, Loader2
} from 'lucide-react'
import clsx from 'clsx'

// Types
interface Question {
    id: string
    section: string
    module: number
    questionText: string
    choices: string[]
    correctAnswer: string
    explanation?: string
    difficulty?: string
}

interface ExamDetails {
    id: string
    title: string
    code: string
    questions: Question[]
}

export default function ExamArchitect() {
    const { examId } = useParams()
    const { token } = useAuthStore()
    const navigate = useNavigate()
    
    const [exam, setExam] = useState<ExamDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingError, setLoadingError] = useState(false)
    const [activeSection, setActiveSection] = useState<'Reading' | 'Math'>('Reading')
    const [activeModule, setActiveModule] = useState<1 | 2>(1)
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
    
    // Editor State
    const [editorState, setEditorState] = useState<Question | null>(null)
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchExam()
    }, [examId])

    const fetchExam = async () => {
        setLoading(true)
        setLoadingError(false)
        
        // Timeout safeguard
        const timeoutId = setTimeout(() => {
            if (loading) setLoadingError(true)
        }, 15000)

        try {
            const res = await axios.get(`${API_URL}/api/admin/exams/${examId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setExam(res.data)
            clearTimeout(timeoutId)
        } catch (err) {
            console.error(err)
            setLoadingError(true)
        } finally {
            setLoading(false)
        }
    }

    // Filter questions for the hierarchy
    const filteredQuestions = exam?.questions.filter(q => 
        q.section === activeSection && q.module === activeModule
    ) || []

    // Load question into editor
    useEffect(() => {
        if (selectedQuestionId && exam) {
            const q = exam.questions.find(q => q.id === selectedQuestionId)
            if (q) setEditorState(JSON.parse(JSON.stringify(q))) // Deep copy
            setIsDirty(false)
        } else {
            setEditorState(null)
        }
    }, [selectedQuestionId, exam])

    const handleSave = async () => {
        if (!editorState || !selectedQuestionId) return
        setSaving(true)
        try {
            // Update local state first for responsiveness
            setExam(prev => {
                if (!prev) return null
                return {
                    ...prev,
                    questions: prev.questions.map(q => q.id === selectedQuestionId ? editorState : q)
                }
            })

            // Send to API
            await axios.put(`${API_URL}/api/admin/questions/${selectedQuestionId}`, {
                section: editorState.section,
                module: editorState.module,
                questionText: editorState.questionText,
                choices: editorState.choices,
                correctAnswer: editorState.correctAnswer,
                explanation: editorState.explanation,
                difficulty: editorState.difficulty
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            setIsDirty(false)
        } catch (err) {
            console.error(err)
            alert('Failed to save question')
        } finally {
            setSaving(false)
        }
    }

    const handleAddQuestion = async () => {
        if (!exam) return
        const newQuestion = {
            section: activeSection,
            module: activeModule,
            questionText: 'New Question',
            choices: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            explanation: '',
            difficulty: 'Medium'
        }

        try {
            // Backend expects a LIST of questions to add.
            // I'll send one.
            await axios.post(`${API_URL}/api/admin/exams/${examId}/questions`, [newQuestion], {
                headers: { Authorization: `Bearer ${token}` }
            })
            fetchExam() // Refresh to get the ID
        } catch (err) {
            console.error(err)
        }
    }

    const handleDeleteQuestion = async () => {
        if (!selectedQuestionId) return
        if (!confirm('Delete this question?')) return
        try {
            await axios.delete(`${API_URL}/api/admin/questions/${selectedQuestionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setExam(prev => prev ? ({...prev, questions: prev.questions.filter(q => q.id !== selectedQuestionId)}) : null)
            setSelectedQuestionId(null)
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 text-brand-muted">
            {loadingError ? (
                <>
                    <div className="text-red-500 font-bold text-lg">Taking longer than expected...</div>
                    <p className="text-sm max-w-md text-center">The server is waking up or experiencing heavy load. Please try again.</p>
                    <button 
                        onClick={fetchExam}
                        className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-bold flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4 animate-spin" /> Retry Connection
                    </button>
                </>
            ) : (
                <>
                    <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
                    <div className="font-medium animate-pulse">Loading Exam Architect...</div>
                </>
            )}
        </div>
    )

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Global Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/library')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <input 
                            value={exam?.title || ''}
                            className="text-lg font-bold text-brand-dark bg-transparent border-none focus:ring-0 p-0 w-64 truncate"
                            readOnly // TODO: Implement Exam Title Edit
                        />
                        <div className="flex items-center gap-2 text-xs text-brand-muted">
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">CODE: {exam?.code}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>Draft</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className={clsx("text-xs font-medium transition-opacity flex items-center gap-1", isDirty ? "text-amber-600 opacity-100" : "opacity-0")}>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        Unsaved Changes
                    </span>
                    <button 
                        onClick={handleSave}
                        disabled={!isDirty || saving}
                        className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            {/* Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                <PanelGroup direction="horizontal">
                    
                    {/* HIERARCHY PANEL (LEFT) */}
                    <Panel defaultSize={20} minSize={15} maxSize={30} className="bg-white border-r border-gray-200 flex flex-col">
                        <div className="p-2 border-b border-gray-200 flex gap-1">
                            <button 
                                onClick={() => setActiveSection('Reading')}
                                className={clsx("flex-1 py-1.5 text-xs font-bold rounded-md transition-colors", activeSection === 'Reading' ? "bg-brand-secondary text-brand-primary" : "text-gray-500 hover:bg-gray-50")}
                            >
                                Reading
                            </button>
                            <button 
                                onClick={() => setActiveSection('Math')}
                                className={clsx("flex-1 py-1.5 text-xs font-bold rounded-md transition-colors", activeSection === 'Math' ? "bg-brand-secondary text-brand-primary" : "text-gray-500 hover:bg-gray-50")}
                            >
                                Math
                            </button>
                        </div>
                        <div className="p-2 border-b border-gray-200 flex gap-1">
                            <button 
                                onClick={() => setActiveModule(1)}
                                className={clsx("flex-1 py-1 text-xs font-medium rounded transition-colors", activeModule === 1 ? "bg-gray-100 text-brand-dark" : "text-gray-400 hover:text-gray-600")}
                            >
                                Module 1
                            </button>
                            <button 
                                onClick={() => setActiveModule(2)}
                                className={clsx("flex-1 py-1 text-xs font-medium rounded transition-colors", activeModule === 2 ? "bg-gray-100 text-brand-dark" : "text-gray-400 hover:text-gray-600")}
                            >
                                Module 2
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filteredQuestions.map((q, idx) => (
                                <button 
                                    key={q.id}
                                    onClick={() => setSelectedQuestionId(q.id)}
                                    className={clsx(
                                        "w-full text-left p-3 rounded-lg border text-sm transition-all group relative",
                                        selectedQuestionId === q.id 
                                            ? "bg-brand-primary text-white border-brand-primary shadow-md" 
                                            : "bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                    )}
                                >
                                    <span className="font-bold mr-2">Q{idx + 1}</span>
                                    <span className="opacity-80 truncate">{q.questionText.substring(0, 20)}...</span>
                                </button>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-200">
                            <button 
                                onClick={handleAddQuestion}
                                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm font-bold hover:border-brand-accent hover:text-brand-accent transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Question
                            </button>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-brand-accent transition-colors" />

                    {/* EDITOR PANEL (CENTER) */}
                    <Panel className="bg-gray-50 flex flex-col">
                        {editorState ? (
                            <div className="flex-1 overflow-y-auto p-8">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    
                                    {/* Metadata Card */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider flex items-center gap-2">
                                                <Settings className="w-4 h-4" /> Configuration
                                            </h3>
                                            <button onClick={handleDeleteQuestion} className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1">
                                                <Trash2 className="w-3 h-3" /> Delete
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Difficulty</label>
                                                <select 
                                                    value={editorState.difficulty || 'Medium'}
                                                    onChange={e => { setEditorState({...editorState, difficulty: e.target.value}); setIsDirty(true) }}
                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                >
                                                    <option>Easy</option>
                                                    <option>Medium</option>
                                                    <option>Hard</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Domain / Skill</label>
                                                <input 
                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm" 
                                                    placeholder="e.g. Algebra" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Question Editor */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                                        <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Content
                                        </h3>
                                        
                                        <textarea 
                                            value={editorState.questionText}
                                            onChange={e => { setEditorState({...editorState, questionText: e.target.value}); setIsDirty(true) }}
                                            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none resize-y font-serif text-lg"
                                            placeholder="Type the question prompt (and passage) here..."
                                        />
                                    </div>

                                    {/* Options Editor */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider flex items-center gap-2 mb-4">
                                            <Layout className="w-4 h-4" /> Answer Choices
                                        </h3>
                                        <div className="space-y-3">
                                            {editorState.choices.map((choice, idx) => {
                                                const isCorrect = editorState.correctAnswer === choice
                                                return (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => { setEditorState({...editorState, correctAnswer: choice}); setIsDirty(true) }}
                                                            className={clsx(
                                                                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                                                isCorrect ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-gray-400 hover:border-gray-400"
                                                            )}
                                                        >
                                                            {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : String.fromCharCode(65 + idx)}
                                                        </button>
                                                        <input 
                                                            value={choice}
                                                            onChange={e => {
                                                                const newChoices = [...editorState.choices]
                                                                newChoices[idx] = e.target.value
                                                                // If this was the correct answer, update that too so they stay in sync
                                                                let newCorrect = editorState.correctAnswer
                                                                if (isCorrect) newCorrect = e.target.value
                                                                
                                                                setEditorState({...editorState, choices: newChoices, correctAnswer: newCorrect})
                                                                setIsDirty(true)
                                                            }}
                                                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none"
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <Layout className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select a question to edit or create a new one.</p>
                            </div>
                        )}
                    </Panel>

                </PanelGroup>
            </div>
        </div>
    )
}
