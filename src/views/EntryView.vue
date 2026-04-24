<template>
  <div class="entry-view">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? '収支編集' : '収支登録' }}</h1>
      <p class="page-subtitle">{{ isEdit ? '稼働結果を修正します' : '今日の稼働結果を記録しましょう' }}</p>
    </div>
    
    <div class="entry-content">
      <EntryForm :entryId="route.params.id" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import EntryForm from '../components/entry/EntryForm.vue';

const route = useRoute();
const isEdit = computed(() => !!route.params.id);
</script>

<style scoped>
.entry-view {
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color, #ffffff);
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, #00d4ff, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
}

.entry-content {
  margin-bottom: 3rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
