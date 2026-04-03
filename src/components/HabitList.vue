<template>
  <div class="habit-list">
    <div class="section-header">
      <div class="header-content">
        <h2 class="section-title">
          <span class="title-icon">🎯</span>
          Your Habits
        </h2>
        <p class="section-subtitle">{{ habits.length }} active habit{{ habits.length !== 1 ? 's' : '' }}</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="habits.length === 0" class="empty-state">
      <div class="empty-illustration">
        <div class="empty-icon">🌱</div>
        <div class="empty-rings">
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
        </div>
      </div>
      <h3 class="empty-title">Start Your Habit Journey</h3>
      <p class="empty-description">
        Build lasting habits that transform your life. Add your first habit and start tracking your progress today.
      </p>
      <button @click="$emit('add-habit')" class="cta-button">
        <span class="cta-icon">✨</span>
        Create Your First Habit
      </button>
    </div>

    <!-- Habits Grid -->
    <div v-else class="habits-grid">
      <div
        v-for="habit in habits"
        :key="habit.id"
        class="habit-card"
        :class="{ 'completed-today': isCheckedInToday(habit) }"
      >
        <!-- Card Header -->
        <div class="card-header">
          <div class="habit-info">
            <div class="habit-icon">{{ getHabitIcon(habit.name) }}</div>
            <div class="habit-details">
              <h3 class="habit-name">{{ habit.name }}</h3>
              <p v-if="habit.description" class="habit-description">{{ habit.description }}</p>
            </div>
          </div>
          <button @click="deleteHabit(habit.id)" class="delete-btn" title="Delete habit">
            <span class="delete-icon">🗑️</span>
          </button>
        </div>

        <!-- Progress Section -->
        <div class="progress-section">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${getHabitStats(habit).completionRate}%` }"
            ></div>
          </div>
          <div class="progress-text">
            {{ getHabitStats(habit).completionRate }}% complete
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">🔥</div>
            <div class="stat-content">
              <div class="stat-value">{{ getHabitStats(habit).currentStreak }}</div>
              <div class="stat-label">Current Streak</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <div class="stat-value">{{ getHabitStats(habit).longestStreak }}</div>
              <div class="stat-label">Best Streak</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">{{ getHabitStats(habit).totalCheckIns }}</div>
              <div class="stat-label">Total Days</div>
            </div>
          </div>
        </div>

        <!-- Action Section -->
        <div class="action-section">
          <button
            @click="checkIn(habit.id)"
            :disabled="isCheckedInToday(habit)"
            class="check-in-btn"
            :class="{ 'checked-in': isCheckedInToday(habit), 'has-pending': hasPendingData(habit.id) }"
          >
            <span class="btn-icon">{{ isCheckedInToday(habit) ? '✅' : hasPendingData(habit.id) ? '📸' : '✓' }}</span>
            <span class="btn-text">
              {{ isCheckedInToday(habit) ? 'Completed Today!' : hasPendingData(habit.id) ? 'Complete with Photo' : 'Mark Complete' }}
            </span>
          </button>

          <div v-if="!isCheckedInToday(habit)" class="quick-actions">
            <button
              @click="openCamera(habit.id)"
              class="action-btn camera-btn"
              :class="{ 'active': hasPendingPhoto(habit.id) }"
              :title="hasPendingPhoto(habit.id) ? 'Change photo' : 'Take a photo'"
            >
              <span class="action-icon">{{ hasPendingPhoto(habit.id) ? '📸✓' : '📷' }}</span>
            </button>
            <button
              @click="openLocationCheckIn(habit.id)"
              class="action-btn location-btn"
              :class="{ 'active': hasPendingLocation(habit.id) }"
              :title="hasPendingLocation(habit.id) ? 'Change location' : 'Check in location'"
            >
              <span class="action-icon">{{ hasPendingLocation(habit.id) ? '📍✓' : '📍' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <CameraCapture
      :show="showCamera"
      title="Capture your achievement!"
      @close="closeCamera"
      @photo-taken="handlePhotoTaken"
    />

    <LocationCheckIn
      :show="showLocation"
      @close="closeLocation"
      @location-checked-in="handleLocationCheckedIn"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useHabits } from '../composables/useHabits';
import CameraCapture from './CameraCapture.vue';
import LocationCheckIn from './LocationCheckIn.vue';
import type { Habit } from '../types';

const emit = defineEmits<{
  'add-habit': [];
}>();

const { habits, checkInHabit, getHabitStats, deleteHabit } = useHabits();

const showCamera = ref(false);
const showLocation = ref(false);
const currentHabitId = ref<string>('');
const pendingPhoto = ref<string>('');
const pendingLocation = ref<{ latitude: number; longitude: number; name?: string } | null>(null);

const getHabitIcon = (habitName: string): string => {
  const name = habitName.toLowerCase();
  const iconMap: Record<string, string> = {
    exercise: '💪',
    workout: '🏋️',
    run: '🏃',
    running: '🏃',
    walk: '🚶',
    walking: '🚶',
    read: '📚',
    reading: '📚',
    book: '📖',
    water: '💧',
    drink: '🥤',
    sleep: '😴',
    meditate: '🧘',
    meditation: '🧘',
    journal: '📝',
    writing: '✍️',
    learn: '🎓',
    study: '📚',
    code: '💻',
    coding: '💻',
    music: '🎵',
    guitar: '🎸',
    piano: '🎹',
    eat: '🍽️',
    food: '🥗',
    healthy: '🥦',
    diet: '🍎',
    morning: '🌅',
    evening: '🌆',
    night: '🌙',
    social: '👥',
    call: '📞',
    friend: '👫',
    family: '👨‍👩‍👧',
    work: '💼',
    productivity: '⚡',
    focus: '🎯',
    goal: '🎯',
    habit: '🎯',
  };

  // Check for keywords in habit name
  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (name.includes(keyword)) {
      return icon;
    }
  }

  // Default icons based on first letter or random
  const defaultIcons = ['🎯', '⭐', '💫', '🌟', '✨', '🔥', '⚡', '💎', '🌈', '🎨'];
  return defaultIcons[name.charCodeAt(0) % defaultIcons.length];
};

const checkIn = (id: string) => {
  checkInHabit(id, undefined, pendingPhoto.value || undefined, pendingLocation.value || undefined);
  pendingPhoto.value = '';
  pendingLocation.value = null;
};

const openCamera = (habitId: string) => {
  currentHabitId.value = habitId;
  showCamera.value = true;
};

const openLocationCheckIn = (habitId: string) => {
  currentHabitId.value = habitId;
  showLocation.value = true;
};

const handlePhotoTaken = (photo: string, includeLocation: boolean = false) => {
  pendingPhoto.value = photo;
  showCamera.value = false;

  // If location is requested, open location check-in
  if (includeLocation && currentHabitId.value) {
    openLocationCheckIn(currentHabitId.value);
  } else if (currentHabitId.value) {
    // Otherwise, just check-in with photo
    checkIn(currentHabitId.value);
  }
};

const handleLocationCheckedIn = (location: { latitude: number; longitude: number; name?: string }) => {
  pendingLocation.value = location;
  showLocation.value = false;
  // Auto check-in after location check-in
  if (currentHabitId.value) {
    checkIn(currentHabitId.value);
  }
};

const closeCamera = () => {
  showCamera.value = false;
  currentHabitId.value = '';
};

const closeLocation = () => {
  showLocation.value = false;
  currentHabitId.value = '';
};

const hasPendingData = (habitId: string): boolean => {
  return hasPendingPhoto(habitId) || hasPendingLocation(habitId);
};

const hasPendingPhoto = (habitId: string): boolean => {
  return currentHabitId.value === habitId && !!pendingPhoto.value;
};

const hasPendingLocation = (habitId: string): boolean => {
  return currentHabitId.value === habitId && !!pendingLocation.value;
};

const isCheckedInToday = (habit: Habit): boolean => {
  const today = new Date().toDateString();
  return habit.checkIns.some(checkIn => checkIn.date.toDateString() === today);
};
</script>

<style scoped>
/* Section Header */
.section-header {
  margin-bottom: var(--space-2xl);
  text-align: center;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.title-icon {
  font-size: var(--font-size-4xl);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.section-subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
  margin: 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-2xl) var(--space-lg);
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 2px dashed var(--border-light);
}

.empty-illustration {
  position: relative;
  margin-bottom: var(--space-xl);
  display: inline-block;
}

.empty-icon {
  font-size: 4rem;
  position: relative;
  z-index: 2;
}

.empty-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring {
  position: absolute;
  border: 2px solid var(--primary-light);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

.ring-1 {
  width: 80px;
  height: 80px;
  animation-delay: 0s;
}

.ring-2 {
  width: 100px;
  height: 100px;
  animation-delay: 0.5s;
  opacity: 0.6;
}

.ring-3 {
  width: 120px;
  height: 120px;
  animation-delay: 1s;
  opacity: 0.3;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }
}

.empty-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.empty-description {
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
  line-height: 1.6;
  margin-bottom: var(--space-xl);
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-inverse);
  border: none;
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.cta-icon {
  font-size: var(--font-size-xl);
}

/* Habits Grid */
.habits-grid {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

/* Habit Cards */
.habit-card {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
  overflow: hidden;
  transition: all var(--transition-normal);
  position: relative;
}

.habit-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.habit-card.completed-today {
  border-color: var(--success-color);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1), var(--shadow-lg);
}

.habit-card.completed-today::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--success-color) 0%, var(--accent-color) 100%);
}

/* Card Header */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-light);
}

.habit-info {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  flex: 1;
}

.habit-icon {
  font-size: 2.5rem;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--secondary-color) 100%);
  border-radius: var(--radius-lg);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.habit-details {
  flex: 1;
  min-width: 0;
}

.habit-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
  word-break: break-word;
}

.habit-description {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.delete-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  opacity: 0.7;
}

.delete-btn:hover {
  background: var(--error-color);
  color: var(--text-inverse);
  opacity: 1;
  transform: scale(1.1);
}

/* Progress Section */
.progress-section {
  padding: 0 var(--space-lg) var(--space-lg);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: var(--space-sm);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  border-radius: var(--radius-sm);
  transition: width var(--transition-slow);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  text-align: center;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  padding: 0 var(--space-lg) var(--space-lg);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.stat-item:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: var(--font-size-xl);
  flex-shrink: 0;
}

.stat-content {
  min-width: 0;
  flex: 1;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  line-height: 1.2;
  display: block;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Action Section */
.action-section {
  padding: var(--space-lg);
  border-top: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.check-in-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.check-in-btn:not(.checked-in) {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-inverse);
}

.check-in-btn.has-pending {
  background: linear-gradient(135deg, var(--warning-color) 0%, var(--primary-color) 100%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.check-in-btn:not(.checked-in):hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.check-in-btn.checked-in {
  background: var(--success-color);
  color: var(--text-inverse);
  cursor: default;
}

.btn-icon {
  font-size: var(--font-size-lg);
}

.quick-actions {
  display: flex;
  gap: var(--space-sm);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 2px solid var(--border-light);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-btn.active {
  border-color: var(--primary-color);
  background: rgba(99, 102, 241, 0.1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.camera-btn:hover, .camera-btn.active {
  border-color: var(--primary-color);
  background: rgba(99, 102, 241, 0.1);
}

.location-btn:hover, .location-btn.active {
  border-color: var(--secondary-color);
  background: rgba(239, 68, 68, 0.1);
}

.action-icon {
  font-size: var(--font-size-lg);
}

/* Responsive Design */
@media (max-width: 768px) {
  .habits-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: var(--font-size-2xl);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-section {
    flex-direction: column;
    gap: var(--space-md);
  }

  .quick-actions {
    align-self: stretch;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .habit-icon {
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }

  .habit-name {
    font-size: var(--font-size-lg);
  }
}
</style>