import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, initializeApp, deleteApp, getAuth, createUserWithEmailAndPassword, firebaseConfig, signOut, writeBatch, increment } from '../firebase';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Plus, Search, Edit2, Trash2, UserPlus, FileDown, FileUp, X } from 'lucide-react';
import { useAuth } from '../App';
import Toast from '../components/Toast';
import { useTeachers, CACHE_KEYS } from '../lib/queries';

export default function AdminTeachers() {
  const queryClient = useQueryClient();
  const { data: teachers = [], isLoading: loading, refetch: fetchTeachers } = useTeachers();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Import Preview States
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    class: '',
    division: '',
    phone: '',
    indexNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const teacherData = {
        fullName: formData.fullName,
        email: formData.email,
        class: formData.class,
        division: formData.division,
        phone: formData.phone,
        indexNumber: formData.indexNumber,
        role: 'teacher'
      };

      if (editingTeacher) {
        const teacherRef = doc(db, 'users', editingTeacher.id);
        await updateDoc(teacherRef, teacherData);
      } else {
        const tempApp = initializeApp(firebaseConfig as any, 'temp-create-teacher-' + Date.now());
        const tempAuth = getAuth(tempApp);
        
        const userCredential = await createUserWithEmailAndPassword(tempAuth, formData.email, formData.password);
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          ...teacherData,
          createdAt: new Date().toISOString()
        });
        
        // Update global stats
        const statsRef = doc(db, 'metadata', 'global_stats');
        await setDoc(statsRef, {
          totalUsers: increment(1),
          'roleCounts.teacher': increment(1)
        }, { merge: true });

        await deleteApp(tempApp);
      }
      
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TEACHERS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_USERS });
      setShowAddModal(false);
      setEditingTeacher(null);
      setToast({ message: editingTeacher ? 'Teacher updated successfully' : 'Teacher added successfully', type: 'success' });
      setFormData({ fullName: '', email: '', password: '', class: '', division: '', phone: '', indexNumber: '' });
      fetchTeachers();
    } catch (err: any) {
      console.error("Error saving teacher:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (errorMessage.includes('auth/email-already-in-use')) {
        setToast({ message: 'Email is already taken.', type: 'error' });
      } else if (errorMessage.includes('auth/weak-password')) {
        setToast({ message: 'Password should be at least 6 characters.', type: 'error' });
      } else {
        setToast({ message: 'Failed to save teacher. Please try again.', type: 'error' });
      }
    }
  };

  const handleExportCSV = () => {
    const dataToExport = teachers.map((t: any) => ({
      fullName: t.fullName,
      email: t.email,
      class: t.class || '',
      division: t.division || '',
      phone: t.phone || '',
      indexNumber: t.indexNumber || '',
      password: '' // Blank password for template
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'teachers.csv';
    link.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result;
      
      const preparePreview = (data: any[]) => {
        setImportPreviewData(data);
        setIsImportPreviewOpen(true);
        setImportProgress(0);
        setIsImporting(false);
      };

      if (file.name.endsWith('.csv')) {
        Papa.parse(data as string, {
          header: true,
          complete: (results) => { preparePreview(results.data); }
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        preparePreview(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));
      }
    };
    
    if (file.name.endsWith('.csv')) reader.readAsText(file);
    else reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    // Filter valid rows first
    const validRows = importPreviewData.filter(row => row.email && row.fullName && row.password);
    const total = validRows.length;
    let completed = 0;
    let skipped = 0;
    let added = 0;
    let errors = 0;

    try {
      // Use Firestore batches for high performance
      const batchSize = 500;
      const checkBatchSize = 30; // Firestore 'in' query limit

      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = writeBatch(db);
        const currentBatchRows = validRows.slice(i, i + batchSize);
        
        // Check for duplicates in smaller batches of 30
        const existingEmails = new Set<string>();
        for (let j = 0; j < currentBatchRows.length; j += checkBatchSize) {
          const checkBatch = currentBatchRows.slice(j, j + checkBatchSize);
          const emailsToCheck = checkBatch.map(r => r.email.toLowerCase().trim());
          
          if (emailsToCheck.length > 0) {
            const q = query(
              collection(db, 'users'), 
              where('role', '==', 'teacher'),
              where('email', 'in', emailsToCheck)
            );
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(d => {
              const email = d.data().email;
              if (email) existingEmails.add(email.toLowerCase());
            });
          }
        }

        let batchCount = 0;
        for (const row of currentBatchRows) {
          try {
            const normalizedEmail = row.email.toLowerCase().trim();
            
            // Check for duplicate email
            if (existingEmails.has(normalizedEmail)) {
              skipped++;
              completed++;
              continue;
            }

            const userRef = doc(collection(db, 'users'));
            
            batch.set(userRef, {
              fullName: row.fullName,
              email: normalizedEmail,
              class: row.class || '',
              division: row.division || '',
              phone: row.phone || '',
              indexNumber: row.indexNumber || '',
              role: 'teacher',
              authCreated: false,
              tempPassword: row.password,
              createdAt: new Date().toISOString()
            });
            
            // Update global stats in the same batch
            const statsRef = doc(db, 'metadata', 'global_stats');
            batch.set(statsRef, {
              totalUsers: increment(1),
              'roleCounts.teacher': increment(1)
            }, { merge: true });

            existingEmails.add(normalizedEmail);
            added++;
            batchCount++;
          } catch (err) {
            console.error('Error preparing teacher for batch:', err);
            errors++;
          }
          completed++;
          if (completed % 10 === 0) {
            setImportProgress(Math.round((completed / total) * 100));
          }
        }

        if (batchCount > 0) {
          await batch.commit();
        }
      }
      setImportProgress(100);
    } catch (err) {
      console.error('Bulk import failed:', err);
      setToast({ message: 'Bulk import failed. Please try again.', type: 'error' });
    }
    
    setIsImporting(false);
    setIsImportPreviewOpen(false);
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TEACHERS });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_USERS });
    fetchTeachers();
    
    let message = `Import finished. ${added} added to database.`;
    if (skipped > 0) message += ` ${skipped} skipped (duplicates).`;
    if (errors > 0) message += ` ${errors} failed.`;
    message += " Accounts will be created automatically on first login.";
    
    setToast({ message, type: errors > 0 ? 'error' : 'success' });
  };

  const handleDelete = async (id: string) => {
    const teacherToDelete = teachers.find((t: any) => t.id === id);
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', id));
      
      // Update global stats
      if (teacherToDelete) {
        const statsRef = doc(db, 'metadata', 'global_stats');
        await setDoc(statsRef, {
          totalUsers: increment(-1),
          'roleCounts.teacher': increment(-1)
        }, { merge: true });
      }

      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TEACHERS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_USERS });
      setToast({ message: 'Teacher deleted successfully', type: 'success' });
      fetchTeachers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({ message: `Error deleting teacher: ${errorMessage}`, type: 'error' });
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };

  const openEditModal = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({
      fullName: teacher.fullName,
      email: teacher.email,
      password: '', // Don't populate password on edit
      class: teacher.class || '',
      division: teacher.division || '',
      phone: teacher.phone || '',
      indexNumber: teacher.indexNumber || ''
    });
    setShowAddModal(true);
  };

  const filteredTeachers = teachers.filter((t: any) => 
    t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.class && t.class.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.division && t.division.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Teachers</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Add and assign teachers to classes</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <FileDown size={20} /> Export
          </button>
          <label className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <FileUp size={20} />
            Import
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleImportFile} className="hidden" />
          </label>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
          >
            <UserPlus size={20} />
            Add Teacher
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Phone</th>
                <th className="p-4 font-medium">Assigned Class</th>
                <th className="p-4 font-medium">Division</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTeachers.map((teacher: any) => (
                <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        {teacher.fullName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 dark:text-white block">{teacher.fullName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">ID: {teacher.indexNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{teacher.email}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{teacher.phone || 'N/A'}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-medium">
                      {teacher.class || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-medium">
                      {teacher.division || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(teacher)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(teacher.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher ID</label>
                  <input
                    type="text"
                    value={formData.indexNumber}
                    onChange={e => setFormData({...formData, indexNumber: e.target.value})}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required={!editingTeacher}
                    disabled={!!editingTeacher}
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/50 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                {!editingTeacher && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Class (e.g., Grade 6)</label>
                  <input
                    type="text"
                    value={formData.class}
                    onChange={e => setFormData({...formData, class: e.target.value})}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Division (e.g., A)</label>
                  <input
                    type="text"
                    value={formData.division}
                    onChange={e => setFormData({...formData, division: e.target.value})}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  {editingTeacher ? 'Save Changes' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Import Preview Modal */}
      {isImportPreviewOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Import Preview</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Review the data before updating the database</p>
              </div>
              {!isImporting && (
                <button 
                  onClick={() => setIsImportPreviewOpen(false)} 
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 transition-colors"
                >
                  <X size={24} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto p-8">
              {isImporting ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-8">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-slate-100 dark:text-slate-800"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={552.92}
                        strokeDashoffset={552.92 - (552.92 * importProgress) / 100}
                        className="text-blue-500 transition-all duration-500 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-black text-slate-900 dark:text-white">{importProgress}%</span>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Importing Data...</h3>
                    <p className="text-slate-500 dark:text-slate-400">Please do not close this window until the process is complete.</p>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-[1.5rem] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {importPreviewData.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{row.fullName || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">{row.email || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">{row.class || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">{row.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreviewData.length > 10 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-200 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 italic">
                        Showing first 10 of {importPreviewData.length} records...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isImporting && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-4">
                <button 
                  onClick={() => setIsImportPreviewOpen(false)} 
                  className="px-8 py-3 text-slate-600 dark:text-slate-400 font-black hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmImport} 
                  className="px-10 py-3 bg-blue-500 text-white rounded-2xl font-black hover:bg-blue-600 shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95"
                >
                  Verify & Import
                </button>
              </div>
            )}
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
