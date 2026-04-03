<template>
  <div class="ai-assistant-container">
    <div class="ai-header" @click="toggleExpanded">
      <div class="header-content">
        <div class="ai-icon">🤖</div>
        <div class="header-text">
          <h3 class="ai-title">AI Habit Assistant</h3>
          <p class="ai-subtitle">Get personalized habit advice and motivation</p>
        </div>
      </div>
      <button class="expand-toggle" :class="{ expanded: expanded }">
        <span class="toggle-icon">{{ expanded ? '−' : '+' }}</span>
      </button>
    </div>

    <div v-if="expanded" class="ai-content">
      <!-- Messages Container -->
      <div class="messages-container" ref="messagesContainer">
        <div class="messages-list">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message-item', message.type]"
          >
            <div class="message-avatar">
              <span v-if="message.type === 'ai'" class="avatar-icon ai">🤖</span>
              <span v-else class="avatar-icon user">👤</span>
            </div>
            <div class="message-bubble">
              <div class="message-text">{{ message.text }}</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="message-item ai typing">
            <div class="message-avatar">
              <span class="avatar-icon ai">🤖</span>
            </div>
            <div class="message-bubble">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="quick-suggestions">
          <button
            v-for="suggestion in quickSuggestions"
            :key="suggestion"
            @click="sendQuickMessage(suggestion)"
            class="suggestion-chip"
            :disabled="isTyping"
          >
            <span class="chip-icon">{{ getSuggestionIcon(suggestion) }}</span>
            {{ suggestion }}
          </button>
        </div>

        <div class="input-container">
          <input
            v-model="userInput"
            @keypress.enter="sendMessage"
            placeholder="Ask me anything about habits..."
            class="message-input"
            :disabled="isTyping"
            ref="messageInput"
          />
          <button
            @click="sendMessage"
            class="send-button"
            :disabled="!userInput.trim() || isTyping"
          >
            <span class="send-icon">{{ isTyping ? '⏳' : '📤' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useHabits } from '../composables/useHabits';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const { habits, getHabitStats } = useHabits();

const expanded = ref(false);
const userInput = ref('');
const messages = ref<Message[]>([]);
const isTyping = ref(false);
const messagesContainer = ref<HTMLElement>();
const messageInput = ref<HTMLInputElement>();

const quickSuggestions = [
  'Suggest a new habit for me',
  'How can I stay motivated?',
  'Analyze my habits',
  'Give me a challenge'
];

const toggleExpanded = () => {
  expanded.value = !expanded.value;
  if (expanded.value) {
    nextTick(() => {
      scrollToBottom();
      messageInput.value?.focus();
    });
  }
};

const sendMessage = async () => {
  if (!userInput.value.trim() || isTyping.value) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    text: userInput.value.trim(),
    timestamp: new Date()
  };

  messages.value.push(userMessage);
  const input = userInput.value;
  userInput.value = '';
  isTyping.value = true;

  nextTick(() => scrollToBottom());

  // Simulate AI response delay
  setTimeout(() => {
    const aiResponse = generateAIResponse(input);
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      text: aiResponse,
      timestamp: new Date()
    };
    messages.value.push(aiMessage);
    isTyping.value = false;
    nextTick(() => scrollToBottom());
  }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5s
};

const sendQuickMessage = (suggestion: string) => {
  if (isTyping.value) return;
  userInput.value = suggestion;
  sendMessage();
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getSuggestionIcon = (suggestion: string): string => {
  const icons: { [key: string]: string } = {
    'Suggest a new habit for me': '💡',
    'How can I stay motivated?': '🔥',
    'Analyze my habits': '📊',
    'Give me a challenge': '🏆'
  };
  return icons[suggestion] || '💭';
};

const generateAIResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('suggest') && lowerInput.includes('habit')) {
    const suggestions = [
      'Try "Drink 8 glasses of water daily" - staying hydrated improves focus and energy! 💧',
      'How about "Read for 20 minutes before bed" - it can improve sleep quality and knowledge. 📚',
      'Consider "Take a 10-minute walk daily" - great for both physical and mental health. 🚶',
      'Try "Practice gratitude journaling" - writing down 3 things you\'re thankful for each day. 🙏',
      'How about "Learn one new word daily" - expands vocabulary and keeps your mind sharp. 🧠'
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  if (lowerInput.includes('motivat')) {
    const motivations = [
      'Remember: Every expert was once a beginner. Your consistency today builds the expert of tomorrow! 🌟',
      'Small daily improvements compound into remarkable results. Keep going! 📈',
      'You\'re building habits that will serve you for life. That\'s incredibly valuable! 💎',
      'Progress might be slow, but it\'s happening. Celebrate the small wins along the way. 🎉',
      'Your future self will thank you for the discipline you\'re showing today. 🙌'
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  if (lowerInput.includes('analyze') || lowerInput.includes('habits')) {
    if (habits.value.length === 0) {
      return 'You haven\'t created any habits yet! Start with something simple and achievable. 🌱';
    }

    const totalHabits = habits.value.length;
    const completedToday = habits.value.filter(h =>
      h.checkIns.some(c => c.date.toDateString() === new Date().toDateString())
    ).length;

    const avgCompletion = habits.value.reduce((sum, h) => sum + getHabitStats(h).completionRate, 0) / totalHabits;

    return `You have ${totalHabits} habits. Today you've completed ${completedToday} of them. Your average completion rate is ${avgCompletion.toFixed(1)}%. ${
      avgCompletion > 80 ? 'Excellent work! You\'re highly consistent. 🏆' :
      avgCompletion > 60 ? 'Good progress! Keep building momentum. 📊' :
      'You\'re building good habits. Focus on consistency over perfection. 💪'
    }`;
  }

  if (lowerInput.includes('challenge')) {
    const challenges = [
      '30-day challenge: Try a new healthy recipe each day for a month! 🥗',
      'Weekend warrior: Complete all your habits for 3 weekends in a row. 🏃',
      'Streak master: Try to maintain a 7-day streak on your most challenging habit. 🔥',
      'Social challenge: Share your progress with a friend and motivate each other. 👫',
      'Mindfulness challenge: Add 5 minutes of meditation to your daily routine. 🧘'
    ];
    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  // Default responses
  const defaults = [
    'I\'m here to help you build better habits! What would you like to know? 🤔',
    'Consistency is key in habit formation. What habits are you working on? 🔑',
    'Remember, it takes about 66 days to form a new habit. You\'re on the right path! 🛤️',
    'Small changes lead to big results. What\'s one habit you\'d like to improve? 📈',
    'You\'ve got this! Building habits is a journey, not a destination. 🚀'
  ];

  return defaults[Math.floor(Math.random() * defaults.length)];
};

onMounted(() => {
  // Add welcome message
  const welcomeMessage: Message = {
    id: 'welcome',
    type: 'ai',
    text: 'Hi! I\'m your AI habit assistant. I can suggest new habits, provide motivation, analyze your progress, or give you challenges. What would you like help with? 🤖',
    timestamp: new Date()
  };
  messages.value.push(welcomeMessage);
});
</script>

<style scoped>
.ai-assistant-container {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 16px;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
  overflow: hidden;
  transition: all 0.3s ease;
}

.ai-assistant-container:hover {
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.15));
}

/* Header */
.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--primary-light, #667eea) 0%, var(--primary, #764ba2) 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ai-header:hover {
  background: linear-gradient(135deg, var(--primary, #764ba2) 0%, var(--primary-dark, #667eea) 100%);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ai-icon {
  font-size: 32px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ai-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.ai-subtitle {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.8);
}

.expand-toggle {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.expand-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.expand-toggle.expanded {
  background: rgba(255, 255, 255, 0.3);
}

.toggle-icon {
  font-size: 20px;
  font-weight: bold;
  color: white;
}

/* Content */
.ai-content {
  padding: 24px;
  background: var(--bg-primary, #ffffff);
}

/* Messages */
.messages-container {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color, #e1e5e9) transparent;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--border-color, #e1e5e9);
  border-radius: 3px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 100%;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.avatar-icon.ai {
  background: linear-gradient(135deg, var(--primary-light, #667eea), var(--primary, #764ba2));
  color: white;
}

.avatar-icon.user {
  background: linear-gradient(135deg, var(--secondary, #f093fb), var(--secondary-dark, #f5576c));
  color: white;
}

.message-bubble {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-item.user .message-bubble {
  align-items: flex-end;
}

.message-text {
  background: var(--message-bg, #f8f9fa);
  color: var(--text-primary, #2d3748);
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.message-item.user .message-text {
  background: linear-gradient(135deg, var(--primary, #667eea), var(--primary-dark, #764ba2));
  color: white;
}

.message-item.ai .message-text {
  background: var(--bg-secondary, #f7fafc);
  border: 1px solid var(--border-color, #e1e5e9);
}

.message-time {
  font-size: 11px;
  color: var(--text-muted, #718096);
  padding: 0 4px;
}

/* Typing Indicator */
.typing .message-bubble {
  align-items: flex-start;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--bg-secondary, #f7fafc);
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 18px;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary, #667eea);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* Input Area */
.input-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-chip {
  background: var(--bg-secondary, #f7fafc);
  border: 1px solid var(--border-color, #e1e5e9);
  color: var(--text-primary, #2d3748);
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.suggestion-chip:hover:not(:disabled) {
  background: var(--primary-light, #e8f2ff);
  border-color: var(--primary, #667eea);
  color: var(--primary, #667eea);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.suggestion-chip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chip-icon {
  font-size: 14px;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--border-color, #e1e5e9);
  border-radius: 24px;
  font-size: 14px;
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #2d3748);
  transition: all 0.2s ease;
  outline: none;
}

.message-input:focus {
  border-color: var(--primary, #667eea);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.message-input:disabled {
  background: var(--bg-secondary, #f7fafc);
  cursor: not-allowed;
}

.send-button {
  background: linear-gradient(135deg, var(--primary, #667eea), var(--primary-dark, #764ba2));
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.send-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.15));
}

.send-button:disabled {
  background: var(--text-muted, #a0aec0);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.send-icon {
  font-size: 18px;
}

/* Dark mode adjustments */
[data-theme="dark"] .ai-assistant-container {
  background: var(--card-bg-dark, #2d3748);
  border-color: var(--border-color-dark, #4a5568);
}

[data-theme="dark"] .ai-content {
  background: var(--bg-primary-dark, #1a202c);
}

[data-theme="dark"] .message-text {
  background: var(--message-bg-dark, #4a5568);
  color: var(--text-primary-dark, #e2e8f0);
}

[data-theme="dark"] .message-item.ai .message-text {
  background: var(--bg-secondary-dark, #2d3748);
  border-color: var(--border-color-dark, #4a5568);
}

[data-theme="dark"] .message-time {
  color: var(--text-muted-dark, #a0aec0);
}

[data-theme="dark"] .suggestion-chip {
  background: var(--bg-secondary-dark, #2d3748);
  border-color: var(--border-color-dark, #4a5568);
  color: var(--text-primary-dark, #e2e8f0);
}

[data-theme="dark"] .suggestion-chip:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.1);
  border-color: var(--primary, #667eea);
}

[data-theme="dark"] .message-input {
  background: var(--bg-primary-dark, #1a202c);
  border-color: var(--border-color-dark, #4a5568);
  color: var(--text-primary-dark, #e2e8f0);
}

[data-theme="dark"] .message-input:disabled {
  background: var(--bg-secondary-dark, #2d3748);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .ai-header {
    padding: 16px 20px;
  }

  .ai-content {
    padding: 20px;
  }

  .messages-container {
    max-height: 300px;
  }

  .message-bubble {
    max-width: 85%;
  }

  .quick-suggestions {
    gap: 6px;
  }

  .suggestion-chip {
    padding: 6px 10px;
    font-size: 12px;
  }

  .input-container {
    gap: 8px;
  }

  .message-input {
    padding: 10px 14px;
    font-size: 16px; /* Prevents zoom on iOS */
  }

  .send-button {
    width: 40px;
    height: 40px;
  }
}
</style>