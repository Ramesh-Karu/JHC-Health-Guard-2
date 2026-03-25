import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, orderBy, limit } from '../firebase';
import { Search, User, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../App';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterBmiCategory, setFilterBmiCategory] = useState('');
  const [filterHealthStatus, setFilterHealthStatus] = useState('');
  const [filterPoints, setFilterPoints] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user) return;
      try {
        // Fetch students in teacher's class
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const querySnapshot = await getDocs(q);
        const studentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch latest health record for each student to get BMI and category
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

        setStudents(studentsWithHealth as any);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users/health_records');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user]);

  const uniqueClasses = Array.from(new Set(students.map((s: any) => s.class).filter(Boolean)));
  const uniqueDivisions = Array.from(new Set(students.map((s: any) => s.division).filter(Boolean)));

  const filteredStudents = students.filter((s: any) => {
    const nameMatch = s.fullName ? s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const indexMatch = s.indexNumber ? s.indexNumber.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesSearch = nameMatch || indexMatch;
    const matchesClass = filterClass ? s.class === filterClass : true;
    const matchesDivision = filterDivision ? s.division === filterDivision : true;
    const matchesBmiCategory = filterBmiCategory ? s.healthCategory === filterBmiCategory : true;
    
    let matchesHealthStatus = true;
    if (filterHealthStatus === 'Healthy') {
      matchesHealthStatus = s.healthCategory === 'Normal';
    } else if (filterHealthStatus === 'Unhealthy') {
      matchesHealthStatus = s.healthCategory && s.healthCategory !== 'Normal' && s.healthCategory !== 'N/A';
    }

    let matchesPoints = true;
    const pts = s.points || 0;
    if (filterPoints === '0-100') matchesPoints = pts >= 0 && pts <= 100;
    else if (filterPoints === '101-500') matchesPoints = pts > 100 && pts <= 500;
    else if (filterPoints === '501-1000') matchesPoints = pts > 500 && pts <= 1000;
    else if (filterPoints === '>1000') matchesPoints = pts > 1000;

    const matchesDate = filterDate ? s.latestDate === filterDate : true;
    
    return matchesSearch && matchesClass && matchesDivision && matchesBmiCategory && matchesHealthStatus && matchesPoints && matchesDate;
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
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Classes</option>
            {uniqueClasses.map((c: any) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Divisions</option>
            {uniqueDivisions.map((d: any) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterBmiCategory} onChange={e => setFilterBmiCategory(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All BMI Categories</option>
            <option value="Normal">Normal</option>
            <option value="Underweight">Underweight</option>
            <option value="Overweight">Overweight</option>
            <option value="Obese">Obese</option>
            <option value="At Risk (Waist/Hip)">At Risk (Waist/Hip)</option>
          </select>
          <select value={filterHealthStatus} onChange={e => setFilterHealthStatus(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Health Status</option>
            <option value="Healthy">Healthy</option>
            <option value="Unhealthy">Unhealthy</option>
          </select>
          <select value={filterPoints} onChange={e => setFilterPoints(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Points</option>
            <option value="0-100">0 - 100</option>
            <option value="101-500">101 - 500</option>
            <option value="501-1000">501 - 1000</option>
            <option value=">1000">&gt; 1000</option>
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-2 border border-slate-200 rounded-xl" />
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
