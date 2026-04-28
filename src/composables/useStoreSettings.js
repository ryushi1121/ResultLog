import { ref, watch } from 'vue';

const STORE_SETTINGS_KEY = 'resultlog_store_settings';

// Load from localStorage
const loadSettings = () => {
  const stored = localStorage.getItem(STORE_SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse store settings', e);
    }
  }
  return {};
};

const storeSettings = ref(loadSettings());

// Save to localStorage whenever it changes
watch(storeSettings, (newVal) => {
  localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(newVal));
}, { deep: true });

export const useStoreSettings = () => {
  /**
   * Get the exchange rate for a store. Defaults to 5.0 (等価)
   * @param {String} storeName
   * @returns {Number} 5.0, 5.1, etc.
   */
  const getExchangeRate = (storeName) => {
    if (!storeName || !storeSettings.value[storeName]) {
      return 5.0; // Default: 5.0枚交換
    }
    return storeSettings.value[storeName].exchangeRate || 5.0;
  };

  /**
   * Set the exchange rate for a store.
   * @param {String} storeName
   * @param {Number} rate 
   */
  const setExchangeRate = (storeName, rate) => {
    if (!storeName) return;
    if (!storeSettings.value[storeName]) {
      storeSettings.value[storeName] = {};
    }
    storeSettings.value[storeName].exchangeRate = rate;
  };

  /**
   * Remove a store's settings.
   */
  const removeStoreSettings = (storeName) => {
    if (storeSettings.value[storeName]) {
      delete storeSettings.value[storeName];
    }
  };

  /**
   * Calculate yen equivalent of medals based on store's exchange rate.
   * "X枚交換" means X medals = 100 yen.
   * So 1 medal = 100 / X yen.
   */
  const calculateYen = (storeName, medals) => {
    if (!medals) return 0;
    const rate = getExchangeRate(storeName);
    // 1枚単価を小数第2位で四捨五入（例: 5.1枚交換 → 100/5.1=19.607...→19.6円）
    const yenPerMedal = Math.round(100 / rate * 10) / 10;
    return Math.round(medals * yenPerMedal);
  };

  return {
    storeSettings,
    getExchangeRate,
    setExchangeRate,
    removeStoreSettings,
    calculateYen
  };
};
