import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

  // Group by specific buckets for budget comparison
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

  // Donut Data (Categorized)
  const categoryMap: Record<string, number> = {};
  expenses.forEach(e => {
    if (e.amount > 0) {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    }
  });
  if (unaccounted > 0) {
    categoryMap['UNACCOUNTED (Gap)'] = (categoryMap['UNACCOUNTED (Gap)'] || 0) + unaccounted;
  }

  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="expense-visuals">
      <div className="ev-charts-row">
        {/* ── Donut Chart (Distribution) ────────────────────────────────── */}
        <div className="ev-donut-container">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={65}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1000}
                stroke="none"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  fontSize: '0.75rem' 
                }}
                itemStyle={{ color: 'var(--text-primary)' }}
                formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="ev-donut-center">
            <span className="ev-donut-total-val">₹{Object.values(categoryMap).reduce((s,v) => s+v, 0).toLocaleString('en-IN')}</span>
            <span className="ev-donut-total-lbl">Spent</span>
          </div>
        </div>

        {/* ── Budget Progress Bars ────────────────────────────────────────── */}
        <div className="ev-budgets-col">
          <BudgetProgress 
            label="General Budget" 
            spent={totalGeneral} 
            limit={budgets.budget} 
            color="var(--accent)" 
          />
          <BudgetProgress 
            label="Settlement Budget" 
            spent={totalInSettlement} 
            limit={budgets.budgetSmt} 
            color="var(--blue)" 
          />
          <BudgetProgress 
            label="Unforeseen Budget" 
            spent={totalUnforeseen} 
            limit={budgetUfs} 
            color="var(--red)" 
          />
        </div>
      </div>
    </div>
  );
}

interface BudgetProps { label: string; spent: number; limit: number; color: string }

function BudgetProgress({ label, spent, limit, color }: BudgetProps) {
  const over = spent > limit;
  const pct  = limit > 0 ? (spent / limit) * 100 : 0;
  const displayPct = Math.min(pct, 100);

  return (
    <div className="ev-budget-row">
      <div className="ev-budget-info">
        <span className="ev-budget-label">{label}</span>
        <span className="ev-budget-values mono">
          <span className={over ? 'red' : ''}>₹{spent.toLocaleString('en-IN')}</span> / ₹{limit.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="ev-progress-track">
        <div 
          className="ev-progress-fill" 
          style={{ width: `${displayPct}%`, background: color }}
        />
        {over && <div className="ev-progress-over" style={{ left: `100%`, width: `${Math.min(pct - 100, 20)}%` }} />}
      </div>
    </div>
  );
}
