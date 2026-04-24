<template>
  <div class="dashboard-view">
    <div class="page-header">
      <div class="header-main">
        <h1 class="page-title">ダッシュボード</h1>
        <p class="page-subtitle">{{ displayPeriodStr }}の状況</p>
      </div>
      
      <div class="dashboard-controls">
        <router-link to="/entry" class="btn btn-action register-btn">
          <i class="fa-solid fa-pen-to-square"></i> 収支登録
        </router-link>

        <div class="view-mode-toggle">
          <label class="radio-label">
            <input type="radio" v-model="viewMode" value="month" @change="onPeriodChange" />
            月
          </label>
          <label class="radio-label">
            <input type="radio" v-model="viewMode" value="year" @change="onPeriodChange" />
            年
          </label>
        </div>
        
        <div class="period-navigation">
          <input 
            v-if="viewMode === 'month'" 
            type="month" 
            v-model="selectedMonthStr"
            class="period-input"
          />
          <div v-else class="year-input-wrapper">
            <input 
              type="number" 
              v-model="selectedYearStr" 
              class="period-input year-input"
              min="2000" 
              max="2100" 
            />
            <span class="year-label">年</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ローディング状態 -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>データを読み込み中...</p>
    </div>

    <!-- エラー状態 -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="forceReload" class="btn btn-outline">再試行</button>
    </div>

    <div v-else class="dashboard-content">
      <!-- サマリーカード群 -->
      <div class="summary-cards">
        <SummaryCard 
          :title="`${targetPeriodText}の総投資`" 
          :amount="currentPeriodStats.investment" 
          subtitle="Total Investment"
        />
        <SummaryCard 
          :title="`${targetPeriodText}の総回収`" 
          :amount="currentPeriodStats.collection" 
          subtitle="Total Collection"
        />
        <SummaryCard 
          :title="`${targetPeriodText}の収支`" 
          :amount="currentPeriodStats.profit" 
          :isProfit="true"
          subtitle="Total Profit"
        />
      </div>

      <div class="dashboard-grid">
        <!-- クイック統計 -->
        <QuickStats :entries="currentPeriodEntries" :title="`${targetPeriodText}の成績サマリー`" class="grid-item" />

        <!-- 直近の履歴 -->
        <RecentHistory :entries="entries" :limit="5" class="grid-item" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useEntries } from '../composables/useEntries';
import SummaryCard from '../components/dashboard/SummaryCard.vue';
import QuickStats from '../components/dashboard/QuickStats.vue';
import RecentHistory from '../components/dashboard/RecentHistory.vue';

const { entries, isLoading, error, loadEntries, isLoaded } = useEntries();

// 状態
const viewMode = ref('month'); // 'month' or 'year'
const currentDate = ref(new Date());

// 表示用の期間文字列
const selectedMonthStr = computed({
  get: () => {
    const year = currentDate.value.getFullYear();
    const month = String(currentDate.value.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },
  set: (val) => {
    if (val) {
      const [y, m] = val.split('-');
      currentDate.value = new Date(y, m - 1, 1);
    }
  }
});

const selectedYearStr = computed({
  get: () => currentDate.value.getFullYear(),
  set: (val) => {
    if (val) {
      currentDate.value = new Date(val, 0, 1);
    }
  }
});

// 現在の表示期間の文字列 (ヘッダー等に表示用)
const displayPeriodStr = computed(() => {
  if (viewMode.value === 'month') {
    return `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`;
  } else {
    return `${currentDate.value.getFullYear()}年`;
  }
});

const targetPeriodText = computed(() => {
  return displayPeriodStr.value;
});

// 未来の期間かどうか（次へボタンの無効化用）
const isFuturePeriod = computed(() => {
  const now = new Date();
  if (viewMode.value === 'month') {
    return currentDate.value.getFullYear() === now.getFullYear() && 
           currentDate.value.getMonth() >= now.getMonth();
  } else {
    return currentDate.value.getFullYear() >= now.getFullYear();
  }
});

// 表示期間のデータをフィルタリング
const currentPeriodEntries = computed(() => {
  const targetYear = currentDate.value.getFullYear();
  const targetMonth = String(currentDate.value.getMonth() + 1).padStart(2, '0');
  
  return entries.value.filter(e => {
    if (viewMode.value === 'month') {
      return e.date.startsWith(`${targetYear}-${targetMonth}`);
    } else {
      return e.date.startsWith(`${targetYear}`);
    }
  });
});

// 表示期間の合計を計算
const currentPeriodStats = computed(() => {
  const stats = { investment: 0, collection: 0, profit: 0 };
  
  currentPeriodEntries.value.forEach(e => {
    stats.investment += e.investment;
    stats.collection += e.collection;
    stats.profit += e.profit;
  });
  
  return stats;
});

const onPeriodChange = () => {
  // ローカルでフィルタされるため再取得不要
};

const loadData = () => {
  if (!isLoaded.value) {
    loadEntries(); // 全データを取得
  }
};

const forceReload = () => {
  loadEntries(); // 明示的な再試行時は全データを再取得
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.btn-action {
  background: linear-gradient(135deg, #ff9a44 0%, #fc6076 100%);
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(252, 96, 118, 0.4);
  border: none;
}

.btn-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(252, 96, 118, 0.6);
  color: #ffffff;
}

.dashboard-view {
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
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
  margin: 0;
}

.dashboard-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .dashboard-controls {
    align-items: flex-end;
  }
}

.view-mode-toggle {
  display: flex;
  gap: 1.5rem;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-color, #ffffff);
  font-size: 0.9rem;
}

.radio-label input[type="radio"] {
  accent-color: var(--primary-color, #00d4ff);
}

.period-navigation {
  display: flex;
  align-items: center;
  background-color: var(--bg-card-color, #16213e);
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  overflow: hidden;
}

.period-input {
  background: transparent;
  border: none;
  color: var(--text-color, #ffffff);
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  outline: none;
  font-family: inherit;
}

.period-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

.year-input-wrapper {
  display: flex;
  align-items: center;
}

.year-input {
  width: 90px;
  padding-right: 0.25rem;
  text-align: center;
}

.year-label {
  color: var(--text-color, #ffffff);
  padding-right: 1rem;
  font-weight: 600;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
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

@media (max-width: 768px) {
  .dashboard-view {
    padding: 0.5rem;
  }
}
</style>
