<template>
  <div class="recent-history card">
    <div class="card-header">
      <h3 class="card-title">直近の履歴</h3>
      <router-link to="/list" class="view-all">すべて見る</router-link>
    </div>
    
    <div class="history-list" v-if="entries.length > 0">
      <div v-for="entry in recentEntries" :key="entry.id" class="history-item">
        <div class="item-date">
          <span class="day">{{ formatDateDisplay(entry.date) }}</span>
          <span class="dow">{{ entry.dayOfWeek }}</span>
        </div>
        
        <div class="item-details">
          <div class="store-info">{{ entry.store }}</div>
          <div class="machine-info" v-if="entry.machine">{{ entry.machine }}</div>
        </div>
        
        <div class="item-profit" :class="getProfitClass(entry.profit)">
          {{ formatProfit(entry.profit) }}
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <p>履歴がありません</p>
      <router-link to="/entry" class="btn btn-outline">収支を登録する</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatProfit } from '../../utils/formatters';

const props = defineProps({
  entries: {
    type: Array,
    required: true
  },
  limit: {
    type: Number,
    default: 5
  }
});

const recentEntries = computed(() => {
  return props.entries.slice(0, props.limit);
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
  display: flex;
  flex-direction: column;
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

.view-all {
  color: var(--primary-color, #00d4ff);
  font-size: 0.9rem;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.view-all:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: rgba(15, 15, 26, 0.4);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.03);
  transition: background-color 0.2s ease;
}

.history-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.item-date {
  display: flex;
  flex-direction: column;
  min-width: 80px;
  color: #94a3b8;
}

.item-date .day {
  font-size: 0.85rem;
}

.item-date .dow {
  font-size: 0.75rem;
  opacity: 0.8;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-right: 1rem;
  overflow: hidden;
}

.store-info {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.machine-info {
  font-size: 0.85rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-profit {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  min-width: 90px;
  text-align: right;
}

.item-profit.positive { color: var(--success-color, #22c55e); }
.item-profit.negative { color: var(--danger-color, #ef4444); }
.item-profit.zero { color: #94a3b8; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: #64748b;
  gap: 1rem;
}

.btn-outline {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  color: var(--primary-color, #00d4ff);
  border: 1px solid var(--primary-color, #00d4ff);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background-color: rgba(0, 212, 255, 0.1);
}

@media (max-width: 480px) {
  .card {
    padding: 1rem;
  }
  .history-item {
    padding: 0.75rem;
  }
  .item-date {
    min-width: 65px;
  }
  .item-profit {
    min-width: 75px;
    font-size: 1rem;
  }
  .item-details {
    margin-right: 0.5rem;
  }
}
</style>
