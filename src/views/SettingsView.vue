<template>
  <div class="settings-view">
    <div class="page-header">
      <h1 class="page-title">設定</h1>
      <p class="page-subtitle">アプリの設定とアカウント管理</p>
    </div>

    <div class="settings-grid">
      <!-- アカウント情報 -->
      <div class="card settings-card">
        <h3>Google アカウント</h3>
        <div v-if="user" class="account-info">
          <img :src="user.picture" alt="Profile" class="profile-pic" v-if="user.picture" />
          <div class="account-details">
            <div class="account-name">{{ user.name }}</div>
            <div class="account-email">{{ user.email }}</div>
          </div>
        </div>
        <div class="settings-actions mt-4">
          <button class="btn btn-danger" @click="handleLogout">
            <span class="icon">🚪</span> ログアウト
          </button>
        </div>
      </div>

      <!-- 店舗別設定 -->
      <div class="card settings-card">
        <h3>店舗別設定 (交換率)</h3>
        <p class="text-muted text-sm mb-4">
          スロットの交換率（例：5.1枚交換の場合は「5.1」）を設定します。設定していない店舗はデフォルトで「5.0」として計算されます。
        </p>

        <div class="store-rate-form mb-4">
          <div class="form-group">
            <label class="form-label text-sm">店舗名</label>
            <!-- 既存の店舗または新規入力 -->
            <input 
              type="text" 
              v-model="newStoreName" 
              class="form-control" 
              placeholder="店舗名を入力" 
              list="store-list"
            />
            <datalist id="store-list">
              <option v-for="store in suggestStores" :key="store" :value="store"></option>
            </datalist>
          </div>
          <div class="form-group mt-2">
            <label class="form-label text-sm">交換率 (〇〇枚交換)</label>
            <div class="rate-input-group">
              <input 
                type="number" 
                v-model.number="newStoreRate" 
                class="form-control" 
                placeholder="5.0" 
                step="0.01"
                min="1"
              />
              <span class="rate-suffix">枚交換</span>
            </div>
          </div>
          <button class="btn btn-primary mt-3 w-100" @click="handleSaveStoreRate" :disabled="!newStoreName || !newStoreRate">
            設定を保存
          </button>
        </div>

        <div class="store-list-container">
          <h4 class="text-sm mb-2">設定済み店舗</h4>
          <ul class="store-rate-list" v-if="Object.keys(storeSettings).length > 0">
            <li v-for="(settings, store) in storeSettings" :key="store" class="store-rate-item">
              <div class="store-rate-info">
                <span class="store-name">{{ store }}</span>
                <span class="store-rate">{{ settings.exchangeRate }} 枚交換</span>
              </div>
              <button class="btn-icon btn-delete" @click="handleRemoveStore(store)" title="削除">
                🗑️
              </button>
            </li>
          </ul>
          <p v-else class="text-muted text-sm text-center py-2">
            設定されている店舗はありません
          </p>
        </div>
      </div>

      <!-- データ管理 -->
      <div class="card settings-card">
        <h3>データ管理</h3>
        <p class="text-muted text-sm mb-4">
          データはすべてGoogleカレンダー（「ResultLog」プレフィックス付き）に保存されています。
        </p>
        <div class="settings-actions">
          <button class="btn btn-primary" @click="handleSync" :disabled="isLoading">
            <span class="icon">🔄</span>
            {{ isLoading ? '同期中...' : '手動で同期する' }}
          </button>
        </div>
        <p v-if="syncMessage" class="sync-message mt-2 text-sm text-success">
          {{ syncMessage }}
        </p>
      </div>

      <!-- アプリ情報 -->
      <div class="card settings-card">
        <h3>アプリ情報</h3>
        <ul class="app-info-list">
          <li><strong>バージョン:</strong> 1.0.0</li>
          <li><strong>開発環境:</strong> Vue 3 + Vite</li>
          <li><strong>PWA:</strong> 対応済み</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useEntries } from '@/composables/useEntries';
import { useStoreSettings } from '@/composables/useStoreSettings';

const router = useRouter();
const { user, logout } = useAuth();
const { loadEntries, clearEntries, isLoading, suggestStores } = useEntries();
const { storeSettings, setExchangeRate, removeStoreSettings } = useStoreSettings();

const syncMessage = ref('');
const newStoreName = ref('');
const newStoreRate = ref(5.0);

const handleSaveStoreRate = () => {
  if (newStoreName.value && newStoreRate.value) {
    setExchangeRate(newStoreName.value, newStoreRate.value);
    newStoreName.value = '';
    newStoreRate.value = 5.0;
  }
};

const handleRemoveStore = (store) => {
  if (confirm(`「${store}」の設定を削除しますか？`)) {
    removeStoreSettings(store);
  }
};

const handleLogout = () => {
  if (confirm('ログアウトしますか？')) {
    logout();
    clearEntries();
    router.push('/login');
  }
};

const handleSync = async () => {
  syncMessage.value = '';
  try {
    await loadEntries();
    syncMessage.value = '同期が完了しました。';
    setTimeout(() => { syncMessage.value = ''; }, 3000);
  } catch (err) {
    alert('同期に失敗しました。');
  }
};
</script>

<style scoped>
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  padding: 24px;
}

.settings-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.profile-pic {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
}

.account-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
}

.account-email {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.app-info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.app-info-list li {
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

.app-info-list li:last-child {
  border-bottom: none;
}

.app-info-list strong {
  color: #fff;
  margin-right: 8px;
}

@media (min-width: 768px) {
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
  .settings-grid > .settings-card:first-child {
    grid-column: span 2;
  }
}

.store-rate-form {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.rate-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-suffix {
  color: var(--text-secondary, #94a3b8);
  white-space: nowrap;
}

.store-list-container {
  margin-top: 20px;
}

.store-rate-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.store-rate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: rgba(15, 15, 26, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.store-rate-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.store-name {
  font-weight: 500;
  color: #fff;
}

.store-rate {
  font-size: 0.85rem;
  color: var(--primary-color, #00d4ff);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 4px;
}

.btn-icon:hover {
  opacity: 1;
}

.w-100 {
  width: 100%;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
</style>
