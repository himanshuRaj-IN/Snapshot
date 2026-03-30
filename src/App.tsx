import { useState, useEffect } from 'react';
import type { Snapshot } from './data/schema';
import { getSnapshot } from './services/dataService';
import SummaryBar from './components/SummaryBar';
import MajorExpenses from './components/MajorExpenses';
import InvestmentSaving from './components/InvestmentSaving';
import CreditDebt from './components/CreditDebt';
import LiquidCashFooter from './components/LiquidCashFooter';
import './App.css';

export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSnapshot('MAR_2026')
      .then(data => setSnapshot(data))
      .finally(() => setLoading(false));
  }, []);

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
          <h1 className="app-month">{snapshot.month}</h1>
          <div className="app-header-right">
            <span className="badge badge-green">● Live</span>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="app-main">
        <SummaryBar snapshot={snapshot} />

        <div className="grid-bottom">
          <MajorExpenses
            expenses={snapshot.expenses}
            budgets={snapshot.expenseBudgets}
            unaccounted={snapshot.expenseUnaccounted}
          />
          <InvestmentSaving investments={snapshot.investments} />
          <CreditDebt credits={snapshot.credits} />
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <LiquidCashFooter snapshot={snapshot} />
    </div>
  );
}
