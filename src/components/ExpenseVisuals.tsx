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

  // Categorical Data (for Bar Chart - Vertical Bars)
  const categoryMap: Record<string, number> = {};
  expenses.forEach(e => {
    if (e.amount > 0 && e.category !== 'IN-SETTLEMENT' && e.category !== 'SETTLED') {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    }
  });
  if (unaccounted > 0) {
    categoryMap['UNACCOUNTED (Gap)'] = (categoryMap['UNACCOUNTED (Gap)'] || 0) + unaccounted;
  }

  const barData = Object.entries(categoryMap)
    .sort((a,b) => b[1] - a[1])
    .map(([name, value], i) => ({ 
      name: name.replace(' ESSENTIALS', '').replace(' (NON-E)', '').replace('NONESSENTIALS', 'Non-E'), 
      value, 
      fill: COLORS[i % COLORS.length] 
    }));

  return (
    <div className="expense-visuals">
      {/* ── Category Bar Chart (Vertical Bars) ─────────────────────── */}
      <div className="ev-section">
        <div className="ev-section-title">Spending Distribution</div>
        <div className="ev-bar-container" style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: 'var(--text-muted)' }} 
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.75rem' }}
                formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                {barData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Individual Budget Rings ────────────────────────────────── */}
      <div className="ev-section">
        <div className="ev-section-title">Budget Status</div>
        <div className="ev-rings-grid">
          <BudgetRing label="General" spent={totalGeneral} limit={budgets.budget} color="var(--accent)" />
          <BudgetRing label="Settlement" spent={totalInSettlement} limit={budgets.budgetSmt} color="var(--blue)" />
          <BudgetRing label="Unforeseen" spent={totalUnforeseen} limit={budgetUfs} color="var(--red)" />
        </div>
      </div>
    </div>
  );
}

function BudgetRing({ label, spent, limit, color }: { label: string, spent: number, limit: number, color: string }) {
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const displayPct = Math.min(pct, 100);
  const over = spent > limit;

  // Single-ring data
  const data = [{ name: label, value: displayPct }];

  return (
    <div className="ev-ring-gauge">
      <div className="ev-ring-gauge-svg">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            innerRadius="75%" 
            outerRadius="100%" 
            data={data} 
            startAngle={90} 
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: 'rgba(255,255,255,0.05)' }}
              dataKey="value"
              cornerRadius={10}
              fill={color}
              animationDuration={1500}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="ev-gauge-center">
          <span className="ev-gauge-pct" style={{ color: over ? 'var(--red)' : 'var(--text-primary)' }}>
            {Math.round(pct)}%
          </span>
          <span className="ev-gauge-val mono">
            ₹{spent > 9999 ? (spent/1000).toFixed(1)+'k' : spent}
          </span>
        </div>
      </div>
      <div className="ev-gauge-label">{label}</div>
    </div>
  );
}
