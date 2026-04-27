<template>
  <div class="analytics-card card mb-4">
    <div class="section-header">
      <h3>店舗別集計</h3>
      <button v-if="selectedStore" class="clear-btn" @click="setSelectedStore(selectedStore)">
        {{ selectedStore }} ✕
      </button>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>店舗名</th>
            <th class="text-right">回数</th>
            <th class="text-right">勝率</th>
            <th class="text-right">収支</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="stat in storeStats"
            :key="stat.name"
            class="clickable-row"
            :class="{ 'row-selected': selectedStore === stat.name }"
            @click="setSelectedStore(stat.name)"
          >
            <td>{{ stat.name }}</td>
            <td class="text-right">{{ stat.count }}</td>
            <td class="text-right">{{ stat.winRate.toFixed(1) }}%</td>
            <td class="text-right font-weight-bold" :class="getProfitClass(stat.profit)">
              {{ formatCurrency(stat.profit) }}
            </td>
          </tr>
          <tr v-if="storeStats.length === 0">
            <td colspan="4" class="text-center text-muted">データがありません</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useAnalytics } from '@/composables/useAnalytics';
import { formatCurrency } from '@/utils/formatters';

const { storeStats, selectedStore, setSelectedStore } = useAnalytics();

const getProfitClass = (val) => {
  if (val > 0) return 'text-success';
  if (val < 0) return 'text-danger';
  return '';
};
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-header h3 {
  margin: 0;
}
.clear-btn {
  font-size: 0.8rem;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 212, 255, 0.5);
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
  cursor: pointer;
  white-space: nowrap;
}
.clear-btn:hover {
  background: rgba(0, 212, 255, 0.2);
}
.clickable-row {
  cursor: pointer;
  transition: background 0.15s;
}
.clickable-row:hover {
  background: rgba(255, 255, 255, 0.04);
}
.row-selected {
  background: rgba(0, 212, 255, 0.1) !important;
  border-left: 3px solid #00d4ff;
}
</style>
