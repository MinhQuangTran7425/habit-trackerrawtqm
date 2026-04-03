<template>
  <div class="habit-form">
    <!-- Section Header -->
    <div class="section-header">
      <div class="header-content">
        <h2 class="section-title">
          <span class="title-icon">✨</span>
          Create New Habit
        </h2>
        <p class="section-subtitle">Build a habit that sticks with you</p>
      </div>
    </div>

    <!-- Form Container -->
    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="habit-form-element">
        <!-- Habit Name -->
        <div class="form-group">
          <label for="name" class="form-label">
            <span class="label-icon">🎯</span>
            Habit Name
            <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.name }"
              placeholder="e.g., Morning exercise, Daily reading, Meditation"
              required
              maxlength="50"
            />
            <div class="input-icon">📝</div>
          </div>
          <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
          <div class="helper-text">{{ form.name.length }}/50 characters</div>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description" class="form-label">
            <span class="label-icon">💬</span>
            Description
            <span class="optional">(optional)</span>
          </label>
          <div class="input-wrapper">
            <textarea
              id="description"
              v-model="form.description"
              class="form-textarea"
              :class="{ 'input-error': errors.description }"
              placeholder="Describe your habit and why it's important to you..."
              rows="3"
              maxlength="200"
            ></textarea>
            <div class="input-icon">📝</div>
          </div>
          <div v-if="errors.description" class="error-message">{{ errors.description }}</div>
          <div class="helper-text">{{ form.description.length }}/200 characters</div>
        </div>

        <!-- Goal Frequency -->
        <div class="form-group">
          <label for="goal" class="form-label">
            <span class="label-icon">📊</span>
            Weekly Goal
            <span class="required">*</span>
          </label>
          <div class="goal-selector">
            <div class="goal-options">
              <button
                v-for="option in goalOptions"
                :key="option.value"
                type="button"
                class="goal-option"
                :class="{ active: form.goal === option.value }"
                @click="form.goal = option.value"
              >
                <div class="goal-icon">{{ option.icon }}</div>
                <div class="goal-text">{{ option.label }}</div>
                <div class="goal-value">{{ option.value }}</div>
              </button>
            </div>
          </div>
          <div class="goal-description">
            <span class="goal-summary">
              {{ getGoalDescription(form.goal) }}
            </span>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" @click="$emit('cancel')" class="cancel-btn">
            <span class="btn-icon">❌</span>
            Cancel
          </button>
          <button type="submit" class="submit-btn" :disabled="!isFormValid">
            <span class="btn-icon">✨</span>
            Create Habit
          </button>
        </div>
      </form>

      <!-- Tips Section -->
      <div class="tips-section">
        <h3 class="tips-title">
          <span class="tips-icon">💡</span>
          Habit Success Tips
        </h3>
        <div class="tips-list">
          <div class="tip-item">
            <span class="tip-bullet">🎯</span>
            <span class="tip-text">Start small - consistency beats intensity</span>
          </div>
          <div class="tip-item">
            <span class="tip-bullet">⏰</span>
            <span class="tip-text">Pair with existing routines for better success</span>
          </div>
          <div class="tip-item">
            <span class="tip-bullet">📅</span>
            <span class="tip-text">Track daily to build momentum</span>
          </div>
          <div class="tip-item">
            <span class="tip-bullet">🎉</span>
            <span class="tip-text">Celebrate small wins along the way</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useHabits } from '../composables/useHabits';

const emit = defineEmits<{
  cancel: [];
}>();

const { addHabit: addHabitToStore } = useHabits();

const form = ref({
  name: '',
  description: '',
  goal: 7,
});

const errors = ref({
  name: '',
  description: '',
});

const goalOptions = [
  { value: 1, label: 'Once a week', icon: '🌱' },
  { value: 2, label: 'Couple times', icon: '🌿' },
  { value: 3, label: 'Few times', icon: '🌳' },
  { value: 4, label: 'Half the week', icon: '🌲' },
  { value: 5, label: 'Most days', icon: '🌴' },
  { value: 6, label: 'Almost daily', icon: '🎋' },
  { value: 7, label: 'Every day', icon: '🌟' },
];

const isFormValid = computed(() => {
  return form.value.name.trim().length >= 2 && form.value.goal >= 1 && form.value.goal <= 7;
});

const validateForm = () => {
  errors.value.name = '';
  errors.value.description = '';

  if (form.value.name.trim().length < 2) {
    errors.value.name = 'Habit name must be at least 2 characters long';
  }

  if (form.value.description.length > 200) {
    errors.value.description = 'Description must be less than 200 characters';
  }

  return !errors.value.name && !errors.value.description;
};

const getGoalDescription = (goal: number): string => {
  const descriptions = {
    1: 'Perfect for building foundational habits',
    2: 'Good balance between commitment and flexibility',
    3: 'Building regular practice',
    4: 'Halfway to daily habit formation',
    5: 'Strong commitment with some flexibility',
    6: 'Very committed, almost daily',
    7: 'Maximum commitment for life-changing habits',
  };
  return descriptions[goal as keyof typeof descriptions] || '';
};

const handleSubmit = () => {
  if (!validateForm()) return;

  addHabitToStore({
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    goal: form.value.goal,
  });

  // Reset form
  form.value = { name: '', description: '', goal: 7 };
  errors.value = { name: '', description: '' };

  // Show success feedback (could emit an event for parent to handle)
  // For now, we'll just reset the form
};
</script>

<style scoped>
.habit-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.habit-form h2 {
  margin-top: 0;
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.add-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
}

.add-btn:hover {
  background: #0056b3;
}
</style>