export type UserRole = 'admin' | 'student' | 'teacher' | 'coach' | 'organic-admin' | 'breakfast-admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  passwordChanged?: boolean;
  profileCompleted?: boolean;
  authCreated?: boolean;
  tempPassword?: string;
  indexNumber?: string;
  admissionNumber?: string;
  dob?: string;
  gender?: string;
  class?: string;
  division?: string;
  address?: string;
  parentName?: string;
  parentContact?: string;
  guardianName?: string;
  guardianContact?: string;
  photoUrl?: string;
  points: number;
  wellnessBadge?: boolean;
  badgeStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  height: number;
  weight: number;
  bmi: number;
  hip?: number;
  waist?: number;
  gripStrength?: number;
  category: string;
  date: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: 'sport' | 'habit' | 'exercise' | 'quiz';
  name: string;
  date: string;
  duration?: string;
  performance?: string;
  remarks?: string;
  points: number;
  createdAt: string;
}

export interface Poll {
  question: string;
  options: {
    id: string;
    text: string;
    votes: string[]; // Array of user IDs
  }[];
  expiresAt?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorWellnessBadge?: boolean;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  category?: 'General' | 'Nutrition' | 'Fitness' | 'Success Story' | 'Announcement';
  reactions?: { [key: string]: string[] };
  poll?: Poll;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorWellnessBadge?: boolean;
  content: string;
  createdAt: string;
}

export interface Query {
  id: string;
  studentId: string;
  studentName?: string;
  studentClass?: string;
  subject: string;
  message: string;
  reply?: string;
  status: 'pending' | 'resolved';
  createdAt: string;
  repliedAt?: string;
}

export interface Notification {
  id: string;
  targetType: 'all' | 'class' | 'user';
  targetId: string | null;
  message: string;
  type: 'announcement' | 'health';
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  category: string;
  createdAt: string;
}

export interface BreakfastItem {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  price: number;
  quantity?: number; // Optional now
  nutritionInfo?: string;
  category?: string;
  createdAt: string;
}

export interface BreakfastReservation {
  id: string;
  userId: string;
  userName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
  status: 'Reserved' | 'Collected';
  createdAt: string;
}

export interface BreakfastPurchase {
  id: string;
  indexNumber: string;
  userId?: string; // Linked user ID if found
  date: string; // YYYY-MM-DD
  pointsAwarded: number;
  createdAt: string;
}

export interface BreakfastSettings {
  pointsPerEntry: number;
}
