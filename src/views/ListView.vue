<template>
  <div class="list-view">
    <div class="page-header">
      <h1 class="page-title">収支一覧</h1>
      <p class="page-subtitle">記録した収支の詳細を確認・管理できます</p>
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
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useEntries } from '../composables/useEntries';
import FilterPanel from '../components/list/FilterPanel.vue';
import EntryTable from '../components/list/EntryTable.vue';

const { entries, isLoading, error, loadEntries, removeEntry, suggestStores, suggestMachines, isLoaded } = useEntries();
const currentFilters = ref(null);

const filteredEntries = computed(() => {
  if (!currentFilters.value) return entries.value;
  
  let result = entries.value;
  
  // Month filter
  if (currentFilters.value.month) {
    result = result.filter(e => e.date.startsWith(currentFilters.value.month));
  }
  
  // Store filter
  if (currentFilters.value.store) {
    result = result.filter(e => e.store === currentFilters.value.store);
  }
  
  // Machine filter
  if (currentFilters.value.machine) {
    result = result.filter(e => e.machine === currentFilters.value.machine);
  }
  
  return result;
});

const handleFilterChange = (filters) => {
  currentFilters.value = filters;
  
  // If month changed, we might need to load data from API
  // In a real app we might paginate or load per month.
  // For now, if we don't have the data, we fetch it.
  if (filters.month) {
    const minDate = new Date(filters.month + '-01');
    
    // Check if we need to load (if we have no entries matching this month, it might not be loaded)
    // Here we just make sure data is loaded if we switch months dynamically, 
    // but in useEntries we might just keep fetching and appending. 
    // To simplify: if we already fetched all recently, we rely on local filtering.
  }
};

const handleDelete = async (id) => {
  try {
    await removeEntry(id);
  } catch (err) {
    alert('削除に失敗しました: ' + err.message);
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
  margin-bottom: 2rem;
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
