import React, { useEffect, useState, useRef } from 'react'
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
    domain?: string
    skill?: string
}

interface ExamStructure {
    id: string
    title: string
    code: string
    questions: Question[]
}

export default function ExamArchitect() {
    const { examId } = useParams()
    const { token } = useAuthStore()
    const navigate = useNavigate()
    
    const [structure, setStructure] = useState<ExamStructure | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingError, setLoadingError] = useState(false)
    const [activeSection, setActiveSection] = useState<'Reading' | 'Math'>('Reading')
    const [activeModule, setActiveModule] = useState<1 | 2>(1)
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
    
    // Editor State
    const [editorState, setEditorState] = useState<Question | null>(null)
    const [loadingQuestion, setLoadingQuestion] = useState(false)
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const passageRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        fetchStructure()
    }, [examId])

    // Keyboard Shortcuts & Auto-focus
    useEffect(() => {
        if (editorState && passageRef.current) {
            passageRef.current.focus()
        }
    }, [selectedQuestionId])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                handleSaveAndNext()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [editorState, selectedQuestionId, structure, activeSection, activeModule])

    // Auto-save logic
    useEffect(() => {
        if (!isDirty || !editorState) return
        
        const timer = setTimeout(() => {
            handleSave()
        }, 2000) // Auto-save after 2 seconds of inactivity

        return () => clearTimeout(timer)
    }, [editorState, isDirty])

    const fetchStructure = async () => {
        setLoading(true)
        setLoadingError(false)
        const timeoutId = setTimeout(() => { setLoadingError(true) }, 15000)

        try {
            const res = await axios.get(`${API_URL}/api/admin/exams/${examId}/structure`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setStructure(res.data)
            clearTimeout(timeoutId)
        } catch (err) {
            console.error(err)
            setLoadingError(true)
        } finally {
            setLoading(false)
        }
    }

    // Load question details from local state when selected
    useEffect(() => {
        if (!selectedQuestionId || !structure) {
            setEditorState(null)
            return
        }

        const question = structure.questions.find(q => q.id === selectedQuestionId)
        if (question) {
            setEditorState(question)
            setIsDirty(false)
        }
    }, [selectedQuestionId, structure]) // Added structure dependency so updates reflect immediately

    // Filter questions for the hierarchy
    const filteredQuestions = structure?.questions.filter(q => 
        q.section === activeSection && q.module === activeModule
    ) || []

    const handleSaveAndNext = async () => {
        if (!editorState || !selectedQuestionId) return
        
        // 1. Save current
        await handleSave()

        // 2. Find next question
        if (!structure) return
        const currentFiltered = structure.questions.filter(q => 
            q.section === activeSection && q.module === activeModule
        )
        const currentIndex = currentFiltered.findIndex(q => q.id === selectedQuestionId)
        
        if (currentIndex !== -1 && currentIndex < currentFiltered.length - 1) {
            setSelectedQuestionId(currentFiltered[currentIndex + 1].id)
        }
    }

    const handleSave = async () => {
        if (!editorState || !selectedQuestionId) return
        setSaving(true)
        try {
            // Optimistic update of the full question in local state
            setStructure(prev => {
                if (!prev) return null
                return {
                    ...prev,
                    questions: prev.questions.map(q => q.id === selectedQuestionId ? editorState : q)
                }
            })

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
        if (!structure) return
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
            await axios.post(`${API_URL}/api/admin/exams/${examId}/questions`, [newQuestion], {
                headers: { Authorization: `Bearer ${token}` }
            })
            fetchStructure() // Refresh structure to get the new ID
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
            setStructure(prev => prev ? ({...prev, questions: prev.questions.filter(q => q.id !== selectedQuestionId)}) : null)
            setSelectedQuestionId(null)
        } catch (err) {
            console.error(err)
        }
    }

    const handleMoveQuestion = (id: string, direction: 'up' | 'down') => {
        if (!structure) return
        const index = structure.questions.findIndex(q => q.id === id)
        if (index === -1) return
        
        const newQuestions = [...structure.questions]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        
        if (targetIndex < 0 || targetIndex >= newQuestions.length) return
        
        [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
        setStructure({ ...structure, questions: newQuestions })
        setIsDirty(true)
    }

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 text-brand-muted">
            {loadingError ? (
                <>
                    <div className="text-red-500 font-bold text-lg">Taking longer than expected...</div>
                    <p className="text-sm max-w-md text-center">The server is waking up or experiencing heavy load. Please try again.</p>
                    <button 
                        onClick={fetchStructure}
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
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
            {/* Global Header */}
            <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/library')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <input 
                            value={structure?.title || ''}
                            className="text-base font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 w-64 truncate"
                            readOnly 
                        />
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">CODE: {structure?.code}</span>
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
                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wide"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!isDirty || saving}
                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-900 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wide shadow-sm"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {saving ? 'Saving...' : 'Publish'}
                    </button>
                </div>
            </header>

            {/* Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                <PanelGroup direction="horizontal">
                    
                    {/* HIERARCHY PANEL (LEFT) - DARK THEME */}
                    <Panel defaultSize={20} minSize={15} maxSize={30} className="bg-slate-900 text-gray-300 flex flex-col border-r border-slate-800">
                        {/* Section Tabs */}
                        <div className="p-4 pb-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sections</h3>
                            <div className="flex flex-col gap-1">
                                <button 
                                    onClick={() => setActiveSection('Reading')}
                                    className={clsx(
                                        "w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors", 
                                        activeSection === 'Reading' ? "bg-indigo-600 text-white" : "hover:bg-slate-800 text-slate-400"
                                    )}
                                >
                                    Reading and Writing
                                </button>
                                <button 
                                    onClick={() => setActiveSection('Math')}
                                    className={clsx(
                                        "w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors", 
                                        activeSection === 'Math' ? "bg-indigo-600 text-white" : "hover:bg-slate-800 text-slate-400"
                                    )}
                                >
                                    Math
                                </button>
                            </div>
                        </div>

                        {/* Module Tabs */}
                        <div className="px-4 py-2 border-t border-slate-800">
                             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Modules</h3>
                             <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                                <button 
                                    onClick={() => setActiveModule(1)}
                                    className={clsx("flex-1 py-1.5 text-xs font-medium rounded-md transition-all text-center", activeModule === 1 ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                                >
                                    Module 1
                                </button>
                                <button 
                                    onClick={() => setActiveModule(2)}
                                    className={clsx("flex-1 py-1.5 text-xs font-medium rounded-md transition-all text-center", activeModule === 2 ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                                >
                                    Module 2
                                </button>
                             </div>
                        </div>

                        {/* Question List */}
                        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {filteredQuestions.map((q, idx) => (
                                <button 
                                    key={q.id}
                                    onClick={() => setSelectedQuestionId(q.id)}
                                    className={clsx(
                                        "w-full text-left p-3 rounded-md text-sm transition-all group relative border border-transparent",
                                        selectedQuestionId === q.id 
                                            ? "bg-slate-800 text-white border-slate-700" 
                                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={clsx("font-bold text-xs", selectedQuestionId === q.id ? "text-indigo-400" : "text-slate-500")}>Q{idx + 1}</span>
                                    </div>
                                    <div className="truncate text-xs opacity-80 font-serif">{q.questionText.substring(0, 50) || "New Question..."}</div>
                                </button>
                            ))}
                            
                            <button 
                                onClick={handleAddQuestion}
                                className="w-full flex items-center gap-3 px-3 py-3 mt-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-md transition-colors text-sm font-bold"
                            >
                                <Plus className="w-4 h-4" />
                                New Question
                            </button>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-indigo-500 transition-colors" />

                    {/* EDITOR PANEL (CENTER) - SPLIT VIEW */}
                    <Panel className="bg-white flex flex-col relative">
                        {editorState ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Editor Header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <h1 className="text-xl font-extrabold text-slate-900">Question {filteredQuestions.findIndex(q => q.id === selectedQuestionId) + 1}</h1>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>{activeSection}</span>
                                                <span>•</span>
                                                <span>Module {activeModule}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={handleDeleteQuestion}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Question"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="w-px h-6 bg-gray-100 mx-1"></div>
                                        <button 
                                            onClick={() => handleMoveQuestion(editorState.id, 'up')}
                                            disabled={structure?.questions.findIndex(q => q.id === editorState.id) === 0}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-20"
                                        >
                                            <ChevronLeft className="w-4 h-4 rotate-90" />
                                        </button>
                                        <button 
                                            onClick={() => handleMoveQuestion(editorState.id, 'down')}
                                            disabled={structure?.questions.findIndex(q => q.id === editorState.id) === (structure?.questions.length || 0) - 1}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-20"
                                        >
                                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                                        </button>
                                    </div>
                                </div>

                                {/* Split View Editor */}
                                <div className="flex-1 overflow-hidden">
                                    <PanelGroup direction="horizontal">
                                        {/* Passage Side */}
                                        <Panel defaultSize={50} minSize={30}>
                                            <div className="h-full flex flex-col p-6 overflow-y-auto border-r border-gray-50 bg-slate-50/30">
                                                <div className="mb-4">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Passage / Stimulus</label>
                                                    <textarea 
                                                        ref={passageRef}
                                                        value={editorState.questionText}
                                                        onChange={e => { setEditorState({...editorState, questionText: e.target.value}); setIsDirty(true) }}
                                                        className="w-full min-h-[400px] p-6 bg-white border border-gray-200 rounded-xl text-base text-slate-800 font-serif leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none shadow-sm"
                                                        placeholder="The following text is adapted from..."
                                                    />
                                                </div>
                                            </div>
                                        </Panel>

                                        <PanelResizeHandle className="w-1 bg-gray-100 hover:bg-indigo-500 transition-colors" />

                                        {/* Question Side */}
                                        <Panel defaultSize={50} minSize={30}>
                                            <div className="h-full flex flex-col p-6 overflow-y-auto space-y-6">
                                                {/* Meta Info */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Domain</label>
                                                        <select 
                                                            value={editorState.domain || 'Information and Ideas'}
                                                            onChange={e => { setEditorState({...editorState, domain: e.target.value}); setIsDirty(true) }}
                                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                                        >
                                                            <option>Information and Ideas</option>
                                                            <option>Craft and Structure</option>
                                                            <option>Expression of Ideas</option>
                                                            <option>Standard English Conventions</option>
                                                            <option>Algebra</option>
                                                            <option>Advanced Math</option>
                                                            <option>Problem Solving and Data Analysis</option>
                                                            <option>Geometry and Trigonometry</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Skill</label>
                                                        <input 
                                                            value={editorState.skill || ''}
                                                            onChange={e => { setEditorState({...editorState, skill: e.target.value}); setIsDirty(true) }}
                                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                                            placeholder="e.g. Central Ideas and Details"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Explanation / Difficulty */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Difficulty</label>
                                                        <select 
                                                            value={editorState.difficulty || 'Medium'}
                                                            onChange={e => { setEditorState({...editorState, difficulty: e.target.value}); setIsDirty(true) }}
                                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                                        >
                                                            <option>Easy</option>
                                                            <option>Medium</option>
                                                            <option>Hard</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Explanation</label>
                                                        <input 
                                                            value={editorState.explanation || ''}
                                                            onChange={e => { setEditorState({...editorState, explanation: e.target.value}); setIsDirty(true) }}
                                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                                            placeholder="Why is this the correct answer?"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Options */}
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Answer Choices</label>
                                                    <div className="space-y-2.5">
                                                        {editorState.choices.map((choice, idx) => {
                                                            const isCorrect = editorState.correctAnswer === choice
                                                            return (
                                                                <div key={idx} className="group relative">
                                                                    <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none z-10">
                                                                        <span className={clsx("font-bold text-xs", isCorrect ? "text-indigo-400" : "text-slate-400")}>
                                                                            {String.fromCharCode(65 + idx)}
                                                                        </span>
                                                                    </div>
                                                                    <input 
                                                                        value={choice}
                                                                        onChange={e => {
                                                                            const newChoices = [...editorState.choices]
                                                                            newChoices[idx] = e.target.value
                                                                            let newCorrect = editorState.correctAnswer
                                                                            if (isCorrect) newCorrect = e.target.value
                                                                            setEditorState({...editorState, choices: newChoices, correctAnswer: newCorrect})
                                                                            setIsDirty(true)
                                                                        }}
                                                                        className={clsx(
                                                                            "w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-medium transition-all outline-none",
                                                                            isCorrect 
                                                                                ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 shadow-sm" 
                                                                                : "bg-white border-gray-200 text-slate-600 hover:border-gray-300 focus:border-indigo-500"
                                                                        )}
                                                                    />
                                                                    <button 
                                                                        onClick={() => { setEditorState({...editorState, correctAnswer: choice}); setIsDirty(true) }}
                                                                        className={clsx(
                                                                            "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity",
                                                                            isCorrect ? "opacity-100 bg-indigo-600 text-white" : "bg-gray-100 text-gray-400 hover:bg-green-500 hover:text-white"
                                                                        )}
                                                                        title="Mark as Correct"
                                                                    >
                                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </Panel>
                                    </PanelGroup>
                                </div>

                                {/* Editor Footer Navigation */}
                                <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px]">Ctrl</kbd>
                                        <span>+</span>
                                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px]">Enter</kbd>
                                        <span className="ml-1">Save & Next</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                const currentFiltered = filteredQuestions
                                                const idx = currentFiltered.findIndex(q => q.id === selectedQuestionId)
                                                if (idx > 0) setSelectedQuestionId(currentFiltered[idx - 1].id)
                                            }}
                                            disabled={filteredQuestions.findIndex(q => q.id === selectedQuestionId) === 0}
                                            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-30"
                                        >
                                            Previous
                                        </button>
                                        <button 
                                            onClick={handleSaveAndNext}
                                            className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10"
                                        >
                                            Next Question
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                                <Layout className="w-24 h-24 mb-6 opacity-10" />
                                <p className="text-lg font-medium text-slate-400">Select a question to edit</p>
                            </div>
                        )}
                        
                        {/* Side Tools (Floating) */}
                        <div className="absolute right-0 top-0 bottom-0 w-14 border-l border-gray-100 bg-white flex flex-col items-center py-4 gap-4 z-10">
                            <button className="p-2 rounded-lg bg-slate-900 text-white shadow-md hover:bg-slate-800 transition-all">
                                <Settings className="w-5 h-5" />
                            </button>
                            <div className="w-8 h-px bg-gray-100"></div>
                            {/* Placeholder Tools */}
                            {[1, 2, 3].map(i => (
                                <button key={i} className="p-2 rounded-lg text-gray-300 hover:bg-gray-50 hover:text-indigo-500 transition-colors">
                                    <div className="w-5 h-5 rounded-sm border-2 border-current opacity-50"></div>
                                </button>
                            ))}
                        </div>
                    </Panel>

                </PanelGroup>
            </div>
        </div>
    )
}
