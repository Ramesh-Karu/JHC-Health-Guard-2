import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, orderBy, limit, startAfter, getCountFromServer } from '../firebase';
import { Search, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../App';

export default function CoachAttendance() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [pageStack, setPageStack] = useState<any[]>([]);
  const athletesPerPage = 20;

  const fetchAthletes = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    if (!user) return;
    setLoading(true);
    try {
      const usersCol = collection(db, 'users');
      let baseQ = query(usersCol, where('role', '==', 'student'));

      if (searchTerm) {
        baseQ = query(baseQ, where('fullName', '>=', searchTerm), where('fullName', '<=', searchTerm + '\uf8ff'));
      }

      if (direction === 'initial') {
        const countSnapshot = await getCountFromServer(baseQ);
        setTotalAthletes(countSnapshot.data().count);
        setPageStack([]);
      }

      let q = query(baseQ, orderBy('fullName'), limit(athletesPerPage));

      if (direction === 'next' && lastDoc) {
        q = query(baseQ, orderBy('fullName'), startAfter(lastDoc), limit(athletesPerPage));
      } else if (direction === 'prev' && pageStack.length > 1) {
        const prevDoc = pageStack[pageStack.length - 2];
        q = query(baseQ, orderBy('fullName'), startAfter(prevDoc), limit(athletesPerPage));
        if (pageStack.length === 2) {
          q = query(baseQ, orderBy('fullName'), limit(athletesPerPage));
        }
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAthletes(data);

      if (snapshot.docs.length > 0) {
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
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAthletes('initial');
    }, 500);
    return () => clearTimeout(timer);
  }, [user, searchTerm]);

  const markAttendance = async () => {
    try {
      const attendanceList = athletes.map((a: any) => ({
        studentId: a.id,
        status: attendance[a.id] || 'Present'
      }));
      
      await addDoc(collection(db, 'attendance'), {
        date,
        recordedBy: user?.id,
        attendance: attendanceList
      });

      alert('Attendance marked!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Training Attendance</h1>
          <p className="text-slate-500 mt-1">Mark attendance for your training sessions</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="p-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
        />
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <span className="text-sm font-medium text-slate-500">
            Showing {athletes.length} students
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1 || loading}
              onClick={() => fetchAthletes('prev')}
              className="p-1 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-white"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-bold text-slate-600">
              Page {currentPage}
            </span>
            <button 
              disabled={athletes.length < athletesPerPage || loading}
              onClick={() => fetchAthletes('next')}
              className="p-1 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading students...</div>
          ) : athletes.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                  {a.fullName?.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-slate-900">{a.fullName}</div>
                  <div className="text-xs text-slate-500">{a.indexNumber || 'No Index'}</div>
                </div>
              </div>
              <select 
                value={attendance[a.id] || 'Present'}
                onChange={e => setAttendance({...attendance, [a.id]: e.target.value})} 
                className={`p-2 border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 ${
                  attendance[a.id] === 'Absent' ? 'text-red-600 border-red-200 bg-red-50' :
                  attendance[a.id] === 'Excused' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                  'text-emerald-600 border-emerald-200 bg-emerald-50'
                }`}
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Excused">Excused</option>
              </select>
            </div>
          ))}
          {athletes.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">No students found.</div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <button 
            onClick={markAttendance} 
            disabled={athletes.length === 0 || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 size={20} />
            Submit Attendance for Current Page
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">
            Note: Attendance is submitted for the students visible on the current page.
          </p>
        </div>
      </div>
    </div>
  );
}
