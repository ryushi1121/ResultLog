<template>
  <div class="suggest-input">
    <label v-if="label" :for="id" class="form-label">{{ label }}</label>
    <div class="input-wrapper">
      <input
        :id="id"
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        :list="listId"
        class="form-control"
        :required="required"
        autocomplete="off"
      />
      <datalist :id="listId">
        <option v-for="suggestion in suggestions" :key="suggestion" :value="suggestion" />
      </datalist>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

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
  suggestions: {
    type: Array,
    default: () => []
  },
  required: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:modelValue']);

const listId = computed(() => `${props.id}-list`);
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

.input-wrapper {
  position: relative;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
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
</style>
