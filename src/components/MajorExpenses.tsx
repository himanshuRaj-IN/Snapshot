import { useState, useRef, useEffect } from 'react';
import type { ExpenseItem, ExpenseBudgets } from '../data/schema';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from './AddExpenseModal';
import './Sections.css';

interface Props {
  expenses: ExpenseItem[];
  budgets: ExpenseBudgets;
  unaccounted: number;
  onSave?: (expenses: ExpenseItem[]) => void;
}

const fmt = (n: number) => n > 0 ? n.toLocaleString('en-IN') : '—';

export default function MajorExpenses({ expenses, budgets, unaccounted, onSave }: Props) {
  const total = expenses.reduce((s, e) => s + e.amount, 0) + unaccounted;
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('FIXED ESSENTIALS');
  const [name, setName]         = useState('');
  const [amount, setAmount]     = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) {
      setCategory('FIXED ESSENTIALS');
      setName('');
      setAmount('');
      setTimeout(() => nameRef.current?.focus(), 40);
    }
  }, [adding]);

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    const payload: ExpenseItem = {
      category, name: name.trim(), amount: amt
    };
    
    if (onSave) {
      onSave([...expenses, payload]);
    }
    
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setAdding(false);
  };

  return (
    <div className="card">
      <div className="card-title">
        <span className="card-title-icon" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>↓</span>
        Major Expenses
        <button
          className="card-add-btn"
          onClick={() => setAdding(v => !v)}
          aria-label="Add expense"
          title={adding ? 'Cancel' : 'Add expense'}
          style={adding ? { color: 'var(--red)', borderColor: 'var(--red)' } : undefined}
        >{adding ? '✕' : '＋'}</button>
      </div>

      <table className="snap-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Name</th>
            <th className="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {/* ── Inline Add Row (top) ───────────────────────────────────── */}
          {adding && (
            <tr className="inline-add-row">
              <td>
                <select
                  className="inline-select"
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  onKeyDown={handleKeyDown}
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </td>
              <td>
                <input
                  ref={nameRef}
                  className="inline-input"
                  type="text"
                  placeholder="Description…"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </td>
              <td>
                <div className="inline-amount-cell">
                  <input
                    className="inline-input inline-input-amount mono"
                    type="number"
                    min="1"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button className="inline-save-btn" onClick={handleSave} title="Save (Enter)">✓</button>
                </div>
              </td>
            </tr>
          )}

          {/* ── Expense rows ───────────────────────────────────────────── */}
          {expenses.filter(e => e.amount > 0 || e.name).map((e, i) => (
            <tr key={i}>
              <td className="exp-cat">{e.category}</td>
              <td>{e.name || <span className="muted">—</span>}</td>
              <td className="val">{fmt(e.amount)}</td>
            </tr>
          ))}

          <tr className="row-unaccounted">
            <td colSpan={2} className="exp-cat">Unaccounted</td>
            <td className="val amber">{fmt(unaccounted)}</td>
          </tr>
        </tbody>
      </table>

      <div className="divider" />

      <div className="exp-budget-grid">
        <BudgetRow label="Budget"     budget={budgets.budget}    spent={total} />
        <BudgetRow label="Budget SMT" budget={budgets.budgetSmt} spent={0} />
        <BudgetRow label="Budget UFS" budget={budgets.budgetUfs} spent={0} />
        <div className="exp-settlement">
          <span className="muted">In-Settlement (Flat NCR)</span>
          <span className="mono">{fmt(budgets.inSettlement)}</span>
        </div>
        <div className="exp-settlement">
          <span className="muted">Settled</span>
          <span className="mono">{fmt(budgets.settled)}</span>
        </div>
      </div>

      <div className="section-total">
        <span>Total Expenses</span>
        <span className="mono red">{total.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

function BudgetRow({ label, budget, spent }: { label: string; budget: number; spent: number }) {
  const pct  = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over = spent > budget;
  return (
    <div className="budget-row">
      <div className="budget-row-top">
        <span className="muted">{label}</span>
        <span className="mono" style={{ color: over ? 'var(--red)' : 'var(--text-primary)' }}>
          {spent.toLocaleString('en-IN')} / {budget.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="budget-bar-track">
        <div className="budget-bar-fill" style={{ width: `${pct}%`, background: over ? 'var(--red)' : 'var(--accent)' }} />
      </div>
    </div>
  );
}
