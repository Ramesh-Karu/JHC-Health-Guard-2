import React, { useState, useEffect, useMemo } from 'react';
import { useAllStudents, CACHE_KEYS } from '../lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { User as UserType } from '../types';
import Toast from '../components/Toast';
import HeartLoader from '../components/HeartLoader';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, collection, getDocs, query, where, writeBatch, setDoc, deleteDoc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  Search, 
  UserPlus, 
  Filter, 
  Award, 
  QrCode, 
  Activity, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Ruler, 
  Scale, 
  FileDown, 
  FileUp, 
  X,
  Plus,
  Minus,
  MapPin,
  Phone,
  Calendar,
  UserCircle,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Students() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // Import Preview States
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterGender, setFilterGender] = useState('');

  // Form States
  const [formData, setFormData] = useState({
    username: '', password: '', fullName: '', indexNumber: '', dob: '',
    gender: 'Male', class: '', division: '', address: '', parentName: '', parentContact: '', photoUrl: '', admissionNumber: ''
  });
  const [editingStudent, setEditingStudent] = useState<UserType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserType | null>(null);
  const [healthData, setHealthData] = useState({ height: '', weight: '', date: new Date().toISOString().split('T')[0] });
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);

  const { data: allStudents = [], isLoading, refetch } = useAllStudents();

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      const matchesSearch = s.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = !filterClass || s.class === filterClass;
      const matchesDivision = !filterDivision || s.division === filterDivision;
      const matchesGender = !filterGender || s.gender === filterGender;
      return matchesSearch && matchesClass && matchesDivision && matchesGender;
    });
  }, [allStudents, searchTerm, filterClass, filterDivision, filterGender]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * studentsPerPage;
    return filteredStudents.slice(startIndex, startIndex + studentsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving student, formData:', formData, 'editingStudent:', editingStudent);
    try {
      if (editingStudent) {
        const studentRef = doc(db, 'users', editingStudent.id);
        const updateData = {
          fullName: formData.fullName,
          indexNumber: formData.indexNumber,
          admissionNumber: formData.admissionNumber,
          dob: formData.dob,
          gender: formData.gender,
          class: formData.class,
          division: formData.division,
          address: formData.address,
          parentName: formData.parentName,
          parentContact: formData.parentContact,
          photoUrl: formData.photoUrl
        };
        await updateDoc(studentRef, updateData);
        setToast({ message: 'Student updated successfully!', type: 'success' });
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_STUDENTS });
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_USERS });
      } else {
        const tempApp = initializeApp(firebaseConfig, 'tempApp');
        const tempAuth = getAuth(tempApp);
        const userCredential = await createUserWithEmailAndPassword(tempAuth, `${formData.username}@school.internal`, formData.password);
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: `${formData.username}@school.internal`,
          username: formData.username,
          fullName: formData.fullName,
          indexNumber: formData.indexNumber,
          admissionNumber: formData.admissionNumber,
          dob: formData.dob,
          gender: formData.gender,
          class: formData.class,
          division: formData.division,
          address: formData.address,
          parentName: formData.parentName,
          parentContact: formData.parentContact,
          photoUrl: formData.photoUrl,
          role: 'student',
          passwordChanged: false,
          profileCompleted: false,
          points: 0,
          authCreated: true,
          createdAt: new Date().toISOString()
        });
        
        await deleteApp(tempApp);
        setToast({ message: 'Student registered successfully!', type: 'success' });
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_STUDENTS });
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_USERS });
        setIsModalOpen(false);
      }
      
      setIsModalOpen(false);
      setEditingStudent(null);
      setFormData({
        username: '', password: '', fullName: '', indexNumber: '', dob: '',
        gender: 'Male', class: '', division: '', address: '', parentName: '', parentContact: '', photoUrl: '', admissionNumber: ''
      });
    } catch (err: any) {
      // ...
    }
  };

  const openEditModal = (student: UserType) => {
    setEditingStudent(student);
    setFormData({
      username: student.username || '',
      password: '', // Don't populate password
      fullName: student.fullName || '',
      indexNumber: student.indexNumber || '',
      admissionNumber: student.admissionNumber || '',
      dob: student.dob || '',
      gender: student.gender || 'Male',
      class: student.class || '',
      division: student.division || '',
      address: student.address || '',
      parentName: student.parentName || '',
      parentContact: student.parentContact || '',
      photoUrl: student.photoUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleAddHealthRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const heightInMeters = parseFloat(healthData.height) / 100;
      const weightInKg = parseFloat(healthData.weight);
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      
      let category = 'Normal';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi >= 25 && bmi < 30) category = 'Overweight';
      else if (bmi >= 30) category = 'Obese';

      await addDoc(collection(db, 'health_records'), {
        userId: selectedStudent.id,
        height: parseFloat(healthData.height),
        weight: parseFloat(healthData.weight),
        bmi,
        category,
        date: healthData.date,
        createdAt: new Date().toISOString()
      });
      setIsHealthModalOpen(false);
      setToast({ message: 'Health record added successfully!', type: 'success' });
      setHealthData({ height: '', weight: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'health_records');
    }
  };

  const handleExportCSV = () => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      // Assuming YYYY-MM-DD format from database
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-');
        return `${year}.${month}.${day}`;
      }
      return dateStr;
    };

    const dataToExport = allStudents.length > 0 ? allStudents.map(s => ({
      username: s.username,
      fullName: s.fullName,
      email: s.email,
      indexNumber: s.indexNumber,
      dob: formatDate(s.dob || ''),
      class: s.class,
      division: s.division,
      password: '' // Blank password for template
    })) : [{
      username: 'student001',
      fullName: 'Example Student',
      email: 'student@school.com',
      indexNumber: 'S001',
      dob: '2010.01.01',
      class: '10',
      division: 'A',
      password: 'password123'
    }];
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'students.csv';
    link.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const parseDate = (dateStr: string) => {
      if (!dateStr) return '';
      // Check for YYYY.MM.DD format
      if (dateStr.match(/^\d{4}\.\d{2}\.\d{2}$/)) {
        return dateStr.replace(/\./g, '-'); // Convert to YYYY-MM-DD
      }
      return dateStr; // Assume it's already YYYY-MM-DD or something else
    };

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
    const parseDate = (dateStr: string) => {
      if (!dateStr) return '';
      // Check for YYYY.MM.DD format
      if (dateStr.match(/^\d{4}\.\d{2}\.\d{2}$/)) {
        return dateStr.replace(/\./g, '-'); // Convert to YYYY-MM-DD
      }
      return dateStr; // Assume it's already YYYY-MM-DD or something else
    };

    setIsImporting(true);
    // Filter valid rows first
    const validRows = importPreviewData.filter(row => row.username && row.fullName && row.indexNumber);
    const total = validRows.length;
    let completed = 0;
    let skipped = 0;
    let added = 0;
    let errors = 0;

    try {
      // Pre-fetch existing students to avoid 6000+ individual queries
      const existingSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
      const existingIndexNumbers = new Set(existingSnapshot.docs.map(d => d.data().indexNumber));
      const existingUsernames = new Set(existingSnapshot.docs.map(d => d.data().username?.toLowerCase()));

      // Use Firestore batches for high performance
      const batchSize = 250; // 2 operations per row (user + stats)
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = writeBatch(db);
        const currentBatchRows = validRows.slice(i, i + batchSize);
        let batchCount = 0;

        for (const row of currentBatchRows) {
          try {
            const normalizedUsername = row.username.toLowerCase().trim();
            const systemEmail = `${normalizedUsername}@school.internal`;

            // Local duplicate check (O(1) with Sets)
            if (existingIndexNumbers.has(row.indexNumber) || existingUsernames.has(normalizedUsername)) {
              console.log(`Skipping duplicate student: ${row.indexNumber} / ${normalizedUsername}`);
              skipped++;
              completed++;
              continue;
            }

            const userRef = doc(collection(db, 'users'));
            batch.set(userRef, {
              email: row.email || '',
              username: normalizedUsername,
              systemEmail: systemEmail,
              fullName: row.fullName,
              indexNumber: row.indexNumber || '',
              dob: parseDate(row.dob || ''),
              class: row.class || '',
              division: row.division || '',
              role: 'student',
              passwordChanged: false,
              profileCompleted: false,
              points: 0,
              authCreated: false,
              tempPassword: row.password || '123456',
              createdAt: new Date().toISOString()
            });
            
            // Update global stats in the same batch
            const statsRef = doc(db, 'metadata', 'global_stats');
            batch.set(statsRef, {
              totalUsers: increment(1),
              'roleCounts.student': increment(1)
            }, { merge: true });
            
            // Add to local sets to prevent duplicates within the same import file
            existingIndexNumbers.add(row.indexNumber);
            existingUsernames.add(normalizedUsername);
            
            added++;
            batchCount++;
          } catch (err) {
            console.error('Error preparing student for batch:', err);
            errors++;
          }
          
          completed++;
          // Update progress even for skipped rows
          if (completed % 10 === 0) {
            setImportProgress(Math.round((completed / total) * 100));
          }
        }

        if (batchCount > 0) {
          await batch.commit();
        }
      }
      
      // Final progress update
      setImportProgress(100);
    } catch (err) {
      console.error('Bulk import failed:', err);
      setToast({ message: 'Bulk import failed. Please try again.', type: 'error' });
      setIsImporting(false);
      setIsImportPreviewOpen(false);
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_STUDENTS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_USERS });
      refetch();
      return;
    }
    
    setIsImporting(false);
    setIsImportPreviewOpen(false);
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_STUDENTS });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_USERS });
    refetch();
    
    let message = `Import finished. ${added} added to database.`;
    if (skipped > 0) message += ` ${skipped} skipped (duplicates).`;
    if (errors > 0) message += ` ${errors} failed.`;
    message += " Accounts will be created automatically on first login.";
    
    setToast({ message, type: errors > 0 ? 'error' : 'success' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', id));
      setToast({ message: 'Student deleted successfully', type: 'success' });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_STUDENTS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_USERS });
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setToast({ message: `Error deleting student: ${errorMessage}`, type: 'error' });
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Register and monitor student health profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <FileDown size={18} />
            Export
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm cursor-pointer">
            <FileUp size={18} />
            Import
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleImportFile} className="hidden" />
          </label>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"
          >
            <UserPlus size={18} />
            Add Student
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or index number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <Filter size={20} />
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-4">
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              <option value="">All Classes</option>
              {Array.from(new Set(allStudents.map(s => s.class).filter(Boolean))).map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
            </select>
            <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              <option value="">All Divisions</option>
              {Array.from(new Set(allStudents.map(s => s.division).filter(Boolean))).map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
            </select>
            <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Index No</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Points</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <HeartLoader />
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No students found
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                          <img 
                            src={student.photoUrl || `https://ui-avatars.com/api/?name=${student.fullName}&background=3b82f6&color=fff`} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{student.fullName}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Adm: {student.admissionNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{student.indexNumber}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">{student.class}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.gender}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-blue-600 font-bold">
                        <Award size={14} />
                        {student.points}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => navigate(`/health-passport/${student.id}`)}
                          className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                          title="View Health Passport"
                        >
                          <QrCode size={18} />
                        </button>
                        <button 
                          onClick={() => { setSelectedStudent(student); setIsHealthModalOpen(true); }}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Add Health Record"
                        >
                          <Activity size={18} />
                        </button>
                        <button 
                          onClick={() => openEditModal(student)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900 font-bold">{paginatedStudents.length}</span> of <span className="text-slate-900 font-bold">{filteredStudents.length}</span> students
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1">
              <span className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-200">
                {currentPage}
              </span>
              <span className="text-slate-400 font-medium">/</span>
              <span className="text-slate-600 font-medium">
                {totalPages || 1}
              </span>
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">{editingStudent ? 'Edit Student' : 'Register New Student'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingStudent(null); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Index Number</label>
                  <input 
                    type="text" 
                    required
                    value={formData.indexNumber || ''}
                    onChange={(e) => setFormData({...formData, indexNumber: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Admission Number</label>
                  <input 
                    type="text" 
                    value={formData.admissionNumber || ''}
                    onChange={(e) => setFormData({...formData, admissionNumber: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Username</label>
                  <input 
                    type="text" 
                    required
                    disabled={!!editingStudent}
                    value={formData.username || ''}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                  />
                </div>
                {!editingStudent && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Password</label>
                    <input 
                      type="password" 
                      required
                      value={formData.password || ''}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Date of Birth</label>
                  <input 
                    type="date" 
                    required
                    value={formData.dob || ''}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Class / Grade</label>
                  <input 
                    type="text" 
                    required
                    value={formData.class || ''}
                    onChange={(e) => setFormData({...formData, class: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Division</label>
                  <input 
                    type="text" 
                    required
                    value={formData.division || ''}
                    onChange={(e) => setFormData({...formData, division: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Profile Photo</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      // Handle file upload logic here (e.g., upload to Firebase Storage)
                      // For now, we'll just set a placeholder or handle it later
                      console.log(e.target.files?.[0]);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-bold">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-200">Register Student</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Health Record Modal */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">New Health Record</h2>
              <button onClick={() => setIsHealthModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddHealthRecord} className="p-8 space-y-6">
              <p className="text-sm text-slate-500">Recording measurements for <span className="font-bold text-slate-900">{selectedStudent?.fullName}</span></p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Ruler size={16} className="text-blue-500" /> Height (cm)
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    value={healthData.height}
                    onChange={(e) => setHealthData({...healthData, height: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Scale size={16} className="text-blue-500" /> Weight (kg)
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    value={healthData.weight}
                    onChange={(e) => setHealthData({...healthData, weight: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Measurement Date</label>
                  <input 
                    type="date" 
                    required
                    value={healthData.date}
                    onChange={(e) => setHealthData({...healthData, date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all">
                Save Record
              </button>
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
            className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Import Preview</h2>
                <p className="text-slate-500 font-medium">Review the data before updating the database</p>
              </div>
              {!isImporting && (
                <button 
                  onClick={() => setIsImportPreviewOpen(false)} 
                  className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"
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
                        className="text-slate-100"
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
                      <span className="text-4xl font-black text-slate-900">{importProgress}%</span>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">Importing Data...</h3>
                    <p className="text-slate-500">Please do not close this window until the process is complete.</p>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-[1.5rem] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Full Name</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Username</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Index Number</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Class</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importPreviewData.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{row.fullName || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.username || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.indexNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.class || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreviewData.length > 10 && (
                    <div className="p-4 bg-slate-50 text-center border-t border-slate-200">
                      <p className="text-sm font-bold text-slate-500 italic">
                        Showing first 10 of {importPreviewData.length} records...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isImporting && (
              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
                <button 
                  onClick={() => setIsImportPreviewOpen(false)} 
                  className="px-8 py-3 text-slate-600 font-black hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmImport} 
                  className="px-10 py-3 bg-blue-500 text-white rounded-2xl font-black hover:bg-blue-600 shadow-xl shadow-blue-200 transition-all active:scale-95"
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
