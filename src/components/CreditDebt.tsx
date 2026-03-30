import { useState, useRef, useEffect } from 'react';
import type { CreditEntry } from '../data/schema';
import './Sections.css';

interface Props {
  credits: CreditEntry[];
  onSave?: (credits: CreditEntry[]) => void;
}

const fmt = (n: number) => n > 0 ? n.toLocaleString('en-IN') : '—';

export default function CreditDebt({ credits, onSave }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form states
  const [entity, setEntity]       = useState('');
  const [amount, setAmount]       = useState('');
  const [lentOrOwe, setLentOrOwe] = useState('');
  const [settled, setSettled]     = useState('');
  const [borrowed, setBorrowed]   = useState('');
  const entityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) {
      setEditingIndex(null);
      setEntity('');
      setAmount('');
      setLentOrOwe('');
      setSettled('');
      setBorrowed('');
      setTimeout(() => entityRef.current?.focus(), 40);
    }
  }, [adding]);

  const handleSaveAdd = () => {
    if (!entity.trim()) return;
    const payload: CreditEntry = {
      entity: entity.trim(),
      amount: parseFloat(amount) || 0,
      lentOrOwe: parseFloat(lentOrOwe) || 0,
      settled: parseFloat(settled) || 0,
      borrowed: parseFloat(borrowed) || 0,
    };
    if (onSave) onSave([...credits, payload]);
    setAdding(false);
  };

  const handleStartEdit = (c: CreditEntry, i: number) => {
    setAdding(false);
    setEditingIndex(i);
    setEntity(c.entity);
    setAmount(c.amount.toString());
    setLentOrOwe(c.lentOrOwe.toString());
    setSettled(c.settled.toString());
    setBorrowed(c.borrowed.toString());
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !entity.trim()) return;
    const updated = [...credits];
    updated[editingIndex] = {
      entity: entity.trim(),
      amount: parseFloat(amount) || 0,
      lentOrOwe: parseFloat(lentOrOwe) || 0,
      settled: parseFloat(settled) || 0,
      borrowed: parseFloat(borrowed) || 0,
    };
    if (onSave) onSave(updated);
    setEditingIndex(null);
  };

  const handleDelete = (i: number) => {
    if (!window.confirm(`Delete entry for ${credits[i].entity}?`)) return;
    const updated = credits.filter((_, idx) => idx !== i);
    if (onSave) onSave(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent, isEdit: boolean) => {
    if (e.key === 'Enter') isEdit ? handleSaveEdit() : handleSaveAdd();
    if (e.key === 'Escape') isEdit ? setEditingIndex(null) : setAdding(false);
  };

  const totalLent     = credits.reduce((s, c) => s + c.lentOrOwe, 0);
  const totalSettled  = credits.reduce((s, c) => s + c.settled, 0);
  const totalBorrowed = credits.reduce((s, c) => s + c.borrowed, 0);

  return (
    <div className="card">
      <div className="card-title">
        <span className="card-title-icon" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>⇄</span>
        Credit &amp; Debt
        <button
          className="card-add-btn"
          onClick={() => setAdding(v => !v)}
          title={adding ? 'Cancel' : 'Add person'}
        >{adding ? '✕' : '＋'}</button>
      </div>

      <div className="overflow-x">
        <table className="snap-table">
          <thead>
            <tr>
              <th>Entity</th>
              <th className="right">Amt</th>
              <th className="right">Lent/Owe</th>
              <th className="right">Settled</th>
              <th className="right">Borrowed</th>
            </tr>
          </thead>
          <tbody>
            {/* Adding Row */}
            {adding && (
              <tr className="inline-add-row c-debt-form">
                <td><input ref={entityRef} className="inline-input" placeholder="Name…" value={entity} onChange={e => setEntity(e.target.value)} onKeyDown={ev => handleKeyDown(ev, false)} /></td>
                <td><input className="inline-input mono" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={ev => handleKeyDown(ev, false)} /></td>
                <td><input className="inline-input mono" type="number" placeholder="0" value={lentOrOwe} onChange={e => setLentOrOwe(e.target.value)} onKeyDown={ev => handleKeyDown(ev, false)} /></td>
                <td><input className="inline-input mono" type="number" placeholder="0" value={settled} onChange={e => setSettled(e.target.value)} onKeyDown={ev => handleKeyDown(ev, false)} /></td>
                <td>
                  <div className="inline-amount-cell">
                    <input className="inline-input mono" type="number" placeholder="0" value={borrowed} onChange={e => setBorrowed(e.target.value)} onKeyDown={ev => handleKeyDown(ev, false)} />
                    <button className="inline-save-btn" onClick={handleSaveAdd}>✓</button>
                  </div>
                </td>
              </tr>
            )}

            {/* List Rows */}
            {credits.map((c, i) => {
              const isEditing = editingIndex === i;
              if (isEditing) {
                return (
                  <tr key={i} className="inline-edit-row c-debt-form">
                    <td><input className="inline-input" value={entity} onChange={e => setEntity(e.target.value)} onKeyDown={ev => handleKeyDown(ev, true)} autoFocus /></td>
                    <td><input className="inline-input mono" type="number" value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={ev => handleKeyDown(ev, true)} /></td>
                    <td><input className="inline-input mono" type="number" value={lentOrOwe} onChange={e => setLentOrOwe(e.target.value)} onKeyDown={ev => handleKeyDown(ev, true)} /></td>
                    <td><input className="inline-input mono" type="number" value={settled} onChange={e => setSettled(e.target.value)} onKeyDown={ev => handleKeyDown(ev, true)} /></td>
                    <td>
                      <div className="inline-amount-cell">
                        <input className="inline-input mono" type="number" value={borrowed} onChange={e => setBorrowed(e.target.value)} onKeyDown={ev => handleKeyDown(ev, true)} />
                        <button className="inline-save-btn" onClick={handleSaveEdit}>✓</button>
                        <button className="inline-save-btn" onClick={() => setEditingIndex(null)} style={{ color: 'var(--red)' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={i} className="expense-row-hover">
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.entity}</td>
                  <td className="val">{fmt(c.amount)}</td>
                  <td className="val green">{fmt(c.lentOrOwe)}</td>
                  <td className="val muted">{fmt(c.settled)}</td>
                  <td className="val red">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <span className="mono">{fmt(c.borrowed)}</span>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => handleStartEdit(c, i)}>✎</button>
                        <button className="icon-btn" onClick={() => handleDelete(i)}>✕</button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divider" />

      <div className="credit-summary">
        <div className="credit-summary-row">
          <span className="muted">Total Lent</span>
          <span className="mono green">{totalLent.toLocaleString('en-IN')}</span>
        </div>
        <div className="credit-summary-row">
          <span className="muted">Total Settled</span>
          <span className="mono">{totalSettled.toLocaleString('en-IN')}</span>
        </div>
        <div className="credit-summary-row">
          <span className="muted">Total Borrowed</span>
          <span className="mono red">{totalBorrowed.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}

