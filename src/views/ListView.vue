<template>
  <div class="list-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">収支一覧</h1>
        <p class="page-subtitle">記録した収支の詳細を確認・管理できます</p>
      </div>
      <button class="btn btn-export" @click="handleExport" :disabled="filteredEntries.length === 0">
        <i class="fa-solid fa-file-csv"></i> CSV出力
      </button>
    </div>

    <FilterPanel 
      :stores="suggestStores"
      :machines="suggestMachines"
      @filter-change="handleFilterChange"
    />

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>データを読み込み中...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="forceReload" class="btn btn-outline">再試行</button>
    </div>

    <div v-else class="list-content">
      <EntryTable
        :entries="filteredEntries"
        @delete-entry="handleDelete"
        @bulk-delete="handleBulkDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useEntries } from '../composables/useEntries';
import FilterPanel from '../components/list/FilterPanel.vue';
import EntryTable from '../components/list/EntryTable.vue';
import { exportCSV } from '../utils/csvExporter';

const { entries, isLoading, error, loadEntries, removeEntry, removeBulk, suggestStores, suggestMachines, isLoaded } = useEntries();
const currentFilters = ref(null);

const filteredEntries = computed(() => {
  if (!currentFilters.value) return entries.value;

  let result = entries.value;
  const { periodType, periodValue, store, machine } = currentFilters.value;

  if (periodType === 'month' && periodValue) {
    result = result.filter(e => e.date.startsWith(periodValue));
  } else if (periodType === 'year' && periodValue) {
    result = result.filter(e => e.date.startsWith(periodValue));
  }

  if (store) result = result.filter(e => e.store === store);
  if (machine) result = result.filter(e => e.machine === machine);

  return result;
});

const handleFilterChange = (filters) => {
  currentFilters.value = filters;
};

const handleExport = () => {
  const f = currentFilters.value;
  let filename = 'resultlog';
  if (f?.periodType === 'month' && f.periodValue) filename += `_${f.periodValue}`;
  else if (f?.periodType === 'year' && f.periodValue) filename += `_${f.periodValue}`;
  exportCSV(filteredEntries.value, `${filename}.csv`);
};

const handleDelete = async (id) => {
  try {
    await removeEntry(id);
  } catch (err) {
    alert('削除に失敗しました: ' + err.message);
  }
};

const handleBulkDelete = async (ids) => {
  try {
    await removeBulk(ids);
  } catch (err) {
    alert(err.message);
  }
};

const forceReload = () => {
  loadEntries();
};

onMounted(() => {
  if (!isLoaded.value) {
    loadEntries();
  }
});
</script>

<style scoped>
.list-view {
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: #94a3b8;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-export:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.btn-export:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color, #ffffff);
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  gap: 1rem;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color, #00d4ff);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
