<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import HabitList from './components/HabitList.vue';
import HabitForm from './components/HabitForm.vue';
import CalendarView from './components/CalendarView.vue';
import AIAssistant from './components/AIAssistant.vue';
import PhoneSensors from './components/PhoneSensors.vue';

const currentView = ref<'list' | 'add' | 'calendar' | 'ai' | 'sensors'>('list');

const currentComponent = computed(() => {
  switch (currentView.value) {
    case 'add':
      return HabitForm;
    case 'calendar':
      return CalendarView;
    case 'ai':
      return AIAssistant;
    case 'sensors':
      return PhoneSensors;
    default:
      return HabitList;
  }
});
const isDarkMode = ref(false);

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value.toString());
  updateTheme();
};

const updateTheme = () => {
  document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light');
};

onMounted(() => {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'true';
    updateTheme();
  }
});
</script>

<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <!-- Header with gradient background -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo">
            <span class="logo-icon">🎯</span>
            <h1>HabitFlow</h1>
          </div>
          <p class="tagline">Build better habits, one day at a time</p>
        </div>

        <div class="header-actions">
          <button @click="toggleDarkMode" class="theme-toggle" :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <span class="theme-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
          </button>
        </div>
      </div>

      <!-- Modern tab navigation -->
      <nav class="main-nav">
        <div class="nav-container">
          <button
            @click="currentView = 'list'"
            :class="['nav-item', { active: currentView === 'list' }]"
          >
            <span class="nav-icon">📋</span>
            <span class="nav-text">Habits</span>
          </button>

          <button
            @click="currentView = 'calendar'"
            :class="['nav-item', { active: currentView === 'calendar' }]"
          >
            <span class="nav-icon">📅</span>
            <span class="nav-text">Calendar</span>
          </button>

          <button
            @click="currentView = 'add'"
            :class="['nav-item', 'nav-add', { active: currentView === 'add' }]"
          >
            <span class="nav-icon">➕</span>
          </button>

          <button
            @click="currentView = 'ai'"
            :class="['nav-item', { active: currentView === 'ai' }]"
          >
            <span class="nav-icon">🤖</span>
            <span class="nav-text">AI</span>
          </button>

          <button
            @click="currentView = 'sensors'"
            :class="['nav-item', { active: currentView === 'sensors' }]"
          >
            <span class="nav-icon">📱</span>
            <span class="nav-text">Sensors</span>
          </button>
        </div>
      </nav>
    </header>

    <!-- Main content with smooth transitions -->
    <main class="main-content">
      <div class="content-wrapper">
        <transition name="fade" mode="out-in">
          <component :is="currentComponent" :key="currentView" />
        </transition>
      </div>
    </main>
  </div>
</template>

<style>
/* CSS Custom Properties for Theming */
:root {
  /* Light Theme Colors */
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #a5b4fc;
  --secondary-color: #06b6d4;
  --accent-color: #f59e0b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;

  /* Background Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-overlay: rgba(0, 0, 0, 0.5);

  /* Text Colors */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --text-inverse: #ffffff;

  /* Border Colors */
  --border-light: #e2e8f0;
  --border-medium: #cbd5e1;
  --border-dark: #475569;

  /* Shadow */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}

/* Dark Theme */
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-overlay: rgba(0, 0, 0, 0.7);

  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;

  --border-light: #334155;
  --border-medium: #475569;
  --border-dark: #64748b;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.5);
}

/* Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
  font-size: var(--font-size-base);
  transition: background-color var(--transition-normal), color var(--transition-normal);
}

/* App Container */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header Styles */
.app-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-inverse);
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.logo-icon {
  font-size: var(--font-size-3xl);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.logo h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.025em;
}

.tagline {
  font-size: var(--font-size-sm);
  opacity: 0.9;
  font-weight: var(--font-weight-normal);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.theme-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-inverse);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: var(--font-size-lg);
  backdrop-filter: blur(10px);
  transition: all var(--transition-fast);
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

/* Navigation Styles */
.main-nav {
  background: var(--bg-primary);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  position: relative;
  min-width: 70px;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transform: translateY(-2px);
}

.nav-item.active {
  background: var(--primary-color);
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: var(--accent-color);
  border-radius: 2px;
}

.nav-add {
  background: linear-gradient(135deg, var(--success-color) 0%, var(--primary-color) 100%);
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
  margin: 0 var(--space-md);
}

.nav-add:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-lg);
}

.nav-icon {
  font-size: var(--font-size-xl);
  transition: transform var(--transition-fast);
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: var(--space-lg);
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }

  .logo-section {
    align-items: center;
  }

  .nav-container {
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .nav-item {
    min-width: 60px;
    padding: var(--space-sm);
  }

  .nav-text {
    font-size: 10px;
  }

  .main-content {
    padding: var(--space-md);
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: var(--space-xs);
  }

  .nav-item {
    min-width: 50px;
    padding: var(--space-xs);
  }

  .nav-icon {
    font-size: var(--font-size-lg);
  }

  .nav-text {
    display: none;
  }
}
</style>
