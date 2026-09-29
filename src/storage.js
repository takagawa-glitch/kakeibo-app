// ローカルストレージへの保存・読み込み
// データ形式: [{ id, store, date, items: [{ id, name, price, category }] }]
const STORAGE_KEY = 'kakeibo-receipts';

export function loadReceipts() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    const data = json ? JSON.parse(json) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    // 読み込めない（壊れている・使用不可）場合は空の状態から始める
    return [];
  }
}

export function saveReceipts(receipts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  } catch (error) {
    console.error('ローカルストレージへの保存に失敗しました', error);
  }
}
