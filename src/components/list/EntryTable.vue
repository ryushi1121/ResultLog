<template>
  <div class="entry-table-container">
    <!-- 一括削除バー -->
    <div v-if="selectedIds.size > 0" class="bulk-bar">
      <span class="bulk-count">{{ selectedIds.size }}件選択中</span>
      <button class="btn btn-danger btn-sm" @click="confirmBulkDelete">
        <i class="fa-solid fa-trash"></i> 一括削除
      </button>
      <button class="btn btn-ghost btn-sm" @click="clearSelection">選択解除</button>
    </div>

    <div class="table-responsive" v-if="entries.length > 0">
      <table class="entry-table">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" :checked="allSelected" :indeterminate.prop="someSelected" @change="toggleAll" />
            </th>
            <th class="col-date-store" @click="sortBy('date')" style="cursor:pointer;user-select:none;">
              日付／店舗 <span class="sort-icon">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
            <th class="col-machine">機種</th>
            <th class="col-inv-col num-col">投資／回収</th>
            <th class="col-profit num-col">収支</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in sortedEntries" :key="entry.id" class="entry-row" :class="{ 'row-selected': selectedIds.has(entry.id) }">
            <td class="col-check">
              <input type="checkbox" :checked="selectedIds.has(entry.id)" @change="toggleRow(entry.id)" />
            </td>
            <td class="col-date-store">
              <div class="two-line-cell">
                <span class="line-main">{{ formatDateDisplay(entry.date) }}（{{ entry.dayOfWeek }}）</span>
                <span class="line-sub">{{ entry.store }}</span>
              </div>
            </td>
            <td class="col-machine">
              <div class="two-line-cell">
                <span class="line-main">{{ entry.machine }}</span>
                <span class="line-sub" v-if="entry.slotNumber || entry.memo">
                  {{ entry.slotNumber ? `#${entry.slotNumber}` : '' }}{{ entry.slotNumber && entry.memo ? ' ' : '' }}{{ entry.memo }}
                </span>
              </div>
            </td>
            <td class="col-inv-col num-col">
              <div class="two-line-cell two-line-cell--right">
                <span class="line-main">{{ formatCurrency(entry.investment) }}</span>
                <span class="line-sub">{{ formatCurrency(entry.collection) }}</span>
              </div>
            </td>
            <td class="col-profit num-col" :class="getProfitClass(entry.profit)">
              {{ formatProfit(entry.profit) }}
            </td>
            <td class="col-actions">
              <div class="action-btns">
                <button class="btn-icon icon-edit" @click="editEntry(entry)" title="編集">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-icon icon-delete" @click="confirmDelete(entry)" title="削除">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="summary-row">
            <td></td>
            <td colspan="2" class="text-right">合計</td>
            <td class="num-col">
              <div class="two-line-cell two-line-cell--right">
                <span class="line-main">{{ formatCurrency(totalInvestment) }}</span>
                <span class="line-sub">{{ formatCurrency(totalCollection) }}</span>
              </div>
            </td>
            <td class="num-col" :class="getProfitClass(totalProfit)">{{ formatProfit(totalProfit) }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <div v-else class="empty-state">
      <p>条件に一致するデータがありません</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrency, formatProfit } from '../../utils/formatters';

const router = useRouter();

const props = defineProps({
  entries: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['delete-entry', 'bulk-delete']);

const selectedIds = ref(new Set());

const allSelected = computed(() =>
  sortedEntries.value.length > 0 && sortedEntries.value.every(e => selectedIds.value.has(e.id))
);
const someSelected = computed(() =>
  sortedEntries.value.some(e => selectedIds.value.has(e.id)) && !allSelected.value
);

const toggleRow = (id) => {
  const next = new Set(selectedIds.value);
  next.has(id) ? next.delete(id) : next.add(id);
  selectedIds.value = next;
};

const toggleAll = () => {
  if (allSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(sortedEntries.value.map(e => e.id));
  }
};

const clearSelection = () => { selectedIds.value = new Set(); };

const confirmBulkDelete = () => {
  const count = selectedIds.value.size;
  if (window.confirm(`選択した ${count} 件を削除しますか？\n（この操作は元に戻せません）`)) {
    emit('bulk-delete', [...selectedIds.value]);
    selectedIds.value = new Set();
  }
};

// フィルタ変更時に選択をリセット
watch(() => props.entries, () => { selectedIds.value = new Set(); });

const sortAsc = ref(false);

const sortBy = () => { sortAsc.value = !sortAsc.value; };

const sortedEntries = computed(() => {
  const result = [...props.entries];
  result.sort((a, b) => {
    const valA = new Date(a.date).getTime();
    const valB = new Date(b.date).getTime();
    return sortAsc.value ? valA - valB : valB - valA;
  });
  return result;
});

const totalInvestment = computed(() => props.entries.reduce((sum, e) => sum + e.investment, 0));
const totalCollection = computed(() => props.entries.reduce((sum, e) => sum + e.collection, 0));
const totalProfit = computed(() => props.entries.reduce((sum, e) => sum + e.profit, 0));

const getProfitClass = (profit) => {
  if (profit > 0) return 'positive';
  if (profit < 0) return 'negative';
  return 'zero';
};

const editEntry = (entry) => {
  router.push({ name: 'EntryEdit', params: { id: entry.id } });
};

const confirmDelete = (entry) => {
  const confirmed = window.confirm(`本当に${entry.date}の「${entry.store}」での記録を削除しますか？\n（この操作は元に戻せません）`);
  if (confirmed) {
    emit('delete-entry', entry.id);
  }
};
</script>

<style scoped>
.entry-table-container {
  background-color: var(--bg-card-color, #16213e);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  /* overflow:hidden は使わない（action列が切れる） */
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 1rem;
}

.entry-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  background-color: rgba(0, 0, 0, 0.2);
  color: #94a3b8;
  font-weight: 500;
  padding: 10px 8px;
  font-size: 0.82rem;
  white-space: nowrap;
}

td {
  padding: 10px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
  font-size: 0.9rem;
  word-break: break-all;
}

.entry-row:hover td {
  background-color: rgba(255, 255, 255, 0.03);
}

.num-col {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.text-right { text-align: right; }

/* 2行セル共通 */
.two-line-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.two-line-cell--right {
  align-items: flex-end;
}
.line-main {
  font-size: 0.88rem;
  color: #e2e8f0;
  white-space: nowrap;
}
.line-sub {
  font-size: 0.78rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 列幅 */
.col-check      { width: 32px; text-align: center; padding: 6px 2px; }
.col-date-store { min-width: 110px; }
.col-machine    { min-width: 80px; }
.col-inv-col    { width: 80px; white-space: nowrap; }
.col-profit     { width: 72px; white-space: nowrap; }
.col-actions    { width: 56px; padding: 6px 4px; white-space: nowrap; }

/* アクションボタン横並び */
.action-btns {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
}

.sort-icon { font-size: 0.7rem; margin-left: 2px; }

.positive { color: var(--success-color, #22c55e); font-weight: 600; }
.negative { color: var(--danger-color, #ef4444); font-weight: 600; }

.summary-row td {
  background-color: rgba(0, 0, 0, 0.3);
  font-weight: 600;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 0.15rem;
  line-height: 1;
}
.btn-icon:hover { opacity: 1; }
.icon-edit  { color: #00d4ff; }
.icon-delete { color: #ef4444; }

.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
}

.row-selected td {
  background-color: rgba(0, 212, 255, 0.06);
}

.bulk-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(0, 212, 255, 0.08);
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
}

.bulk-count {
  font-size: 0.9rem;
  color: #00d4ff;
  font-weight: 600;
  flex: 1;
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn-danger:hover { background: rgba(239, 68, 68, 0.25); }

.btn-ghost {
  background: transparent;
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-ghost:hover { background: rgba(255, 255, 255, 0.05); }

.btn-sm {
  padding: 5px 12px;
  font-size: 0.82rem;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
