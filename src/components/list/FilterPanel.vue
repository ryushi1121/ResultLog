<template>
  <div class="filter-panel card">
    <div class="filter-group">
      <label class="filter-label">期間</label>
      <div class="filter-inputs date-inputs">
        <input type="month" v-model="filters.month" class="form-control" />
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
import { reactive, watch, onMounted } from 'vue';
import { getMonthString } from '../../utils/dateUtils';

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

const filters = reactive({
  month: getMonthString(new Date()),
  store: '',
  machine: ''
});

const resetFilters = () => {
  filters.month = getMonthString(new Date());
  filters.store = '';
  filters.machine = '';
};

// フィルタが変更されたら親コンポーネントに通知
watch(filters, (newFilters) => {
  emit('filter-change', { ...newFilters });
}, { deep: true });

onMounted(() => {
  // 初期値を送信
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

.filter-label {
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 500;
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
