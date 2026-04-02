import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, doc, updateDoc, auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Hash, 
  Shield, 
  Edit3, 
  Save, 
  X,
  Camera,
  Heart,
  Activity,
  Award,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../App';
import { User } from '../types';
import { PassportImageUploader } from '../components/PassportImageUploader';

export default function HealthPass() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(!user?.profileCompleted);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        indexNumber: user.indexNumber,
        dob: user.dob,
        gender: user.gender,
        class: user.class,
        address: user.address,
        parentName: user.parentName,
        parentContact: user.parentContact,
        photoUrl: user.photoUrl
      });
    }
  }, [user]);

  const handleImageUpload = async (file: File) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('photo', file);
      
      // Get token from Firebase or LocalStorage
      let token = localStorage.getItem('token');
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      
      const response = await fetch('/api/upload-profile-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      const photoUrl = data.photoUrl;
      
      setFormData(prev => ({ ...prev, photoUrl }));
      
      // Also update Firestore immediately for the photo if using Firebase
      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, 'users', user.id), { photoUrl });
        } catch (err) {
          console.warn("Failed to update Firestore photoUrl, but server upload succeeded:", err);
        }
      }
      
      login({ ...user, photoUrl });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert(error.message || "Failed to upload image to server.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      // Ensure profileCompleted is set to true when saving
      const updatedData = { ...formData, profileCompleted: true };
      
      // Remove undefined values to prevent Firebase errors
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key as keyof typeof updatedData] === undefined) {
          delete (updatedData as any)[key];
        }
      });

      // Update Firestore
      try {
        await updateDoc(userRef, updatedData);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      }
      
      // Sync to Server
      try {
        let token = localStorage.getItem('token');
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }
        
        await fetch('/api/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedData)
        });
      } catch (e) {
        console.warn("Failed to sync profile to server:", e);
      }
      
      const updatedUser = { ...user, ...updatedData };
      login(updatedUser);
      setIsEditing(false);
      navigate('/dashboard');
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Helmet>
        <title>Health Passport | JHC Health Guard</title>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [{
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://jhchealthguard.online/"
            },{
              "@type": "ListItem",
              "position": 2,
              "name": "Health Passport",
              "item": "https://jhchealthguard.online/health-passport"
            }]
          })}
        </script>
      </Helmet>
      {/* Header / Cover */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl" />
        </div>
      </div>

      {/* Passport Info Card */}
      <div className="relative -mt-16 md:-mt-24 px-4 md:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">
            {/* Avatar Section */}
            <div className="relative group">
              <PassportImageUploader 
                photoUrl={formData.photoUrl || ''} 
                fullName={user.fullName} 
                onUpload={handleImageUpload} 
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 rounded-2xl">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Name & Basic Info */}
            <div className="flex-1 space-y-4 md:space-y-2 w-full">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 w-full">
                <div className="flex flex-col items-center md:items-start">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                    {user.fullName}
                    {user.wellnessBadge && <span title="Wellness Badge"><ShieldCheck size={28} className="text-emerald-500 fill-emerald-100 dark:fill-emerald-900/30" /></span>}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                    <Shield size={16} className="text-blue-500" />
                    {user.role === 'admin' ? 'System Administrator' : `Student • Class ${user.class}`}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 w-full md:w-auto">
                  {isEditing ? (
                    <>
                      {!user.profileCompleted ? null : (
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                          <X size={18} />
                          Cancel
                        </button>
                      )}
                      <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-600 transition-all disabled:opacity-70"
                      >
                        <Save size={18} />
                        {loading ? 'Saving...' : user.profileCompleted ? 'Save Changes' : 'Continue'}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-xl shadow-lg dark:shadow-none hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
                    >
                      <Edit3 size={18} />
                      Edit Health Pass
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold">
                  <Award size={16} />
                  {user.points} Health Points
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold">
                  <Activity size={16} />
                  Active Health Pass
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mt-8 md:mt-12 pt-8 md:pt-12 border-t border-slate-100 dark:border-slate-800">
            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserIcon size={20} className="text-blue-500" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-white font-medium">{user.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Index Number</label>
                    <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                      <Hash size={14} className="text-slate-400" />
                      {user.indexNumber || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                    {isEditing ? (
                      <input 
                        type="date" 
                        value={formData.dob}
                        onChange={(e) => setFormData({...formData, dob: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {user.dob || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                    {isEditing ? (
                      <select 
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-slate-900 dark:text-white font-medium">{user.gender || 'N/A'}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class / Grade</label>
                    <p className="text-slate-900 dark:text-white font-medium">{user.class || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Residential Address</label>
                  {isEditing ? (
                    <textarea 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none dark:text-white"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-white font-medium flex items-start gap-2">
                      <MapPin size={14} className="text-slate-400 mt-1" />
                      {user.address || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency / Parent Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Heart size={20} className="text-red-500" />
                Emergency Contact
              </h3>

              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parent / Guardian Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.parentName}
                        onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-white font-bold">{user.parentName || 'N/A'}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Number</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.parentContact}
                        onChange={(e) => setFormData({...formData, parentContact: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      />
                    ) : (
                      <p className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2">
                        <Phone size={14} />
                        {user.parentContact || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400 mb-2">Health Privacy Note</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Your health information is securely stored and only accessible by authorized school medical staff and administrators. 
                    Read our <Link to="/privacy-security" className="underline font-bold hover:text-blue-800 dark:hover:text-blue-200">Privacy & Security Policy</Link> to learn more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
