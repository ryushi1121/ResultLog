<template>
  <div class="analytics-view">
    <div class="page-header">
      <h1 class="page-title">集計</h1>
      <p class="page-subtitle">期間・店舗別の収支確認</p>
    </div>

    <PeriodSelector />

    <!-- 期間累積収支サマリー -->
    <div class="period-summary card mb-4">
      <span class="summary-label">{{ periodLabel }}の累積収支</span>
      <span class="summary-amount" :class="profitClass">
        {{ formattedProfit }}円
      </span>
      <span class="summary-count">{{ summaryStats.count }}回</span>
    </div>

    <DailyTrendChart />

    <div class="analytics-grid">
      <MachineAnalytics />
      <WeekdayAnalytics />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useEntries } from '@/composables/useEntries';
import { useAnalytics } from '@/composables/useAnalytics';
import { formatProfit } from '@/utils/formatters';
import PeriodSelector from '@/components/analytics/PeriodSelector.vue';
import DailyTrendChart from '@/components/analytics/DailyTrendChart.vue';
import MachineAnalytics from '@/components/analytics/MachineAnalytics.vue';
import WeekdayAnalytics from '@/components/analytics/WeekdayAnalytics.vue';

const { isLoaded, loadEntries } = useEntries();
const { summaryStats, periodType, periodValue, selectedStore } = useAnalytics();

onMounted(() => {
  if (!isLoaded.value) loadEntries();
});

const periodLabel = computed(() => {
  let label = '';
  if (periodType.value === 'month' && periodValue.value) {
    const [y, m] = periodValue.value.split('-');
    label = `${y}年${parseInt(m)}月`;
  } else if (periodType.value === 'year' && periodValue.value) {
    label = `${periodValue.value}年`;
  } else {
    label = '全期間';
  }
  return selectedStore.value ? `${label} / ${selectedStore.value}` : label;
});

const formattedProfit = computed(() => formatProfit(summaryStats.value.totalProfit));
const profitClass = computed(() => {
  const p = summaryStats.value.totalProfit;
  if (p > 0) return 'text-success';
  if (p < 0) return 'text-danger';
  return '';
});
</script>

<style scoped>
.period-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  flex-wrap: wrap;
}
.summary-label {
  color: #aaa;
  font-size: 0.9rem;
}
.summary-amount {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.summary-count {
  color: #888;
  font-size: 0.85rem;
  margin-left: auto;
}
.analytics-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
@media (min-width: 1024px) {
  .analytics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
  .analytics-grid > *:nth-child(3) {
    grid-column: span 2;
  }
}
</style>
