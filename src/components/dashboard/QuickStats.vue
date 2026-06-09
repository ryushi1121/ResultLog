<template>
  <div class="quick-stats card">
    <div class="card-header">
      <h3 class="card-title">{{ title || '成績サマリー' }}</h3>
      <router-link :to="chartsLink" class="card-link">分析を見る <i class="fa-solid fa-arrow-right"></i></router-link>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">日別勝率</div>
        <div class="stat-value" :class="{ 'good': dayWinRate >= 50 }">
          {{ isNaN(dayWinRate) ? '-' : dayWinRate + '%' }}
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
  },
  chartsLink: {
    type: [String, Object],
    default: '/charts'
  }
});

const activeDays = computed(() => {
  // 1日に複数エントリがある場合も考慮してユニークな日付をカウント
  const dates = new Set(props.entries.map(e => e.date));
  return dates.size;
});

const dayWinRate = computed(() => {
  const dayMap = {};
  props.entries.forEach(e => {
    if (!dayMap[e.date]) dayMap[e.date] = 0;
    dayMap[e.date] += e.profit;
  });
  const days = Object.values(dayMap);
  if (days.length === 0) return NaN;
  const winDays = days.filter(p => p > 0).length;
  return Math.round((winDays / days.length) * 100);
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
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color, #ffffff);
}

.card-link {
  font-size: 0.85rem;
  color: var(--primary-color, #00d4ff);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.card-link:hover {
  opacity: 0.8;
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
  color: var(--text-sub);
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
  color: var(--text-sub);
}

.stat-value.good { color: var(--success-color, #22c55e); }
.stat-value.positive { color: var(--success-color, #22c55e); }
.stat-value.negative { color: var(--danger-color, #ef4444); }
.stat-value.zero { color: var(--text-sub); }

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
