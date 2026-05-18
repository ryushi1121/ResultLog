<template>
  <div class="filter-panel card">
    <!-- 期間行 -->
    <div class="selector-row">
      <div class="period-tabs">
        <button :class="{ active: filters.periodType === 'all' }" @click="setPeriod('all')">全期間</button>
        <button :class="{ active: filters.periodType === 'year' }" @click="setPeriod('year')">年別</button>
        <button :class="{ active: filters.periodType === 'month' }" @click="setPeriod('month')">月別</button>
      </div>
      <input
        v-if="filters.periodType === 'month'"
        type="month"
        v-model="filters.periodValue"
        class="period-input"
      />
      <select
        v-else-if="filters.periodType === 'year'"
        v-model="filters.periodValue"
        class="period-input"
      >
        <option v-for="year in availableYears" :key="year" :value="year">{{ year }}年</option>
      </select>
    </div>

    <!-- 店舗行 -->
    <div class="selector-row sub-row">
      <label class="row-label">店舗</label>
      <select v-model="filters.store" class="row-select">
        <option value="">すべての店舗</option>
        <option v-for="store in stores" :key="store" :value="store">{{ store }}</option>
      </select>
    </div>

    <!-- 機種行 -->
    <div class="selector-row sub-row">
      <label class="row-label">機種</label>
      <select v-model="filters.machine" class="row-select">
        <option value="">すべての機種</option>
        <option v-for="machine in machines" :key="machine" :value="machine">{{ machine }}</option>
      </select>
    </div>

    <!-- リセット行 -->
    <div class="selector-row sub-row">
      <button @click="resetFilters" class="reset-btn">リセット</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch, onMounted } from 'vue';
import { getMonthString } from '../../utils/dateUtils';
import { useEntries } from '../../composables/useEntries';

const props = defineProps({
  stores: {
    type: Array,
    default: () => []
  },
  machines: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['filter-change']);

const { entries } = useEntries();

const availableYears = computed(() => {
  const years = new Set();
  entries.value.forEach(e => {
    if (e.date) years.add(e.date.substring(0, 4));
  });
  const arr = Array.from(years).sort().reverse();
  return arr.length > 0 ? arr : [new Date().getFullYear().toString()];
});

const filters = reactive({
  periodType: 'month',
  periodValue: getMonthString(new Date()),
  store: '',
  machine: ''
});

const setPeriod = (type) => {
  filters.periodType = type;
  if (type === 'month') {
    filters.periodValue = getMonthString(new Date());
  } else if (type === 'year') {
    filters.periodValue = availableYears.value[0] || new Date().getFullYear().toString();
  } else {
    filters.periodValue = null;
  }
};

const resetFilters = () => {
  filters.periodType = 'month';
  filters.periodValue = getMonthString(new Date());
  filters.store = '';
  filters.machine = '';
};

watch(filters, (newFilters) => {
  emit('filter-change', { ...newFilters });
}, { deep: true });

onMounted(() => {
  emit('filter-change', { ...filters });
});

defineExpose({
  setMonth(yyyyMm) {
    filters.periodType = 'month';
    filters.periodValue = yyyyMm;
  },
  setPeriod(type, value) {
    filters.periodType = type;
    filters.periodValue = value;
  }
});
</script>

<style scoped>
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px 20px;
  margin-bottom: 2rem;
}

.selector-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.sub-row {
  border-top: 1px solid var(--border-subtle);
  padding-top: 10px;
}

/* 期間タブ */
.period-tabs {
  display: flex;
  gap: 8px;
}

.period-tabs button {
  padding: 7px 16px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.period-tabs button:hover {
  background: var(--surface-hover);
}

.period-tabs button.active {
  background: var(--accent-primary);
  color: var(--text-inverse);
  border-color: var(--accent-primary);
  font-weight: 600;
}

/* 期間値 input / select */
.period-input {
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 0.95rem;
  outline: none;
  font-family: inherit;
}

.period-input:focus {
  border-color: var(--accent-primary);
}

.period-input option {
  background: var(--bg-input);
  color: var(--text-main);
}

.period-input[type="month"]::-webkit-calendar-picker-indicator {
  filter: var(--picker-filter);
  cursor: pointer;
  opacity: 0.8;
}

/* 店舗・機種行 */
.row-label {
  font-size: 0.85rem;
  color: var(--text-sub);
  white-space: nowrap;
  min-width: 36px;
}

.row-select {
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 0.9rem;
  outline: none;
  min-width: 160px;
}

.row-select:focus {
  border-color: var(--accent-primary);
}

.row-select option {
  background: var(--bg-input);
  color: var(--text-main);
}

/* リセットボタン */
.reset-btn {
  padding: 7px 16px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-sub);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: var(--surface-hover);
  color: var(--text-main);
}
</style>
