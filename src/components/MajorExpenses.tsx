import { useState, useRef, useEffect } from 'react';
import type { ExpenseItem, Snapshot } from '../data/schema';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from './AddExpenseModal';
import './Sections.css';

interface Props {
  snapshot: Snapshot;
  onSave?: (expenses: ExpenseItem[]) => void;
}

const fmt = (n: number) => n > 0 ? n.toLocaleString('en-IN') : '—';

export default function MajorExpenses({ snapshot, onSave }: Props) {
  const expenses = snapshot.expenses || [];
  const budgets = snapshot.expenseBudgets;
  const unaccounted = snapshot.expenseUnaccounted;

  // Split into categories
  const settlementCats = ['IN-SETTLEMENT', 'SETTLED'];
  const unforeseenCats = ['UNFORESEEN'];
  const generalCats = EXPENSE_CATEGORIES.filter(c => !settlementCats.includes(c) && !unforeseenCats.includes(c));

  const generalExpenses = expenses.filter(e => generalCats.includes(e.category as ExpenseCategory) && (e.amount > 0 || e.name));
  const settlementExpenses = expenses.filter(e => settlementCats.includes(e.category) && (e.amount > 0 || e.name));
  const unforeseenExpenses = expenses.filter(e => unforeseenCats.includes(e.category) && (e.amount > 0 || e.name));

  const totalGeneral = generalExpenses.reduce((s, e) => s + e.amount, 0) + unaccounted;
  const totalUnforeseen = unforeseenExpenses.reduce((s, e) => s + e.amount, 0);

  // Total out of pocket ignores 'SETTLED'
  const settledSum = expenses.filter(e => e.category === 'SETTLED').reduce((s, e) => s + e.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0) + unaccounted - settledSum;

  // Derive Unforeseen Budget from S-CONTINGENCY FUND expected amount
  const contingencyFund = snapshot.investments.find(inv => inv.name === 'S-CONTINGENCY FUND');
  const budgetUfs = contingencyFund && contingencyFund.expected ? contingencyFund.expected : budgets.budgetUfs;

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

  const renderExpenseRow = (e: ExpenseItem, i: number) => (
    <tr key={i}>
      <td className="exp-cat">{e.category}</td>
      <td>{e.name || <span className="muted">—</span>}</td>
      <td className="val">{fmt(e.amount)}</td>
    </tr>
  );

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* ── Add Row ───────────────────────────────────────────── */}
        {adding && (
          <table className="snap-table" style={{ marginBottom: 0 }}>
            <tbody>
              <tr className="inline-add-row" style={{ display: 'flex' }}>
                <td style={{ width: '30%', paddingRight: '8px' }}>
                  <select
                    className="inline-select"
                    value={category}
                    onChange={e => setCategory(e.target.value as ExpenseCategory)}
                    onKeyDown={handleKeyDown}
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td style={{ width: '40%', paddingRight: '8px' }}>
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
                <td style={{ width: '30%' }}>
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
            </tbody>
          </table>
        )}

        {/* ── General Block ───────────────────────────────────────────── */}
        <div className="expense-block">
          <div className="expense-block-header muted" style={{ fontSize: '0.75rem', fontWeight: 600, paddingBottom: '4px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
            GENERAL EXPENSES
          </div>
          <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
            <table className="snap-table">
              <tbody>
                {generalExpenses.map(renderExpenseRow)}
              </tbody>
            </table>
          </div>
          <table className="snap-table" style={{ borderTop: '1px solid var(--border)', marginTop: '4px' }}>
            <tbody>
              <tr className="row-unaccounted">
                <td colSpan={2} className="exp-cat">Unaccounted</td>
                <td className="val amber">{fmt(unaccounted)}</td>
              </tr>
            </tbody>
          </table>
          <div className="exp-budget-grid" style={{ marginTop: '12px' }}>
            <BudgetRow label="Budget" budget={budgets.budget} spent={totalGeneral} />
            <BudgetRow label="Budget SMT" budget={budgets.budgetSmt} spent={0} />
          </div>
        </div>

        {/* ── Settlement Block ────────────────────────────────────────── */}
        <div className="expense-block">
          <div className="expense-block-header muted" style={{ fontSize: '0.75rem', fontWeight: 600, paddingBottom: '4px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
            SETTLEMENT
          </div>
          {settlementExpenses.length > 0 && (
            <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '8px' }}>
              <table className="snap-table">
                <tbody>
                  {settlementExpenses.map(renderExpenseRow)}
                </tbody>
              </table>
            </div>
          )}
          <div className="exp-budget-grid">
            <div className="exp-settlement">
              <span className="muted">In-Settlement</span>
              <span className="mono">{fmt(budgets.inSettlement)}</span>
            </div>
            <div className="exp-settlement">
              <span className="muted">Settled</span>
              <span className="mono">{fmt(budgets.settled)}</span>
            </div>
          </div>
        </div>

        {/* ── Unforeseen Block ────────────────────────────────────────── */}
        <div className="expense-block">
          <div className="expense-block-header muted" style={{ fontSize: '0.75rem', fontWeight: 600, paddingBottom: '4px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
            UNFORESEEN
          </div>
          {unforeseenExpenses.length > 0 && (
            <div style={{ maxHeight: '55px', overflowY: 'auto', marginBottom: '8px' }}>
              <table className="snap-table">
                <tbody>
                  {unforeseenExpenses.map(renderExpenseRow)}
                </tbody>
              </table>
            </div>
          )}
          <div className="exp-budget-grid">
            <BudgetRow label="Budget UFS (Contingency)" budget={budgetUfs} spent={totalUnforeseen} />
          </div>
        </div>

      </div>

      {/* ── Global Total ───────────────────────────────────────────── */}
      <div className="section-total" style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <span>Total Expenses (Net)</span>
        <span className="mono red">{totalExpense.toLocaleString('en-IN')}</span>
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
