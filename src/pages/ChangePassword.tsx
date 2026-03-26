import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, updatePassword, doc, updateDoc, setDoc, getDoc } from '../firebase';
import { useAuth } from '../App';
import { Lock, AlertCircle } from 'lucide-react';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        // Check if the user signed in with a password provider
        const hasPasswordProvider = auth.currentUser.providerData.some(
          (provider) => provider.providerId === 'password'
        );

        if (hasPasswordProvider) {
          console.log('Attempting to update password for:', auth.currentUser.uid);
          await updatePassword(auth.currentUser, newPassword);
          console.log('Password updated in Auth');
        } else {
          console.log('User signed in with Google, skipping Auth password update');
        }
        
        console.log('Updating passwordChanged and authCreated flag in Firestore for:', auth.currentUser.uid);
        const userRef = doc(db, 'users', auth.currentUser.uid);
        try {
          await setDoc(userRef, {
            passwordChanged: true,
            authCreated: true
          }, { merge: true });
        } catch (err) {
          console.error('Failed to update user document in Firestore:', err);
          throw new Error('Failed to update user profile. Please try again.');
        }
        
        const updatedDoc = await getDoc(userRef);
        console.log('Updated user document:', updatedDoc.data());
        console.log('passwordChanged and authCreated flags updated in Firestore');
        
        // Update local user state so ProtectedRoute doesn't redirect back
        if (user) {
          login({ ...user, passwordChanged: true, authCreated: true });
        }
        
        navigate('/dashboard');
      } else {
        console.error('No current user found for password update');
        setError('No user found. Please login again.');
      }
    } catch (err: any) {
      console.error('Failed to update password:', err);
      setError(`Failed to update password: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 pt-safe pb-safe">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-none p-8 w-full max-w-md border border-slate-100 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Change Password</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 text-center">Please change your password to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={20} />
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={20} />
            <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600">Update Password</button>
        </form>
      </div>
    </div>
  );
}
