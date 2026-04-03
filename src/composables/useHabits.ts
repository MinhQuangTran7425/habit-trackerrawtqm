import { ref, computed } from 'vue';
import type { Habit, HabitStats, CheckIn } from '../types';

const HABITS_KEY = 'habit-tracker-habits';

const habits = ref<Habit[]>([]);

const loadHabits = () => {
  const stored = localStorage.getItem(HABITS_KEY);
  if (stored) {
    habits.value = JSON.parse(stored).map((h: any) => ({
      ...h,
      createdAt: new Date(h.createdAt),
      checkIns: h.checkIns.map((checkIn: any) => {
        // Handle migration from old Date[] format to new CheckIn[] format
        if (checkIn instanceof Date || typeof checkIn === 'string') {
          // Old format: just a date
          const date = new Date(checkIn);
          return {
            id: Date.now().toString() + Math.random(),
            habitId: h.id,
            date,
          };
        } else {
          // New format: CheckIn object
          return {
            ...checkIn,
            date: new Date(checkIn.date),
          };
        }
      }),
    }));
  }
};

const saveHabits = () => {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits.value));
};

const addHabit = (habit: Omit<Habit, 'id' | 'createdAt' | 'checkIns'>) => {
  const newHabit: Habit = {
    ...habit,
    id: Date.now().toString(),
    createdAt: new Date(),
    checkIns: [],
  };
  habits.value.push(newHabit);
  saveHabits();
};

const checkInHabit = (id: string, date: Date = new Date(), photo?: string, location?: { latitude: number; longitude: number; name?: string }, note?: string) => {
  const habit = habits.value.find((h: Habit) => h.id === id);
  if (habit) {
    const dateStr = date.toDateString();
    const existingCheckIn = habit.checkIns.find((c: CheckIn) => c.date.toDateString() === dateStr);

    if (!existingCheckIn) {
      const newCheckIn: CheckIn = {
        id: Date.now().toString() + Math.random(),
        habitId: id,
        date,
        photo,
        location,
        note,
      };
      habit.checkIns.push(newCheckIn);
      habit.checkIns.sort((a: CheckIn, b: CheckIn) => a.date.getTime() - b.date.getTime());
      saveHabits();
      return newCheckIn;
    }
  }
  return null;
};

const getHabitStats = (habit: Habit): HabitStats => {
  const checkIns = habit.checkIns;
  if (checkIns.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalCheckIns: 0, completionRate: 0 };
  }

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if checked in today
  const lastCheckIn = checkIns[checkIns.length - 1];
  const lastCheckInDate = new Date(lastCheckIn.date);
  lastCheckInDate.setHours(0, 0, 0, 0);

  if (lastCheckInDate.getTime() === today.getTime()) {
    currentStreak = 1;
  }

  for (let i = checkIns.length - 2; i >= 0; i--) {
    const currentDate = new Date(checkIns[i].date);
    const nextDate = new Date(checkIns[i + 1].date);
    const diff = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  if (currentStreak === 1) {
    currentStreak = tempStreak;
  }

  // Completion rate: based on days since creation
  const daysSinceCreation = Math.floor((today.getTime() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const completionRate = (checkIns.length / daysSinceCreation) * 100;

  return {
    currentStreak,
    longestStreak,
    totalCheckIns: checkIns.length,
    completionRate: Math.round(completionRate),
  };
};

const deleteHabit = (id: string) => {
  habits.value = habits.value.filter((h: Habit) => h.id !== id);
  saveHabits();
};

// Load on init
loadHabits();

export const useHabits = () => ({
  habits: computed(() => habits.value),
  addHabit,
  checkInHabit,
  getHabitStats,
  deleteHabit,
});