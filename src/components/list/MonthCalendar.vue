<template>
  <div class="month-calendar">
    <!-- 曜日ヘッダー -->
    <div class="cal-header">
      <div
        v-for="d in DAYS"
        :key="d"
        class="cal-dow"
        :class="{ 'is-sun': d === '日', 'is-sat': d === '土' }"
      >{{ d }}</div>
    </div>

    <!-- 日付グリッド -->
    <div class="cal-grid">
      <div v-for="n in startOffset" :key="`gap-${n}`" class="cal-cell cal-cell--gap" />
      <div
        v-for="day in daysInMonth"
        :key="day"
        class="cal-cell"
        :class="[cellClass(day), { 'is-today': isToday(day), 'is-selected': selectedDay === day }]"
        @click="handleDayClick(day)"
      >
        <span class="cal-day-num" :class="dowClass(day)">{{ day }}</span>
        <template v-if="entryMap[day]">
          <span class="cal-profit" :class="profitClass(dayTotal(day))">
            {{ compactProfit(dayTotal(day)) }}
          </span>
          <span v-if="entryMap[day].length > 1" class="cal-badge">{{ entryMap[day].length }}</span>
        </template>
      </div>
    </div>

    <!-- 月合計 -->
    <div class="cal-summary">
      <span class="cal-summary-label">月計</span>
      <span class="cal-summary-profit" :class="profitClass(monthTotal)">{{ formatProfit(monthTotal) }}</span>
      <span class="cal-summary-sub">{{ props.entries.length }}件 / 投資 {{ formatCurrency(monthInv) }} 回収 {{ formatCurrency(monthCol) }}</span>
    </div>

    <!-- 選択日の詳細パネル -->
    <transition name="slide-down">
      <div v-if="selectedDay && entryMap[selectedDay]" class="day-panel">
        <div class="day-panel-header">
          <span class="day-panel-title">
            {{ yearMonth.replace('-', '/') }}/{{ String(selectedDay).padStart(2, '0') }}（{{ selectedDayDow }}）
          </span>
          <span class="day-panel-total" :class="profitClass(dayTotal(selectedDay))">
            {{ formatProfit(dayTotal(selectedDay)) }}
          </span>
          <button class="day-panel-close" @click="selectedDay = null">✕</button>
        </div>
        <div
          v-for="entry in entryMap[selectedDay]"
          :key="entry.id"
          class="day-panel-entry"
          @click="editEntry(entry)"
        >
          <div class="dpe-main">
            <span class="dpe-store">{{ entry.store }}</span>
            <span class="dpe-machine">{{ entry.machine }}{{ entry.slotNumber ? ` #${entry.slotNumber}` : '' }}</span>
          </div>
          <div class="dpe-right">
            <span class="dpe-profit" :class="profitClass(entry.profit)">{{ formatProfit(entry.profit) }}</span>
            <span class="dpe-inv">{{ formatCurrency(entry.investment) }}/{{ formatCurrency(entry.collection) }}</span>
          </div>
          <i class="fa-solid fa-chevron-right dpe-arrow"></i>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { formatProfit, formatCurrency } from '../../utils/formatters';

const router = useRouter();

const props = defineProps({
  entries:   { type: Array,  required: true },
  yearMonth: { type: String, required: true } // 'YYYY-MM'
});

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

const selectedDay = ref(null);

// フィルタ変更時に選択をリセット
watch(() => props.yearMonth, () => { selectedDay.value = null; });

const year  = computed(() => parseInt(props.yearMonth.split('-')[0]));
const month = computed(() => parseInt(props.yearMonth.split('-')[1]));

const daysInMonth  = computed(() => new Date(year.value, month.value, 0).getDate());
const startOffset  = computed(() => new Date(year.value, month.value - 1, 1).getDay()); // 0=日

// エントリを日付(number)でマップ
const entryMap = computed(() => {
  const map = {};
  for (const entry of props.entries) {
    const day = parseInt(entry.date.split('-')[2]);
    if (!map[day]) map[day] = [];
    map[day].push(entry);
  }
  return map;
});

const dayTotal = (day) => (entryMap.value[day] || []).reduce((s, e) => s + e.profit, 0);

const monthTotal = computed(() => props.entries.reduce((s, e) => s + e.profit, 0));
const monthInv   = computed(() => props.entries.reduce((s, e) => s + e.investment, 0));
const monthCol   = computed(() => props.entries.reduce((s, e) => s + e.collection, 0));

const selectedDayDow = computed(() => {
  if (!selectedDay.value) return '';
  return DAYS[new Date(year.value, month.value - 1, selectedDay.value).getDay()];
});

// ---- スタイル用 ----
const profitClass = (v) => v > 0 ? 'positive' : v < 0 ? 'negative' : 'zero';

const cellClass = (day) => {
  if (!entryMap.value[day]) return '';
  const t = dayTotal(day);
  return t > 0 ? 'cal-cell--positive' : t < 0 ? 'cal-cell--negative' : 'cal-cell--zero';
};

const dowClass = (day) => {
  const dow = (startOffset.value + day - 1) % 7;
  if (dow === 0) return 'is-sun';
  if (dow === 6) return 'is-sat';
  return '';
};

const isToday = (day) => {
  const t = new Date();
  return t.getFullYear() === year.value && t.getMonth() + 1 === month.value && t.getDate() === day;
};

const compactProfit = (value) => {
  if (value === 0) return '±0';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString()}`;
};

// ---- クリック ----
const handleDayClick = (day) => {
  if (!entryMap.value[day]) return;
  selectedDay.value = selectedDay.value === day ? null : day;
};

const editEntry = (entry) => {
  router.push({ name: 'EntryEdit', params: { id: entry.id } });
};
</script>

<style scoped>
.month-calendar {
  background: var(--bg-card-color);
  border-radius: 1rem;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* ---- 曜日ヘッダー ---- */
.cal-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--overlay-2);
  border-bottom: 1px solid var(--border-subtle);
}
.cal-dow {
  text-align: center;
  padding: 8px 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-faded);
}
.cal-dow.is-sun { color: #dc322f; }
.cal-dow.is-sat { color: #268bd2; }

/* ---- グリッド ---- */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border-subtle);
}

.cal-cell {
  background: var(--bg-card-color);
  min-height: 72px;
  padding: 6px;
  cursor: default;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  transition: background 0.15s;
  position: relative;
}
.cal-cell--gap {
  background: var(--overlay-1);
  cursor: default;
}
.cal-cell:not(.cal-cell--gap):hover {
  background: var(--surface-hover);
}

.cal-cell--positive {
  background: var(--color-win-bg);
  cursor: pointer;
}
.cal-cell--positive:hover { background: rgba(133, 153, 0, 0.18); }
.cal-cell--negative {
  background: var(--color-lose-bg);
  cursor: pointer;
}
.cal-cell--negative:hover { background: rgba(220, 50, 47, 0.15); }
.cal-cell--zero {
  background: var(--surface-hover);
  cursor: pointer;
}

.cal-cell.is-today .cal-day-num {
  background: var(--accent-primary);
  color: var(--text-inverse);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.cal-cell.is-selected {
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}

.cal-day-num {
  font-size: 0.82rem;
  color: var(--text-sub);
  font-weight: 500;
  line-height: 1;
}
.cal-day-num.is-sun { color: #dc322f; }
.cal-day-num.is-sat { color: #268bd2; }

.cal-profit {
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.cal-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 0.65rem;
  background: rgba(var(--accent-primary-rgb), 0.2);
  color: var(--accent-primary);
  border-radius: 99px;
  padding: 0 5px;
  line-height: 1.5;
}

/* ---- カラー ---- */
.positive { color: var(--success-color); }
.negative { color: var(--danger-color); }
.zero     { color: var(--text-sub); }

/* ---- 月合計 ---- */
.cal-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--overlay-2);
  border-top: 1px solid var(--border-subtle);
  flex-wrap: wrap;
}
.cal-summary-label {
  font-size: 0.8rem;
  color: var(--text-faded);
  font-weight: 600;
}
.cal-summary-profit {
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.cal-summary-sub {
  font-size: 0.75rem;
  color: var(--text-faded);
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}

/* ---- 選択日パネル ---- */
.day-panel {
  border-top: 1px solid var(--border-subtle);
  background: var(--overlay-1);
}
.day-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 8px;
  border-bottom: 1px solid var(--border-subtle);
}
.day-panel-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-main);
}
.day-panel-total { font-size: 0.88rem; font-weight: 700; }
.day-panel-close {
  margin-left: auto;
  background: transparent;
  border: none;
  color: var(--text-faded);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s;
}
.day-panel-close:hover { color: var(--text-main); }

.day-panel-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background 0.15s;
}
.day-panel-entry:hover { background: rgba(var(--accent-primary-rgb), 0.05); }

.dpe-main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.dpe-store {
  font-size: 0.88rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dpe-machine {
  font-size: 0.77rem;
  color: var(--text-sub);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dpe-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.dpe-profit { font-size: 0.88rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.dpe-inv   { font-size: 0.73rem; color: var(--text-faded); font-variant-numeric: tabular-nums; }
.dpe-arrow { font-size: 0.65rem; color: var(--text-faded); flex-shrink: 0; }

/* ---- アニメーション ---- */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top;
}
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: scaleY(0.95); }

/* ---- レスポンシブ ---- */
@media (max-width: 480px) {
  .cal-cell { min-height: 56px; padding: 4px; gap: 2px; }
  .cal-profit  { font-size: 0.68rem; }
  .cal-day-num { font-size: 0.75rem; }
  .cal-summary-sub { display: none; }
}
</style>
