<template>
  <div class="suggest-input" ref="rootRef">
    <label v-if="label" :for="id" class="form-label">{{ label }}</label>

    <!-- よく使う候補：ワンタップで入力 -->
    <div v-if="chips.length" class="chips">
      <button
        v-for="chip in chips"
        :key="chip"
        type="button"
        class="chip"
        :class="{ active: chip === modelValue }"
        @click="select(chip)"
      >{{ chip }}</button>
    </div>

    <div class="input-wrapper">
      <input
        :id="id"
        type="text"
        :value="modelValue"
        @input="onInput"
        @focus="open = true"
        @keydown="onKeydown"
        :placeholder="placeholder"
        class="form-control"
        :required="required"
        autocomplete="off"
        role="combobox"
        :aria-expanded="showList"
        :aria-controls="listId"
      />
      <button
        v-if="modelValue"
        type="button"
        class="clear-btn"
        aria-label="クリア"
        @click="clear"
      >×</button>

      <!-- 候補リスト：縦並びで1行ずつタップ -->
      <ul v-if="showList" :id="listId" class="suggest-list" role="listbox">
        <li
          v-for="(item, i) in filtered"
          :key="item"
          role="option"
          :aria-selected="i === activeIndex"
          :class="{ active: i === activeIndex }"
          @mousedown.prevent="select(item)"
        >{{ item }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  // よく使う順に並んでいる前提
  suggestions: {
    type: Array,
    default: () => []
  },
  required: {
    type: Boolean,
    default: false
  },
  chipCount: {
    type: Number,
    default: 4
  },
  maxItems: {
    type: Number,
    default: 30
  }
});

const emit = defineEmits(['update:modelValue']);

const rootRef = ref(null);
const open = ref(false);
const activeIndex = ref(-1);

const listId = computed(() => `${props.id}-list`);

const chips = computed(() => props.suggestions.slice(0, props.chipCount));

// 大文字小文字・全角半角・空白の違いは無視して部分一致
const normalize = (s) => s.normalize('NFKC').toLowerCase().replace(/\s+/g, '');

const filtered = computed(() => {
  const q = normalize(props.modelValue || '');
  const list = q
    ? props.suggestions.filter(s => normalize(s).includes(q) && s !== props.modelValue)
    : props.suggestions;
  return list.slice(0, props.maxItems);
});

const showList = computed(() => open.value && filtered.value.length > 0);

const onInput = (e) => {
  emit('update:modelValue', e.target.value);
  open.value = true;
  activeIndex.value = -1;
};

const select = (value) => {
  emit('update:modelValue', value);
  open.value = false;
  activeIndex.value = -1;
};

const clear = () => {
  emit('update:modelValue', '');
  open.value = true;
};

const onKeydown = (e) => {
  if (!showList.value) return;
  const last = filtered.value.length - 1;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value = activeIndex.value >= last ? 0 : activeIndex.value + 1;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value = activeIndex.value <= 0 ? last : activeIndex.value - 1;
  } else if (e.key === 'Enter' && activeIndex.value >= 0) {
    e.preventDefault();
    select(filtered.value[activeIndex.value]);
  } else if (e.key === 'Escape') {
    open.value = false;
  }
};

// 外側タップ・フォーカス移動で閉じる
const onOutside = (e) => {
  if (rootRef.value && !rootRef.value.contains(e.target)) open.value = false;
};

onMounted(() => {
  document.addEventListener('pointerdown', onOutside);
  document.addEventListener('focusin', onOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside);
  document.removeEventListener('focusin', onOutside);
});
</script>

<style scoped>
.suggest-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: var(--text-color, #e2e8f0);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chip {
  max-width: 100%;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  background-color: transparent;
  color: var(--text-color, #e2e8f0);
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip.active {
  border-color: var(--primary-color, #00d4ff);
  background-color: rgba(0, 212, 255, 0.15);
  color: var(--primary-color, #00d4ff);
}

.input-wrapper {
  position: relative;
}

.form-control {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  background-color: var(--bg-card-color, #16213e);
  color: var(--text-color, #ffffff);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color, #00d4ff);
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2);
}

.clear-btn {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: var(--text-muted, #94a3b8);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}

.suggest-list {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  z-index: 20;
  max-height: 16rem;
  overflow-y: auto;
  margin: 0;
  padding: 0.25rem 0;
  list-style: none;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  background-color: var(--bg-card-color, #16213e);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  -webkit-overflow-scrolling: touch;
}

.suggest-list li {
  padding: 0.75rem 1rem;
  min-height: 44px;
  color: var(--text-color, #ffffff);
  cursor: pointer;
}

.suggest-list li + li {
  border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
}

.suggest-list li.active,
.suggest-list li:hover {
  background-color: rgba(0, 212, 255, 0.12);
}
</style>
