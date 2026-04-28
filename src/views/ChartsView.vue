<template>
  <div class="charts-view">
    <div class="page-header">
      <h1 class="page-title">分析</h1>
      <p class="page-subtitle">収支の傾向・パターンを読む</p>
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

    <div class="charts-grid">
      <TrendChart />
      <DateSlotAnalytics />
      <SpecialDateAnalytics />
      <StoreChart v-if="selectedStore === ''" />
      <MachineChart />
      <WeekdayChart />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useEntries } from '@/composables/useEntries';
import { useAnalytics } from '@/composables/useAnalytics';
import { formatProfit } from '@/utils/formatters';
import PeriodSelector from '@/components/analytics/PeriodSelector.vue';
import TrendChart from '@/components/charts/TrendChart.vue';
import StoreChart from '@/components/charts/StoreChart.vue';
import MachineChart from '@/components/charts/MachineChart.vue';
import WeekdayChart from '@/components/charts/WeekdayChart.vue';
import DateSlotAnalytics from '@/components/analytics/DateSlotAnalytics.vue';
import SpecialDateAnalytics from '@/components/analytics/SpecialDateAnalytics.vue';

const { isLoaded, loadEntries } = useEntries();
const { selectedMachine, selectedStore, summaryStats, periodType, periodValue } = useAnalytics();


onMounted(() => {
  if (!isLoaded.value) loadEntries();
  selectedMachine.value = null;
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
.charts-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
@media (min-width: 1024px) {
  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
  .charts-grid > *:first-child {
    grid-column: span 2;
  }
}
</style>
