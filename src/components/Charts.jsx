import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { CATEGORIES, CATEGORY_COLORS } from '../categories.js';
import { totalsByCategory, totalsByMonth, formatYen } from '../summary.js';

// Chart.jsで使う部品を登録する
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// ツールチップに「カテゴリ名: ¥金額」と表示する
const yenTooltip = {
  callbacks: {
    label: (ctx) => `${ctx.dataset.label ?? ctx.label}: ${formatYen(ctx.parsed.y ?? ctx.parsed)}`,
  },
};

// カテゴリ別の集計表・円グラフと、月別の棒グラフ
export default function Charts({ receipts, visibleReceipts }) {
  if (receipts.length === 0) return null;

  // 円グラフ：選択中の月のカテゴリ別合計（金額が0以下のカテゴリは除く）
  const categoryTotals = totalsByCategory(visibleReceipts);
  const usedCategories = CATEGORIES.filter((c) => categoryTotals[c] > 0);
  const grandTotal = CATEGORIES.reduce((sum, c) => sum + categoryTotals[c], 0);

  const pieData = {
    labels: usedCategories,
    datasets: [
      {
        data: usedCategories.map((c) => categoryTotals[c]),
        backgroundColor: usedCategories.map((c) => CATEGORY_COLORS[c]),
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  // 棒グラフ：全期間の月別合計（カテゴリごとに積み上げ）
  const monthTotals = totalsByMonth(receipts);
  const months = Object.keys(monthTotals);
  const barData = {
    labels: months,
    datasets: CATEGORIES.filter((c) => months.some((m) => monthTotals[m][c] !== 0)).map((c) => ({
      label: c,
      data: months.map((m) => monthTotals[m][c]),
      backgroundColor: CATEGORY_COLORS[c],
    })),
  };

  return (
    <div className="charts">
      <section className="card">
        <h2>カテゴリ別の支出</h2>
        <div className="summary-total">
          合計 <strong>{formatYen(grandTotal)}</strong>
        </div>
        {usedCategories.length > 0 ? (
          <div className="chart-box">
            <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { tooltip: yenTooltip } }} />
          </div>
        ) : (
          <p className="empty">この期間の支出はありません</p>
        )}
        <table className="category-table">
          <tbody>
            {usedCategories.map((c) => (
              <tr key={c}>
                <td>
                  <span className="swatch" style={{ background: CATEGORY_COLORS[c] }} />
                  {c}
                </td>
                <td className="num">{formatYen(categoryTotals[c])}</td>
                <td className="num muted">{Math.round((categoryTotals[c] / grandTotal) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>月別の支出</h2>
        <div className="chart-box">
          <Bar
            data={barData}
            options={{
              maintainAspectRatio: false,
              plugins: { tooltip: yenTooltip },
              scales: {
                x: { stacked: true },
                y: { stacked: true, ticks: { callback: (v) => formatYen(v) } },
              },
            }}
          />
        </div>
      </section>
    </div>
  );
}
