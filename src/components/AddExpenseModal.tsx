import { useState, useEffect, useRef } from 'react';
import './AddExpenseModal.css';

export const EXPENSE_CATEGORIES = [
  'FIXED ESSENTIALS',
  'FIXED NONESSENTIALS',
  'PERSONAL ESSENTIALS',
  'PERSONAL NONESSENTIALS',
  'UNACCOUNTED',
  'IN-SETTLEMENT',
  'SETTLED',
  'UNFORESEEN',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface NewExpensePayload {
  category: ExpenseCategory;
  name: string;
  amount: number;
  date: string; // ISO yyyy-mm-dd
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the form data — wire up your API call here later */
  onSubmit: (payload: NewExpensePayload) => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AddExpenseModal({ open, onClose, onSubmit }: Props) {
  const [category, setCategory] = useState<ExpenseCategory>('FIXED ESSENTIALS');
  const [name, setName]         = useState('');
  const [amount, setAmount]     = useState('');
  const [date, setDate]         = useState(todayISO);
  const [shake, setShake]       = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Reset form whenever modal opens
  useEffect(() => {
    if (open) {
      setCategory('FIXED ESSENTIALS');
      setName('');
      setAmount('');
      setDate(todayISO());
      setTimeout(() => nameRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onSubmit({ category, name: name.trim(), amount: amt, date });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-panel ${shake ? 'modal-shake' : ''}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Add Expense"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">↓</span>
            Add Expense
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {/* Date */}
          <div className="field-group">
            <label className="field-label" htmlFor="exp-date">Date</label>
            <input
              id="exp-date"
              className="field-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="field-group">
            <label className="field-label" htmlFor="exp-category">Category</label>
            <div className="field-select-wrap">
              <select
                id="exp-category"
                className="field-select"
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
              >
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="field-select-arrow">▾</span>
            </div>
          </div>

          {/* Name */}
          <div className="field-group">
            <label className="field-label" htmlFor="exp-name">Description</label>
            <input
              id="exp-name"
              ref={nameRef}
              className="field-input"
              type="text"
              placeholder="e.g. Rent, Groceries…"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div className="field-group">
            <label className="field-label" htmlFor="exp-amount">Amount</label>
            <div className="field-amount-wrap">
              <span className="field-currency">₹</span>
              <input
                id="exp-amount"
                className="field-input field-input-amount mono"
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              <span>Add Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
