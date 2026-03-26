import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType, collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc, initializeApp, deleteApp, getAuth, createUserWithEmailAndPassword, firebaseConfig, signOut, writeBatch, orderBy, limit, startAfter, getCountFromServer } from '../firebase';
import { Search, Plus, Trash2, FileDown, FileUp, X, UserPlus, Edit2 } from 'lucide-react';
import { useAuth } from '../App';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { User } from '../types';
import Toast from '../components/Toast';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyLazy, setShowOnlyLazy] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pagination States
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [firstDoc, setFirstDoc] = useState<any>(null);
  const [pageStack, setPageStack] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 20;

  // Import Preview States
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    role: 'student'
  });

  const fetchUsers = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    setLoading(true);
    try {
      const usersCol = collection(db, 'users');
      
      // Get total count on initial load
      if (direction === 'initial') {
        const countSnapshot = await getCountFromServer(usersCol);
        setTotalUsers(countSnapshot.data().count);
        setPageStack([]);
      }

      let q;
      if (searchTerm) {
        // Prefix search for fullName
        q = query(
          usersCol, 
          where('fullName', '>=', searchTerm),
          where('fullName', '<=', searchTerm + '\uf8ff'),
          limit(usersPerPage)
        );
      } else if (showOnlyLazy) {
        q = query(
          usersCol,
          where('authCreated', '==', false),
          orderBy('fullName'),
          limit(usersPerPage)
        );
      } else {
        q = query(usersCol, orderBy('fullName'), limit(usersPerPage));
      }

      if (direction === 'next' && lastDoc) {
        if (searchTerm) {
          q = query(
            usersCol,
            where('fullName', '>=', searchTerm),
            where('fullName', '<=', searchTerm + '\uf8ff'),
            startAfter(lastDoc),
            limit(usersPerPage)
          );
        } else if (showOnlyLazy) {
          q = query(
            usersCol,
            where('authCreated', '==', false),
            orderBy('fullName'),
            startAfter(lastDoc),
            limit(usersPerPage)
          );
        } else {
          q = query(usersCol, orderBy('fullName'), startAfter(lastDoc), limit(usersPerPage));
        }
      } else if (direction === 'prev' && pageStack.length > 1) {
        const prevDoc = pageStack[pageStack.length - 2];
        if (searchTerm) {
          q = query(
            usersCol,
            where('fullName', '>=', searchTerm),
            where('fullName', '<=', searchTerm + '\uf8ff'),
            startAfter(prevDoc),
            limit(usersPerPage)
          );
        } else if (showOnlyLazy) {
          q = query(
            usersCol,
            where('authCreated', '==', false),
            orderBy('fullName'),
            startAfter(prevDoc),
            limit(usersPerPage)
          );
        } else {
          q = query(usersCol, orderBy('fullName'), startAfter(prevDoc), limit(usersPerPage));
        }
        // If going back to first page
        if (pageStack.length === 2) {
           if (searchTerm) {
            q = query(
              usersCol,
              where('fullName', '>=', searchTerm),
              where('fullName', '<=', searchTerm + '\uf8ff'),
              limit(usersPerPage)
            );
          } else if (showOnlyLazy) {
            q = query(
              usersCol,
              where('authCreated', '==', false),
              orderBy('fullName'),
              limit(usersPerPage)
            );
          } else {
            q = query(usersCol, orderBy('fullName'), limit(usersPerPage));
          }
        }
      }

      if (!q) return; // Safety check for TS

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as object) }));
      setUsers(data as any);
      
      if (snapshot.docs.length > 0) {
        setFirstDoc(snapshot.docs[0]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        
        if (direction === 'next') {
          setPageStack(prev => [...prev, snapshot.docs[0]]);
          setCurrentPage(prev => prev + 1);
        } else if (direction === 'prev') {
          setPageStack(prev => prev.slice(0, -1));
          setCurrentPage(prev => prev - 1);
        } else {
          setPageStack([snapshot.docs[0]]);
          setCurrentPage(1);
        }
      } else {
        setUsers([]);
        setLastDoc(null);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      handleFirestoreError(err, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers('initial');
  }, [showOnlyLazy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers('initial');
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating user with data:', formData);
    try {
      const tempApp = initializeApp(firebaseConfig, 'temp-create-user-' + Date.now());
      const tempAuth = getAuth(tempApp);
      
      const normalizedUsername = formData.username.toLowerCase().trim();
      const systemEmail = `${normalizedUsername}@school.internal`;
      const userCredential = await createUserWithEmailAndPassword(tempAuth, systemEmail, formData.password);
      
      console.log('User created in Auth, UID:', userCredential.user.uid);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: formData.email,
        username: normalizedUsername,
        systemEmail: systemEmail,
        fullName: formData.fullName,
        role: formData.role,
        passwordChanged: false,
        profileCompleted: false,
        createdAt: new Date().toISOString()
      });
      
      console.log('User saved to Firestore');
      await deleteApp(tempApp);
      
      setIsModalOpen(false);
      setFormData({ email: '', username: '', password: '', fullName: '', role: 'student' });
      setToast({ message: 'User created successfully', type: 'success' });
      fetchUsers('initial');
    } catch (err: any) {
      console.error("Error creating user:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (errorMessage.includes('auth/email-already-in-use')) {
        setToast({ message: 'Username or email is already taken.', type: 'error' });
      } else if (errorMessage.includes('auth/weak-password')) {
        setToast({ message: 'Password should be at least 6 characters.', type: 'error' });
      } else {
        setToast({ message: 'Error creating user. Please try again.', type: 'error' });
      }
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    console.log('Editing user:', editingUser.id, 'with data:', { fullName: editingUser.fullName, role: editingUser.role });
    try {
      console.log('Updating Firestore doc:', editingUser.id);
      await updateDoc(doc(db, 'users', editingUser.id), {
        fullName: editingUser.fullName,
        role: editingUser.role
      });
      console.log('User updated successfully');
      setIsEditModalOpen(false);
      setEditingUser(null);
      setToast({ message: 'User updated successfully', type: 'success' });
      fetchUsers('initial');
    } catch (err) {
      console.error('Error updating user:', err);
      setToast({ message: 'Error updating user', type: 'error' });
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setToast({ message: 'User deleted successfully', type: 'success' });
        fetchUsers('initial');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setToast({ message: `Error deleting user: ${errorMessage}`, type: 'error' });
        handleFirestoreError(err, OperationType.DELETE, 'users');
      }
    }
  };

  const handleDeleteAllStudents = async () => {
    const students = users.filter(u => u.role === 'student');
    if (students.length === 0) {
      setToast({ message: 'No students found to delete', type: 'error' });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ALL ${students.length} students? This action cannot be undone.`)) {
      try {
        setIsImporting(true);
        setImportProgress(0);
        
        const batchSize = 500;
        for (let i = 0; i < students.length; i += batchSize) {
          const batch = writeBatch(db);
          const currentBatch = students.slice(i, i + batchSize);
          
          currentBatch.forEach(student => {
            batch.delete(doc(db, 'users', student.id));
          });
          
          await batch.commit();
          setImportProgress(Math.round(((i + currentBatch.length) / students.length) * 100));
        }
        
        setToast({ message: `Successfully deleted ${students.length} students`, type: 'success' });
        fetchUsers('initial');
      } catch (err) {
        console.error('Error deleting all students:', err);
        setToast({ message: 'Error deleting students. Some may not have been deleted.', type: 'error' });
      } finally {
        setIsImporting(false);
        setImportProgress(0);
      }
    }
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(users);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users.csv';
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
    const validRows = importPreviewData.filter(row => row.username && row.fullName && row.password);
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
        const existingUsernames = new Set<string>();
        for (let j = 0; j < currentBatchRows.length; j += checkBatchSize) {
          const checkBatch = currentBatchRows.slice(j, j + checkBatchSize);
          const usernamesToCheck = checkBatch.map(r => r.username.toLowerCase().trim());
          
          if (usernamesToCheck.length > 0) {
            const q = query(
              collection(db, 'users'), 
              where('username', 'in', usernamesToCheck)
            );
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(d => {
              const uname = d.data().username;
              if (uname) existingUsernames.add(uname.toLowerCase());
            });
          }
        }

        let batchCount = 0;
        for (const row of currentBatchRows) {
          try {
            const normalizedUsername = row.username.toLowerCase().trim();
            
            // Check for duplicate username
            if (existingUsernames.has(normalizedUsername)) {
              skipped++;
              completed++;
              continue;
            }

            const userRef = doc(collection(db, 'users'));
            const systemEmail = `${normalizedUsername}@school.internal`;
            
            batch.set(userRef, {
              email: row.email || '',
              username: normalizedUsername,
              systemEmail: systemEmail,
              fullName: row.fullName,
              role: row.role || 'student',
              dob: row.dob || '',
              authCreated: false,
              tempPassword: row.password,
              passwordChanged: false,
              profileCompleted: false,
              createdAt: new Date().toISOString()
            });
            
            existingUsernames.add(normalizedUsername);
            added++;
            batchCount++;
          } catch (err) {
            console.error('Error preparing user for batch:', err);
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
    fetchUsers('initial');
    
    let message = `Import finished. ${added} added to database.`;
    if (skipped > 0) message += ` ${skipped} skipped (duplicates).`;
    if (errors > 0) message += ` ${errors} failed.`;
    message += " Accounts will be created automatically on first login.";
    
    setToast({ message, type: errors > 0 ? 'error' : 'success' });
  };

  const handleResetAccount = async (u: User) => {
    if (window.confirm(`Are you sure you want to reset ${u.fullName}'s account? This will delete their Firebase Auth account and allow a fresh login with the default password.`)) {
      try {
        // 1. Delete Auth user via backend API
        const currentUser = auth.currentUser;
        if (currentUser) {
          const idToken = await currentUser.getIdToken();
          const emailToDelete = u.email || `${u.username}@school.internal`;
          
          const response = await fetch('/api/admin/delete-auth-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ email: emailToDelete })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete auth user');
          }
          
          const result = await response.json();
          console.log('Auth user deletion result:', result);
        }

        // 2. Reset Firestore document
        // We don't need to change the username anymore if we delete the Auth user!
        // But we'll keep the option to reset it if they want to be extra safe.
        // For now, let's just reset the authCreated flag.
        await updateDoc(doc(db, 'users', u.id), {
          authCreated: false,
          passwordChanged: false,
          tempPassword: '123456'
        });
        
        setToast({ message: `Account reset for ${u.username}. Password: 123456`, type: 'success' });
      } catch (err: any) {
        console.error('Error resetting account:', err);
        setToast({ message: `Error resetting account: ${err.message}`, type: 'error' });
      }
    }
  };

  return (
    <div className="space-y-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl"
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold cursor-pointer">
            <input 
              type="checkbox" 
              checked={showOnlyLazy} 
              onChange={(e) => setShowOnlyLazy(e.target.checked)}
              className="w-4 h-4"
            />
            Show Lazy Accounts
          </label>
          <button onClick={handleDeleteAllStudents} className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-xl text-red-600 font-bold hover:bg-red-50">
            <Trash2 size={18} /> Delete All Students
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50">
            <FileDown size={18} /> Export CSV
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer">
            <FileUp size={18} /> Import File
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleImportFile} className="hidden" />
          </label>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600">
            <UserPlus size={18} /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 font-bold">
                  {u.fullName}
                  {u.authCreated === false && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-full">Lazy</span>
                  )}
                </td>
                <td className="px-6 py-4">{u.username}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4 capitalize">{u.role}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => { setEditingUser(u); setIsEditModalOpen(true); }} className="text-blue-500 hover:text-blue-700" title="Edit User"><Edit2 size={18} /></button>
                  <button onClick={() => handleResetAccount(u)} className="text-amber-500 hover:text-amber-700" title="Reset Account (Fix Login Issues)"><UserPlus size={18} /></button>
                  <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700" title="Delete User"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button 
            disabled={currentPage === 1 || loading}
            onClick={() => fetchUsers('prev')}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm font-bold text-slate-700">
            Page {currentPage} {totalUsers > 0 && `of ${totalPages}`}
          </span>
          <button 
            disabled={users.length < usersPerPage || loading}
            onClick={() => fetchUsers('next')}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Add New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input type="text" placeholder="Full Name" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <input type="text" placeholder="Username" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <input type="email" placeholder="Email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <input type="password" placeholder="Password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
                <option value="organic-admin">Organic Admin</option>
                <option value="breakfast-admin">Healthy Canteen Admin</option>
              </select>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-bold">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600">Add User</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <input type="text" placeholder="Full Name" required value={editingUser.fullName || ''} onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
                <option value="organic-admin">Organic Admin</option>
                <option value="breakfast-admin">Healthy Canteen Admin</option>
              </select>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }} className="px-6 py-2.5 text-slate-600 font-bold">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600">Save Changes</button>
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
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">DOB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importPreviewData.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{row.fullName || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.username || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.role || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.email || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.dob || '-'}</td>
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
