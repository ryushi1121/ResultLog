/**
 * 同時実行数を絞りながら配列を処理する。
 *
 * Google Calendar API は短時間に大量のリクエストを投げると 429 を返すため、
 * Promise.all で一気に流さずワーカー数で頭を押さえる。
 * 各要素の結果は入力と同じ順序で返る。
 *
 * @param {Array} items
 * @param {(item: any, index: number) => Promise<any>} worker
 * @param {Number} limit 同時実行数
 * @returns {Promise<Array>}
 */
export const mapWithConcurrency = async (items, worker, limit = 3) => {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index], index);
      }
    }
  );

  await Promise.all(runners);
  return results;
};
