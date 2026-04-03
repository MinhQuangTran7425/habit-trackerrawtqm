<template>
  <div class="camera-modal" v-if="show">
    <div class="camera-overlay" @click="close"></div>
    <div class="camera-content">
      <div class="camera-header">
        <h3>{{ title }}</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <div class="camera-body">
        <!-- Camera Preview with Filters -->
        <div v-if="stream && !photoTaken" class="camera-preview">
          <video
            ref="videoElement"
            autoplay
            playsinline
            class="camera-video"
            :style="{ filter: currentFilter }"
          ></video>

          <!-- Filter Controls -->
          <div class="filter-controls">
            <div class="filter-selector">
              <button
                v-for="filter in filters"
                :key="filter.id"
                @click="currentFilter = filter.value"
                class="filter-btn"
                :class="{ active: currentFilter === filter.value }"
              >
                <div class="filter-preview" :style="{ filter: filter.value }"></div>
                <span class="filter-name">{{ filter.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Photo Preview -->
        <div v-if="photoTaken" class="photo-preview">
          <img :src="photoData" alt="Captured photo" class="captured-photo" />
        </div>

        <!-- Camera Placeholder -->
        <div v-if="!stream && !photoTaken" class="camera-placeholder">
          <div class="camera-icon">📷</div>
          <p>Camera access needed</p>
          <button @click="startCamera" class="btn-primary">Enable Camera</button>
        </div>
      </div>

      <div class="camera-footer">
        <!-- Camera Controls -->
        <div v-if="!photoTaken" class="camera-controls">
          <button @click="switchCamera" class="switch-camera-btn" v-if="hasMultipleCameras">
            <span class="switch-icon">🔄</span>
          </button>
          <button @click="takePhoto" class="take-photo-btn" :disabled="!stream">
            <span class="capture-icon">📸</span>
          </button>
          <div class="camera-options">
            <label class="option-toggle">
              <input v-model="includeLocation" type="checkbox" />
              <span class="toggle-slider"></span>
              <span class="toggle-text">Include location</span>
            </label>
          </div>
        </div>

        <!-- Photo Actions -->
        <div v-else class="photo-actions">
          <button @click="retakePhoto" class="btn-secondary">
            <span class="btn-icon">🔄</span>
            Retake
          </button>
          <button @click="confirmPhoto" class="btn-primary">
            <span class="btn-icon">✓</span>
            Use Photo
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick } from 'vue';

interface Props {
  show: boolean;
  title?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'photo-taken', photo: string, includeLocation?: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Take a Photo'
});

const emit = defineEmits<Emits>();

const videoElement = ref<HTMLVideoElement>();
const canvasElement = ref<HTMLCanvasElement>();
const stream = ref<MediaStream | null>(null);
const photoTaken = ref(false);
const photoData = ref<string>('');
const currentFilter = ref('none');
const includeLocation = ref(true);
const hasMultipleCameras = ref(false);
const currentFacingMode = ref<'user' | 'environment'>('environment');

const filters = [
  { id: 'none', name: 'None', value: 'none' },
  { id: 'grayscale', name: 'B&W', value: 'grayscale(100%)' },
  { id: 'sepia', name: 'Sepia', value: 'sepia(100%)' },
  { id: 'brightness', name: 'Bright', value: 'brightness(1.2)' },
  { id: 'contrast', name: 'Contrast', value: 'contrast(1.2)' },
  { id: 'saturate', name: 'Vivid', value: 'saturate(1.5)' },
  { id: 'hue-rotate', name: 'Warm', value: 'hue-rotate(15deg)' },
  { id: 'blur', name: 'Soft', value: 'blur(0.5px)' },
  { id: 'vintage', name: 'Vintage', value: 'sepia(30%) contrast(1.1) brightness(1.1)' },
  { id: 'cool', name: 'Cool', value: 'hue-rotate(-15deg) saturate(1.3)' }
];

const checkMultipleCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    hasMultipleCameras.value = videoDevices.length > 1;
  } catch (error) {
    console.error('Error checking cameras:', error);
    hasMultipleCameras.value = false;
  }
};

const startCamera = async () => {
  try {
    // Check for multiple cameras first
    await checkMultipleCameras();

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: currentFacingMode.value,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });

    stream.value = mediaStream;

    await nextTick();

    if (videoElement.value) {
      videoElement.value.srcObject = mediaStream;

      // Wait for video to be ready
      await new Promise((resolve) => {
        if (videoElement.value) {
          videoElement.value.onloadedmetadata = resolve;
        }
      });
    }
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Unable to access camera. Please check permissions and try again.');
  }
};

const switchCamera = async () => {
  // Stop current stream
  stopCamera();

  // Switch facing mode
  currentFacingMode.value = currentFacingMode.value === 'environment' ? 'user' : 'environment';

  // Start camera with new facing mode
  await startCamera();
};

const takePhoto = async () => {
  if (!videoElement.value) return;

  const video = videoElement.value;

  // Wait for video to be ready
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    alert('Camera not ready. Please wait a moment and try again.');
    return;
  }

  try {
    // Create canvas if it doesn't exist
    let canvas: HTMLCanvasElement;
    if (canvasElement.value) {
      canvas = canvasElement.value;
    } else {
      canvas = document.createElement('canvas');
      canvasElement.value = canvas;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      alert('Unable to process photo. Please try again.');
      return;
    }

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Apply current filter to the canvas
    context.filter = currentFilter.value;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Reset filter
    context.filter = 'none';

    // Convert to base64 with high quality
    photoData.value = canvas.toDataURL('image/jpeg', 0.95);
    photoTaken.value = true;

  } catch (error) {
    console.error('Error taking photo:', error);
    alert('Failed to take photo. Please try again.');
  }
};

const retakePhoto = () => {
  photoTaken.value = false;
  photoData.value = '';
};

const confirmPhoto = () => {
  emit('photo-taken', photoData.value, includeLocation.value);
  close();
};

const close = () => {
  stopCamera();
  photoTaken.value = false;
  photoData.value = '';
  currentFilter.value = 'none';
  includeLocation.value = true;
  emit('close');
};

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop());
    stream.value = null;
  }
};

watch(() => props.show, async (newShow) => {
  if (newShow) {
    await startCamera();
  } else {
    stopCamera();
  }
});

onUnmounted(() => {
  stopCamera();
});
</script>

<style scoped>
.camera-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}

.camera-content {
  position: relative;
  background: var(--card-bg, #ffffff);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: var(--shadow-xl, 0 20px 60px rgba(0, 0, 0, 0.3));
  display: flex;
  flex-direction: column;
}

/* Header */
.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e1e5e9);
  background: var(--bg-primary, #ffffff);
}

.camera-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #2d3748);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted, #718096);
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-secondary, #f7fafc);
  color: var(--text-primary, #2d3748);
}

/* Body */
.camera-body {
  position: relative;
  flex: 1;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

/* Camera Preview */
.camera-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s ease;
}

/* Filter Controls */
.filter-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  padding: 0 20px;
}

.filter-selector {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.filter-selector::-webkit-scrollbar {
  display: none;
}

.filter-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.filter-btn.active {
  background: var(--primary, #667eea);
  border-color: rgba(255, 255, 255, 0.5);
}

.filter-preview {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
}

.filter-name {
  font-size: 10px;
  color: white;
  font-weight: 500;
  text-align: center;
}

/* Photo Preview */
.photo-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.captured-photo {
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
  box-shadow: var(--shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.3));
}

/* Camera Placeholder */
.camera-placeholder {
  text-align: center;
  padding: 40px;
  color: white;
}

.camera-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.camera-placeholder p {
  margin-bottom: 20px;
  font-size: 16px;
}

/* Footer */
.camera-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--border-color, #e1e5e9);
  background: var(--bg-primary, #ffffff);
}

/* Camera Controls */
.camera-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.switch-camera-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.switch-camera-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.switch-icon {
  font-size: 20px;
}

.take-photo-btn {
  background: var(--primary, #667eea);
  border: 4px solid white;
  border-radius: 50%;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.3));
}

.take-photo-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: var(--shadow-xl, 0 20px 60px rgba(0, 0, 0, 0.3));
}

.take-photo-btn:disabled {
  background: var(--text-muted, #a0aec0);
  cursor: not-allowed;
  transform: none;
}

.capture-icon {
  font-size: 24px;
}

.camera-options {
  display: flex;
  align-items: center;
}

/* Option Toggle */
.option-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary, #2d3748);
}

.option-toggle input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 36px;
  height: 20px;
  background: var(--border-color, #e1e5e9);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.option-toggle input:checked + .toggle-slider {
  background: var(--primary, #667eea);
}

.option-toggle input:checked + .toggle-slider::before {
  transform: translateX(16px);
}

.toggle-text {
  font-weight: 500;
}

/* Photo Actions */
.photo-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn-primary, .btn-secondary {
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  min-width: 100px;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary, #667eea), var(--primary-dark, #764ba2));
  color: white;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.15));
}

.btn-primary:disabled {
  background: var(--text-muted, #a0aec0);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: var(--bg-secondary, #f7fafc);
  color: var(--text-primary, #2d3748);
  border: 2px solid var(--border-color, #e1e5e9);
}

.btn-secondary:hover {
  background: var(--bg-primary, #ffffff);
  border-color: var(--primary, #667eea);
  color: var(--primary, #667eea);
}

.btn-icon {
  font-size: 16px;
}

/* Dark mode adjustments */
[data-theme="dark"] .camera-content {
  background: var(--card-bg-dark, #2d3748);
  border-color: var(--border-color-dark, #4a5568);
}

[data-theme="dark"] .camera-header {
  background: var(--bg-primary-dark, #1a202c);
  border-color: var(--border-color-dark, #4a5568);
}

[data-theme="dark"] .camera-header h3 {
  color: var(--text-primary-dark, #e2e8f0);
}

[data-theme="dark"] .close-btn {
  color: var(--text-muted-dark, #a0aec0);
}

[data-theme="dark"] .close-btn:hover {
  background: var(--bg-secondary-dark, #2d3748);
  color: var(--text-primary-dark, #e2e8f0);
}

[data-theme="dark"] .camera-footer {
  background: var(--bg-primary-dark, #1a202c);
  border-color: var(--border-color-dark, #4a5568);
}

[data-theme="dark"] .btn-secondary {
  background: var(--bg-secondary-dark, #2d3748);
  border-color: var(--border-color-dark, #4a5568);
  color: var(--text-primary-dark, #e2e8f0);
}

[data-theme="dark"] .btn-secondary:hover {
  background: var(--bg-primary-dark, #1a202c);
  border-color: var(--primary, #667eea);
}

[data-theme="dark"] .option-toggle {
  color: var(--text-primary-dark, #e2e8f0);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .camera-modal {
    padding: 10px;
  }

  .camera-content {
    max-height: 95vh;
    border-radius: 16px;
  }

  .camera-header {
    padding: 16px 20px;
  }

  .camera-header h3 {
    font-size: 16px;
  }

  .camera-body {
    min-height: 250px;
  }

  .filter-controls {
    bottom: 16px;
    padding: 0 16px;
  }

  .filter-selector {
    padding: 8px;
    gap: 6px;
  }

  .filter-btn {
    min-width: 50px;
    padding: 6px;
  }

  .filter-preview {
    width: 28px;
    height: 28px;
  }

  .filter-name {
    font-size: 9px;
  }

  .camera-footer {
    padding: 16px 20px;
  }

  .camera-controls {
    gap: 12px;
  }

  .take-photo-btn {
    width: 60px;
    height: 60px;
  }

  .switch-camera-btn {
    width: 44px;
    height: 44px;
  }

  .switch-icon, .capture-icon {
    font-size: 18px;
  }

  .photo-actions {
    gap: 8px;
  }

  .btn-primary, .btn-secondary {
    padding: 10px 16px;
    font-size: 13px;
    min-width: 80px;
  }
}
</style>