// CDC BMI-for-Age Percentiles for Boys (Age 11-17)
// Approximated from the provided boy's growth chart.

// CDC BMI-for-Age Percentiles for Boys
const boyPercentiles: Record<number, { p3: number, p5: number, p90: number, p97: number }> = {
  6: { p3: 12.8, p5: 13.1, p90: 18.8, p97: 21.4 },
  7: { p3: 13.0, p5: 13.3, p90: 19.8, p97: 23.0 },
  8: { p3: 13.2, p5: 13.6, p90: 20.9, p97: 24.6 },
  9: { p3: 13.5, p5: 13.8, p90: 21.8, p97: 26.0 },
  10: { p3: 13.8, p5: 14.1, p90: 22.7, p97: 27.3 },
  11: { p3: 14.1, p5: 14.5, p90: 23.6, p97: 28.3 },
  12: { p3: 14.4, p5: 14.8, p90: 24.3, p97: 29.2 },
  13: { p3: 14.7, p5: 15.1, p90: 25.0, p97: 30.0 },
  14: { p3: 15.0, p5: 15.4, p90: 25.5, p97: 30.6 },
  15: { p3: 15.3, p5: 15.8, p90: 26.1, p97: 31.2 },
  16: { p3: 15.6, p5: 16.1, p90: 26.5, p97: 31.7 },
  17: { p3: 15.9, p5: 16.3, p90: 27.0, p97: 32.1 },
  18: { p3: 16.1, p5: 16.6, p90: 27.4, p97: 32.4 },
};

export const getAgeFromDob = (dob: string) => {
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

export const getBmiCategory = (bmi: number, age: number, gender?: string): { label: string, color: string, percentile: number, bg: string, description: string } => {
  const roundedAge = Math.min(18, Math.max(6, Math.round(age)));
  
  // Default to Boy percentiles (as provided in chart)
  const data = boyPercentiles[roundedAge as keyof typeof boyPercentiles];
  if (!data) return { label: 'Normal', color: 'text-emerald-500', percentile: 50, bg: 'bg-emerald-500', description: 'Your BMI is within the healthy range for your age.' }; // Fallback

  if (bmi < data.p3) return { label: 'Severely Underweight', color: 'text-red-600', percentile: 1, bg: 'bg-red-600', description: 'Your BMI is significantly below the healthy range. Please consult a health professional.' };
  if (bmi < data.p5) return { label: 'Underweight', color: 'text-blue-500', percentile: 3, bg: 'bg-blue-500', description: 'Your BMI is below the healthy range for your age.' };
  if (bmi < data.p90) return { label: 'Acceptable Weight', color: 'text-emerald-500', percentile: 50, bg: 'bg-emerald-500', description: 'Your BMI is within the healthy range for your age.' };
  if (bmi < data.p97) return { label: 'Overweight', color: 'text-amber-500', percentile: 90, bg: 'bg-amber-500', description: 'Your BMI indicates you are above the healthy range for your age.' };
  return { label: 'Severely Overweight', color: 'text-red-600', percentile: 97, bg: 'bg-red-600', description: 'Your BMI indicates you are significantly above the healthy range for your age. Please consult a health professional.' };
};

export const calculateBmi = (weight: number, height: number) => {
  if (height <= 0) return 0;
  return weight / ((height / 100) * (height / 100));
};
