<template>
  <div class="summary-card">
    <div class="summary-header">
      <h3 class="summary-title">{{ title }}</h3>
      <div class="summary-icon">
        <slot name="icon"></slot>
      </div>
    </div>
    <div class="summary-content" :class="{ 'positive': isProfit && amount > 0, 'negative': isProfit && amount < 0 }">
      <span class="currency-symbol">¥</span>
      <span class="amount">{{ formattedAmount }}</span>
    </div>
    <div v-if="subtitle" class="summary-footer">
      {{ subtitle }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatCurrency } from '../../utils/formatters';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  isProfit: {
    type: Boolean,
    default: false
  }
});

const formattedAmount = computed(() => {
  return formatCurrency(props.isProfit ? Math.abs(props.amount) : props.amount);
});
</script>

<style scoped>
.summary-card {
  background-color: var(--bg-card-color, #16213e);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-title {
  color: #94a3b8;
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0;
}

.summary-icon {
  color: var(--primary-color, #00d4ff);
  font-size: 1.2rem;
  opacity: 0.8;
}

.summary-content {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  font-family: 'Inter', sans-serif;
  color: var(--text-color, #ffffff);
}

.currency-symbol {
  font-size: 1.2rem;
  font-weight: 500;
  opacity: 0.7;
}

.amount {
  font-size: 2rem;
  font-weight: 700;
}

.summary-content.positive {
  color: var(--success-color, #22c55e);
}
.summary-content.positive::before {
  content: '+';
  font-size: 1.5rem;
  font-weight: 600;
}

.summary-content.negative {
  color: var(--danger-color, #ef4444);
}
.summary-content.negative::before {
  content: '-';
  font-size: 1.5rem;
  font-weight: 600;
}

.summary-footer {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: auto;
}

@media (max-width: 480px) {
  .summary-card {
    padding: 1rem;
  }
}
</style>
