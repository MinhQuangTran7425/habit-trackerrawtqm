export interface Habit {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  checkIns: CheckIn[]; // Changed from Date[] to CheckIn[]
  goal: number; // days per week, e.g. 7 for daily
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  completionRate: number; // percentage
}

export interface CheckIn {
  id: string;
  habitId: string;
  date: Date;
  photo?: string; // base64 encoded image
  location?: {
    latitude: number;
    longitude: number;
    name?: string; // place name if available
  };
  note?: string;
}

export interface Stamp {
  id: string;
  type: 'task' | 'location';
  image: string; // base64 encoded
  date: Date;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  habitId?: string;
}