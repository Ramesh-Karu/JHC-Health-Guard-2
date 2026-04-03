import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, doc, getDoc, orderBy, onSnapshot } from '../firebase';
import { 
  User, 
  ShieldCheck, 
  QrCode, 
  Printer, 
  Download, 
  History, 
  Award, 
  Activity, 
  Apple, 
  ChevronLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Scale,
  Ruler,
  Brain,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { useAuth } from '../App';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  LineChart,
  Line
} from 'recharts';
import { HealthPassportCard } from '../components/HealthPassportCard';
import { Skeleton } from '../components/Skeleton';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

import { useStudentProfile, useStudentHealthRecords, useStudentActivities } from '../lib/queries';

import { LoginPrompt } from '../components/LoginPrompt';

export default function HealthPassport() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const targetId = id || user?.id || '';
  
  if (!user && !id) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <LoginPrompt 
          title="Digital Health Passport"
          description="Access your official student health record, BMI history, and activity logs. Login to view your passport."
        />
      </div>
    );
  }

  const { data: student, isLoading: studentLoading } = useStudentProfile(targetId);
  const { data: healthHistory, isLoading: hrLoading } = useStudentHealthRecords(targetId);
  const { data: activities, isLoading: actLoading } = useStudentActivities(targetId);
  
  const loading = studentLoading || hrLoading || actLoading;
  const componentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Health_Passport_${student?.fullName || 'Student'}`,
  });

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    
    try {
      const imgData = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2 });
      
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Health_Passport_${student?.fullName || 'Student'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    
    try {
      const imgData = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2 });
      
      const pdf = new jsPDF('l', 'mm', [150, 87]); // Card size in mm
      pdf.addImage(imgData, 'PNG', 0, 0, 150, 87);
      pdf.save(`Health_Passport_${student?.fullName || 'Student'}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const latestRecord = healthHistory[0];
  const passportUrl = `https://healthguard.online/health-passport/${student?.id}`;

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      const shareText = `Check out ${student?.fullName}'s Health Passport!\nClass: ${student?.class}\nIndex: ${student?.indexNumber}\nHealth Status: ${latestRecord?.category || 'Normal'}`;
      const branding = `Powered by JHC Health Guard - AI Integrated Health Management System of Jaffna Hindu College`;
      
      if (Capacitor.isNativePlatform()) {
        const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2 });
        const base64Data = dataUrl.split(',')[1];
        
        const fileName = `Health_Passport_${student?.id}.png`;
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });
        
        await Share.share({
          title: `${student?.fullName}'s Health Passport`,
          text: `${shareText}\n\n${passportUrl}\n\n${branding}`,
          url: savedFile.uri,
          dialogTitle: 'Share Health Passport'
        });
      } else {
        const blob = await htmlToImage.toBlob(cardRef.current, { pixelRatio: 2 });
        
        if (!blob) {
          throw new Error('Could not generate image blob');
        }
        
        const file = new File([blob], `Health_Passport_${student?.fullName || 'Student'}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${student?.fullName}'s Health Passport`,
            text: `${shareText}\n\n${branding}`,
            url: passportUrl,
            files: [file]
          });
        } else if (navigator.share) {
          await navigator.share({
            title: `${student?.fullName}'s Health Passport`,
            text: `${shareText}\n\n${branding}`,
            url: passportUrl
          });
        } else {
          await navigator.clipboard.writeText(`${shareText}\n\n${passportUrl}\n\n${branding}`);
          alert('Link copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        const fallbackText = `Check out ${student?.fullName}'s Health Passport!\nClass: ${student?.class}\nIndex: ${student?.indexNumber}\nHealth Status: ${latestRecord?.category || 'Normal'}\n\n${passportUrl}\n\nPowered by JHC Health Guard - AI Integrated Health Management System of Jaffna Hindu College`;
        await navigator.clipboard.writeText(fallbackText);
        alert('Link copied to clipboard!');
      } catch (clipboardError) {
        alert('Sharing is not supported on this device.');
      }
    }
  };

  const CardWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      whileHover={{ 
        y: -10, 
        rotateX: 5, 
        rotateY: 5, 
        scale: 1.02,
        transition: { duration: 0.2 } 
      }}
      style={{ perspective: 1000 }}
    >
      {children}
    </motion.div>
  );

  if (loading) return (
    <div className="space-y-8 pb-12 px-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-[40px]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <div className="space-y-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    </div>
  );

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500">
          <User size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Student Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400">The health passport you are looking for does not exist or you do not have permission to view it.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <ChevronLeft size={24} className="text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Digital Health Passport</h1>
            <p className="text-slate-500 dark:text-slate-400">Official student health record</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleShare}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Share2 size={18} />
            <span className="whitespace-nowrap">Share</span>
          </button>
          <button 
            onClick={() => handlePrint()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <Printer size={18} />
            <span className="whitespace-nowrap">Print Report</span>
          </button>
          <button 
            onClick={handleDownloadImage}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
          >
            <Download size={18} />
            <span className="whitespace-nowrap">Download Image</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
          >
            <Download size={18} />
            <span className="whitespace-nowrap">Download PDF</span>
          </button>
        </div>
      </div>

      <div ref={componentRef} className="print:p-8 space-y-8">
        {/* Passport Card for PDF and Image Generation */}
        <div className="absolute left-[-9999px] top-[-9999px] print:static print:block">
          <HealthPassportCard ref={cardRef} student={student} passportUrl={passportUrl} />
        </div>
        
        {/* Passport Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] border-4 border-white/20 overflow-hidden shadow-2xl flex-shrink-0 bg-white">
              <img 
                src="https://image2url.com/r2/default/images/1773243015309-8d00926d-bd9c-4a4d-931d-e00cbf039414.jpg" 
                alt={student?.fullName} 
                className="w-full h-full object-contain p-2"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-4 mb-6">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight break-words text-center md:text-left w-full md:w-auto flex items-center justify-center md:justify-start gap-2">
                  {student?.fullName}
                  {student?.wellnessBadge && (
                    <CheckCircle2 size={28} className="text-emerald-400 fill-emerald-400/10" />
                  )}
                </h2>
                <span className="px-4 py-1 bg-blue-500/30 backdrop-blur-md rounded-full text-sm font-bold border border-white/20 whitespace-nowrap">
                  {student?.class}
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-slate-300">
                <div className="bg-white/5 p-3 rounded-2xl md:bg-transparent md:p-0 md:rounded-none">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Index Number</p>
                  <p className="font-bold text-white break-all">{student?.indexNumber}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl md:bg-transparent md:p-0 md:rounded-none">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Date of Birth</p>
                  <p className="font-bold text-white">{student?.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl md:bg-transparent md:p-0 md:rounded-none">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Gender</p>
                  <p className="font-bold text-white capitalize">{student?.gender}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl md:bg-transparent md:p-0 md:rounded-none">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Health Status</p>
                  <p className="font-bold text-emerald-400">{latestRecord?.category || 'Normal'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-2xl flex-shrink-0 mt-4 md:mt-0">
              <QRCodeSVG value={passportUrl} size={100} className="md:w-[120px] md:h-[120px]" />
              <p className="text-[10px] font-bold text-slate-400 text-center mt-2 uppercase tracking-widest">Verify Passport</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column: Health Metrics & History */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <CardWrapper>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-xl flex items-center justify-center">
                      <Scale size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Weight</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{latestRecord?.weight || 0} kg</p>
                </div>
              </CardWrapper>
              <CardWrapper>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                      <Ruler size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Height</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{latestRecord?.height || 0} cm</p>
                </div>
              </CardWrapper>
              <CardWrapper>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                      <Ruler size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Hip/Waist</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{latestRecord?.hip || 0} / {latestRecord?.waist || 0} cm</p>
                </div>
              </CardWrapper>
              <CardWrapper>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 rounded-xl flex items-center justify-center">
                      <Activity size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Grip</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{latestRecord?.gripStrength || 0} kg</p>
                </div>
              </CardWrapper>
              <CardWrapper>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/20 text-violet-500 dark:text-violet-400 rounded-xl flex items-center justify-center">
                      <Activity size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">BMI</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{latestRecord?.bmi?.toFixed(1) || '0.0'}</p>
                </div>
              </CardWrapper>
            </div>

            {/* Growth Charts */}
            <CardWrapper>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-500" />
                  Growth Pattern Analysis
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...healthHistory].reverse()}>
                      <defs>
                        <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="bmi" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBmi)" strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardWrapper>

            {/* Activity History */}
            <CardWrapper>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Award size={20} className="text-amber-500" />
                  Activity & Achievement Records
                </h3>
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                          <Activity className="text-blue-500" size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{activity.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(activity.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-600 dark:text-blue-400 font-bold">+{activity.points} pts</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activity.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardWrapper>
          </div>

          {/* Right Column: AI Insights & Nutrition */}
          <div className="space-y-8">
            {/* Contact Info */}
            <CardWrapper>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Emergency Contact</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parent/Guardian</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{student?.parentName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Number</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{student?.parentContact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{student?.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardWrapper>
          </div>
          </motion.div>

        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 text-xs">
          <p>This is an official Digital Health Passport issued by Jaffna Hindu College.</p>
          <p className="mt-1">Verification Code: {student?.indexNumber}-{student?.id}-{new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
