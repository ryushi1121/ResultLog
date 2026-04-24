<template>
  <div class="quick-stats card">
    <h3 class="card-title">{{ title || '成績サマリー' }}</h3>
    
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">勝率</div>
        <div class="stat-value" :class="{ 'good': winRate >= 50 }">
          {{ isNaN(winRate) ? '-' : winRate + '%' }}
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">稼働日数</div>
        <div class="stat-value">{{ activeDays }} <span class="unit">日</span></div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">平均収支 / 日</div>
        <div class="stat-value profit" :class="getProfitClass(averageProfit)">
          {{ formatProfit(averageProfit) }}
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">最高勝ち額</div>
        <div class="stat-value positive">
          <span v-if="maxWin > 0">+{{ formatCurrency(maxWin) }}</span>
          <span v-else>-</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatCurrency, formatProfit } from '../../utils/formatters';

const props = defineProps({
  entries: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: '成績サマリー'
  }
});

const activeDays = computed(() => {
  // 1日に複数エントリがある場合も考慮してユニークな日付をカウント
  const dates = new Set(props.entries.map(e => e.date));
  return dates.size;
});

const winRate = computed(() => {
  if (props.entries.length === 0) return NaN;
  const wins = props.entries.filter(e => e.profit > 0).length;
  return Math.round((wins / props.entries.length) * 100);
});

const averageProfit = computed(() => {
  if (activeDays.value === 0) return 0;
  const totalProfit = props.entries.reduce((sum, e) => sum + e.profit, 0);
  return Math.round(totalProfit / activeDays.value);
});

const maxWin = computed(() => {
  if (props.entries.length === 0) return 0;
  return Math.max(...props.entries.map(e => e.profit));
});

const getProfitClass = (profit) => {
  if (profit > 0) return 'positive';
  if (profit < 0) return 'negative';
  return 'zero';
};
</script>

<style scoped>
.card {
  background-color: var(--bg-card-color, #16213e);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
}

.card-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color, #ffffff);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #94a3b8;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  color: var(--text-color, #ffffff);
}

.unit {
  font-size: 1rem;
  font-weight: 500;
  color: #94a3b8;
}

.stat-value.good { color: var(--success-color, #22c55e); }
.stat-value.positive { color: var(--success-color, #22c55e); }
.stat-value.negative { color: var(--danger-color, #ef4444); }
.stat-value.zero { color: #94a3b8; }

@media (max-width: 480px) {
  .card {
    padding: 1rem;
  }
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
