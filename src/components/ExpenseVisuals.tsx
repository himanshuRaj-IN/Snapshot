import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import type { Snapshot } from '../data/schema';
import './ExpenseVisuals.css';

interface Props {
  snapshot: Snapshot;
}

const COLORS = [
  '#7c6df0', // Accent
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#22c55e', // Green
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

export default function ExpenseVisuals({ snapshot }: Props) {
  const { expenses, expenseBudgets: budgets, expenseUnaccounted: unaccounted } = snapshot;

  const unforeseenCats = ['UNFORESEEN'];
  const generalCats = [
    'FIXED ESSENTIALS', 'FIXED NONESSENTIALS', 
    'PERSONAL ESSENTIALS', 'PERSONAL NONESSENTIALS', 
    'UNACCOUNTED'
  ];

  // Actuals
  const totalGeneral = expenses
    .filter(e => generalCats.includes(e.category))
    .reduce((s, e) => s + e.amount, 0) + unaccounted;
  
  const totalInSettlement = expenses
    .filter(e => e.category === 'IN-SETTLEMENT')
    .reduce((s, e) => s + e.amount, 0);

  const totalUnforeseen = expenses
    .filter(e => unforeseenCats.includes(e.category))
    .reduce((s, e) => s + e.amount, 0);

  // Budgets
  const contingencyFund = snapshot.investments.find(inv => inv.name === 'S-CONTINGENCY FUND');
  const budgetUfs = contingencyFund && contingencyFund.expected ? contingencyFund.expected : budgets.budgetUfs;

  // Categorical Data (for Bar Chart)
  const categoryMap: Record<string, number> = {};
  expenses.forEach(e => {
    if (e.amount > 0) {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    }
  });
  if (unaccounted > 0) {
    categoryMap['UNACCOUNTED (Gap)'] = (categoryMap['UNACCOUNTED (Gap)'] || 0) + unaccounted;
  }

  const barData = Object.entries(categoryMap)
    .sort((a,b) => b[1] - a[1])
    .map(([name, value], i) => ({ 
      name: name.replace(' ESSENTIALS', '').replace(' NONESSENTIALS', ' (Non-E)'), 
      value, 
      fill: COLORS[i % COLORS.length] 
    }));

  // Budget Data (for 3-Ring Radial Chart)
  const getPct = (s: number, b: number) => b > 0 ? (s / b) * 100 : 0;
  const ringData = [
    { name: 'General',    value: getPct(totalGeneral, budgets.budget),       fill: 'var(--accent)' },
    { name: 'Settlement', value: getPct(totalInSettlement, budgets.budgetSmt), fill: 'var(--blue)'   },
    { name: 'Unforeseen', value: getPct(totalUnforeseen, budgetUfs),        fill: 'var(--red)'    },
  ];

  return (
    <div className="expense-visuals">
      {/* ── Category Bar Chart ───────────────────────────────────── */}
      <div className="ev-section">
        <div className="ev-section-title">Spending by Category</div>
        <div className="ev-bar-container">
          <ResponsiveContainer width="100%" height={Math.max(barData.length * 40, 200)}>
            <BarChart layout="vertical" data={barData} margin={{ left: 10, right: 40, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.75rem' }}
                formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {barData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={barData[index].fill} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 3-Ring Budget Chart ──────────────────────────────────── */}
      <div className="ev-section">
        <div className="ev-section-title">Budget Ring Status</div>
        <div className="ev-ring-row">
          <div className="ev-ring-container">
            <ResponsiveContainer width="100%" height={240}>
              <RadialBarChart 
                innerRadius="30%" 
                outerRadius="100%" 
                data={ringData} 
                startAngle={90} 
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background={{ fill: 'rgba(255,255,255,0.05)' }}
                  dataKey="value"
                  cornerRadius={10}
                  animationDuration={1500}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="ev-ring-center">
              <span className="ev-ring-percent">%{Math.round(getPct(totalGeneral, budgets.budget))}</span>
              <span className="ev-ring-lbl">General</span>
            </div>
          </div>

          <div className="ev-ring-legend">
            {ringData.map(r => (
              <div key={r.name} className="ev-legend-item">
                <div className="ev-legend-dot" style={{ background: r.fill }} />
                <span className="ev-legend-name">{r.name}</span>
                <span className="ev-legend-val mono">{Math.round(r.value)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Text Progress bars (Still useful as reference) ────────── */}
      <div className="ev-budgets-col" style={{ padding: '0 12px' }}>
        <BudgetProgress label="General" spent={totalGeneral} limit={budgets.budget} color="var(--accent)" />
        <BudgetProgress label="Settlement" spent={totalInSettlement} limit={budgets.budgetSmt} color="var(--blue)" />
        <BudgetProgress label="Unforeseen" spent={totalUnforeseen} limit={budgetUfs} color="var(--red)" />
      </div>
    </div>
  );
}

function BudgetProgress({ label, spent, limit, color }: { label: string; spent: number; limit: number; color: string }) {
  const over = spent > limit;
  const pct  = limit > 0 ? (spent / limit) * 100 : 0;
  const displayPct = Math.min(pct, 100);
  return (
    <div className="ev-budget-row" style={{ margin: '8px 0' }}>
      <div className="ev-budget-info">
        <span className="ev-budget-label" style={{ color }}>{label}</span>
        <span className="ev-budget-values mono" style={{ fontSize: '0.7rem' }}>
          ₹{spent.toLocaleString('en-IN')} / ₹{limit.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="ev-progress-track">
        <div className="ev-progress-fill" style={{ width: `${displayPct}%`, background: color }} />
      </div>
    </div>
  );
}
