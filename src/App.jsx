import { useEffect, useMemo, useState } from 'react';
import ReceiptUpload from './components/ReceiptUpload.jsx';
import ItemList from './components/ItemList.jsx';
import Charts from './components/Charts.jsx';
import { loadReceipts, saveReceipts } from './storage.js';
import { listMonths, toMonth } from './summary.js';

export default function App() {
  // 初回表示時にローカルストレージから読み込む
  const [receipts, setReceipts] = useState(loadReceipts);
  // 表示する月（'all' は全期間）
  const [month, setMonth] = useState('all');

  // データが変わるたびにローカルストレージへ保存する
  useEffect(() => {
    saveReceipts(receipts);
  }, [receipts]);

  const months = useMemo(() => listMonths(receipts), [receipts]);

  // 選択中の月のレシートだけを取り出す
  const visibleReceipts = useMemo(
    () => (month === 'all' ? receipts : receipts.filter((r) => toMonth(r.date) === month)),
    [receipts, month],
  );

  // 読み取り結果をレシートとして追加する
  function handleAdd(result) {
    const receipt = {
      id: crypto.randomUUID(),
      store: result.store,
      date: result.date,
      time: result.time,
      items: result.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
    };
    setReceipts((prev) => [receipt, ...prev]);
    setMonth('all');
  }

  // 商品のカテゴリを手動で変更する
  function handleChangeCategory(receiptId, itemId, category) {
    setReceipts((prev) =>
      prev.map((r) =>
        r.id !== receiptId
          ? r
          : { ...r, items: r.items.map((i) => (i.id === itemId ? { ...i, category } : i)) },
      ),
    );
  }

  // 商品を1件削除する（商品がなくなったレシートも削除する）
  function handleDeleteItem(receiptId, itemId) {
    setReceipts((prev) =>
      prev
        .map((r) => (r.id !== receiptId ? r : { ...r, items: r.items.filter((i) => i.id !== itemId) }))
        .filter((r) => r.items.length > 0),
    );
  }

  // レシート1枚分をまとめて削除する
  function handleDeleteReceipt(receiptId) {
    if (!confirm('このレシートを削除しますか？')) return;
    setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
  }

  return (
    <div className="container">
      <header>
        <h1>レシート家計簿</h1>
        <p className="subtitle">レシートの写真をアップロードすると、自動で読み取って記録します</p>
      </header>

      <ReceiptUpload receipts={receipts} onAdd={handleAdd} />

      {receipts.length > 0 && (
        <div className="month-filter">
          <label>
            表示する月：
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">全期間</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <Charts receipts={receipts} visibleReceipts={visibleReceipts} />

      <ItemList
        receipts={visibleReceipts}
        onChangeCategory={handleChangeCategory}
        onDeleteItem={handleDeleteItem}
        onDeleteReceipt={handleDeleteReceipt}
      />
    </div>
  );
}
