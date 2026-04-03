<template>
  <div class="phone-sensors-container">
    <div class="sensor-header">
      <div class="header-content">
        <div class="sensor-icon">📱</div>
        <div class="header-text">
          <h3 class="sensor-title">Phone Usage Monitor</h3>
          <p class="sensor-subtitle">Track your screen time and posture</p>
        </div>
      </div>
    </div>

    <div class="sensor-content">
      <!-- Status Overview -->
      <div class="status-overview">
        <div class="status-card">
          <div class="status-icon">⏱️</div>
          <div class="status-info">
            <div class="status-label">Session Time</div>
            <div class="status-value">{{ formatTime(sessionTime) }}</div>
          </div>
        </div>

        <div class="status-card">
          <div class="status-icon">📅</div>
          <div class="status-info">
            <div class="status-label">Daily Usage</div>
            <div class="status-value">{{ formatTime(dailyUsage) }}</div>
          </div>
        </div>

        <div class="status-card">
          <div class="status-icon" :class="{ 'supported': orientationSupported, 'unsupported': !orientationSupported }">
            {{ orientationSupported ? '📐' : '❌' }}
          </div>
          <div class="status-info">
            <div class="status-label">Orientation</div>
            <div class="status-value" :class="{ 'enabled': orientationSupported, 'disabled': !orientationSupported }">
              {{ orientationSupported ? 'Active' : 'Not Supported' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Orientation Display -->
      <div v-if="orientationSupported" class="orientation-section">
        <h4 class="section-title">📱 Device Orientation</h4>
        <div class="orientation-content">
          <div class="orientation-visual">
            <div class="phone-visualization">
              <div
                class="phone-device"
                :style="{ transform: `rotateX(${orientation.beta || 0}deg) rotateY(${orientation.gamma || 0}deg)` }"
              >
                <div class="phone-screen">
                  <div class="screen-content">
                    <div class="app-icon">📱</div>
                    <div class="app-label">Habit Tracker</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="orientation-data">
            <div class="data-item">
              <span class="data-label">Tilt Angle:</span>
              <span class="data-value">{{ orientation.beta?.toFixed(1) || 0 }}°</span>
            </div>
            <div class="data-item">
              <span class="data-label">Rotation:</span>
              <span class="data-value">{{ orientation.gamma?.toFixed(1) || 0 }}°</span>
            </div>
            <div class="data-item">
              <span class="data-label">Posture:</span>
              <span class="data-value posture">{{ getPostureDescription() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Usage Limits -->
      <div class="limits-section">
        <h4 class="section-title">⚙️ Usage Settings</h4>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-icon">📅</span>
              Daily Limit (minutes)
            </label>
            <input
              v-model.number="dailyLimit"
              type="number"
              min="1"
              max="1440"
              class="setting-input"
              @change="saveSettings"
            />
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-icon">⏱️</span>
              Session Limit (minutes)
            </label>
            <input
              v-model.number="sessionLimit"
              type="number"
              min="1"
              max="480"
              class="setting-input"
              @change="saveSettings"
            />
          </div>
        </div>
      </div>

      <!-- Break Reminders -->
      <div class="reminders-section">
        <h4 class="section-title">🔔 Break Reminders</h4>
        <div class="reminder-toggle">
          <label class="toggle-label">
            <input
              v-model="breakRemindersEnabled"
              type="checkbox"
              class="toggle-input"
              @change="saveSettings"
            />
            <span class="toggle-slider"></span>
            <span class="toggle-text">Enable break reminders</span>
          </label>
        </div>

        <div v-if="breakRemindersEnabled" class="reminder-settings">
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-icon">⏰</span>
              Break Interval (minutes)
            </label>
            <input
              v-model.number="breakInterval"
              type="number"
              min="5"
              max="120"
              class="setting-input"
              @change="saveSettings"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Break Reminder Modal -->
    <div v-if="showBreakReminder" class="break-modal-overlay" @click="dismissBreakReminder">
      <div class="break-modal" @click.stop>
        <div class="break-header">
          <div class="break-icon">⏰</div>
          <h3 class="break-title">Time for a Break!</h3>
        </div>
        <div class="break-content">
          <p class="break-message">
            You've been using the app for <strong>{{ formatTime(sessionTime) }}</strong>.
          </p>
          <p class="break-advice">
            Take a moment to stretch, look away from the screen, or practice some deep breathing.
          </p>
        </div>
        <div class="break-actions">
          <button @click="dismissBreakReminder" class="break-button">
            <span class="button-icon">✓</span>
            Got it!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface OrientationData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

const orientationSupported = ref(false);
const orientation = ref<OrientationData>({ alpha: null, beta: null, gamma: null });
const sessionTime = ref(0); // in seconds
const dailyUsage = ref(0); // in seconds
const lastActiveTime = ref(Date.now());

const dailyLimit = ref(480); // 8 hours in minutes
const sessionLimit = ref(90); // 1.5 hours in minutes
const breakRemindersEnabled = ref(true);
const breakInterval = ref(30); // minutes
const showBreakReminder = ref(false);
const lastBreakReminder = ref(0);

const SETTINGS_KEY = 'phone-sensor-settings';

const loadSettings = () => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    const settings = JSON.parse(stored);
    dailyLimit.value = settings.dailyLimit || 480;
    sessionLimit.value = settings.sessionLimit || 90;
    breakRemindersEnabled.value = settings.breakRemindersEnabled !== false;
    breakInterval.value = settings.breakInterval || 30;
  }

  // Load daily usage
  const today = new Date().toDateString();
  const storedUsage = localStorage.getItem(`daily-usage-${today}`);
  if (storedUsage) {
    dailyUsage.value = parseInt(storedUsage);
  }
};

const saveSettings = () => {
  const settings = {
    dailyLimit: dailyLimit.value,
    sessionLimit: sessionLimit.value,
    breakRemindersEnabled: breakRemindersEnabled.value,
    breakInterval: breakInterval.value,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const handleOrientation = (event: DeviceOrientationEvent) => {
  orientation.value = {
    alpha: event.alpha,
    beta: event.beta,
    gamma: event.gamma,
  };
};

const getPostureDescription = (): string => {
  const beta = orientation.value.beta || 0;

  if (beta > 45) return 'Looking down';
  if (beta < -45) return 'Looking up';
  if (Math.abs(beta) < 15) return 'Screen facing up';
  return 'Normal viewing';
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const updateUsageTime = () => {
  const now = Date.now();
  const timeDiff = Math.floor((now - lastActiveTime.value) / 1000);

  // Only count as active if less than 5 minutes have passed
  if (timeDiff < 300) {
    sessionTime.value += timeDiff;
    dailyUsage.value += timeDiff;

    // Save daily usage
    const today = new Date().toDateString();
    localStorage.setItem(`daily-usage-${today}`, dailyUsage.value.toString());

    // Check for break reminders
    if (breakRemindersEnabled.value && sessionTime.value - lastBreakReminder.value >= breakInterval.value * 60) {
      showBreakReminder.value = true;
      lastBreakReminder.value = sessionTime.value;
    }

    // Check usage limits
    if (sessionTime.value >= sessionLimit.value * 60) {
      alert(`You've reached your ${sessionLimit.value}-minute session limit. Time for a break!`);
    }

    if (dailyUsage.value >= dailyLimit.value * 60) {
      alert(`You've reached your ${dailyLimit.value}-minute daily limit. Great job being mindful of your screen time!`);
    }
  }

  lastActiveTime.value = now;
};

const dismissBreakReminder = () => {
  showBreakReminder.value = false;
};

const handleVisibilityChange = () => {
  if (document.hidden) {
    // App is not visible, pause tracking
    lastActiveTime.value = Date.now();
  } else {
    // App became visible again
    updateUsageTime();
  }
};

onMounted(() => {
  // Check for device orientation support
  if (window.DeviceOrientationEvent) {
    orientationSupported.value = true;
    window.addEventListener('deviceorientation', handleOrientation);
  }

  loadSettings();

  // Start usage tracking
  const usageInterval = setInterval(updateUsageTime, 1000);

  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  onUnmounted(() => {
    clearInterval(usageInterval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (orientationSupported.value) {
      window.removeEventListener('deviceorientation', handleOrientation);
    }
  });
});
</script>

<style scoped>
.phone-sensors-container {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 16px;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
  overflow: hidden;
  transition: all 0.3s ease;
}

.phone-sensors-container:hover {
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.15));
}

/* Header */
.sensor-header {
  background: linear-gradient(135deg, var(--secondary, #f093fb) 0%, var(--secondary-dark, #f5576c) 100%);
  padding: 20px 24px;
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sensor-icon {
  font-size: 32px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sensor-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.sensor-subtitle {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.8);
}

/* Content */
.sensor-content {
  padding: 24px;
}

/* Status Overview */
.status-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.status-card {
  background: var(--bg-secondary, #f7fafc);
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.status-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: white;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.status-icon.supported {
  background: linear-gradient(135deg, var(--success, #48bb78), var(--success-dark, #38a169));
  color: white;
}

.status-icon.unsupported {
  background: linear-gradient(135deg, var(--error, #f56565), var(--error-dark, #e53e3e));
  color: white;
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 12px;
  color: var(--text-muted, #718096);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  margin-bottom: 4px;
}

.status-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #2d3748);
}

.status-value.enabled {
  color: var(--success, #48bb78);
}

.status-value.disabled {
  color: var(--error, #f56565);
}

/* Orientation Section */
.orientation-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #2d3748);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.orientation-content {
  background: var(--bg-secondary, #f7fafc);
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 24px;
  align-items: center;
}

.orientation-visual {
  flex-shrink: 0;
}

.phone-visualization {
  perspective: 1000px;
}

.phone-device {
  width: 120px;
  height: 200px;
  background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
  border-radius: 16px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.phone-screen {
  position: absolute;
  top: 20px;
  left: 10px;
  right: 10px;
  bottom: 20px;
  background: #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.screen-content {
  text-align: center;
  color: white;
}

.app-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.app-label {
  font-size: 10px;
  opacity: 0.8;
}

.orientation-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color, #e1e5e9);
}

.data-item:last-child {
  border-bottom: none;
}

.data-label {
  font-weight: 500;
  color: var(--text-primary, #2d3748);
}

.data-value {
  font-weight: 600;
  color: var(--primary, #667eea);
}

.data-value.posture {
  color: var(--secondary, #f093fb);
}

/* Settings Sections */
.limits-section, .reminders-section {
  margin-bottom: 24px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.setting-item {
  background: var(--bg-secondary, #f7fafc);
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 12px;
  padding: 16px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-primary, #2d3748);
  margin-bottom: 8px;
}

.setting-icon {
  font-size: 16px;
}

.setting-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid var(--border-color, #e1e5e9);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #2d3748);
  transition: all 0.2s ease;
  outline: none;
}

.setting-input:focus {
  border-color: var(--primary, #667eea);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Toggle */
.reminder-toggle {
  margin-bottom: 16px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-primary, #2d3748);
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--border-color, #e1e5e9);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.toggle-input:checked + .toggle-slider {
  background: var(--primary, #667eea);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-text {
  flex: 1;
}

/* Break Modal */
.break-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.break-modal {
  background: var(--card-bg, #ffffff);
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-xl, 0 20px 60px rgba(0, 0, 0, 0.3));
  animation: slideUp 0.3s ease;
  text-align: center;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.break-header {
  margin-bottom: 24px;
}

.break-icon {
  font-size: 48px;
  margin-bottom: 16px;
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.break-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary, #2d3748);
}

.break-content {
  margin-bottom: 32px;
}

.break-message {
  font-size: 16px;
  color: var(--text-primary, #2d3748);
  margin-bottom: 12px;
  line-height: 1.5;
}

.break-advice {
  font-size: 14px;
  color: var(--text-muted, #718096);
  line-height: 1.4;
}

.break-actions {
  display: flex;
  justify-content: center;
}

.break-button {
  background: linear-gradient(135deg, var(--primary, #667eea), var(--primary-dark, #764ba2));
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.break-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.15));
}

.button-icon {
  font-size: 18px;
}

/* Dark mode adjustments */
[data-theme="dark"] .phone-sensors-container {
  background: var(--card-bg-dark, #2d3748);
  border-color: var(--border-color-dark, #4a5568);
}

[data-theme="dark"] .sensor-content {
  background: var(--bg-primary-dark, #1a202c);
}

[data-theme="dark"] .status-card {
  background: var(--bg-secondary-dark, #2d3748);
  border-color: var(--border-color-dark, #4a5568);
}

[data-theme="dark"] .orientation-content {
  background: var(--bg-secondary-dark, #2d3748);
  border-color: var(--border-color-dark, #4a5568);
}

[data-theme="dark"] .setting-item {
  background: var(--bg-secondary-dark, #2d3748);
  border-color: var(--border-color-dark, #4a5568);
}

[data-theme="dark"] .setting-input {
  background: var(--bg-primary-dark, #1a202c);
  border-color: var(--border-color-dark, #4a5568);
  color: var(--text-primary-dark, #e2e8f0);
}

[data-theme="dark"] .break-modal {
  background: var(--card-bg-dark, #2d3748);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .sensor-header {
    padding: 16px 20px;
  }

  .sensor-content {
    padding: 20px;
  }

  .status-overview {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .orientation-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .settings-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .phone-device {
    width: 100px;
    height: 160px;
  }

  .break-modal {
    padding: 24px;
    margin: 20px;
  }

  .break-title {
    font-size: 20px;
  }
}
</style>