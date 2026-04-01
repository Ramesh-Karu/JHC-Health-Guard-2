import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, getCountFromServer } from '../firebase';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import { useAuth } from '../App';
import Toast from '../components/Toast';

import { useClassrooms, useTeachers, useAllStudents, CACHE_KEYS } from '../lib/queries';

export default function AdminClassrooms() {
  const queryClient = useQueryClient();
  const { data: classroomsRaw = [], isLoading: classesLoading, refetch: refetchClasses } = useClassrooms();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: allStudents = [], isLoading: studentsLoading } = useAllStudents();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState({
    grade: '',
    division: '',
    teacherId: ''
  });

  const loading = classesLoading || teachersLoading || studentsLoading;

  // Map teacher names and calculate student counts client-side
  const classrooms = classroomsRaw.map((c: any) => {
    const teacher = teachers.find((t: any) => t.id === c.teacherId);
    const studentCount = allStudents.filter((s: any) => 
      s.class === (c.grade || c.name) && s.division === c.division
    ).length;
    
    return {
      ...c,
      teacherName: teacher ? (teacher as any).fullName : null,
      studentCount
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClassroom) {
        const classRef = doc(db, 'classrooms', editingClassroom.id);
        await updateDoc(classRef, formData);
      } else {
        await addDoc(collection(db, 'classrooms'), formData);
      }
      
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CLASSROOMS });
      setShowAddModal(false);
      setEditingClassroom(null);
      setToast({ message: editingClassroom ? 'Classroom updated successfully' : 'Classroom added successfully', type: 'success' });
      setFormData({ grade: '', division: '', teacherId: '' });
      refetchClasses();
    } catch (error) {
      handleFirestoreError(error, editingClassroom ? OperationType.UPDATE : OperationType.CREATE, 'classrooms');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classroom?')) return;
    
    try {
      await deleteDoc(doc(db, 'classrooms', id));
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CLASSROOMS });
      setToast({ message: 'Classroom deleted successfully', type: 'success' });
      refetchClasses();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `classrooms/${id}`);
    }
  };

  const openEditModal = (classroom: any) => {
    setEditingClassroom(classroom);
    setFormData({
      grade: classroom.grade || '',
      division: classroom.division || '',
      teacherId: classroom.teacherId || ''
    });
    setShowAddModal(true);
  };

  const filteredClassrooms = classrooms.filter((c: any) => 
    c.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.teacherName && c.teacherName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Class & Division Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Organize students and assign teachers to classes</p>
        </div>
        <button
          onClick={() => {
            setEditingClassroom(null);
            setFormData({ grade: '', division: '', teacherId: '' });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
        >
          <Plus size={20} />
          Add Classroom
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search classrooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 font-medium">Class / Grade</th>
                <th className="p-4 font-medium">Division</th>
                <th className="p-4 font-medium">Teacher Assigned</th>
                <th className="p-4 font-medium">Student Count</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredClassrooms.map((classroom: any) => (
                <tr key={classroom.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{classroom.grade}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-bold tracking-wide">
                      {classroom.division}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                    {classroom.teacherName || <span className="text-slate-400 dark:text-slate-500 italic font-normal">Unassigned</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                      <Users size={16} className="text-slate-400" />
                      {classroom.studentCount || 0}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(classroom)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all active:scale-95"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(classroom.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all active:scale-95"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClassrooms.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
              No classrooms found.
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Grade / Class</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Grade 8"
                  value={formData.grade || ''}
                  onChange={e => setFormData({...formData, grade: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Division</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., A"
                  value={formData.division || ''}
                  onChange={e => setFormData({...formData, division: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Assign Teacher (Optional)</label>
                <select
                  value={formData.teacherId || ''}
                  onChange={e => setFormData({...formData, teacherId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white font-medium appearance-none"
                >
                  <option value="">-- Unassigned --</option>
                  {teachers.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
                >
                  {editingClassroom ? 'Save Changes' : 'Add Classroom'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
