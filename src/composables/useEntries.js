import { ref, computed } from 'vue';
import { useCalendar } from './useCalendar';

const entries = ref([]);
const isLoading = ref(false);
const error = ref(null);
const isLoaded = ref(false);

export const useEntries = () => {
  const { fetchEntries: fetchApi, createEntry: createApi, updateEntry: updateApi, deleteEntry: deleteApi } = useCalendar();

  const loadEntries = async (timeMin = null, timeMax = null) => {
    isLoading.value = true;
    error.value = null;
    entries.value = []; // Clear old data to prevent cross-account leak
    try {
      const data = await fetchApi(timeMin, timeMax);
      entries.value = data;
      isLoaded.value = true;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearEntries = () => {
    entries.value = [];
    isLoaded.value = false;
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
    }
  };

  const removeBulk = async (ids) => {
    isLoading.value = true;
    error.value = null;
    const succeeded = [];
    let failed = 0;
    try {
      for (let i = 0; i < ids.length; i++) {
        try {
          await deleteApi(ids[i]);
          succeeded.push(ids[i]);
        } catch {
          failed++;
        }
        if (i < ids.length - 1) await new Promise(r => setTimeout(r, 200));
      }
      entries.value = entries.value.filter(e => !succeeded.includes(e.id));
      if (failed > 0) throw new Error(`${failed}件の削除に失敗しました`);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
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
