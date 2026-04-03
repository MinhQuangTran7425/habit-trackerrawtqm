<template>
  <div class="location-modal" v-if="show">
    <div class="location-overlay" @click="close"></div>
    <div class="location-content">
      <div class="location-header">
        <h3>Check In Location</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <div class="location-body">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Getting your location...</p>
        </div>

        <div v-else-if="location" class="location-info">
          <div class="location-icon">📍</div>
          <div class="location-details">
            <h4>{{ location.name || 'Current Location' }}</h4>
            <p>{{ location.latitude.toFixed(6) }}, {{ location.longitude.toFixed(6) }}</p>
            <p v-if="location.name" class="location-type">Tourist Spot</p>
          </div>
        </div>

        <div v-else class="location-error">
          <div class="error-icon">⚠️</div>
          <p>{{ error }}</p>
          <button @click="getLocation" class="btn-primary">Try Again</button>
        </div>
      </div>

      <div class="location-footer">
        <button @click="close" class="btn-secondary">Cancel</button>
        <button
          v-if="location"
          @click="confirmLocation"
          class="btn-primary"
        >
          Check In Here
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  show: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'location-checked-in', location: { latitude: number; longitude: number; name?: string }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);
const location = ref<{ latitude: number; longitude: number; name?: string } | null>(null);
const error = ref('');

const getLocation = () => {
  if (!navigator.geolocation) {
    error.value = 'Geolocation is not supported by this browser.';
    return;
  }

  loading.value = true;
  error.value = '';
  location.value = null;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      // Try to get place name using reverse geocoding (simplified)
      // In a real app, you'd use a geocoding service like Google Maps API
      const placeName = await getPlaceName(latitude, longitude);

      location.value = {
        latitude,
        longitude,
        name: placeName
      };
      loading.value = false;
    },
    (err) => {
      loading.value = false;
      switch (err.code) {
        case err.PERMISSION_DENIED:
          error.value = 'Location access denied. Please enable location permissions.';
          break;
        case err.POSITION_UNAVAILABLE:
          error.value = 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          error.value = 'Location request timed out.';
          break;
        default:
          error.value = 'An unknown error occurred.';
          break;
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    }
  );
};

const getPlaceName = async (lat: number, lon: number): Promise<string | undefined> => {
  // This is a simplified version. In production, use a proper geocoding API
  // For demo purposes, we'll simulate some tourist spots
  const touristSpots = [
    { name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945, radius: 0.01 },
    { name: 'Times Square', lat: 40.7580, lon: -73.9855, radius: 0.01 },
    { name: 'Central Park', lat: 40.7829, lon: -73.9654, radius: 0.02 },
    { name: 'Golden Gate Bridge', lat: 37.8199, lon: -122.4783, radius: 0.01 },
    { name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445, radius: 0.005 },
  ];

  for (const spot of touristSpots) {
    const distance = Math.sqrt(
      Math.pow(lat - spot.lat, 2) + Math.pow(lon - spot.lon, 2)
    );
    if (distance <= spot.radius) {
      return spot.name;
    }
  }

  return undefined;
};

const confirmLocation = () => {
  if (location.value) {
    emit('location-checked-in', location.value);
    close();
  }
};

const close = () => {
  loading.value = false;
  location.value = null;
  error.value = '';
  emit('close');
};

// Auto-get location when modal opens
watch(() => props.show, (newShow) => {
  if (newShow) {
    getLocation();
  }
});
</script>

<style scoped>
.location-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
}

.location-content {
  position: relative;
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.location-header h3 {
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

.location-body {
  padding: 30px 20px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.location-info {
  text-align: center;
}

.location-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.location-details h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.location-details p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.location-type {
  color: #007bff !important;
  font-weight: bold;
}

.location-error {
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.location-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}
</style>