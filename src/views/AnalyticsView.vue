<template>
  <div class="analytics-view">
    <div class="page-header">
      <h1 class="page-title">集計・分析</h1>
      <p class="page-subtitle">店舗別・機種別・曜日別の集計</p>
    </div>
    
    <PeriodSelector />
    
    <div class="analytics-grid">
      <StoreAnalytics />
      <MachineAnalytics />
      <WeekdayAnalytics />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useEntries } from '@/composables/useEntries';
import PeriodSelector from '@/components/analytics/PeriodSelector.vue';
import StoreAnalytics from '@/components/analytics/StoreAnalytics.vue';
import MachineAnalytics from '@/components/analytics/MachineAnalytics.vue';
import WeekdayAnalytics from '@/components/analytics/WeekdayAnalytics.vue';

const { isLoaded, loadEntries } = useEntries();

onMounted(() => {
  if (!isLoaded.value) {
    loadEntries();
  }
});
</script>

<style scoped>
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
