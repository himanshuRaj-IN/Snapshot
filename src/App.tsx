import { useState, useEffect } from 'react';
import type { Snapshot, ExpenseItem, CreditEntry } from './data/schema';
import { getSnapshot, listSnapshotMonths, saveCoreSnapshot, saveTransactions, saveLedger, createNewSnapshot } from './services/dataService';
import SummaryBar from './components/SummaryBar';
import MajorExpenses from './components/MajorExpenses';
import InvestmentSaving from './components/InvestmentSaving';
import CreditDebt from './components/CreditDebt';
import LiquidCashFooter from './components/LiquidCashFooter';
import './App.css';

export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [months, setMonths] = useState<{key: string, label: string}[]>([]);
  const [currentKey, setCurrentKey] = useState('MAR_2026');
  
  const [pendingMonth, setPendingMonth] = useState<{key: string, label: string} | null>(null);

  useEffect(() => {
    listSnapshotMonths().then(setMonths);
  }, []);

  useEffect(() => {
    setLoading(true);
    getSnapshot(currentKey)
      .then(data => {
        // If dataService returned our mock/fallback or the exact month, we check if the label matches.
        // A simple check is if data.month doesn't match the requested key's string format roughly, 
        // it means we got a null/fallback and should prompt creation.
        const [m, y] = currentKey.split('_');
        const expected = `${m} ${y}`;
        if (data.month !== expected) {
          // Trigger create dialog
          setPendingMonth(months.find(m => m.key === currentKey) || { key: currentKey, label: expected });
          setLoading(false);
          return;
        }
        
        setSnapshot(data);
        setPendingMonth(null);
      })
      .finally(() => setLoading(false));
  }, [currentKey, months]);

  const handleCreateNew = async () => {
    if (!pendingMonth) return;
    setLoading(true);
    // Hardcoded to base off MAR_2026 for now, or you could base off current snapshot if exists
    const newSnap = await createNewSnapshot('MAR_2026', pendingMonth.key);
    setSnapshot(newSnap);
    setPendingMonth(null);
    setLoading(false);
  };

  const handleSaveCore = async (updated: Snapshot) => {
    setSnapshot(updated);
    await saveCoreSnapshot(updated);
  };

  const handleSaveExpenses = async (expenses: ExpenseItem[]) => {
    if (!snapshot) return;
    setSnapshot({ ...snapshot, expenses });
    await saveTransactions(snapshot.month, expenses);
  };

  const handleSaveCredits = async (credits: CreditEntry[]) => {
    if (!snapshot) return;
    setSnapshot({ ...snapshot, credits });
    await saveLedger(snapshot.month, credits);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading snapshot…</p>
      </div>
    );
  }

  // Pending creation overlay
  if (pendingMonth) {
    return (
      <div className="app-loading" style={{ flexDirection: 'column', gap: '20px' }}>
        <h2>Initialize {pendingMonth.label}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          This will carry over your closing balances from the previous session into the opening balances for {pendingMonth.label}.
        </p>
        <button 
          onClick={handleCreateNew}
          style={{ padding: '10px 20px', background: 'var(--accent)', color: 'var(--bg)', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          Create Snapshot
        </button>
        <button 
          onClick={() => setCurrentKey('MAR_2026')}
          style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
        >
          Cancel & Return
        </button>
      </div>
    );
  }

  if (!snapshot) return null;

  return (
    <div className="app">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <span className="app-logo-icon">◈</span>
            <span className="app-logo-label">snapshot</span>
          </div>
          
          <select 
            className="app-month-picker"
            value={currentKey}
            onChange={(e) => setCurrentKey(e.target.value)}
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '4px', fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}
          >
            {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>

          <div className="app-header-right">
            <span className="badge badge-green">● Live</span>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="app-main">
        <SummaryBar snapshot={snapshot} onSave={handleSaveCore} />

        <div className="grid-bottom">
          <MajorExpenses
            expenses={snapshot.expenses}
            budgets={snapshot.expenseBudgets}
            unaccounted={snapshot.expenseUnaccounted}
            onSave={handleSaveExpenses}
          />
          <InvestmentSaving 
            snapshot={snapshot}
            onSave={handleSaveCore} 
          />
          <CreditDebt 
            credits={snapshot.credits} 
            onSave={handleSaveCredits}
          />
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <LiquidCashFooter snapshot={snapshot} />
    </div>
  );
}
