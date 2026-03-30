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
  const [dropdownKey, setDropdownKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // 1. On mount, fetch available months and select the most recent one automatically
  useEffect(() => {
    listSnapshotMonths().then(res => {
      setMonths(res);
      if (res.length > 0) {
        setDropdownKey(res[0].key);
        setActiveKey(res[0].key);
      } else {
        // Fallback if absolutely nothing is in DB
        setDropdownKey('MAR_2026');
        setActiveKey('MAR_2026');
      }
    });
  }, []);

  // 2. Fetch the snapshot ONLY whenever the ACTIVE key changes
  useEffect(() => {
    if (!activeKey) return;
    
    setLoading(true);
    getSnapshot(activeKey)
      .then(data => {
        setSnapshot(data);
      })
      .finally(() => setLoading(false));
  }, [activeKey]);

  const handleGo = () => {
    if (dropdownKey && dropdownKey !== activeKey) {
      setActiveKey(dropdownKey);
    }
  };

  // 3. Unblocked "New Snapshot" modal overlay flow
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSource, setCreateSource] = useState('');
  const [createTarget, setCreateTarget] = useState('');

  const openCreateModal = () => {
    setCreateSource(activeKey || (months.length > 0 ? months[0].key : 'MARCH_2026'));
    setCreateTarget('');
    setShowCreateModal(true);
  };

  const handleCreateNew = async () => {
    const input = createTarget.trim();
    if (!input) return;
    
    // Normalize format to strict Postgres expectations
    const formatted = input.toUpperCase().replace(/\s+/g, '_');
    const [m, y] = formatted.split('_');
    const VALID_MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    if (!m || !y || !/^\d{4}$/.test(y) || !VALID_MONTHS.includes(m)) {
      alert(`⚠️ Invalid Format: '${input}'\n\nPlease use the full month name and year. Example: "APRIL 2026" or "APRIL_2026"`);
      return;
    }

    // Block overwriting an existing snapshot completely
    if (months.find(x => x.key === formatted)) {
      alert(`Snapshot for ${m} ${y} already exists! Use the dropdown to select it.`);
      return;
    }

    setLoading(true);
    const newSnap = await createNewSnapshot(createSource, formatted);
    setSnapshot(newSnap);
    
    const updatedList = await listSnapshotMonths();
    setMonths(updatedList);
    
    // Auto-navigate to the newly created snapshot
    setDropdownKey(formatted);
    setActiveKey(formatted);
    
    setShowCreateModal(false);
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
              value={dropdownKey || ''}
              onChange={(e) => setDropdownKey(e.target.value)}
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '4px', fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
            >
              {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            
            <button 
              onClick={handleGo}
              style={{ padding: '6px 16px', background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600 }}
              title="Load selected snapshot"
            >
              Go
            </button>

            <button 
              onClick={openCreateModal}
              style={{ padding: '6px 12px', background: 'var(--accent)', color: '#000', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Create new snapshot using closing balances"
            >
              <span>+</span> New
            </button>
          </div>

          <div className="app-header-right">
            <span className="badge badge-green">● Live</span>
          </div>
        </div>
      </header>

      {/* ── Create Snapshot Modal ────────────────────────────────────── */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '10px', color: 'var(--text-primary)' }}>Initialize New Snapshot</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Select an existing snapshot to carry forward its <b>Closing Balances</b> into the <b>Opening Balances</b> of your new month.
            </p>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '30px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  SOURCE (Closing Balances)
                </label>
                <select 
                  value={createSource} 
                  onChange={e => setCreateSource(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer' }}
                >
                  {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>

              <div style={{ color: 'var(--accent)', fontSize: '1.5rem', marginTop: '20px' }}>→</div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  NEW (Opening Balances)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. APRIL 2026" 
                  value={createTarget}
                  onChange={e => setCreateTarget(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '1rem' }}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateNew}
                style={{ padding: '10px 18px', background: 'var(--accent)', border: 'none', color: '#000', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      )}

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
