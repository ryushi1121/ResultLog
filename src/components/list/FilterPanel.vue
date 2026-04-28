<template>
  <div class="filter-panel card">
    <div class="filter-group period-group">
      <label class="filter-label">期間</label>
      <div class="period-row">
        <div class="period-tabs">
          <button :class="{ active: filters.periodType === 'all' }" @click="setPeriod('all')">全期間</button>
          <button :class="{ active: filters.periodType === 'year' }" @click="setPeriod('year')">年別</button>
          <button :class="{ active: filters.periodType === 'month' }" @click="setPeriod('month')">月別</button>
        </div>
        <input
          v-if="filters.periodType === 'month'"
          type="month"
          v-model="filters.periodValue"
          class="form-control period-value"
        />
        <select
          v-else-if="filters.periodType === 'year'"
          v-model="filters.periodValue"
          class="form-control period-value"
        >
          <option v-for="year in availableYears" :key="year" :value="year">{{ year }}年</option>
        </select>
      </div>
    </div>

    <div class="filter-group">
      <label class="filter-label">店舗</label>
      <select v-model="filters.store" class="form-control">
        <option value="">すべての店舗</option>
        <option v-for="store in stores" :key="store" :value="store">{{ store }}</option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label">機種</label>
      <select v-model="filters.machine" class="form-control">
        <option value="">すべての機種</option>
        <option v-for="machine in machines" :key="machine" :value="machine">{{ machine }}</option>
      </select>
    </div>

    <div class="filter-actions">
      <button @click="resetFilters" class="btn btn-outline-secondary">リセット</button>
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
</script>

<style scoped>
.filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-end;
  background-color: var(--bg-card-color, #16213e);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.period-group {
  min-width: 320px;
}

.filter-label {
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 500;
}

.period-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.period-tabs {
  display: flex;
  gap: 0.5rem;
}

.period-tabs button {
  padding: 0.45rem 0.9rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.period-tabs button:hover {
  background: rgba(255, 255, 255, 0.05);
}

.period-tabs button.active {
  background: var(--primary-color, #00d4ff);
  color: #0f0f1a;
  border-color: var(--primary-color, #00d4ff);
  font-weight: bold;
}

.period-value {
  width: auto;
  min-width: 130px;
}

.period-value::-webkit-calendar-picker-indicator {
  filter: brightness(0) invert(1);
  cursor: pointer;
  opacity: 0.7;
}

.form-control {
  width: 100%;
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  background-color: rgba(15, 15, 26, 0.5);
  color: var(--text-color, #ffffff);
  font-size: 1rem;
  transition: all 0.2s ease;
  color-scheme: dark;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color, #00d4ff);
}

.filter-actions {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.btn {
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-outline-secondary {
  background: transparent;
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-outline-secondary:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
}
</style>
