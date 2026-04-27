<template>
  <div class="period-selector card mb-4">
    <div class="selector-row">
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

    <div class="selector-row store-row">
      <label class="store-label">店舗</label>
      <select v-model="selectedStore" class="store-select">
        <option value="">全店舗</option>
        <option v-for="store in availableStores" :key="store" :value="store">
          {{ store }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAnalytics } from '@/composables/useAnalytics';
import { useEntries } from '@/composables/useEntries';

const { periodType, periodValue, selectedStore, availableStores } = useAnalytics();
const { entries } = useEntries();

const availableYears = computed(() => {
  const years = new Set();
  entries.value.forEach(e => {
    if (e.date) years.add(e.date.substring(0, 4));
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
  flex-direction: column;
  gap: 12px;
  padding: 15px 20px;
}
.selector-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
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
  background: #1a1a2e;
  color: #fff;
  color-scheme: dark;
  font-size: 0.95rem;
  outline: none;
}
.period-inputs input:focus,
.period-inputs select:focus {
  border-color: var(--color-primary, #00d4ff);
}
.period-inputs select option {
  background: #1a1a2e;
  color: #fff;
}
.period-inputs input[type="month"]::-webkit-calendar-picker-indicator,
.period-inputs input[type="number"]::-webkit-inner-spin-button {
  filter: brightness(0) invert(1);
  cursor: pointer;
  opacity: 0.8;
}
.store-row {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 10px;
}
.store-label {
  font-size: 0.85rem;
  color: #aaa;
  white-space: nowrap;
}
.store-select {
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #1a1a2e;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  min-width: 160px;
}
.store-select:focus {
  border-color: var(--color-primary, #00d4ff);
}
.store-select option {
  background: #1a1a2e;
  color: #fff;
}
</style>
