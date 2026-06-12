<template>
  <div class="entry-list-container">
    <!-- 一括削除バー -->
    <div v-if="selectedIds.size > 0" class="bulk-bar">
      <span class="bulk-count">{{ selectedIds.size }}件選択中</span>
      <button class="btn btn-danger btn-sm" @click="confirmBulkDelete">
        <i class="fa-solid fa-trash"></i> 一括削除
      </button>
      <button class="btn btn-ghost btn-sm" @click="clearSelection">選択解除</button>
    </div>

    <!-- リストヘッダー -->
    <div class="list-header">
      <label class="check-wrap" @click.stop>
        <input
          type="checkbox"
          :checked="allSelected"
          :indeterminate.prop="someSelected"
          @change="toggleAll"
        />
      </label>
      <button class="sort-btn" @click="sortAsc = !sortAsc">
        日付 <i class="fa-solid" :class="sortAsc ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
      </button>
      <span class="header-total" v-if="groupedByDate.length > 0">
        計 {{ sortedEntries.length }}件
      </span>
    </div>

    <div v-if="groupedByDate.length > 0">
      <!-- 日付グループ -->
      <div v-for="group in groupedByDate" :key="group.date" class="date-group">
        <!-- 日付ヘッダー行 -->
        <div
          class="group-header"
          :class="{ 'is-expanded': expandedDates.has(group.date) }"
          @click="toggleGroup(group.date)"
        >
          <label class="check-wrap" @click.stop>
            <input
              type="checkbox"
              :checked="isGroupAllSelected(group)"
              :indeterminate.prop="isGroupPartialSelected(group)"
              @change="toggleGroupSelection(group)"
            />
          </label>
          <div class="group-date-info">
            <span class="group-date">{{ formatDateDisplay(group.date) }}（{{ group.entries[0].dayOfWeek }}）</span>
            <span class="group-count">{{ group.entries.length }}件</span>
          </div>
          <span class="group-profit" :class="getProfitClass(group.totalProfit)">
            {{ formatProfit(group.totalProfit) }}
          </span>
          <i class="fa-solid fa-chevron-right group-chevron" :class="{ 'is-open': expandedDates.has(group.date) }"></i>
        </div>

        <!-- アコーディオン本体 -->
        <transition name="accordion">
          <div v-if="expandedDates.has(group.date)" class="group-body">
            <div
              v-for="entry in group.entries"
              :key="entry.id"
              class="entry-row"
              :class="{ 'row-selected': selectedIds.has(entry.id) }"
              @click="editEntry(entry)"
            >
              <label class="check-wrap entry-check" @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedIds.has(entry.id)"
                  @change="toggleRow(entry.id)"
                />
              </label>
              <div class="entry-main">
                <span class="entry-store">{{ entry.store }}</span>
                <span class="entry-machine">
                  {{ entry.machine }}{{ entry.slotNumber ? ` #${entry.slotNumber}` : '' }}
                  <span v-if="entry.memo" class="entry-memo">{{ entry.memo }}</span>
                </span>
              </div>
              <div class="entry-numbers">
                <span class="entry-profit" :class="getProfitClass(entry.profit)">{{ formatProfit(entry.profit) }}</span>
                <span class="entry-inv">{{ formatCurrency(entry.investment) }}<span class="inv-sep">/</span>{{ formatCurrency(entry.collection) }}</span>
              </div>
              <div class="entry-actions" @click.stop>
                <button class="btn-icon icon-edit" @click="editEntry(entry)" title="編集">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-icon icon-delete" @click="confirmDelete(entry)" title="削除">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 合計行 -->
      <div class="summary-row">
        <span class="summary-label">合計</span>
        <span class="summary-profit" :class="getProfitClass(totalProfit)">{{ formatProfit(totalProfit) }}</span>
        <span class="summary-inv">
          {{ formatCurrency(totalInvestment) }}<span class="inv-sep">/</span>{{ formatCurrency(totalCollection) }}
        </span>
      </div>
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
  entries: { type: Array, required: true }
});

const emit = defineEmits(['delete-entry', 'bulk-delete']);

// ---- ソート ----
const sortAsc = ref(false);

const sortedEntries = computed(() => {
  return [...props.entries].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return sortAsc.value ? diff : -diff;
  });
});

// ---- 日付グループ化 ----
const groupedByDate = computed(() => {
  const map = new Map();
  for (const entry of sortedEntries.value) {
    if (!map.has(entry.date)) map.set(entry.date, []);
    map.get(entry.date).push(entry);
  }
  return [...map.entries()].map(([date, entries]) => ({
    date,
    entries,
    totalProfit: entries.reduce((s, e) => s + e.profit, 0),
    totalInvestment: entries.reduce((s, e) => s + e.investment, 0),
    totalCollection: entries.reduce((s, e) => s + e.collection, 0),
  }));
});

// ---- アコーディオン ----
const expandedDates = ref(new Set());

// 初回ロード時に最初のグループを展開
watch(groupedByDate, (groups) => {
  if (groups.length > 0 && expandedDates.value.size === 0) {
    expandedDates.value = new Set([groups[0].date]);
  }
}, { immediate: true });

const toggleGroup = (date) => {
  const next = new Set(expandedDates.value);
  next.has(date) ? next.delete(date) : next.add(date);
  expandedDates.value = next;
};

// ---- チェックボックス ----
const selectedIds = ref(new Set());

watch(() => props.entries, () => { selectedIds.value = new Set(); });

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
  selectedIds.value = allSelected.value
    ? new Set()
    : new Set(sortedEntries.value.map(e => e.id));
};

const clearSelection = () => { selectedIds.value = new Set(); };

const isGroupAllSelected = (group) =>
  group.entries.every(e => selectedIds.value.has(e.id));

const isGroupPartialSelected = (group) =>
  group.entries.some(e => selectedIds.value.has(e.id)) && !isGroupAllSelected(group);

const toggleGroupSelection = (group) => {
  const next = new Set(selectedIds.value);
  if (isGroupAllSelected(group)) {
    group.entries.forEach(e => next.delete(e.id));
  } else {
    group.entries.forEach(e => next.add(e.id));
  }
  selectedIds.value = next;
};

const confirmBulkDelete = () => {
  if (window.confirm(`選択した ${selectedIds.value.size} 件を削除しますか？\n（この操作は元に戻せません）`)) {
    emit('bulk-delete', [...selectedIds.value]);
    selectedIds.value = new Set();
  }
};

// ---- 合計 ----
const totalInvestment = computed(() => props.entries.reduce((s, e) => s + e.investment, 0));
const totalCollection = computed(() => props.entries.reduce((s, e) => s + e.collection, 0));
const totalProfit = computed(() => props.entries.reduce((s, e) => s + e.profit, 0));

// ---- ユーティリティ ----
const getProfitClass = (profit) => {
  if (profit > 0) return 'positive';
  if (profit < 0) return 'negative';
  return 'zero';
};

const editEntry = (entry) => {
  router.push({ name: 'EntryEdit', params: { id: entry.id } });
};

const confirmDelete = (entry) => {
  if (window.confirm(`${entry.date}「${entry.store}」の記録を削除しますか？\n（この操作は元に戻せません）`)) {
    emit('delete-entry', entry.id);
  }
};
</script>

<style scoped>
.entry-list-container {
  background-color: var(--bg-card-color);
  border-radius: 1rem;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* ---- 一括削除バー ---- */
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(var(--accent-primary-rgb), 0.08);
  border-bottom: 1px solid rgba(var(--accent-primary-rgb), 0.2);
}
.bulk-count {
  font-size: 0.9rem;
  color: var(--accent-primary);
  font-weight: 600;
  flex: 1;
}

/* ---- リストヘッダー ---- */
.list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--overlay-1);
  border-bottom: 1px solid var(--border-subtle);
}
.sort-btn {
  background: transparent;
  border: none;
  color: var(--text-sub);
  font-size: 0.82rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;
}
.sort-btn:hover { color: var(--text-main); }
.header-total {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-faded);
}

/* ---- チェックボックス共通 ---- */
.check-wrap {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}
.check-wrap input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-primary);
  cursor: pointer;
}

/* ---- 日付グループ ---- */
.date-group {
  border-bottom: 1px solid var(--border-subtle);
}
.date-group:last-of-type { border-bottom: none; }

.group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}
.group-header:hover,
.group-header.is-expanded {
  background: var(--surface-hover);
}

.group-date-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.group-date {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
}
.group-count {
  font-size: 0.75rem;
  color: var(--text-faded);
  background: var(--border-subtle);
  padding: 1px 7px;
  border-radius: 99px;
  white-space: nowrap;
}
.group-profit {
  font-size: 0.92rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.group-chevron {
  font-size: 0.7rem;
  color: var(--text-faded);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}
.group-chevron.is-open {
  transform: rotate(90deg);
}

/* ---- アコーディオンアニメーション ---- */
.accordion-enter-active,
.accordion-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top;
}
.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

/* ---- エントリ行 ---- */
.group-body {
  background: var(--overlay-1);
}

.entry-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px 9px 28px;
  border-top: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background 0.15s;
}
.entry-row:hover {
  background: rgba(var(--accent-primary-rgb), 0.05);
}
.row-selected {
  background: rgba(var(--accent-primary-rgb), 0.08);
}

.entry-check { margin-right: 2px; }

.entry-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.entry-store {
  font-size: 0.88rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.entry-machine {
  font-size: 0.78rem;
  color: var(--text-sub);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.entry-memo {
  color: var(--text-faded);
  margin-left: 4px;
  white-space: pre-wrap;
}

.entry-numbers {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}
.entry-profit {
  font-size: 0.88rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.entry-inv {
  font-size: 0.75rem;
  color: var(--text-faded);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.inv-sep {
  color: var(--text-faded);
  margin: 0 2px;
}

.entry-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

/* ---- 合計行 ---- */
.summary-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--overlay-2);
  border-top: 2px solid var(--border-strong);
}
.summary-label {
  font-size: 0.82rem;
  color: var(--text-sub);
  font-weight: 600;
  flex: 1;
}
.summary-profit {
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.summary-inv {
  font-size: 0.8rem;
  color: var(--text-faded);
  font-variant-numeric: tabular-nums;
}

/* ---- カラー ---- */
.positive { color: var(--success-color); }
.negative { color: var(--danger-color); }
.zero     { color: var(--text-sub); }

/* ---- アクションボタン ---- */
.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.88rem;
  opacity: 0.6;
  transition: opacity 0.15s;
  padding: 0.2rem 0.25rem;
  line-height: 1;
}
.btn-icon:hover { opacity: 1; }
.icon-edit   { color: var(--accent-primary); }
.icon-delete { color: var(--danger-color); }

/* ---- 空状態 ---- */
.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-faded);
}

/* ---- 共通ボタン ---- */
.btn-danger {
  background: var(--color-lose-bg);
  color: var(--danger-color);
  border: 1px solid var(--color-lose-border);
}
.btn-danger:hover { background: rgba(var(--danger-color), 0.22); }
.btn-ghost {
  background: transparent;
  color: var(--text-sub);
  border: 1px solid var(--border-color);
}
.btn-ghost:hover { background: var(--surface-hover); }
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
