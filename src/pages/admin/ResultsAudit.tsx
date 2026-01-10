import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { API_URL } from '../../config'
import { useAuthStore } from '../../store/authStore'
import { Search, Eye, X, BarChart2, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useFetch } from '../../hooks/useFetch'

interface ExamResult {
  studentExamId: string
  studentName: string
  examTitle: string
  score: number
  completedAt: string
}

export default function ResultsAudit() {
  const { token } = useAuthStore()
  const { data: results, loading, error, mutate } = useFetch<ExamResult[]>(`${API_URL}/api/admin/results`, 'admin-results')
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null)

  // Mock data for the detailed chart since backend doesn't aggregate domains yet
  const mockDomainData = [
    { name: 'Algebra', score: 85 },
    { name: 'Geometry', score: 60 },
    { name: 'Reading', score: 90 },
    { name: 'Grammar', score: 75 },
  ]

  if (loading && !results) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <Loader2 className="w-8 h-8 animate-spin mb-2" />
      <p className="text-sm">Loading Results Audit...</p>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-red-500">
      <p className="text-sm font-bold">Failed to load results.</p>
      <button onClick={() => mutate()} className="mt-2 text-brand-accent hover:underline text-xs">Try Again</button>
    </div>
  )

  const resultsList = results || []

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-panel">
          <div className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-1">Exams Completed</div>
          <div className="text-3xl font-bold text-brand-dark">{resultsList.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-panel">
          <div className="text-brand-muted text-xs font-bold uppercase tracking-wider mb-1">Avg. Score</div>
          <div className="text-3xl font-bold text-brand-dark">
            {resultsList.length > 0 ? Math.round(resultsList.reduce((a, b) => a + b.score, 0) / resultsList.length) : 0}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-panel overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    placeholder="Search results..." 
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                />
            </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-brand-muted uppercase tracking-wider">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Exam</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Total Score</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resultsList.map((res) => (
                <tr key={res.studentExamId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-brand-dark">{res.studentName}</td>
                    <td className="px-6 py-4 text-gray-600">{res.examTitle}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{new Date(res.completedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                        <span className={`font-bold ${res.score >= 1200 ? 'text-green-600' : 'text-brand-dark'}`}>
                            {res.score}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <button 
                            onClick={() => setSelectedResult(res)}
                            className="flex items-center gap-1 text-xs font-bold text-brand-accent hover:text-blue-700 transition-colors"
                        >
                            <Eye className="w-4 h-4" /> View Report
                        </button>
                    </td>
                </tr>
            ))}
            {resultsList.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No completed exams found.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Report Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-brand-dark">Performance Report</h3>
                        <p className="text-sm text-brand-muted">{selectedResult.studentName} • {selectedResult.examTitle}</p>
                    </div>
                    <button onClick={() => setSelectedResult(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Score Hero */}
                    <div className="flex flex-col items-center justify-center py-8 bg-brand-dark text-white rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-brand-accent/10"></div>
                        <span className="relative text-sm font-bold uppercase tracking-widest opacity-70 mb-2">Total Score</span>
                        <span className="relative text-6xl font-black tracking-tight">{selectedResult.score}</span>
                        <span className="relative text-sm opacity-70 mt-2">out of 1600</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Domain Chart */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-brand-dark mb-6 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-brand-accent" /> Domain Breakdown
                            </h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mockDomainData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]} hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                                        <Tooltip />
                                        <Bar dataKey="score" fill="#007AFF" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Insights */}
                        <div className="space-y-6">
                            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                                <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" /> Strongest Skills
                                </h4>
                                <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                                    <li>Information and Ideas</li>
                                    <li>Linear Equations</li>
                                </ul>
                            </div>
                            <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                                <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" /> Areas for Improvement
                                </h4>
                                <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                                    <li>Geometry and Trigonometry</li>
                                    <li>Standard English Conventions</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
