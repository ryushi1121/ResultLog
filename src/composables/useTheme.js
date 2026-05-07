import { ref, watch } from 'vue';

const STORAGE_KEY = 'resultlog-theme';
const theme = ref(localStorage.getItem(STORAGE_KEY) || 'dark');

const applyTheme = (t) => {
  if (t === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem(STORAGE_KEY, t);
};

// 初期化
applyTheme(theme.value);

export function useTheme() {
  watch(theme, applyTheme);

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  };

  return { theme, toggleTheme };
}
