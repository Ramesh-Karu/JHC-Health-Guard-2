import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Activity, AlertCircle, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useAuth } from '../App';
import StudentHealthHistoryModal from '../components/StudentHealthHistoryModal';
import { useTeacherStudents } from '../lib/queries';

export default function TeacherStudents() {
  const { user } = useAuth();
  const { data: students = [], isLoading: loading } = useTeacherStudents(user?.class || '', user?.division || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const studentsPerPage = 10;

  const filteredStudents = students.filter((s: any) => {
    const nameMatch = s.fullName ? s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const indexMatch = s.indexNumber ? s.indexNumber.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return nameMatch || indexMatch;
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const currentStudents = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);

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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button 
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-slate-700 px-2">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button 
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {(!user?.class || !user?.division) ? (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle size={48} className="mx-auto mb-4 text-slate-400" />
              <p className="text-lg font-medium">You have not been assigned to a classroom.</p>
              <p className="text-sm">Please contact the administrator to assign you to a class.</p>
            </div>
          ) : loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-slate-500">Loading students...</p>
            </div>
          ) : (
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
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.map((student: any) => (
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
                    <td className="p-4">
                      <button 
                        onClick={() => setSelectedStudent(student)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <History size={16} />
                        History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {currentStudents.length === 0 && !loading && (user?.class && user?.division) && (
            <div className="p-8 text-center text-slate-500">
              No students found in your class.
            </div>
          )}
        </div>
      </div>
      {selectedStudent && (
        <StudentHealthHistoryModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
}
