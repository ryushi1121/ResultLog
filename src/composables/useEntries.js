import { ref, computed } from 'vue';
import { useCalendar } from './useCalendar';
import { mapWithConcurrency } from '@/utils/concurrency';

const entries = ref([]);
const isLoading = ref(false);
const error = ref(null);
const isLoaded = ref(false);

const CACHE_KEY = 'resultlog_entries_cache';

// 取得済みデータのローカルキャッシュ。
// 全件フェッチは件数に比例して待たされるので、前回の内容を先に表示して裏で更新する
const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { email, entries: cached } = JSON.parse(raw);
    // 別アカウントのデータが混ざらないよう、保存時と同じユーザーのときだけ使う
    if (!Array.isArray(cached) || email !== localStorage.getItem('google_user_email')) return null;
    return cached;
  } catch {
    return null;
  }
};

const writeCache = (list) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      email: localStorage.getItem('google_user_email'),
      entries: list
    }));
  } catch {
    // 容量超過などで書けなくても表示自体には影響しないので握りつぶす
  }
};

// CSV取込のように短時間で何度も更新が走るケースがあるため、書き込みはまとめる
let cacheTimer = null;
const scheduleCacheWrite = () => {
  clearTimeout(cacheTimer);
  cacheTimer = setTimeout(() => writeCache(entries.value), 500);
};

export const useEntries = () => {
  const { fetchEntries: fetchApi, createEntry: createApi, updateEntry: updateApi, deleteEntry: deleteApi } = useCalendar();

  const loadEntries = async (timeMin = null, timeMax = null) => {
    if (isLoading.value) return; // 重複実行防止：同時に複数走ると prevEntries スナップショットが空になり楽観的更新データが消える
    isLoading.value = true;
    error.value = null;
    const prevEntries = entries.value.slice(); // 楽観的更新済みエントリを保持
    // 初回はキャッシュを先に見せる。2回目以降（既に表示中）は一旦空にして別アカウントの残留を防ぐ
    entries.value = entries.value.length === 0 ? (readCache() || []) : [];
    try {
      const data = await fetchApi(timeMin, timeMax);
      // 登録直後で検索インデックスに乗っていないエントリをマージして復元する
      if (prevEntries.length > 0) {
        const fetchedIds = new Set(data.map(e => e.id));
        const missing = prevEntries.filter(e => e.id && !fetchedIds.has(e.id));
        if (missing.length > 0) {
          data.push(...missing);
          data.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
      }
      entries.value = data;
      isLoaded.value = true;
      writeCache(data);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      // 取得失敗時に空の entries でキャッシュを潰さないよう、ここでは書き込まない
      isLoading.value = false;
    }
  };

  const clearEntries = () => {
    clearTimeout(cacheTimer); // 予約済みの書き込みが消したキャッシュを復活させないように
    entries.value = [];
    isLoaded.value = false;
    localStorage.removeItem(CACHE_KEY);
  };

  const addEntry = async (entryData) => {
    isLoading.value = true;
    error.value = null;
    try {
      const newEntry = await createApi(entryData);
      entries.value.unshift(newEntry);
      
      // Sort by date descending
      entries.value.sort((a, b) => new Date(b.date) - new Date(a.date));
      return newEntry;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
      scheduleCacheWrite();
    }
  };

  const editEntry = async (id, entryData) => {
    isLoading.value = true;
    error.value = null;
    try {
      const updatedEntry = await updateApi(id, entryData);
      
      const index = entries.value.findIndex(e => e.id === id);
      if (index !== -1) {
        entries.value[index] = updatedEntry;
        // Sort in case date changed
        entries.value.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      return updatedEntry;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
      scheduleCacheWrite();
    }
  };

  const removeEntry = async (id) => {
    isLoading.value = true;
    error.value = null;
    try {
      await deleteApi(id);
      entries.value = entries.value.filter(e => e.id !== id);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
      scheduleCacheWrite();
    }
  };

  const removeBulk = async (ids) => {
    isLoading.value = true;
    error.value = null;
    let failed = 0;
    try {
      // 1件ずつ + 待機だと100件で20秒以上かかる。429 は fetchWithRetry 側で吸収されるので少数並列で流す
      const results = await mapWithConcurrency(ids, async (id) => {
        try {
          await deleteApi(id);
          return id;
        } catch {
          failed++;
          return null;
        }
      });

      const succeeded = new Set(results.filter(Boolean));
      entries.value = entries.value.filter(e => !succeeded.has(e.id));
      if (failed > 0) throw new Error(`${failed}件の削除に失敗しました`);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
      scheduleCacheWrite();
    }
  };

  // Get unique stores for autocomplete
  const suggestStores = computed(() => {
    const stores = new Set();
    entries.value.forEach(e => {
      if (e.store) stores.add(e.store);
    });
    return Array.from(stores).sort();
  });

  // Get unique machines for autocomplete
  const suggestMachines = computed(() => {
    const machines = new Set();
    entries.value.forEach(e => {
      if (e.machine) machines.add(e.machine);
    });
    return Array.from(machines).sort();
  });

  return {
    entries,
    isLoading,
    isLoaded,
    error,
    loadEntries,
    clearEntries,
    addEntry,
    editEntry,
    removeEntry,
    removeBulk,
    suggestStores,
    suggestMachines
  };
};
