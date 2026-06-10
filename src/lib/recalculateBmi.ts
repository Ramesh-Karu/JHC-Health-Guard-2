import { doc, collection, getDocs, writeBatch, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getBmiCategory, getAgeFromDob } from './bmi';
import { User, HealthRecord } from '../types';

export const recalculateAllStudentsBMI = async () => {
  console.log('Starting BMI recalculation...');
  
  // 1. Fetch all students
  const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'));
  const studentsSnap = await getDocs(studentsQ);
  const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

  // 2. Fetch all health records
  const healthQ = collection(db, 'health_records');
  const healthSnap = await getDocs(healthQ);
  const healthRecords = healthSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthRecord));

  const batch = writeBatch(db);
  let updates = 0;

  // 3. Recalculate
  healthRecords.forEach(record => {
    const student = students.find(s => s.id === record.userId);
    if (student && student.dob && record.height && record.weight) {
      const heightInMeters = (record.height as number) / 100;
      const weightInKg = record.weight as number;
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      
      const ageInYears = getAgeFromDob(student.dob as string);
      
      const category = getBmiCategory(bmi, ageInYears).label;

      if (record.bmi !== bmi || record.category !== category) {
        const recordRef = doc(db, 'health_records', record.id);
        batch.update(recordRef, {
          bmi,
          category
        });
        updates++;
      }
    }
  });

  // 4. Commit batch
  if (updates > 0) {
    await batch.commit();
    console.log(`Recalculation complete. ${updates} records updated.`);
  } else {
    console.log('No updates needed.');
  }
};
