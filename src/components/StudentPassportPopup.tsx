import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType, doc, getDoc, collection, query, where, orderBy, limit, getDocs } from '../firebase';
import { 
  X, 
  User, 
  ShieldCheck, 
  Activity, 
  Scale, 
  Ruler, 
  TrendingUp, 
  Phone, 
  MapPin,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudentPassportPopupProps {
  studentId: string;
  onClose: () => void;
}

export default function StudentPassportPopup({ studentId, onClose }: StudentPassportPopupProps) {
  const [student, setStudent] = useState<any>(null);
  const [latestRecord, setLatestRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        // Fetch student profile
        const studentSnap = await getDoc(doc(db, 'users', studentId));
        if (studentSnap.exists()) {
          setStudent({ id: studentSnap.id, ...studentSnap.data() });
          
          // Fetch latest health record
          const hrQuery = query(
            collection(db, 'health_records'), 
            where('userId', '==', studentId), 
            orderBy('date', 'desc'),
            limit(1)
          );
          const hrSnap = await getDocs(hrQuery);
          if (!hrSnap.empty) {
            setLatestRecord(hrSnap.docs[0].data());
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${studentId}`);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all z-10"
        >
          <X size={20} />
        </button>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Fetching student data...</p>
          </div>
        ) : !student ? (
          <div className="p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <User size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">Student Not Found</h3>
              <p className="text-slate-500">The scanned QR code does not match any student in our records.</p>
            </div>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-24 h-24 rounded-3xl border-2 border-white/20 overflow-hidden bg-white flex-shrink-0">
                  <img 
                    src={student.photoUrl || `https://ui-avatars.com/api/?name=${student.fullName}&background=3b82f6&color=fff`} 
                    alt={student.fullName} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-bold truncate">{student.fullName}</h3>
                    {student.wellnessBadge && <ShieldCheck size={20} className="text-emerald-400 fill-emerald-400/20 flex-shrink-0" />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-0.5 bg-blue-500/30 rounded-full text-xs font-bold border border-white/10">
                      {student.class}
                    </span>
                    <span className="px-3 py-0.5 bg-white/10 rounded-full text-xs font-bold border border-white/10">
                      {student.indexNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8 space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-3xl text-center">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                    <Scale size={16} className="text-blue-500" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</p>
                  <p className="font-bold text-slate-900">{latestRecord?.weight || '--'} kg</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl text-center">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                    <Ruler size={16} className="text-indigo-500" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Height</p>
                  <p className="font-bold text-slate-900">{latestRecord?.height || '--'} cm</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl text-center">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                    <Activity size={16} className="text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BMI</p>
                  <p className="font-bold text-slate-900">{latestRecord?.bmi?.toFixed(1) || '--'}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Phone size={18} className="text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emergency Contact</p>
                    <p className="text-sm font-bold text-slate-900">{student.parentContact || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <MapPin size={18} className="text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{student.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => navigate(`/health-passport/${student.id}`)}
                  className="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                >
                  <ExternalLink size={18} />
                  Full Passport
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
