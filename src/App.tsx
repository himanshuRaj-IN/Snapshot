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
  const [currentKey, setCurrentKey] = useState<string | null>(null);

  // 1. On mount, fetch available months and select the most recent one automatically
  useEffect(() => {
    listSnapshotMonths().then(res => {
      setMonths(res);
      if (res.length > 0) {
        setCurrentKey(res[0].key);
      } else {
        // Fallback if absolutely nothing is in DB
        setCurrentKey('MAR_2026');
      }
    });
  }, []);

  // 2. Fetch the snapshot whenever the current key changes
  useEffect(() => {
    if (!currentKey) return;
    
    setLoading(true);
    getSnapshot(currentKey)
      .then(data => {
        setSnapshot(data);
      })
      .finally(() => setLoading(false));
  }, [currentKey]);

  // 3. Unblocked "New Snapshot" flow triggered by explicit button click
  const handleCreateNew = async () => {
    const input = window.prompt("Enter new month key (e.g. MAY_2026):");
    if (!input) return;
    
    const formatted = input.toUpperCase().replace(/\s+/g, '_');
    if (!/^[A-Z]{3}_\d{4}$/.test(formatted)) {
      alert('Invalid format. Must be formatted like MAY_2026 or APR 2026');
      return;
    }

    setLoading(true);
    // Copy opening balances from whatever you were just looking at!
    const baseMonth = currentKey || 'MAR_2026';
    const newSnap = await createNewSnapshot(baseMonth, formatted);
    
    setSnapshot(newSnap);
    
    const updatedList = await listSnapshotMonths();
    setMonths(updatedList);
    setCurrentKey(formatted);
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

  if (loading && !snapshot) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading snapshot…</p>
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
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select 
              className="app-month-picker"
              value={currentKey || ''}
              onChange={(e) => setCurrentKey(e.target.value)}
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '4px', fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
            >
              {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            
            <button 
              onClick={handleCreateNew}
              style={{ padding: '6px 12px', background: 'var(--accent)', color: '#000', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Create new snapshot using current closing balances"
            >
              <span>+</span> New
            </button>
          </div>

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
