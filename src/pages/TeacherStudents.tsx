import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, orderBy, limit, startAfter, getCountFromServer } from '../firebase';
import { Search, User, Activity, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../App';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [pageStack, setPageStack] = useState<any[]>([]);
  const studentsPerPage = 10;

  const fetchStudents = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    if (!user) return;
    setLoading(true);
    try {
      const studentsCol = collection(db, 'users');
      
      // Base query: only students in the teacher's class/division
      let baseQ = query(
        studentsCol, 
        where('role', '==', 'student'),
        where('class', '==', user.class),
        where('division', '==', user.division)
      );

      // Get total count on initial load
      if (direction === 'initial') {
        const countSnapshot = await getCountFromServer(baseQ);
        setTotalStudents(countSnapshot.data().count);
        setPageStack([]);
      }

      let q = query(baseQ, orderBy('fullName'), limit(studentsPerPage));

      if (direction === 'next' && lastDoc) {
        q = query(baseQ, orderBy('fullName'), startAfter(lastDoc), limit(studentsPerPage));
      } else if (direction === 'prev' && pageStack.length > 1) {
        const prevDoc = pageStack[pageStack.length - 2];
        q = query(baseQ, orderBy('fullName'), startAfter(prevDoc), limit(studentsPerPage));
        if (pageStack.length === 2) {
          q = query(baseQ, orderBy('fullName'), limit(studentsPerPage));
        }
      }

      const snapshot = await getDocs(q);
      const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch latest health record for each student on the CURRENT PAGE ONLY
      const studentsWithHealth = await Promise.all(studentsData.map(async (student: any) => {
        const healthQ = query(
          collection(db, 'health_records'),
          where('userId', '==', student.id),
          orderBy('date', 'desc'),
          limit(1)
        );
        const healthSnapshot = await getDocs(healthQ);
        let latestBmi = null;
        let healthCategory = 'N/A';
        let latestDate = '';
        
        if (!healthSnapshot.empty) {
          const latestRecord = healthSnapshot.docs[0].data();
          latestBmi = latestRecord.bmi;
          healthCategory = latestRecord.category;
          latestDate = latestRecord.date;
        }

        return {
          ...student,
          latestBmi,
          healthCategory,
          latestDate
        };
      }));

      setStudents(studentsWithHealth);

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
      console.error('Error fetching students:', error);
      handleFirestoreError(error, OperationType.GET, 'users/health_records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents('initial');
  }, [user]);

  const totalPages = Math.ceil(totalStudents / studentsPerPage);

  const filteredStudents = students.filter((s: any) => {
    const nameMatch = s.fullName ? s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const indexMatch = s.indexNumber ? s.indexNumber.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return nameMatch || indexMatch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Students</h1>
          <p className="text-slate-500 mt-1">Manage and view students in your assigned class</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button 
              disabled={currentPage === 1 || loading}
              onClick={() => fetchStudents('prev')}
              className="p-2 border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-slate-700 px-2">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button 
              disabled={students.length < studentsPerPage || loading}
              onClick={() => fetchStudents('next')}
              className="p-2 border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Index Number</th>
                <th className="p-4 font-medium">Class/Div</th>
                <th className="p-4 font-medium">Points</th>
                <th className="p-4 font-medium">Latest BMI</th>
                <th className="p-4 font-medium">Health Status</th>
                <th className="p-4 font-medium">Latest Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student: any) => (
                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                        <img 
                          src={student.photoUrl || `https://ui-avatars.com/api/?name=${student.fullName}&background=random`} 
                          alt={student.fullName} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-medium text-slate-900">{student.fullName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{student.indexNumber || 'N/A'}</td>
                  <td className="p-4 text-slate-600">{student.class ? `${student.class} - ${student.division}` : 'N/A'}</td>
                  <td className="p-4 font-bold text-blue-600">{student.points || 0}</td>
                  <td className="p-4 font-mono text-slate-700">
                    {student.latestBmi ? student.latestBmi.toFixed(1) : 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      student.healthCategory === 'Normal' ? 'bg-emerald-100 text-emerald-700' :
                      student.healthCategory === 'Underweight' ? 'bg-blue-100 text-blue-700' :
                      student.healthCategory === 'Overweight' ? 'bg-orange-100 text-orange-700' :
                      student.healthCategory === 'Obese' ? 'bg-red-100 text-red-700' :
                      student.healthCategory === 'At Risk (Waist/Hip)' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {student.healthCategory}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{student.latestDate || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">
              No students found in your class.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
