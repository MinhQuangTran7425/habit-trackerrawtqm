<template>
  <div class="calendar-view">
    <!-- Section Header -->
    <div class="section-header">
      <div class="header-content">
        <h2 class="section-title">
          <span class="title-icon">📅</span>
          Habit Calendar
        </h2>
        <p class="section-subtitle">Track your progress over time</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="habits.length === 0" class="empty-state">
      <div class="empty-illustration">
        <div class="empty-icon">📅</div>
        <div class="empty-decoration">✨</div>
      </div>
      <h3 class="empty-title">No Habits Yet</h3>
      <p class="empty-description">
        Create your first habit to start tracking your progress on the calendar.
      </p>
      <button @click="$emit('add-habit')" class="cta-button">
        <span class="cta-icon">➕</span>
        Create Habit
      </button>
    </div>

    <!-- Calendar Content -->
    <div v-else class="calendar-content">
      <!-- Habit Selector -->
      <div class="habit-selector">
        <div class="selector-label">
          <span class="label-icon">🎯</span>
          <span class="label-text">Select Habit to View</span>
        </div>
        <div class="selector-wrapper">
          <select
            id="habit-select"
            v-model="selectedHabitId"
            class="habit-select"
          >
            <option v-for="habit in habits" :key="habit.id" :value="habit.id">
              {{ habit.name }}
            </option>
          </select>
          <div class="select-arrow">▼</div>
        </div>
      </div>

      <!-- Calendar -->
      <div v-if="selectedHabit" class="calendar-container">
        <!-- Calendar Header -->
        <div class="calendar-header">
          <button @click="prevMonth" class="nav-btn prev-btn" aria-label="Previous month">
            <span class="nav-icon">◀</span>
          </button>

          <div class="month-year">
            <h3 class="month-name">{{ monthNames[currentMonth] }}</h3>
            <span class="year">{{ currentYear }}</span>
          </div>

          <button @click="nextMonth" class="nav-btn next-btn" aria-label="Next month">
            <span class="nav-icon">▶</span>
          </button>
        </div>

        <!-- Weekdays Header -->
        <div class="weekdays-header">
          <div
            v-for="day in weekdays"
            :key="day"
            class="weekday"
            :class="{ 'weekend': isWeekend(day) }"
          >
            {{ day }}
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="calendar-grid">
          <div
            v-for="day in daysInMonth"
            :key="day.fullDate.toISOString()"
            :class="[
              'calendar-day',
              {
                'checked-in': day.checked,
                'today': day.isToday,
                'other-month': !day.isCurrentMonth,
                'has-photo': day.photo,
                'has-location': day.location,
                'weekend': isWeekendDay(day.fullDate)
              }
            ]"
            @click="showDayDetails(day)"
          >
            <div class="day-number">{{ day.date }}</div>

            <div class="day-indicators">
              <div v-if="day.photo" class="indicator photo-indicator" title="Photo taken">
                📸
              </div>
              <div v-if="day.location" class="indicator location-indicator" title="Location checked in">
                📍
              </div>
            </div>

            <div v-if="day.checked" class="completion-mark">
              <div class="checkmark">✓</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Day Details Modal -->
    <div v-if="showDayModal" class="day-modal-overlay" @click="closeDayModal">
      <div class="day-modal" @click.stop>
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-icon">📅</span>
            <div class="title-content">
              <h3 class="day-title">
                {{ monthNames[selectedDay?.fullDate.getMonth()] }} {{ selectedDay?.date }}
              </h3>
              <span class="day-year">{{ selectedDay?.fullDate.getFullYear() }}</span>
            </div>
          </div>
          <button @click="closeDayModal" class="modal-close-btn" aria-label="Close modal">
            <span class="close-icon">✕</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- Completion Status -->
          <div class="completion-status" :class="{ 'completed': selectedDay?.checked }">
            <div class="status-icon">
              {{ selectedDay?.checked ? '✅' : '⭕' }}
            </div>
            <div class="status-text">
              <h4>{{ selectedDay?.checked ? 'Habit Completed!' : 'Not Completed' }}</h4>
              <p>{{ selectedDay?.checked ? 'Great job staying on track!' : 'This day was missed.' }}</p>
            </div>
          </div>

          <!-- Photo Section -->
          <div v-if="selectedDay?.photo" class="photo-section">
            <h4 class="section-title">
              <span class="section-icon">📸</span>
              Memory Capture
            </h4>
            <div class="photo-container">
              <img :src="selectedDay.photo" alt="Check-in photo" class="checkin-photo" />
            </div>
          </div>

          <!-- Location Section -->
          <div v-if="selectedDay?.location" class="location-section">
            <h4 class="section-title">
              <span class="section-icon">📍</span>
              Location Check-in
            </h4>
            <div class="location-card">
              <div class="location-icon">📍</div>
              <div class="location-details">
                <h5 v-if="selectedDay.location.name" class="location-name">
                  {{ selectedDay.location.name }}
                </h5>
                <div class="coordinates">
                  {{ selectedDay.location.latitude.toFixed(4) }}, {{ selectedDay.location.longitude.toFixed(4) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Note Section -->
          <div v-if="selectedDay?.checkIn?.note" class="note-section">
            <h4 class="section-title">
              <span class="section-icon">📝</span>
              Note
            </h4>
            <div class="note-content">
              {{ selectedDay.checkIn.note }}
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!selectedDay?.photo && !selectedDay?.location && !selectedDay?.checkIn?.note" class="empty-details">
            <div class="empty-icon">🎯</div>
            <p>{{ selectedDay?.checked ? 'Habit completed successfully!' : 'No additional details for this day.' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useHabits } from '../composables/useHabits';

const emit = defineEmits<{
  'add-habit': [];
}>();

const { habits } = useHabits();

const selectedHabitId = ref<string>('');
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());
const showDayModal = ref(false);
const selectedDay = ref<any>(null);

const selectedHabit = computed(() =>
  habits.value.find((h: any) => h.id === selectedHabitId.value)
);

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const daysInMonth = computed(() => {
  if (!selectedHabit.value) return [];

  const year = currentYear.value;
  const month = currentMonth.value;

  // Get the first day of the month
  const firstDayOfMonth = new Date(year, month, 1);

  // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
  const startDayOfWeek = firstDayOfMonth.getDay();

  // Calculate the date to start displaying (previous Sunday)
  const startDate = new Date(year, month, 1 - startDayOfWeek);

  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 42 days (6 weeks) for consistent calendar layout
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const dateStr = currentDate.toDateString();
    const isCurrentMonth = currentDate.getMonth() === month;
    const checkIn = selectedHabit.value.checkIns.find((c: any) => c.date.toDateString() === dateStr);
    const checked = !!checkIn;
    const isToday = currentDate.toDateString() === today.toDateString();

    days.push({
      date: currentDate.getDate(),
      fullDate: new Date(currentDate),
      isCurrentMonth,
      checked,
      isToday,
      photo: checkIn?.photo,
      location: checkIn?.location,
      checkIn,
    });
  }

  return days;
});

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const showDayDetails = (day: any) => {
  if (day.checked) {
    selectedDay.value = day;
    showDayModal.value = true;
  }
};

const closeDayModal = () => {
  showDayModal.value = false;
  selectedDay.value = null;
};

const isWeekend = (dayName: string): boolean => {
  return dayName === 'Sat' || dayName === 'Sun';
};

const isWeekendDay = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
};

// Set initial selected habit
watch(habits, (newHabits) => {
  if (newHabits.length > 0 && !selectedHabitId.value) {
    selectedHabitId.value = newHabits[0].id;
  }
}, { immediate: true });
</script>

<style scoped>
.calendar-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.no-habits {
  text-align: center;
  color: #666;
  font-size: 18px;
  margin: 40px 0;
}

.habit-selector {
  margin-bottom: 20px;
  text-align: center;
}

label {
  margin-right: 10px;
  font-weight: bold;
}

select {
  padding: 5px;
  font-size: 16px;
}

.calendar {
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.calendar-header h3 {
  margin: 0;
}

.nav-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.nav-btn:hover {
  background: #0056b3;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.weekday {
  padding: 10px;
  text-align: center;
  font-weight: bold;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.day {
  padding: 10px;
  text-align: center;
  border-right: 1px solid #eee;
  border-bottom: 1px solid #eee;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day.checked-in {
  background: #d4edda;
  color: #155724;
}

.day.today {
  border: 2px solid #007bff;
  font-weight: bold;
}

.day.has-photo {
  position: relative;
}

.photo-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 12px;
  opacity: 0.8;
}

.day.other-month {
  color: #ccc;
  background: #f8f9fa;
}

.day.checked-in.other-month {
  background: #e2e3e5;
  color: #6c757d;
}

.day-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.day-modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.day-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.day-modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.day-modal-body {
  padding: 20px;
}

.day-photo {
  text-align: center;
  margin-bottom: 20px;
}

.day-photo img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.day-location {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.location-icon {
  font-size: 24px;
  margin-right: 15px;
}

.location-info p {
  margin: 2px 0;
}

.location-name {
  font-weight: bold;
  color: #007bff;
}

.coordinates {
  font-size: 14px;
  color: #666;
}

.day-note {
  padding: 15px;
  background: #e9ecef;
  border-radius: 8px;
  font-style: italic;
}

.no-details {
  text-align: center;
  color: #666;
  font-size: 16px;
}
</style>