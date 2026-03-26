import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, db, query, where, getCountFromServer } from '../firebase';

// Cache keys
export const CACHE_KEYS = {
  SPORTS: ['sports'],
  CLASSROOMS: ['classrooms'],
  USER_COUNT: (role: string) => ['user-count', role],
  STUDENT_COUNT: (className: string, division: string) => ['student-count', className, division],
  TEACHERS: ['teachers'],
};

// Fetch teachers with caching
export const useTeachers = () => {
  return useQuery({
    queryKey: CACHE_KEYS.TEACHERS,
    queryFn: async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Fetch sports with caching
export const useSports = () => {
  return useQuery({
    queryKey: CACHE_KEYS.SPORTS,
    queryFn: async () => {
      const sportsSnapshot = await getDocs(collection(db, 'sports'));
      const sportsData = sportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch Activities to get student counts per sport
      const activitiesSnapshot = await getDocs(collection(db, 'activities'));
      const activities = activitiesSnapshot.docs.map(doc => doc.data());

      return sportsData.map((s: any) => {
        const studentCount = new Set(activities.filter(a => a.name === s.name).map(a => a.userId)).size;
        return { ...s, studentCount };
      });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch classrooms with caching
export const useClassrooms = () => {
  return useQuery({
    queryKey: CACHE_KEYS.CLASSROOMS,
    queryFn: async () => {
      const querySnapshot = await getDocs(collection(db, 'classrooms'));
      const classroomsData = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        // Get student count for this classroom
        const q = query(
          collection(db, 'users'), 
          where('role', '==', 'student'),
          where('class', '==', data.name),
          where('division', '==', data.division)
        );
        const countSnapshot = await getCountFromServer(q);
        return { 
          id: doc.id, 
          ...data, 
          studentCount: countSnapshot.data().count 
        };
      }));
      return classroomsData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Generic count query
export const useUserCount = (role: string) => {
  return useQuery({
    queryKey: CACHE_KEYS.USER_COUNT(role),
    queryFn: async () => {
      const q = query(collection(db, 'users'), where('role', '==', role));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
