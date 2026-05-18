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
        <!-- 投資・回収 統合パネル -->
        <div class="investment-card card">
          <div class="invest-header">
            <h3 class="invest-title">{{ targetPeriodText }}の投資 / 回収</h3>
            <router-link :to="listLink" class="card-link">一覧を見る <i class="fa-solid fa-arrow-right"></i></router-link>
          </div>
          <div class="invest-body">
            <div class="invest-col">
              <div class="invest-label">総投資</div>
              <div class="invest-amount investment">¥{{ formatCurrency(currentPeriodStats.investment) }}</div>
            </div>
            <div class="invest-divider"></div>
            <div class="invest-col">
              <div class="invest-label">総回収</div>
              <div class="invest-amount collection">¥{{ formatCurrency(currentPeriodStats.collection) }}</div>
            </div>
          </div>
        </div>

        <!-- 収支パネル -->
        <SummaryCard
          :title="`${targetPeriodText}の収支`"
          :amount="currentPeriodStats.profit"
          :isProfit="true"
          :link="analyticsLink"
          linkLabel="集計を見る"
        />
      </div>

      <div class="dashboard-grid">
        <!-- クイック統計 -->
        <QuickStats :entries="currentPeriodEntries" :title="`${targetPeriodText}の成績サマリー`" :chartsLink="chartsLink" class="grid-item" />

        <!-- 直近の履歴 -->
        <RecentHistory :entries="entries" :limit="5" class="grid-item" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useEntries } from '../composables/useEntries';
import { formatCurrency } from '../utils/formatters';
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

// 各ページへ渡す期間クエリ
const periodQuery = computed(() => {
  if (viewMode.value === 'year') {
    return { mode: 'year', value: String(currentDate.value.getFullYear()) };
  }
  return { mode: 'month', value: selectedMonthStr.value };
});

const listLink = computed(() => ({ path: '/list', query: periodQuery.value }));
const analyticsLink = computed(() => ({ path: '/analytics', query: periodQuery.value }));
const chartsLink = computed(() => ({ path: '/charts', query: periodQuery.value }));

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
  color: var(--text-sub);
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
  background-color: var(--overlay-1);
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
  filter: var(--picker-filter);
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
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 640px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}

/* 投資・回収 統合カード */
.card {
  background-color: var(--bg-card-color, #16213e);
  border-radius: 1rem;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  padding: 1.25rem 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.invest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.invest-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-sub);
}

.card-link {
  font-size: 0.85rem;
  color: var(--primary-color, #00d4ff);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.card-link:hover {
  opacity: 0.8;
}

.invest-body {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.invest-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.invest-divider {
  width: 1px;
  height: 3rem;
  background-color: var(--border-subtle);
  flex-shrink: 0;
}

.invest-label {
  font-size: 0.8rem;
  color: var(--text-faded);
}

.invest-amount {
  font-family: 'Inter', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
}

.invest-amount.investment {
  color: var(--danger-color, #ef4444);
}

.invest-amount.collection {
  color: var(--success-color, #22c55e);
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
  color: var(--text-sub);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-subtle);
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
