<template>
  <div class="toast-stack" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
        @click="dismissToast(toast.id)"
      >
        <i :class="iconOf(toast.type)"></i>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" aria-label="閉じる">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast';

const { toasts, dismissToast } = useToast();

const iconOf = (type) => ({
  error: 'fa-solid fa-circle-exclamation',
  success: 'fa-solid fa-circle-check',
  info: 'fa-solid fa-circle-info'
}[type] || 'fa-solid fa-circle-info');
</script>

<style scoped>
.toast-stack {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* スタック自体はクリックを透過させ、トーストだけ拾う */
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  max-width: min(90vw, 26rem);
  padding: 0.75rem 1rem;
  border-radius: 0.6rem;
  background: var(--bg-card-color, #16213e);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-md, 0 6px 20px rgba(0, 0, 0, 0.35));
  color: var(--text-color, #ffffff);
  font-size: 0.88rem;
  cursor: pointer;
}

.toast--error   { border-left: 3px solid var(--danger-color, #ef4444); }
.toast--success { border-left: 3px solid var(--success-color, #22c55e); }
.toast--info    { border-left: 3px solid var(--primary-color, #00d4ff); }

.toast--error i   { color: var(--danger-color, #ef4444); }
.toast--success i { color: var(--success-color, #22c55e); }
.toast--info i    { color: var(--primary-color, #00d4ff); }

.toast-message {
  flex: 1;
  overflow-wrap: anywhere;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-faded);
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

@media (max-width: 640px) {
  .toast-stack {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }

  .toast {
    max-width: none;
  }
}
</style>
