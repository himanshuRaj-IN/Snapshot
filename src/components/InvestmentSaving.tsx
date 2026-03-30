import { useState } from 'react';
import type { Snapshot } from '../data/schema';
import './Sections.css';
import '../components/SummaryBar.css'; // pull in pencil button styles

interface Props { 
  snapshot: Snapshot;
  onSave?: (updated: Snapshot) => void;
}

const fmt = (n: number) => n > 0 ? n.toLocaleString('en-IN') : '—';

export default function InvestmentSaving({ snapshot, onSave }: Props) {
  const investments = snapshot.investments;
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<{name: string, actual: string, expected: string}[]>([]);

  const startEdit = () => {
    const filled = investments.slice(0, 10).map(i => ({ 
      name: i.name,
      actual: String(i.actual),
      expected: i.expected !== null ? String(i.expected) : ''
    }));
    const padded = [...filled, ...Array.from({ length: 10 - filled.length }, () => ({ name: '', actual: '', expected: '' }))];
    setDrafts(padded);
    setEditing(true);
  };

  const save = () => {
    const payload = drafts
      .filter(i => i.name.trim() !== '')
      .map(i => ({
        name: i.name.trim(),
        actual: parseFloat(i.actual) || 0,
        expected: i.expected.trim() !== '' ? parseFloat(i.expected) : null
      }));
    if (onSave) onSave({ ...snapshot, investments: payload });
    setEditing(false);
  };

  const updateDraft = (idx: number, field: 'name' | 'actual' | 'expected', val: string) => {
    setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d));
  };

  const displayed = editing ? drafts.map(d => ({ 
    ...d, 
    actual: parseFloat(d.actual) || 0,
    expected: d.expected.trim() !== '' ? parseFloat(d.expected) : null
  })) : investments;

  const totalSaving = displayed.filter(i => i.name.startsWith('S-')).reduce((s, i) => s + i.actual, 0);
  const totalInvestment = displayed.filter(i => i.name.startsWith('I-')).reduce((s, i) => s + i.actual, 0);

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="card-title-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>↑</span>
        <span style={{ flex: 1 }}>Investment / Saving</span>
        {!editing ? (
          <button className="inc-edit-btn" onClick={startEdit} title="Edit investment">✏</button>
        ) : (
          <>
            <button className="inc-save-btn" onClick={save} title="Save">✓</button>
            <button className="inc-cancel-btn" onClick={() => setEditing(false)} title="Cancel">✕</button>
          </>
        )}
      </div>

      <div className="card-content-scrollable" style={{ flex: 1, overflowY: 'auto', paddingRight: '6px' }}>
        <table className="snap-table">
          <thead>
            <tr>
              <th>Fund</th>
              <th className="right">Actual</th>
              <th className="right">Expected</th>
            </tr>
          </thead>
          <tbody>
            {editing ? drafts.map((inv, i) => {
              const parsedActual = parseFloat(inv.actual) || 0;
              const parsedExpected = inv.expected.trim() !== '' ? parseFloat(inv.expected) : null;
              const below = parsedExpected !== null && parsedActual < parsedExpected;
              return (
                <tr key={i} className={below ? 'row-warning' : ''}>
                  <td>
                    <input
                      type="text"
                      className="inc-slot-label"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="S-Emg / I-Fund"
                      value={inv.name}
                      onChange={e => updateDraft(i, 'name', e.target.value)}
                    />
                  </td>
                  <td className="right">
                    <input
                      type="number"
                      className="inc-slot-amount mono"
                      style={{ width: '80px', textAlign: 'right', float: 'right' }}
                      value={inv.actual}
                      onChange={e => updateDraft(i, 'actual', e.target.value)}
                    />
                  </td>
                  <td className="right">
                    <input
                      type="number"
                      className="inc-slot-amount mono"
                      style={{ width: '80px', textAlign: 'right', float: 'right' }}
                      placeholder="—"
                      value={inv.expected}
                      onChange={e => updateDraft(i, 'expected', e.target.value)}
                    />
                  </td>
                </tr>
              );
            }) : investments.map((inv, i) => {
              const below = inv.expected !== null && inv.actual < inv.expected;
              return (
                <tr key={i} className={below ? 'row-warning' : ''}>
                  <td>{inv.name}</td>
                  <td className={`val ${below ? 'red' : ''}`}>{fmt(inv.actual)}</td>
                  <td className="val muted">{inv.expected !== null ? fmt(inv.expected) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="section-total" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px', paddingTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Saving</span>
          <span className="mono" style={{ color: 'var(--accent)' }}>{fmt(totalSaving)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Investment</span>
          <span className="mono" style={{ color: 'var(--accent)' }}>{fmt(totalInvestment)}</span>
        </div>
      </div>
    </div>
  );
}
