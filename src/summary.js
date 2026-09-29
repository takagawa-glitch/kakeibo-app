// 集計用の関数
import { CATEGORIES } from './categories.js';

// 日付（YYYY-MM-DD）から月（YYYY-MM）を取り出す。不明な日付は「日付不明」
export function toMonth(date) {
  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : '日付不明';
}

// 登録されている月の一覧（新しい順）
export function listMonths(receipts) {
  const months = new Set(receipts.map((r) => toMonth(r.date)));
  return [...months].sort().reverse();
}

// カテゴリ別の合計金額 { 食費: 1200, ... }
export function totalsByCategory(receipts) {
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const receipt of receipts) {
    for (const item of receipt.items) {
      totals[item.category] = (totals[item.category] ?? 0) + item.price;
    }
  }
  return totals;
}

// 月別・カテゴリ別の合計金額 { '2026-09': { 食費: 1200, ... }, ... }（古い順）
export function totalsByMonth(receipts) {
  const result = {};
  for (const month of listMonths(receipts).reverse()) {
    const inMonth = receipts.filter((r) => toMonth(r.date) === month);
    result[month] = totalsByCategory(inMonth);
  }
  return result;
}

// 金額を「¥1,234」の形式にする（マイナスは「-¥50」）
export function formatYen(value) {
  const sign = value < 0 ? '-' : '';
  return `${sign}¥${Math.abs(value).toLocaleString('ja-JP')}`;
}
