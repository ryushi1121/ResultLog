<template>
  <div class="entry-form-container">
    <form @submit.prevent="submitForm" class="entry-form">
      <div class="form-group">
        <label for="date" class="form-label">日付</label>
        <input 
          id="date" 
          type="date" 
          v-model="formData.date" 
          class="form-control"
          required
        />
      </div>

      <SuggestInput
        id="store"
        v-model="formData.store"
        label="店舗名"
        placeholder="例: マルハン新宿東口店"
        :suggestions="suggestStores"
        required
      />

      <SuggestInput
        id="machine"
        v-model="formData.machine"
        label="機種名"
        placeholder="例: バジリスク絆2天膳"
        :suggestions="suggestMachines"
      />

      <div class="form-group">
        <label for="slotNumber" class="form-label">台番号（任意）</label>
        <input 
          id="slotNumber" 
          type="text" 
          v-model="formData.slotNumber" 
          placeholder="例: 456"
          class="form-control"
        />
      </div>

      <div class="form-row">
        <div class="form-group half">
          <label for="startTime" class="form-label">開始時間</label>
          <input
            id="startTime"
            type="time"
            v-model="formData.startTime"
            class="form-control"
          />
        </div>

        <div class="form-group half">
          <label for="endTime" class="form-label">終了時間</label>
          <input
            id="endTime"
            type="time"
            v-model="formData.endTime"
            class="form-control"
          />
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <h4 class="section-title">投資</h4>
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label for="investmentCash" class="form-label">現金 (円)</label>
            <input 
              id="investmentCash" 
              type="number" 
              v-model.number="formData.investmentCash" 
              placeholder="0"
              class="form-control amount-input investment-input"
              min="0"
              step="100"
            />
          </div>

          <div class="form-group half">
            <label for="investmentMedal" class="form-label">貯メダル (枚)</label>
            <input 
              id="investmentMedal" 
              type="number" 
              v-model.number="formData.investmentMedal" 
              placeholder="0"
              class="form-control amount-input investment-input"
              min="0"
              step="1"
            />
          </div>
        </div>
        <div class="total-display">
          <span>換算額: </span>
          <strong>{{ totalInvestment.toLocaleString() }} 円</strong>
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <h4 class="section-title">回収</h4>
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label for="collectionCash" class="form-label">現金 (円)</label>
            <input 
              id="collectionCash" 
              type="number" 
              v-model.number="formData.collectionCash" 
              placeholder="0"
              class="form-control amount-input collection-input"
              min="0"
              step="100"
            />
          </div>

          <div class="form-group half">
            <label for="collectionMedal" class="form-label">貯メダル (枚)</label>
            <input 
              id="collectionMedal" 
              type="number" 
              v-model.number="formData.collectionMedal" 
              placeholder="0"
              class="form-control amount-input collection-input"
              min="0"
              step="1"
            />
          </div>
        </div>
        <div class="total-display">
          <span>換算額: </span>
          <strong>{{ totalCollection.toLocaleString() }} 円</strong>
        </div>
      </div>

      <div class="profit-display" :class="{ 'positive': profit > 0, 'negative': profit < 0 }">
        <span class="profit-label">収支:</span>
        <span class="profit-amount">{{ formattedProfit }}</span>
      </div>

      <div class="form-group">
        <label for="memo" class="form-label">メモ（任意）</label>
        <textarea 
          id="memo" 
          v-model="formData.memo" 
          rows="3" 
          placeholder="設定示唆、天井期待値、など"
          class="form-control"
        ></textarea>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary btn-submit" :disabled="isLoading">
          <span v-if="isLoading">保存中...</span>
          <span v-else>{{ isEditMode ? '更新する' : '登録する' }}</span>
        </button>
        <button
          v-if="isEditMode"
          type="button"
          class="btn btn-delete"
          :disabled="isLoading"
          @click="handleDelete"
        >
          <i class="fa-solid fa-trash"></i> この記録を削除する
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEntries } from '../../composables/useEntries';
import { useStoreSettings } from '../../composables/useStoreSettings';
import { formatDateForAPI } from '../../utils/dateUtils';
import { formatProfit } from '../../utils/formatters';
import SuggestInput from './SuggestInput.vue';

const props = defineProps({
  entryId: {
    type: String,
    default: null
  }
});

const router = useRouter();
const { entries, addEntry, editEntry, removeEntry, suggestStores, suggestMachines, isLoading, error } = useEntries();
const { calculateYen } = useStoreSettings();

// Initialize form data
const formData = ref({
  date: formatDateForAPI(new Date()),
  store: '',
  machine: '',
  slotNumber: '',
  investmentCash: '',
  investmentMedal: '',
  collectionCash: '',
  collectionMedal: '',
  startTime: '',
  endTime: '',
  memo: ''
});

// Computed totals using store exchange rate
const totalInvestment = computed(() => {
  const cash = Number(formData.value.investmentCash) || 0;
  const medals = Number(formData.value.investmentMedal) || 0;
  return cash + calculateYen(formData.value.store, medals);
});

const totalCollection = computed(() => {
  const cash = Number(formData.value.collectionCash) || 0;
  const medals = Number(formData.value.collectionMedal) || 0;
  return cash + calculateYen(formData.value.store, medals);
});

// Calculate profit dynamically
const profit = computed(() => {
  return totalCollection.value - totalInvestment.value;
});

const formattedProfit = computed(() => formatProfit(profit.value));

const isEditMode = computed(() => !!props.entryId);

onMounted(() => {
  if (isEditMode.value) {
    const existing = entries.value.find(e => e.id === props.entryId);
    if (existing) {
      formData.value = { 
        ...existing,
        investmentCash: existing.investmentCash !== undefined ? existing.investmentCash : existing.investment || '',
        investmentMedal: existing.investmentMedal || '',
        collectionCash: existing.collectionCash !== undefined ? existing.collectionCash : existing.collection || '',
        collectionMedal: existing.collectionMedal || ''
      };
    }
  }
});

const handleDelete = async () => {
  const entry = entries.value.find(e => e.id === props.entryId);
  const label = entry ? `${entry.date}の「${entry.store}」` : 'この記録';
  if (!window.confirm(`${label}を削除しますか？\n（この操作は元に戻せません）`)) return;
  try {
    await removeEntry(props.entryId);
    router.push({ name: 'List' });
  } catch (err) {
    alert('削除に失敗しました: ' + err.message);
  }
};

const submitForm = async () => {
  try {
    const entryData = {
      ...formData.value,
      investment: totalInvestment.value,
      investmentCash: Number(formData.value.investmentCash) || 0,
      investmentMedal: Number(formData.value.investmentMedal) || 0,
      collection: totalCollection.value,
      collectionCash: Number(formData.value.collectionCash) || 0,
      collectionMedal: Number(formData.value.collectionMedal) || 0
    };
    
    if (isEditMode.value) {
      await editEntry(props.entryId, entryData);
      router.push({ name: 'List' });
    } else {
      await addEntry(entryData);
      router.push({ name: 'Dashboard' });
    }
  } catch (err) {
    console.error('Registration/Update failed:', err);
    // Error is handled by useEntries and displayed in the template
  }
};
</script>

<style scoped>
.entry-form-container {
  max-width: 600px;
  margin: 0 auto;
  background-color: var(--bg-card-color, #16213e);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.entry-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-section {
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  margin: 0;
  font-size: 1.1rem;
  color: var(--primary-color, #00d4ff);
  font-weight: 600;
}

.total-display {
  margin-top: 0.75rem;
  text-align: right;
  font-size: 0.9rem;
  color: #94a3b8;
}

.total-display strong {
  color: #e2e8f0;
  font-size: 1rem;
}

.half {
  flex: 1;
}

.form-label {
  font-weight: 500;
  color: var(--text-color, #e2e8f0);
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  background-color: rgba(15, 15, 26, 0.5);
  color: var(--text-color, #ffffff);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color, #00d4ff);
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2);
}

textarea.form-control {
  resize: vertical;
}

.amount-input {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
}

.investment-input:focus {
  border-color: var(--danger-color, #ef4444);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.collection-input:focus {
  border-color: var(--success-color, #22c55e);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.profit-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
}

.profit-label {
  color: #94a3b8;
}

.profit-display.positive .profit-amount {
  color: var(--success-color, #22c55e);
}

.profit-display.negative .profit-amount {
  color: var(--danger-color, #ef4444);
}

.error-message {
  color: var(--danger-color, #ef4444);
  background-color: rgba(239, 68, 68, 0.1);
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.form-actions {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0.875rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color, #00d4ff), var(--secondary-color, #7c3aed));
  color: white;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-delete {
  background: transparent;
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
  font-size: 0.9rem;
  padding: 0.65rem 1.5rem;
}
.btn-delete:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}
</style>
