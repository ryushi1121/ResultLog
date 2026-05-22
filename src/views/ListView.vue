<template>
  <div class="list-view">
    <div class="page-header">
      <h1 class="page-title">収支一覧</h1>
      <p class="page-subtitle">記録した収支の詳細を確認・管理できます</p>
    </div>

    <FilterPanel
      ref="filterPanelRef"
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
      <!-- 常時表示のアクションバー -->
      <div class="action-bar">
        <div v-if="isMonthMode" class="view-toggle">
          <button :class="{ active: viewMode === 'calendar' }" @click="viewMode = 'calendar'">
            <i class="fa-solid fa-calendar-days"></i> カレンダー
          </button>
          <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
            <i class="fa-solid fa-list"></i> リスト
          </button>
        </div>
        <div v-if="isMonthMode && viewMode === 'calendar'" class="cal-nav">
          <button class="cal-nav-btn" @click="prevMonth">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span class="cal-nav-label">{{ calendarMonthLabel }}</span>
          <button class="cal-nav-btn" @click="nextMonth">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
        <button class="btn btn-export" @click="handleExport" :disabled="filteredEntries.length === 0">
          <i class="fa-solid fa-file-csv"></i> CSV出力
        </button>
      </div>

      <MonthCalendar
        v-if="isMonthMode && viewMode === 'calendar'"
        :entries="filteredEntries"
        :year-month="calendarMonth"
      />
      <EntryTable
        v-else
        :entries="filteredEntries"
        @delete-entry="handleDelete"
        @bulk-delete="handleBulkDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEntries } from '../composables/useEntries';
import FilterPanel from '../components/list/FilterPanel.vue';
import EntryTable from '../components/list/EntryTable.vue';
import MonthCalendar from '../components/list/MonthCalendar.vue';
import { exportCSV } from '../utils/csvExporter';

const route = useRoute();
const { entries, isLoading, error, loadEntries, removeEntry, removeBulk, suggestStores, suggestMachines, isLoaded } = useEntries();
const currentFilters = ref(null);
const viewMode = ref('calendar'); // 'calendar' | 'list'
const calendarMonth = ref(null);  // カレンダー表示用の月 (YYYY-MM)
const filterPanelRef = ref(null);

const isMonthMode = computed(() => currentFilters.value?.periodType === 'month');

// FilterPanel の月が変わったらカレンダー月を同期（ナビボタンによる変更は除く）
watch(() => currentFilters.value?.periodValue, (val) => {
  if (isMonthMode.value && val && val !== calendarMonth.value) calendarMonth.value = val;
}, { immediate: true });

// 月別以外に切り替えたらリストに戻す
watch(isMonthMode, (v) => {
  if (!v) viewMode.value = 'list';
  else {
    viewMode.value = 'calendar';
    calendarMonth.value = currentFilters.value?.periodValue ?? null;
  }
});

const calendarMonthLabel = computed(() => {
  if (!calendarMonth.value) return '';
  const [y, m] = calendarMonth.value.split('-');
  return `${y}年${parseInt(m)}月`;
});

const prevMonth = () => {
  if (!calendarMonth.value) return;
  const [y, m] = calendarMonth.value.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  calendarMonth.value = newMonth;
  filterPanelRef.value?.setMonth(newMonth);
};

const nextMonth = () => {
  if (!calendarMonth.value) return;
  const [y, m] = calendarMonth.value.split('-').map(Number);
  const d = new Date(y, m, 1);
  const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  calendarMonth.value = newMonth;
  filterPanelRef.value?.setMonth(newMonth);
};

const filteredEntries = computed(() => {
  if (!currentFilters.value) return entries.value;

  let result = entries.value;
  const { periodType, periodValue, store, machine } = currentFilters.value;

  if (periodType === 'month') {
    const target = (viewMode.value === 'calendar' && calendarMonth.value) ? calendarMonth.value : periodValue;
    if (target) result = result.filter(e => e.date.startsWith(target));
  } else if (periodType === 'year' && periodValue) {
    result = result.filter(e => e.date.startsWith(periodValue.substring(0, 4)));
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
  else if (f?.periodType === 'year' && f.periodValue) filename += `_${f.periodValue.substring(0, 4)}`;
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
  const { mode, value } = route.query;
  if (mode && value) {
    // FilterPanel の ref はマウント直後に使える
    filterPanelRef.value?.setPeriod(mode, value);
  }
});
</script>

<style scoped>
.list-view {
  animation: fadeIn 0.3s ease-out;
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-sub);
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-export:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text-main);
}

.btn-export:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  gap: 1rem;
  color: var(--text-sub);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-subtle);
  border-radius: 50%;
  border-top-color: var(--accent-primary);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.view-toggle {
  display: flex;
  gap: 6px;
}
.view-toggle button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-sub);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.view-toggle button:hover {
  background: var(--surface-hover);
  color: var(--text-main);
}
.view-toggle button.active {
  background: var(--accent-primary);
  color: var(--text-inverse);
  border-color: var(--accent-primary);
  font-weight: 600;
}

.cal-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cal-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-sub);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8rem;
}
.cal-nav-btn:hover {
  background: var(--surface-hover);
  color: var(--text-main);
  border-color: var(--border-color-hover);
}
.cal-nav-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
  min-width: 90px;
  text-align: center;
}
</style>
