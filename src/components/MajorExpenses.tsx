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

  const [adding, setAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Form states (Add/Edit)
  const [category, setCategory] = useState<ExpenseCategory>('FIXED ESSENTIALS');
  const [name, setName]         = useState('');
  const [amount, setAmount]     = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  // Split into categories with index preservation
  const expensesWithIndex = expenses.map((e, i) => ({ ...e, originalIndex: i }));
  
  const settlementCats = ['IN-SETTLEMENT', 'SETTLED'];
  const unforeseenCats = ['UNFORESEEN'];
  const generalCats = EXPENSE_CATEGORIES.filter(c => !settlementCats.includes(c) && !unforeseenCats.includes(c) && c !== 'UNACCOUNTED');

  const generalExpenses = expensesWithIndex.filter(e => generalCats.includes(e.category as ExpenseCategory) && (e.amount > 0 || e.name || e.originalIndex === editingIndex));
  const settlementExpenses = expensesWithIndex.filter(e => settlementCats.includes(e.category) && (e.amount > 0 || e.name || e.originalIndex === editingIndex));
  const unforeseenExpenses = expensesWithIndex.filter(e => unforeseenCats.includes(e.category) && (e.amount > 0 || e.name || e.originalIndex === editingIndex));
  const unaccountedExpenses = expensesWithIndex.filter(e => e.category === 'UNACCOUNTED' && (e.amount > 0 || e.name || e.originalIndex === editingIndex));

  const totalGeneral = generalExpenses.reduce((s, e) => s + e.amount, 0) + unaccountedExpenses.reduce((s, e) => s + e.amount, 0) + unaccounted;
  const totalInSettlement = settlementExpenses.filter(e => e.category === 'IN-SETTLEMENT').reduce((s, e) => s + e.amount, 0);
  const totalUnforeseen = unforeseenExpenses.reduce((s, e) => s + e.amount, 0);

  // Total out of pocket: SUM(All except Settled) - SUM(Settled)
  const sumRemaining = expenses.filter(e => e.category !== 'SETTLED').reduce((s, e) => s + e.amount, 0) + unaccounted;
  const settledRecovery = expenses.filter(e => e.category === 'SETTLED').reduce((s, e) => s + e.amount, 0);
  const netTotal = sumRemaining - settledRecovery;

  // Derive Unforeseen Budget from S-CONTINGENCY FUND expected amount
  const contingencyFund = snapshot.investments.find(inv => inv.name === 'S-CONTINGENCY FUND');
  const budgetUfs = contingencyFund && contingencyFund.expected ? contingencyFund.expected : budgets.budgetUfs;

  useEffect(() => {
    if (adding) {
      setEditingIndex(null);
      setCategory('FIXED ESSENTIALS');
      setName('');
      setAmount('');
      setTimeout(() => nameRef.current?.focus(), 40);
    }
  }, [adding]);

  const handleSaveAdd = () => {
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    const payload: ExpenseItem = { category, name: name.trim(), amount: amt };
    if (onSave) onSave([...expenses, payload]);
    setAdding(false);
  };

  const handleStartEdit = (e: (ExpenseItem & { originalIndex: number })) => {
    setAdding(false);
    setEditingIndex(e.originalIndex);
    setCategory(e.category as ExpenseCategory);
    setName(e.name);
    setAmount(e.amount.toString());
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    
    const updated = [...expenses];
    updated[editingIndex] = { category, name: name.trim(), amount: amt };
    if (onSave) onSave(updated);
    setEditingIndex(null);
  };

  const handleDelete = (originalIndex: number) => {
    if (!window.confirm('Delete this transaction?')) return;
    const updated = expenses.filter((_, i) => i !== originalIndex);
    if (onSave) onSave(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent, isEdit: boolean) => {
    if (e.key === 'Enter') isEdit ? handleSaveEdit() : handleSaveAdd();
    if (e.key === 'Escape') isEdit ? setEditingIndex(null) : setAdding(false);
  };

  const renderExpenseRow = (e: (ExpenseItem & { originalIndex: number })) => {
    const isEditing = editingIndex === e.originalIndex;

    if (isEditing) {
      return (
        <tr key={e.originalIndex} className="inline-edit-row">
          <td style={{ padding: '4px' }}>
            <select
              className="inline-select"
              value={category}
              onChange={ev => setCategory(ev.target.value as ExpenseCategory)}
              onKeyDown={ev => handleKeyDown(ev, true)}
              autoFocus
            >
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </td>
          <td style={{ padding: '4px' }}>
            <input
              className="inline-input"
              type="text"
              value={name}
              onChange={ev => setName(ev.target.value)}
              onKeyDown={ev => handleKeyDown(ev, true)}
            />
          </td>
          <td style={{ padding: '4px' }}>
            <div className="inline-amount-cell">
              <input
                className="inline-input inline-input-amount mono"
                type="number"
                value={amount}
                onChange={ev => setAmount(ev.target.value)}
                onKeyDown={ev => handleKeyDown(ev, true)}
              />
              <button className="inline-save-btn" onClick={handleSaveEdit} title="Save">✓</button>
              <button className="inline-save-btn" onClick={() => setEditingIndex(null)} title="Cancel" style={{ color: 'var(--red)' }}>✕</button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={e.originalIndex} className="expense-row-hover">
        <td className="exp-cat">{e.category}</td>
        <td>{e.name || <span className="muted">—</span>}</td>
        <td className="val">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            <span className="mono">{fmt(e.amount)}</span>
            <div className="row-actions">
              <button className="icon-btn" onClick={() => handleStartEdit(e)} title="Edit">✎</button>
              <button className="icon-btn" onClick={() => handleDelete(e.originalIndex)} title="Delete">✕</button>
            </div>
          </div>
        </td>
      </tr>
    );
  };

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

      <div className="card-content-scrollable" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '6px' }}>
        
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
                    onKeyDown={ev => handleKeyDown(ev, false)}
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
                    onKeyDown={ev => handleKeyDown(ev, false)}
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
                      onKeyDown={ev => handleKeyDown(ev, false)}
                    />
                    <button className="inline-save-btn" onClick={handleSaveAdd} title="Save (Enter)">✓</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* ── Expenses Block ───────────────────────────────────────────── */}
        <div className="expense-block">
          <div className="expense-block-header muted" style={{ fontSize: '0.75rem', fontWeight: 600, paddingBottom: '4px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
            EXPENSES
          </div>
          {generalExpenses.length > 0 && (
            <table className="snap-table">
              <tbody>
                {generalExpenses.map(renderExpenseRow)}
              </tbody>
            </table>
          )}
          
          <table className="snap-table" style={{ borderTop: '1px solid var(--border)', marginTop: '4px' }}>
            <tbody>
              {unaccountedExpenses.map((e, i) => (
                <tr key={`unacc-${i}`} className="row-unaccounted">
                  <td className="exp-cat amber">{e.category}</td>
                  <td className="amber">{e.name || <span className="muted">—</span>}</td>
                  <td className="val amber mono">{fmt(e.amount)}</td>
                </tr>
              ))}
              {(unaccounted > 0 || unaccounted < 0) && (
                <tr className="row-unaccounted">
                  <td colSpan={2} className="exp-cat amber">Unaccounted (Gap)</td>
                  <td className="val amber mono">{fmt(unaccounted)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Settlement Block ────────────────────────────────────────── */}
        <div className="expense-block">
          <div className="expense-block-header muted" style={{ fontSize: '0.75rem', fontWeight: 600, paddingBottom: '4px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
            SETTLEMENT
          </div>
          {settlementExpenses.length > 0 && (
            <table className="snap-table" style={{ marginBottom: '8px' }}>
              <tbody>
                {settlementExpenses.map(renderExpenseRow)}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Unforeseen Block ────────────────────────────────────────── */}
        <div className="expense-block">
          <div className="expense-block-header muted" style={{ fontSize: '0.75rem', fontWeight: 600, paddingBottom: '4px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
            UNFORESEEN
          </div>
          {unforeseenExpenses.length > 0 && (
            <table className="snap-table" style={{ marginBottom: '8px' }}>
              <tbody>
                {unforeseenExpenses.map(renderExpenseRow)}
              </tbody>
            </table>
          )}
        </div>

        <div className="divider" style={{ margin: '10px 0' }} />

        {/* ── Budget Summary Section ───────────────────────────────────── */}
        <div className="exp-budget-grid" style={{ paddingBottom: '12px' }}>
          <BudgetRow label="Budget (General)" budget={budgets.budget} spent={totalGeneral} />
          <BudgetRow label="Budget Settlement" budget={budgets.budgetSmt} spent={totalInSettlement} />
          <BudgetRow label="Budget Unforeseen" budget={budgetUfs} spent={totalUnforeseen} />
        </div>

      </div>

      {/* ── Global Total ───────────────────────────────────────────── */}
      <div className="section-total" style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <span>Total Expenses (Net)</span>
        <span className="mono red">{netTotal.toLocaleString('en-IN')}</span>
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
