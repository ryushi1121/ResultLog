<template>
  <div class="charts-view">
    <div class="page-header">
      <h1 class="page-title">グラフ</h1>
      <p class="page-subtitle">収支をグラフで可視化</p>
    </div>
    
    <PeriodSelector />
    
    <div class="charts-grid">
      <TrendChart />
      <StoreChart />
      <MachineChart />
      <WeekdayChart />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useEntries } from '@/composables/useEntries';
import PeriodSelector from '@/components/analytics/PeriodSelector.vue';
import TrendChart from '@/components/charts/TrendChart.vue';
import StoreChart from '@/components/charts/StoreChart.vue';
import MachineChart from '@/components/charts/MachineChart.vue';
import WeekdayChart from '@/components/charts/WeekdayChart.vue';

const { isLoaded, loadEntries } = useEntries();

onMounted(() => {
  if (!isLoaded.value) {
    loadEntries();
  }
});
</script>

<style scoped>
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
