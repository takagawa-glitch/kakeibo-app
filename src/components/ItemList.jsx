import { CATEGORIES } from '../categories.js';
import { formatYen } from '../summary.js';

// 読み取った商品の一覧（レシートごとに表示）
export default function ItemList({ receipts, onChangeCategory, onDeleteItem, onDeleteReceipt }) {
  if (receipts.length === 0) {
    return (
      <section className="card">
        <h2>登録した商品</h2>
        <p className="empty">まだデータがありません。レシートを読み込んでください。</p>
      </section>
    );
  }

  // 日付の新しい順に並べる
  const sorted = [...receipts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <section className="card">
      <h2>登録した商品</h2>
      {sorted.map((receipt) => {
        const total = receipt.items.reduce((sum, item) => sum + item.price, 0);
        return (
          <div key={receipt.id} className="receipt">
            <div className="receipt-header">
              <span>
                <strong>
                  {receipt.date || '日付不明'}
                  {receipt.time && ` ${receipt.time}`}
                </strong>
                　{receipt.store || '店名不明'}
              </span>
              <span>
                合計 <strong>{formatYen(total)}</strong>
                <button className="link-button" onClick={() => onDeleteReceipt(receipt.id)}>
                  レシートを削除
                </button>
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>商品名</th>
                    <th className="num">金額</th>
                    <th>カテゴリ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      {/* マイナスの金額は、読み取り誤りの可能性があるため⚠を付ける */}
                      <td
                        className={`num ${item.price < 0 ? 'minus' : ''}`}
                        title={item.price < 0 ? '金額がマイナスです。値引き以外の場合は確認してください' : undefined}
                      >
                        {item.price < 0 && '⚠ '}
                        {formatYen(item.price)}
                      </td>
                      <td>
                        {/* 自動分類が違っていたら手で直せるようにする */}
                        <select
                          value={item.category}
                          onChange={(e) => onChangeCategory(receipt.id, item.id, e.target.value)}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="link-button"
                          onClick={() => onDeleteItem(receipt.id, item.id)}
                          aria-label={`${item.name}を削除`}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </section>
  );
}
