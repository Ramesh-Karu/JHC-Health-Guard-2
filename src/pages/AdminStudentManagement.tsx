import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, doc, updateDoc, deleteDoc, increment } from '../firebase';
import { 
  Search, 
  User, 
  Edit, 
  Trash2, 
  Award, 
  X, 
  Save, 
  Plus, 
  Minus,
  MapPin,
  Phone,
  Calendar,
  UserCircle,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { User as UserType } from '../types';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';

export default function AdminStudentManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState<Partial<UserType>>({});
  const [pointAdjustment, setPointAdjustment] = useState(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearchResults([]);
    try {
      const usersCol = collection(db, 'users');
      
      // Search by name (prefix)
      const nameQuery = query(
        usersCol,
        where('role', '==', 'student'),
        where('fullName', '>=', searchTerm),
        where('fullName', '<=', searchTerm + '\uf8ff')
      );

      // Search by index number
      const indexQuery = query(
        usersCol,
        where('role', '==', 'student'),
        where('indexNumber', '==', searchTerm)
      );

      // Search by admission number
      const admissionQuery = query(
        usersCol,
        where('role', '==', 'student'),
        where('admissionNumber', '==', searchTerm)
      );

      const [nameSnap, indexSnap, admissionSnap] = await Promise.all([
        getDocs(nameQuery),
        getDocs(indexQuery),
        getDocs(admissionQuery)
      ]);

      const resultsMap = new Map<string, UserType>();
      
      [...nameSnap.docs, ...indexSnap.docs, ...admissionSnap.docs].forEach(doc => {
        resultsMap.set(doc.id, { id: doc.id, ...doc.data() } as UserType);
      });

      setSearchResults(Array.from(resultsMap.values()));
      
      if (resultsMap.size === 0) {
        setToast({ message: 'No students found matching your search.', type: 'error' });
      }
    } catch (err) {
      console.error('Search error:', err);
      handleFirestoreError(err, OperationType.GET, 'users');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const openEditModal = (student: UserType) => {
    setSelectedStudent(student);
    setFormData({ ...student });
    setPointAdjustment(0);
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const studentRef = doc(db, 'users', selectedStudent.id);
      const finalPoints = (selectedStudent.points || 0) + pointAdjustment;
      
      const updateData = {
        ...formData,
        points: finalPoints
      };
      
      // Remove ID from update data
      delete (updateData as any).id;

      await updateDoc(studentRef, updateData);
      
      setToast({ message: 'Student profile updated successfully!', type: 'success' });
      setIsEditModalOpen(false);
      
      // Refresh search results
      setSearchResults(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, ...updateData } : s));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${selectedStudent.id}`);
      setToast({ message: 'Failed to update profile.', type: 'error' });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this student? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'users', studentId));
      setToast({ message: 'Student deleted successfully.', type: 'success' });
      setSearchResults(prev => prev.filter(s => s.id !== studentId));
      if (selectedStudent?.id === studentId) setIsEditModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${studentId}`);
      setToast({ message: 'Failed to delete student.', type: 'error' });
    }
  };

  const adjustPoints = (amount: number) => {
    setPointAdjustment(prev => prev + amount);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Admin Student Management</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-10">Search, edit, and manage student profiles and points.</p>
        </div>
        <button 
          onClick={clearSearch}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <RotateCcw size={18} />
          Clear Search
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Enter Name, Index Number, or Admission Number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium dark:text-white"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-blue-500 text-white rounded-2xl font-black hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search Student'}
          </button>
        </form>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {searchResults.map((student) => (
            <motion.div
              key={student.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDeleteStudent(student.id)}
                  className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  title="Delete Student"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                  <img 
                    src={student.photoUrl || `https://ui-avatars.com/api/?name=${student.fullName}&background=3b82f6&color=fff`} 
                    alt={student.fullName} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white leading-tight">{student.fullName}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{student.class} - {student.division}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <ShieldCheck size={16} className="text-blue-500" />
                  <span className="font-bold">Index:</span> {student.indexNumber || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <ShieldCheck size={16} className="text-indigo-500" />
                  <span className="font-bold">Admission:</span> {student.admissionNumber || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Award size={16} className="text-amber-500" />
                  <span className="font-bold">Points:</span> {student.points || 0}
                </div>
              </div>

              <button 
                onClick={() => openEditModal(student)}
                className="w-full py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Edit size={18} />
                Edit Profile
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                    <UserCircle className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Edit Student Profile</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Managing {selectedStudent.fullName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateStudent} className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Points Management Section */}
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-3xl p-6 border border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                        <Award className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white">Points Management</h3>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Current: {selectedStudent.points || 0}</p>
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      New Total: {(selectedStudent.points || 0) + pointAdjustment}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={() => adjustPoints(-10)}
                      className="flex-1 py-3 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 rounded-2xl font-black hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Minus size={20} /> 10
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustPoints(-1)}
                      className="flex-1 py-3 bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 rounded-2xl font-black hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Minus size={20} /> 1
                    </button>
                    <div className="w-20 text-center text-xl font-black text-slate-900 dark:text-white">
                      {pointAdjustment > 0 ? `+${pointAdjustment}` : pointAdjustment}
                    </div>
                    <button 
                      type="button"
                      onClick={() => adjustPoints(1)}
                      className="flex-1 py-3 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl font-black hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={20} /> 1
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustPoints(10)}
                      className="flex-1 py-3 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl font-black hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={20} /> 10
                    </button>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <User size={20} className="text-blue-500" />
                    <h3 className="font-black uppercase tracking-wider text-sm">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.fullName || ''}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Index Number</label>
                      <input 
                        type="text" 
                        value={formData.indexNumber || ''}
                        onChange={(e) => setFormData({...formData, indexNumber: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Admission Number</label>
                      <input 
                        type="text" 
                        value={formData.admissionNumber || ''}
                        onChange={(e) => setFormData({...formData, admissionNumber: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="date" 
                          value={formData.dob || ''}
                          onChange={(e) => setFormData({...formData, dob: e.target.value})}
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Class / Grade</label>
                      <input 
                        type="text" 
                        value={formData.class || ''}
                        onChange={(e) => setFormData({...formData, class: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Division</label>
                      <input 
                        type="text" 
                        value={formData.division || ''}
                        onChange={(e) => setFormData({...formData, division: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact & Address */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <MapPin size={20} className="text-emerald-500" />
                    <h3 className="font-black uppercase tracking-wider text-sm">Contact & Address</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                      <textarea 
                        rows={3}
                        value={formData.address || ''}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold resize-none dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Guardian Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Phone size={20} className="text-indigo-500" />
                    <h3 className="font-black uppercase tracking-wider text-sm">Guardian Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Parent/Guardian Name</label>
                      <input 
                        type="text" 
                        value={formData.parentName || ''}
                        onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Parent/Guardian Contact</label>
                      <input 
                        type="text" 
                        value={formData.parentContact || ''}
                        onChange={(e) => setFormData({...formData, parentContact: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Secondary Guardian Name</label>
                      <input 
                        type="text" 
                        value={formData.guardianName || ''}
                        onChange={(e) => setFormData({...formData, guardianName: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Secondary Guardian Contact</label>
                      <input 
                        type="text" 
                        value={formData.guardianContact || ''}
                        onChange={(e) => setFormData({...formData, guardianContact: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-red-900 dark:text-red-400">Danger Zone</h4>
                        <p className="text-sm text-red-600 dark:text-red-500 font-medium">Permanently remove this student from the system.</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleDeleteStudent(selectedStudent.id)}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none active:scale-95"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </form>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-8 py-3 text-slate-600 dark:text-slate-400 font-black hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateStudent}
                  className="px-10 py-3 bg-blue-500 text-white rounded-2xl font-black hover:bg-blue-600 shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save size={20} />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
