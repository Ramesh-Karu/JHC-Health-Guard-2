import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, db, query, where, getCountFromServer, getDoc, doc, orderBy, limit, onSnapshot, loadBundle, namedQuery, getDocsFromCache, getDocFromCache, auth } from '../firebase';
import { User, Query, Post, HealthRecord, Activity } from '../types';
import { useEffect } from 'react';

// Helper to handle Firestore queries with cache fallback on quota exceeded
const fetchWithFallback = async <T>(
  fetcher: () => Promise<T>,
  cacheFetcher: () => Promise<T>,
  operationName: string,
  defaultValue?: T,
  allowUnauthenticated: boolean = false
): Promise<T> => {
  // Lock system for unauthenticated users unless explicitly allowed
  if (!auth.currentUser && !allowUnauthenticated) {
    console.warn(`Access denied for ${operationName}: User not authenticated. Returning null/empty data.`);
    return (defaultValue !== undefined ? defaultValue : null) as T;
  }

  try {
    return await fetcher();
  } catch (err: any) {
    if (err?.message?.includes('Quota exceeded') || err?.message?.includes('quota')) {
      console.warn(`Quota exceeded for ${operationName}, falling back to cache`);
      try {
        return await cacheFetcher();
      } catch (cacheErr) {
        console.error(`Cache fetch also failed for ${operationName}:`, cacheErr);
        throw err; // Throw original quota error if cache also fails
      }
    }
    throw err;
  }
};

// Load Firestore Bundle for initial data optimization
export const loadInitialData = async () => {
  try {
    const response = await fetch('/api/firestore-bundle');
    if (response.status === 204) {
      console.log('Firestore bundle not available (skipping)');
      return;
    }
    if (!response.ok) throw new Error('Failed to fetch bundle');
    
    // Use arrayBuffer() as loadBundle expects a Uint8Array or ArrayBuffer
    const bundleData = await response.arrayBuffer();
    if (bundleData) {
      await loadBundle(db, bundleData);
      console.log('Firestore bundle loaded successfully');
    }
  } catch (err) {
    console.error('Error loading Firestore bundle:', err);
  }
};

// Cache keys
export const CACHE_KEYS = {
  SPORTS: ['sports'],
  CLASSROOMS: ['classrooms'],
  USER_COUNT: (role: string) => ['user-count', role],
  STUDENT_COUNT: (className: string, division: string) => ['student-count', className, division],
  TEACHERS: ['teachers'],
  ALL_USERS: ['all-users'],
  ALL_STUDENTS: ['all-students'],
  ALL_HEALTH_RECORDS: ['all-health-records'],
  ALL_ACTIVITIES: ['all-activities'],
  ALL_ANNOUNCEMENTS: ['all-announcements'],
  TEACHER_ANNOUNCEMENTS: (teacherId: string) => ['teacher-announcements', teacherId],
  ADMIN_DASHBOARD: ['admin-dashboard'],
  TEACHER_DASHBOARD: (className: string) => ['teacher-dashboard', className],
  POINT_SETTINGS: ['point-settings'],
  HEALTH_POINT_SETTINGS: ['health-point-settings'],
  STUDENT_HEALTH_RECORDS: (userId: string) => ['student-health-records', userId],
  STUDENT_ACTIVITIES: (userId: string) => ['student-activities', userId],
  ANNOUNCEMENTS: (className: string) => ['announcements', className],
  COMMUNITY_POSTS: (category: string) => ['community-posts', category],
  LEADERBOARD: ['leaderboard'],
  QUERIES: (userId: string, role: string) => ['queries', userId, role],
  STUDENT_PROFILE: (userId: string) => ['student-profile', userId],
};

// Fetch student profile
export const useStudentProfile = (userId: string) => {
  return useQuery({
    queryKey: CACHE_KEYS.STUDENT_PROFILE(userId),
    queryFn: async () => {
      const userDoc = doc(db, 'users', userId);
      const docSnap = await fetchWithFallback(
        () => getDoc(userDoc),
        () => getDocFromCache(userDoc),
        `student-profile-${userId}`,
        null,
        true // Allow unauthenticated for QR scan
      );
      if (!docSnap) return null;
      if (docSnap.exists()) {
        return { id: docSnap.id, ...(docSnap.data() as any) } as User;
      }
      return null;
    },
    enabled: !!userId,
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch my reservations
export const useMyReservations = (userId: string) => {
  return useQuery({
    queryKey: ['my-reservations', userId],
    queryFn: async () => {
      const q = query(collection(db, 'organic_reservations'), where('userId', '==', userId));
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        `my-reservations-${userId}`
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    },
    enabled: !!userId,
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch STEM analytics data
export const useSTEMAnalytics = () => {
  return useQuery({
    queryKey: ['stem-analytics'],
    queryFn: async () => {
      const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'));
      const healthQ = collection(db, 'health_records');

      const [studentsSnapshot, healthSnapshot] = await Promise.all([
        fetchWithFallback(() => getDocs(studentsQ), () => getDocsFromCache(studentsQ), 'stem-students'),
        fetchWithFallback(() => getDocs(healthQ), () => getDocsFromCache(healthQ), 'stem-health')
      ]);
      
      if (!studentsSnapshot || !healthSnapshot) return { students: [], classStats: [], bmiStats: {} };

      const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const healthData = healthSnapshot.docs.map(doc => doc.data());

      // Calculate analytics
      const classStatsMap: Record<string, { totalBmi: number, count: number }> = {};
      const bmiStatsMap: Record<string, number> = {
        'Underweight': 0,
        'Normal': 0,
        'Overweight': 0,
        'Obese': 0
      };

      // Map latest health record to each student
      const latestHealthByStudent: Record<string, any> = {};
      healthData.forEach(record => {
        if (!latestHealthByStudent[record.userId] || new Date(record.date) > new Date(latestHealthByStudent[record.userId].date)) {
          latestHealthByStudent[record.userId] = record;
        }
      });

      studentsData.forEach(student => {
        const health = latestHealthByStudent[student.id];
        if (health) {
          // Class stats
          const studentClass = (student as any).class || 'Unknown';
          if (!classStatsMap[studentClass]) {
            classStatsMap[studentClass] = { totalBmi: 0, count: 0 };
          }
          classStatsMap[studentClass].totalBmi += health.bmi;
          classStatsMap[studentClass].count += 1;

          // BMI stats
          if (bmiStatsMap[health.category] !== undefined) {
            bmiStatsMap[health.category] += 1;
          }
        }
      });

      const classStats = Object.keys(classStatsMap).map(cls => ({
        class: cls,
        avgBmi: parseFloat((classStatsMap[cls].totalBmi / classStatsMap[cls].count).toFixed(1))
      }));

      return {
        students: studentsData,
        classStats,
        bmiStats: bmiStatsMap
      };
    },
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch breakfast items
export const useBreakfastItems = () => {
  return useQuery({
    queryKey: ['breakfast-items'],
    queryFn: async () => {
      const q = collection(db, 'breakfast_items');
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        'breakfast-items'
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    },
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch breakfast reservations
export const useBreakfastReservations = (userId: string) => {
  return useQuery({
    queryKey: ['breakfast-reservations', userId],
    queryFn: async () => {
      const q = query(collection(db, 'breakfast_reservations'), where('userId', '==', userId));
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        `breakfast-reservations-${userId}`
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    },
    enabled: !!userId,
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch breakfast purchases
export const useBreakfastPurchases = (userId: string) => {
  return useQuery({
    queryKey: ['breakfast-purchases', userId],
    queryFn: async () => {
      const q = query(collection(db, 'breakfast_purchases'), where('userId', '==', userId));
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        `breakfast-purchases-${userId}`
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    },
    enabled: !!userId,
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch queries
export const useQueriesData = (userId: string, role: string) => {
  return useQuery({
    queryKey: CACHE_KEYS.QUERIES(userId, role),
    queryFn: async () => {
      let q;
      if (role === 'student') {
        q = query(
          collection(db, 'queries'),
          where('studentId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'queries'),
          orderBy('createdAt', 'desc')
        );
      }
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        `queries-${userId}`
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Query));
    },
    enabled: !!userId && !!role,
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch leaderboard
export const useLeaderboard = () => {
  return useQuery({
    queryKey: CACHE_KEYS.LEADERBOARD,
    queryFn: async () => {
      const q = query(
        collection(db, 'users'), 
        where('role', '==', 'student'),
        orderBy('points', 'desc'),
        limit(100)
      );
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        'leaderboard',
        null,
        true // Allow unauthenticated for leaderboard
      );
      
      if (!snapshot) return [];

      const leaderboardData = snapshot.docs.map((doc, index) => {
        const student = doc.data();
        return {
          id: doc.id,
          rank: index + 1,
          name: student.fullName || 'Unknown',
          class: student.class || 'N/A',
          division: student.division || 'N/A',
          points: student.points || 0,
          wellnessBadge: student.wellnessBadge || false,
          avatar: student.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || 'U')}&background=random`
        };
      });

      return leaderboardData;
    },
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch community posts
export const useCommunityPosts = (category: string) => {
  return useQuery({
    queryKey: CACHE_KEYS.COMMUNITY_POSTS(category),
    queryFn: async () => {
      let postsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      
      if (category !== 'All') {
        postsQuery = query(
          collection(db, 'announcements'), 
          where('category', '==', category),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await fetchWithFallback(
        () => getDocs(postsQuery),
        () => getDocsFromCache(postsQuery),
        `community-posts-${category}`,
        null,
        true // Allow unauthenticated for community
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Post));
    },
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch student health records
export const useStudentHealthRecords = (userId: string) => {
  return useQuery({
    queryKey: CACHE_KEYS.STUDENT_HEALTH_RECORDS(userId),
    queryFn: async () => {
      const q = query(collection(db, 'health_records'), where('userId', '==', userId), orderBy('date', 'desc'), limit(20));
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        `health-records-${userId}`,
        null,
        true // Allow unauthenticated for QR scan
      );
      if (!snapshot) return [];
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as HealthRecord));
      return records;
    },
    enabled: !!userId,
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch student activities
export const useStudentActivities = (userId: string) => {
  return useQuery({
    queryKey: CACHE_KEYS.STUDENT_ACTIVITIES(userId),
    queryFn: async () => {
      const q = query(collection(db, 'activities'), where('userId', '==', userId), orderBy('date', 'desc'), limit(20));
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        `activities-${userId}`,
        null,
        true // Allow unauthenticated for QR scan
      );
      if (!snapshot) return [];
      const activities = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Activity));
      return activities;
    },
    enabled: !!userId,
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch announcements
export const useAnnouncements = (className: string) => {
  return useQuery({
    queryKey: CACHE_KEYS.ANNOUNCEMENTS(className),
    queryFn: async () => {
      const q = query(collection(db, 'announcements'), where('class', '==', className));
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        `announcements-${className}`
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!className,
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch global stats from metadata
export const useGlobalStats = () => {
  return useQuery({
    queryKey: ['global_stats'],
    queryFn: async () => {
      const statsRef = doc(db, 'metadata', 'global_stats');
      const snap = await fetchWithFallback(
        () => getDoc(statsRef),
        () => getDocFromCache(statsRef),
        'global-stats'
      );
      if (!snap) return { totalUsers: 0, roleCounts: {} };
      if (snap.exists()) return snap.data();
      
      // Fallback: Calculate manually if stats don't exist
      const usersQ = query(collection(db, 'users'), where('role', '==', 'student'));
      const studentCount = await fetchWithFallback(
        () => getCountFromServer(usersQ),
        () => getDocsFromCache(usersQ).then(snap => ({ data: () => ({ count: snap.size }) })),
        'student-count-manual'
      );
      return {
        totalUsers: studentCount.data().count,
        roleCounts: { student: studentCount.data().count }
      };
    },
    staleTime: Infinity,
  });
};

// Fetch admin dashboard data with caching
export const useAdminDashboard = () => {
  const { data: stats } = useGlobalStats();
  
  return useQuery({
    queryKey: CACHE_KEYS.ADMIN_DASHBOARD,
    queryFn: async () => {
      const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'));
      const healthQ = collection(db, 'health_records');
      const sportActivitiesQ = query(collection(db, 'activities'), where('type', '==', 'sport'));

      // Use count queries for totals to save reads
      const [studentsCount, hrSnap, sportActivitiesCount] = await Promise.all([
        fetchWithFallback(
          () => getCountFromServer(studentsQ),
          () => getDocsFromCache(studentsQ).then(snap => ({ data: () => ({ count: snap.size }) })),
          'admin-students-count'
        ),
        fetchWithFallback(() => getDocs(healthQ), () => getDocsFromCache(healthQ), 'admin-health'),
        fetchWithFallback(
          () => getCountFromServer(sportActivitiesQ),
          () => getDocsFromCache(sportActivitiesQ).then(snap => ({ data: () => ({ count: snap.size }) })),
          'admin-sport-activities-count'
        )
      ]);
      
      if (!studentsCount || !hrSnap || !sportActivitiesCount) return { totalStudents: 0, bmiStats: [], classStats: [], activityStats: [] };

      const totalStudents = stats?.roleCounts?.student || studentsCount.data().count;
      const allHealthRecords = hrSnap.docs.map(doc => doc.data());
      
      // BMI Stats
      const bmiCategories: Record<string, number> = {};
      allHealthRecords.forEach((record: any) => {
        if (record.category) {
          bmiCategories[record.category] = (bmiCategories[record.category] || 0) + 1;
        }
      });
      const bmiStats = Object.entries(bmiCategories).map(([category, count]) => ({ category, count }));
      
      // Class Stats - We still need students to map to classes, but we'll fetch them only if needed or use a summary
      // For now, let's keep it but ideally this should be a pre-calculated summary document
      const usersSnap = await fetchWithFallback(() => getDocs(studentsQ), () => getDocsFromCache(studentsQ), 'admin-students-list');
      const students = usersSnap ? usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) : [];
      
      const classBmiMap: Record<string, { total: number, count: number }> = {};
      students.forEach((student: any) => {
        if (student.class) {
          const studentRecords = allHealthRecords.filter((r: any) => r.userId === student.id);
          if (studentRecords.length > 0) {
            const latestRecord: any = studentRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            if (latestRecord.bmi) {
              if (!classBmiMap[student.class]) classBmiMap[student.class] = { total: 0, count: 0 };
              classBmiMap[student.class].total += latestRecord.bmi;
              classBmiMap[student.class].count++;
            }
          }
        }
      });
      const classStats = Object.entries(classBmiMap).map(([className, data]) => ({
        class: className,
        avgBmi: data.total / data.count
      }));

      return {
        totalStudents,
        bmiStats,
        classStats,
        activityStats: [{ type: 'sport', count: sportActivitiesCount.data().count }]
      };
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache for dashboard
  });
};

// Fetch teacher dashboard data with caching
export const useTeacherDashboard = (className: string, division: string) => {
  return useQuery({
    queryKey: CACHE_KEYS.TEACHER_DASHBOARD(className + '-' + division),
    queryFn: async () => {
      const studentsQ = query(
        collection(db, 'users'), 
        where('role', '==', 'student'), 
        where('class', '==', className),
        where('division', '==', division)
      );
      const snapshot = await fetchWithFallback(
        () => getDocs(studentsQ),
        () => getDocsFromCache(studentsQ),
        `teacher-dashboard-students-${className}`
      );
      if (!snapshot) return { totalStudents: 0, bmiStats: [], activityStats: [] };
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const studentIds = students.map(s => s.id);

      if (studentIds.length > 0) {
        // Chunk studentIds into arrays of 10 for Firestore 'in' queries
        const chunks = [];
        for (let i = 0; i < studentIds.length; i += 10) {
          chunks.push(studentIds.slice(i, i + 10));
        }

        const healthPromises = chunks.map(chunk => {
          const q = query(collection(db, 'health_records'), where('userId', 'in', chunk));
          return fetchWithFallback(() => getDocs(q), () => getDocsFromCache(q), 'teacher-dashboard-health');
        });
        const activityPromises = chunks.map(chunk => {
          const q = query(collection(db, 'activities'), where('userId', 'in', chunk));
          return fetchWithFallback(() => getDocs(q), () => getDocsFromCache(q), 'teacher-dashboard-activities');
        });

        const [healthSnapshots, activitySnapshots] = await Promise.all([
          Promise.all(healthPromises),
          Promise.all(activityPromises)
        ]);

        const healthRecords = healthSnapshots.flatMap(snap => snap.docs.map(doc => doc.data()));
        const activities = activitySnapshots.flatMap(snap => snap.docs.map(doc => doc.data()));

        const categories = healthRecords.reduce((acc: any, curr: any) => {
          acc[curr.category] = (acc[curr.category] || 0) + 1;
          return acc;
        }, {});

        const bmiStats = Object.entries(categories).map(([category, count]) => ({ category, count }));

        const types = activities.reduce((acc: any, curr: any) => {
          acc[curr.type] = (acc[curr.type] || 0) + 1;
          return acc;
        }, {});

        const activityStats = Object.entries(types).map(([type, count]) => ({ type, count }));

        return {
          totalStudents: students.length,
          bmiStats,
          activityStats
        };
      } else {
        return { totalStudents: 0, bmiStats: [], activityStats: [] };
      }
    },
    enabled: !!className && !!division,
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch school summary data
export const useSchoolSummary = () => {
  return useQuery({
    queryKey: ['school-summary'],
    queryFn: async () => {
      const summaryRef = doc(db, 'metadata', 'school_summary');
      const snap = await fetchWithFallback(
        () => getDoc(summaryRef),
        () => getDocFromCache(summaryRef),
        'school-summary'
      );
      
      if (snap && snap.exists()) {
        return snap.data() as { totalStudents: number, bmiStats: any[], activityStats: any[] };
      }
      
      // Fallback: Calculate manually if summary document doesn't exist
      console.warn('School summary document missing, calculating manually...');
      const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'));
      const healthQ = collection(db, 'health_records');
      const activitiesQ = collection(db, 'activities');

      const [studentsSnap, healthSnap, activitiesSnap] = await Promise.all([
        fetchWithFallback(() => getDocs(studentsQ), () => getDocsFromCache(studentsQ), 'school-students'),
        fetchWithFallback(() => getDocs(healthQ), () => getDocsFromCache(healthQ), 'school-health'),
        fetchWithFallback(() => getDocs(activitiesQ), () => getDocsFromCache(activitiesQ), 'school-activities')
      ]);

      if (!studentsSnap || !healthSnap || !activitiesSnap) return { totalStudents: 0, bmiStats: [], activityStats: [] };

      const students = studentsSnap.docs;
      const healthRecords = healthSnap.docs.map(doc => doc.data());
      const activities = activitiesSnap.docs.map(doc => doc.data());

      const bmiCategories = healthRecords.reduce((acc: any, curr: any) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
      }, {});

      const activityTypes = activities.reduce((acc: any, curr: any) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, {});

      return {
        totalStudents: students.length,
        bmiStats: Object.entries(bmiCategories).map(([category, count]) => ({ category, count })),
        activityStats: Object.entries(activityTypes).map(([type, count]) => ({ type, count }))
      };
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week cache
  });
};

// Fetch teachers with caching
export const useTeachers = () => {
  return useQuery({
    queryKey: CACHE_KEYS.TEACHERS,
    queryFn: async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        'teachers'
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch coaches with caching
export const useCoaches = () => {
  return useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'coach'));
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        'coaches'
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch sports with caching
export const useSports = () => {
  return useQuery({
    queryKey: CACHE_KEYS.SPORTS,
    queryFn: async () => {
      const q = collection(db, 'sports');
      const sportsSnapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        'sports'
      );
      if (!sportsSnapshot) return [];
      return sportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch classrooms with caching
export const useClassrooms = () => {
  return useQuery({
    queryKey: CACHE_KEYS.CLASSROOMS,
    queryFn: async () => {
      const q = collection(db, 'classrooms');
      const querySnapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        'classrooms'
      );
      if (!querySnapshot) return [];
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    staleTime: Infinity, // Permanent caching
  });
};

// Generic count query
export const useUserCount = (role: string) => {
  return useQuery({
    queryKey: CACHE_KEYS.USER_COUNT(role),
    queryFn: async () => {
      const q = query(collection(db, 'users'), where('role', '==', role));
      const snapshot = await fetchWithFallback(
        () => getCountFromServer(q),
        () => getDocsFromCache(q).then(snap => ({ data: () => ({ count: snap.size }) })),
        `user-count-${role}`
      );
      if (!snapshot) return 0;
      return snapshot.data().count;
    },
    staleTime: Infinity, // Permanent caching
  });
};

// Fetch all students with permanent caching
export const useAllStudents = () => {
  return useQuery({
    queryKey: CACHE_KEYS.ALL_STUDENTS,
    queryFn: async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        'all-students'
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    },
    staleTime: Infinity,
  });
};

// Fetch all users with permanent caching
export const useAllUsers = () => {
  return useQuery({
    queryKey: CACHE_KEYS.ALL_USERS,
    queryFn: async () => {
      const q = collection(db, 'users');
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        'all-users'
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    },
    staleTime: Infinity,
  });
};

// Fetch all health records with permanent caching
export const useAllHealthRecords = () => {
  return useQuery({
    queryKey: CACHE_KEYS.ALL_HEALTH_RECORDS,
    queryFn: async () => {
      const q = collection(db, 'health_records');
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        'all-health-records'
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthRecord));
    },
    staleTime: Infinity,
  });
};

// Fetch all activities with permanent caching
export const useAllActivities = () => {
  return useQuery({
    queryKey: CACHE_KEYS.ALL_ACTIVITIES,
    queryFn: async () => {
      const q = collection(db, 'activities');
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        'all-activities'
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
    },
    staleTime: Infinity,
  });
};

// Fetch teacher's students
export const useTeacherStudents = (className: string, division: string) => {
  return useQuery({
    queryKey: ['teacher-students', className, division],
    queryFn: async () => {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('class', '==', className),
        where('division', '==', division),
        orderBy('fullName')
      );
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        `teacher-students-${className}-${division}`
      );
      if (!snapshot) return [];
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch latest health record for each student
      const studentsWithHealth = await Promise.all(students.map(async (student: any) => {
        const healthQ = query(
          collection(db, 'health_records'),
          where('userId', '==', student.id),
          orderBy('date', 'desc'),
          limit(1)
        );
        const healthSnapshot = await fetchWithFallback(
          () => getDocs(healthQ),
          () => getDocsFromCache(healthQ),
          `student-health-latest-${student.id}`
        );
        let latestBmi = null;
        let healthCategory = 'N/A';
        let latestDate = '';
        
        if (healthSnapshot && !healthSnapshot.empty) {
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
      
      return studentsWithHealth;
    },
    enabled: !!className && !!division,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

// Fetch teacher's announcements
export const useTeacherAnnouncements = (teacherId: string) => {
  return useQuery({
    queryKey: CACHE_KEYS.TEACHER_ANNOUNCEMENTS(teacherId),
    queryFn: async () => {
      const q = query(
        collection(db, 'announcements'),
        where('authorId', '==', teacherId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        `teacher-announcements-${teacherId}`
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!teacherId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

// Fetch health point settings
export const useHealthPointSettings = () => {
  return useQuery({
    queryKey: CACHE_KEYS.HEALTH_POINT_SETTINGS,
    queryFn: async () => {
      const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        return {
          normalBMI: data.pointsPerNormalBMI || 50,
          goodStrength: data.pointsPerGoodStrength || 50
        };
      }
      return { normalBMI: 50, goodStrength: 50 };
    },
    staleTime: Infinity,
  });
};
// Fetch point settings
export const usePointSettings = () => {
  return useQuery({
    queryKey: CACHE_KEYS.POINT_SETTINGS,
    queryFn: async () => {
      const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        return {
          sport: data.pointsPerSport || 20,
          exercise: data.pointsPerExercise || 10,
          habit: data.pointsPerHabit || 5
        };
      }
      return { sport: 20, exercise: 10, habit: 5 };
    },
    staleTime: Infinity,
  });
};

// Fetch all announcements with permanent caching
export const useAllAnnouncements = () => {
  return useQuery({
    queryKey: CACHE_KEYS.ALL_ANNOUNCEMENTS,
    queryFn: async () => {
      const q = collection(db, 'announcements');
      const snapshot = await fetchWithFallback(
        () => getDocs(q),
        () => getDocsFromCache(q),
        'all-announcements'
      );
      if (!snapshot) return [];
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    staleTime: Infinity,
  });
};
