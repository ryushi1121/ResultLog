import { ref, readonly } from 'vue';

// 表示中のトースト（モジュールスコープでアプリ全体に1つ）
const toasts = ref([]);

let nextId = 0;

const DEFAULT_DURATION = 4000;

/**
 * 画面右下にメッセージを出す。
 * alert() と違って操作をブロックしないので、削除や同期の失敗通知に使う。
 *
 * @param {String} message
 * @param {'error'|'success'|'info'} type
 * @param {Number} duration ミリ秒
 */
const showToast = (message, type = 'info', duration = DEFAULT_DURATION) => {
  const id = ++nextId;
  toasts.value.push({ id, message, type });
  setTimeout(() => dismissToast(id), duration);
  return id;
};

const dismissToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};

export function useToast() {
  return {
    toasts: readonly(toasts),
    showToast,
    showError: (message, duration) => showToast(message, 'error', duration),
    showSuccess: (message, duration) => showToast(message, 'success', duration),
    dismissToast
  };
}
