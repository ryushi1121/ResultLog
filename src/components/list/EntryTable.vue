<template>
  <div class="entry-table-container">
    <div class="table-responsive" v-if="entries.length > 0">
      <table class="entry-table">
        <thead>
          <tr>
            <th class="col-date" @click="sortBy('date')">
              日付 <span class="sort-icon" v-if="sortKey === 'date'">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
            <th class="col-store">店舗</th>
            <th class="col-machine">機種</th>
            <th class="col-inv num-col">投資</th>
            <th class="col-col num-col">回収</th>
            <th class="col-profit num-col" @click="sortBy('profit')">
              収支 <span class="sort-icon" v-if="sortKey === 'profit'">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in sortedEntries" :key="entry.id" class="entry-row">
            <td class="col-date">
              <div class="date-cell">
                <span class="day">{{ formatDateDisplay(entry.date) }}</span>
                <span class="dow">{{ entry.dayOfWeek }}</span>
              </div>
            </td>
            <td class="col-store">{{ entry.store }}</td>
            <td class="col-machine">
              <div class="machine-info">
                <span>{{ entry.machine }}</span>
                <span class="slot-memo" v-if="entry.slotNumber || entry.memo">
                  {{ entry.slotNumber ? `#${entry.slotNumber} ` : '' }}{{ entry.memo }}
                </span>
              </div>
            </td>
            <td class="col-inv num-col">{{ formatCurrency(entry.investment) }}</td>
            <td class="col-col num-col">{{ formatCurrency(entry.collection) }}</td>
            <td class="col-profit num-col" :class="getProfitClass(entry.profit)">
              {{ formatProfit(entry.profit) }}
            </td>
            <td class="col-actions">
              <button class="btn-icon text-primary" @click="editEntry(entry)" title="編集">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn-icon text-danger" @click="confirmDelete(entry)" title="削除">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="summary-row">
            <td colspan="3" class="text-right">合計:</td>
            <td class="num-col">{{ formatCurrency(totalInvestment) }}</td>
            <td class="num-col">{{ formatCurrency(totalCollection) }}</td>
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
import { ref, computed } from 'vue';
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

const emit = defineEmits(['delete-entry']);

const sortKey = ref('date');
const sortAsc = ref(false);

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = key !== 'date'; // Default to descending for date, ascending for others
  }
};

const sortedEntries = computed(() => {
  const result = [...props.entries];
  result.sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];
    
    if (sortKey.value === 'date') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }
    
    if (valA < valB) return sortAsc.value ? -1 : 1;
    if (valA > valB) return sortAsc.value ? 1 : -1;
    return 0;
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
  overflow: hidden;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
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
  padding: 1rem;
  font-size: 0.9rem;
  white-space: nowrap;
}

th[click] {
  cursor: pointer;
  user-select: none;
}

th[click]:hover {
  color: white;
}

td {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.entry-row:hover td {
  background-color: rgba(255, 255, 255, 0.03);
}

.num-col {
  text-align: right;
  font-family: 'Inter', sans-serif;
}

.text-right {
  text-align: right;
}

.date-cell {
  display: flex;
  flex-direction: column;
}

.date-cell .dow {
  font-size: 0.8rem;
  color: #94a3b8;
}

.machine-info {
  display: flex;
  flex-direction: column;
}

.slot-memo {
  font-size: 0.8rem;
  color: #94a3b8;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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
  font-size: 1.1rem;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 0.25rem;
}

.btn-icon:hover {
  opacity: 1;
}

.text-danger:hover {
  color: var(--danger-color, #ef4444);
}

.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
}

@media (max-width: 768px) {
  .col-inv, .col-col {
    display: none;
  }
}
</style>
