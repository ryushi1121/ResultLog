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

// 初期化と監視はモジュール読み込み時の1回だけ。
// useTheme() の中で watch すると呼ばれた回数だけ監視が積み上がり、
// setup 外から呼ばれた場合はコンポーネントが破棄されても解除されない
applyTheme(theme.value);
watch(theme, applyTheme);

export function useTheme() {
  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  };

  return { theme, toggleTheme };
}
