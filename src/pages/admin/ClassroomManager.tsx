import React, { useState } from 'react'
import { Users, Plus, Trash2, Edit2, Search, GraduationCap } from 'lucide-react'
import { useFetch, usePost, usePut, useDelete } from '../../hooks/useFetch'
import { Modal } from '../../components/Modals'

interface Classroom {
  id: string
  name: string
  createdAt: string
  studentCount: number
}

interface Student {
  id: string
  firstName: string
  lastName: string
  username: string
}

interface ClassroomDetail {
  id: string
  name: string
  createdAt: string
  students: Student[]
}

export default function ClassroomManager() {
  const { data: classrooms, loading, mutate: refresh } = useFetch<Classroom[]>('/api/admin/classrooms', 'admin-classrooms')
  const { data: allStudents } = useFetch<Student[]>('/api/admin/students', 'admin-students')
  
  const createClassroom = usePost()
  const updateClassroom = usePut()
  const deleteClassroom = useDelete()
  
  const addStudents = usePost()
  const removeStudent = useDelete()

  // State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomDetail | null>(null)
  const [newClassName, setNewClassName] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  
  // Student selection for adding to classroom
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  const handleCreate = async () => {
    if (!newClassName.trim()) return
    await createClassroom.execute('/api/admin/classrooms', { name: newClassName })
    setNewClassName('')
    setIsCreateModalOpen(false)
    refresh()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This will remove the classroom group but not the students.')) {
      await deleteClassroom.execute(`/api/admin/classrooms/${id}`)
      refresh()
      if (viewMode === 'detail' && selectedClassroom?.id === id) {
        setViewMode('list')
        setSelectedClassroom(null)
      }
    }
  }

  const openDetail = async (id: string) => {
    // Ideally fetch details here
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/classrooms/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    })
    if (res.ok) {
      const data = await res.json()
      setSelectedClassroom(data)
      setViewMode('detail')
    }
  }

  const handleAddStudents = async () => {
    if (!selectedClassroom || selectedStudentIds.length === 0) return
    await addStudents.execute(`/api/admin/classrooms/${selectedClassroom.id}/students`, selectedStudentIds)
    openDetail(selectedClassroom.id) // Refresh details
    setSelectedStudentIds([])
    refresh() // Refresh list counts
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClassroom) return
    await removeStudent.execute(`/api/admin/classrooms/${selectedClassroom.id}/students/${studentId}`)
    openDetail(selectedClassroom.id) // Refresh details
    refresh() // Refresh list counts
  }

  if (viewMode === 'detail' && selectedClassroom) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode('list')}
              className="text-sm text-brand-muted hover:text-brand-text"
            >
              ← Back to Classrooms
            </button>
            <h2 className="text-2xl font-bold text-brand-text flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-brand-accent" />
              {selectedClassroom.name}
            </h2>
          </div>
          <div className="text-sm text-brand-muted">
            {selectedClassroom.students.length} Students
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Students List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Enrolled Students</h3>
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-muted uppercase">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-muted uppercase">Username</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-brand-muted uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedClassroom.students.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-sm font-medium text-brand-text">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="py-3 px-4 text-sm text-brand-muted font-mono">{student.username}</td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => handleRemoveStudent(student.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {selectedClassroom.students.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-brand-muted italic">
                        No students in this classroom yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Students Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
            <h3 className="text-lg font-semibold mb-4">Add Students</h3>
            <div className="mb-4">
              <input 
                type="text" 
                placeholder="Search students..." 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 mb-4 border border-gray-100 rounded-lg p-2">
              {allStudents?.filter(s => !selectedClassroom.students.find(cs => cs.id === s.id)).map(student => (
                <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, student.id])
                      else setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id))
                    }}
                    className="rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-brand-text">{student.firstName} {student.lastName}</div>
                    <div className="text-xs text-brand-muted">{student.username}</div>
                  </div>
                </label>
              ))}
            </div>
            <button 
              onClick={handleAddStudents}
              disabled={selectedStudentIds.length === 0 || addStudents.loading}
              className="w-full py-2 bg-brand-accent text-white rounded-lg font-medium text-sm hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addStudents.loading ? 'Adding...' : `Add Selected (${selectedStudentIds.length})`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <p className="text-brand-muted">Manage student groups for easier exam assignment.</p>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-shadow shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          New Classroom
        </button>
      </div>

      {/* Classroom List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms?.map(room => (
          <div 
            key={room.id}
            onClick={() => openDetail(room.id)}
            className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-accent/50 hover:shadow-md transition-all cursor-pointer relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-brand-secondary rounded-lg text-brand-accent">
                <GraduationCap className="w-6 h-6" />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-brand-text mb-1">{room.name}</h3>
            <div className="flex items-center text-sm text-brand-muted gap-4">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {room.studentCount} Students
              </span>
            </div>
          </div>
        ))}
        
        {classrooms?.length === 0 && (
          <div className="col-span-full py-12 text-center text-brand-muted border-2 border-dashed border-gray-200 rounded-xl">
            No classrooms created yet. Click "New Classroom" to start.
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Classroom">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Classroom Name</label>
            <input 
              autoFocus
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="e.g. Period 1 Math"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm text-brand-muted hover:text-brand-text"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreate}
              disabled={!newClassName.trim() || createClassroom.loading}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-medium hover:bg-brand-accent/90"
            >
              {createClassroom.loading ? 'Creating...' : 'Create Classroom'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
