<template>
  <div class="period-selector card mb-4">
    <div class="period-tabs">
      <button 
        :class="{ active: periodType === 'all' }" 
        @click="setPeriod('all')"
      >全期間</button>
      <button 
        :class="{ active: periodType === 'year' }" 
        @click="setPeriod('year')"
      >年別</button>
      <button 
        :class="{ active: periodType === 'month' }" 
        @click="setPeriod('month')"
      >月別</button>
    </div>
    
    <div class="period-inputs" v-if="periodType !== 'all'">
      <input 
        v-if="periodType === 'month'" 
        type="month" 
        v-model="periodValue"
      >
      <select 
        v-if="periodType === 'year'" 
        v-model="periodValue"
      >
        <option v-for="year in availableYears" :key="year" :value="year">
          {{ year }}年
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAnalytics } from '@/composables/useAnalytics';
import { useEntries } from '@/composables/useEntries';

const { periodType, periodValue } = useAnalytics();
const { entries } = useEntries();

const availableYears = computed(() => {
  const years = new Set();
  entries.value.forEach(e => {
    if (e.date) {
      years.add(e.date.substring(0, 4));
    }
  });
  const yearsArr = Array.from(years).sort().reverse();
  return yearsArr.length > 0 ? yearsArr : [new Date().getFullYear().toString()];
});

const setPeriod = (type) => {
  periodType.value = type;
  if (type === 'month') {
    periodValue.value = new Date().toISOString().substring(0, 7);
  } else if (type === 'year') {
    periodValue.value = availableYears.value[0];
  } else {
    periodValue.value = null;
  }
};

onMounted(() => {
  if (periodType.value === 'month' && !periodValue.value) {
    periodValue.value = new Date().toISOString().substring(0, 7);
  } else if (periodType.value === 'year' && !periodValue.value) {
    periodValue.value = availableYears.value[0];
  }
});
</script>

<style scoped>
.period-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  padding: 15px 20px;
}
.period-tabs {
  display: flex;
  gap: 10px;
}
.period-tabs button {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}
.period-tabs button:hover {
  background: rgba(255, 255, 255, 0.05);
}
.period-tabs button.active {
  background: var(--color-primary, #00d4ff);
  color: #0f0f1a;
  border-color: var(--color-primary, #00d4ff);
  font-weight: bold;
}
.period-inputs input,
.period-inputs select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
  color: white;
  color-scheme: dark;
  font-size: 0.95rem;
  outline: none;
}
.period-inputs input:focus,
.period-inputs select:focus {
  border-color: var(--color-primary, #00d4ff);
}
</style>
