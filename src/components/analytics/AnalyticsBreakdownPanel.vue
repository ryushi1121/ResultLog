<template>
  <transition name="slide-down">
    <div class="breakdown-panel">
      <div class="breakdown-panel-header">
        <span class="breakdown-panel-title">{{ title }}の内訳（{{ entries.length }}件）</span>
        <span class="breakdown-panel-total" :class="profitClass(totalProfit)">
          {{ formatProfit(totalProfit) }}
        </span>
        <button class="breakdown-panel-close" @click="$emit('close')">✕</button>
      </div>

      <div v-if="sortedEntries.length === 0" class="breakdown-panel-empty">
        データがありません
      </div>
      <div
        v-for="entry in sortedEntries"
        :key="entry.id"
        class="breakdown-entry"
        @click="editEntry(entry)"
      >
        <div class="bde-main">
          <div class="bde-top">
            <span class="bde-date">{{ formatDate(entry) }}</span>
            <span class="bde-store">{{ entry.store }}</span>
          </div>
          <span class="bde-machine">{{ entry.machine }}{{ entry.slotNumber ? ` #${entry.slotNumber}` : '' }}</span>
        </div>
        <div class="bde-right">
          <span class="bde-profit" :class="profitClass(entry.profit)">{{ formatProfit(entry.profit) }}</span>
          <span class="bde-inv">{{ formatCurrency(entry.investment) }}/{{ formatCurrency(entry.collection) }}</span>
        </div>
        <i class="fa-solid fa-chevron-right bde-arrow"></i>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { formatProfit, formatCurrency } from '@/utils/formatters';

const props = defineProps({
  title:   { type: String, required: true },
  entries: { type: Array,  required: true }
});
defineEmits(['close']);

const router = useRouter();

const sortedEntries = computed(() =>
  [...props.entries].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
);

const totalProfit = computed(() => props.entries.reduce((s, e) => s + (e.profit || 0), 0));

const profitClass = (v) => v > 0 ? 'positive' : v < 0 ? 'negative' : 'zero';

const formatDate = (entry) => {
  if (!entry.date) return '';
  const [, m, d] = entry.date.split('-');
  const dow = entry.dayOfWeek ? `（${entry.dayOfWeek}）` : '';
  return `${parseInt(m)}/${parseInt(d)}${dow}`;
};

const editEntry = (entry) => {
  router.push({ name: 'EntryEdit', params: { id: entry.id } });
};
</script>

<style scoped>
.breakdown-panel {
  border-top: 1px solid var(--border-subtle);
  background: var(--overlay-1);
  border-radius: 0 0 10px 10px;
  margin-top: 12px;
  overflow: hidden;
}
.breakdown-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 8px;
  border-bottom: 1px solid var(--border-subtle);
}
.breakdown-panel-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
}
.breakdown-panel-total { font-size: 0.88rem; font-weight: 700; }
.breakdown-panel-close {
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
.breakdown-panel-close:hover { color: var(--text-main); }

.breakdown-panel-empty {
  padding: 16px 14px;
  font-size: 0.85rem;
  color: var(--text-faded);
}

.breakdown-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background 0.15s;
}
.breakdown-entry:hover { background: rgba(var(--accent-primary-rgb), 0.05); }

.bde-main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.bde-top { display: flex; align-items: baseline; gap: 8px; }
.bde-date {
  font-size: 0.78rem;
  color: var(--text-faded);
  flex-shrink: 0;
}
.bde-store {
  font-size: 0.88rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bde-machine {
  font-size: 0.77rem;
  color: var(--text-sub);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bde-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.bde-profit { font-size: 0.88rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.bde-inv   { font-size: 0.73rem; color: var(--text-faded); font-variant-numeric: tabular-nums; }
.bde-arrow { font-size: 0.65rem; color: var(--text-faded); flex-shrink: 0; }

.positive { color: var(--success-color); }
.negative { color: var(--danger-color); }
.zero     { color: var(--text-sub); }

.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top;
}
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: scaleY(0.95); }
</style>
