import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Lock, User, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { auth, db, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, doc, getDoc, setDoc, query, collection, where, getDocs, createUserWithEmailAndPassword, deleteDoc, writeBatch, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let loginEmail = username;
      let userData: any = null;
      let userId = '';

      // If it's not an email, look up the systemEmail by username
      if (!username.includes('@')) {
        const normalizedUsername = username.toLowerCase().trim();
        const q = query(collection(db, 'users'), where('username', '==', normalizedUsername));
        let snapshot;
        try {
          snapshot = await getDocs(q);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'users');
          return;
        }
        
        if (snapshot.empty) {
          setError('Invalid username or password.');
          setLoading(false);
          return;
        }
        
        const userDoc = snapshot.docs[0];
        userData = userDoc.data();
        loginEmail = userData.systemEmail || `${userData.username}@school.internal`;
        
        if (!loginEmail) {
          setError('Account not properly configured for username login.');
          setLoading(false);
          return;
        }
      }

      // Sign in with Firebase Auth
      let result;
      try {
        result = await signInWithEmailAndPassword(auth, loginEmail, password);
        userId = result.user.uid;
      } catch (err: any) {
        console.error("Firebase Auth Error:", err);
        
        // Lazy Auth: If user not found in Auth, but exists in Firestore with authCreated: false
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          // We already have userData if they logged in with username
          // If they logged in with email, we need to find them
          if (!userData) {
            const q = query(collection(db, 'users'), where('email', '==', loginEmail));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              userData = snapshot.docs[0].data();
              userId = snapshot.docs[0].id;
            }
          }

          const passwordToMatch = userData?.tempPassword || '123456';
          console.log("Lazy Auth: userData exists:", !!userData, "authCreated:", userData?.authCreated, "passwordToMatch:", passwordToMatch, "input password:", password);
          if (userData && userData.authCreated === false && passwordToMatch === password) {
            try {
              console.log("Lazy Auth: Creating account for", loginEmail);
              let createResult;
              try {
                createResult = await createUserWithEmailAndPassword(auth, loginEmail, password);
              } catch (createErr: any) {
                console.log("Lazy Auth: createUserWithEmailAndPassword failed with code:", createErr.code);
                if (createErr.code === 'auth/email-already-in-use') {
                  console.log("Lazy Auth: Email already in use, attempting sign in with password:", password);
                  createResult = await signInWithEmailAndPassword(auth, loginEmail, password);
                } else {
                  throw createErr;
                }
              }
              userId = createResult.user.uid;
              console.log("Lazy Auth: Auth user UID", userId);
              
              // Move Firestore data to the new UID and mark as authCreated
              const q = query(collection(db, 'users'), where('username', '==', userData.username));
              const snapshot = await getDocs(q);
              if (snapshot.empty) {
                throw new Error("Could not find existing user document for migration");
              }
              const existingDocId = snapshot.docs[0].id;
              console.log("Lazy Auth: Found existing doc ID", existingDocId);
              
              const { tempPassword, authCreated, ...rest } = userData;
              const batch = writeBatch(db);
              
              // Create new user document with Auth UID
              batch.set(doc(db, 'users', userId), {
                ...rest,
                authCreated: true,
                uid: userId,
                oldId: existingDocId
              });
              
              // Delete the temporary document
              if (existingDocId !== userId) {
                batch.delete(doc(db, 'users', existingDocId));
              }

              // Migrate linked records (health_records, activities, etc.)
              const collectionsToMigrate = ['health_records', 'activities', 'badges', 'organic_reservations', 'breakfast_reservations', 'likes'];
              
              for (const colName of collectionsToMigrate) {
                console.log(`Lazy Auth: Fetching ${colName} for migration...`);
                const qMigrate = query(collection(db, colName), where('userId', '==', existingDocId));
                try {
                  const snapshotMigrate = await getDocs(qMigrate);
                  console.log(`Lazy Auth: Found ${snapshotMigrate.docs.length} records in ${colName}`);
                  snapshotMigrate.docs.forEach(recordDoc => {
                    batch.update(recordDoc.ref, { userId: userId });
                  });
                } catch (migrateErr) {
                  console.error(`Lazy Auth: Failed to fetch ${colName} for migration:`, migrateErr);
                  handleFirestoreError(migrateErr, OperationType.LIST, colName);
                  throw migrateErr;
                }
              }

              console.log("Lazy Auth: Committing migration batch...");
              try {
                await batch.commit();
                console.log("Lazy Auth migration batch committed successfully");
              } catch (batchErr) {
                console.error("Lazy Auth: Batch commit failed:", batchErr);
                handleFirestoreError(batchErr, OperationType.WRITE, 'batch-migration');
                throw batchErr;
              }
              console.log("Lazy Auth: Migration batch committed successfully");
              
              userData = { ...rest, authCreated: true, uid: userId };
              result = createResult;
            } catch (createErr) {
              console.error("Lazy Auth creation failed:", createErr);
              setError('Account creation failed. Please contact support.');
              setLoading(false);
              return;
            }
          } else {
            setError('Invalid username or password.');
            setLoading(false);
            return;
          }
        } else if (err.code === 'auth/too-many-requests') {
          setError('Too many failed login attempts. Please wait a few minutes and try again.');
          setLoading(false);
          return;
        } else {
          setError('Failed to sign in. Please check your credentials.');
          setLoading(false);
          return;
        }
      }

      // If we haven't fetched userData yet (because they logged in with email), fetch it now
      if (!userData) {
        const userRef = doc(db, 'users', userId);
        let userDoc;
        try {
          userDoc = await getDoc(userRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'users');
          throw err;
        }
        
        if (userDoc.exists()) {
          userData = userDoc.data();
        } else {
          // Fallback if user document doesn't exist
          userData = {
            uid: userId,
            email: result.user.email,
            fullName: result.user.displayName || 'User',
            role: 'student',
            createdAt: new Date().toISOString()
          };
          try {
            await setDoc(userRef, userData);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'users');
            throw err;
          }
        }
      }
      
      login({ ...userData, id: userId });
      
      if (userData.role === 'student' && userData.passwordChanged === false) navigate('/change-password');
      else if (userData.role === 'teacher') navigate('/teacher/dashboard');
      else if (userData.role === 'coach') navigate('/coach/dashboard');
      else if (userData.role === 'organic-admin') navigate('/organic-admin-dashboard');
      else if (userData.role === 'breakfast-admin') navigate('/breakfast-admin-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      console.error("Login error:", err);
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', result.user.uid);
      let userDoc;
      try {
        userDoc = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
        throw err;
      }
      
      let userData;
      if (!userDoc.exists()) {
        // Create new user document
        userData = {
          uid: result.user.uid,
          email: result.user.email,
          fullName: result.user.displayName || 'User',
          role: 'student', // Default role
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userRef, userData);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'users');
          throw err;
        }
      } else {
        userData = userDoc.data();
      }

      login({ ...userData, id: result.user.uid });
      
      // Navigate based on role
      if (userData.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (userData.role === 'coach') {
        navigate('/coach/dashboard');
      } else if (userData.role === 'organic-admin') {
        navigate('/organic-admin-dashboard');
      } else if (userData.role === 'breakfast-admin') {
        navigate('/breakfast-admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-blue-light dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans relative pt-safe pb-safe">
      <Link 
        to="/" 
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-blue font-bold transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Home
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-brand-blue rounded-full flex items-center justify-center shadow-xl shadow-brand-blue/20 mx-auto mb-6"
          >
            <Heart className="text-white" size={40} />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Health Guard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Jaffna Hindu College</p>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 border border-slate-100 dark:border-slate-800"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">Welcome Back</h2>
          
          <form onSubmit={handleUsernameLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input type="text" placeholder="Username or Email" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-slate-900 dark:text-white" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-slate-900 dark:text-white" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-blue text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-brand-blue/20">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
              {loading ? 'Connecting...' : 'Sign in with Google'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
