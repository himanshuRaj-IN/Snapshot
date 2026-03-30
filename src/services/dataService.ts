// ─── Data Service ─────────────────────────────────────────────────────────────
// This is the ONLY file to edit when migrating away from sample data.
// Replace the function bodies with `fetch('/api/snapshots/...')` calls.
// The return types stay the same — components never import sampleData directly.
// ─────────────────────────────────────────────────────────────────────────────
import type { Snapshot } from '../data/schema';
import { MAR_2026 } from '../data/sampleData';

/** Fetch the snapshot and all related tables for a given month key */
export async function getSnapshot(_monthKey: string): Promise<Snapshot> {
  try {
    const [month, year] = _monthKey.split('_'); 
    
    // Fetch all 3 endpoints concurrently
    const [snapRes, transRes, ledgRes] = await Promise.all([
      fetch(`/api/snapshots?month=${month || 'MARCH'}&year=${year || 2026}`),
      fetch(`/api/transactions?month=${month || 'MARCH'}&year=${year || 2026}`),
      fetch(`/api/ledger?month=${month || 'MARCH'}&year=${year || 2026}`)
    ]);

    if (snapRes.ok) {
      const dbSnap = await snapRes.json();
      if (dbSnap) {
        const expenses = transRes.ok ? await transRes.json() : [];
        const credits = ledgRes.ok ? await ledgRes.json() : [];
        
        return { 
          ...dbSnap, 
          expenses, 
          credits 
        };
      }
    }
  } catch (e) {
    console.warn('API not available, falling back to mock data');
  }
  // Fallback ensures UI renders if Neon DB is empty
  return MAR_2026; 
}

/** Upsert the Core Snapshot (Summary & Investment payload) */
export async function saveCoreSnapshot(snapshot: Snapshot): Promise<void> {
  try {
    await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
  } catch (e) {
    console.error('Failed to save snapshot:', e);
  }
}

/** Fast upsert exactly for Major Expenses table */
export async function saveTransactions(month: string, expenses: Snapshot['expenses']): Promise<void> {
  try {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, expenses }),
    });
  } catch (e) {
    console.error('Failed to save transactions:', e);
  }
}

/** Fast upsert exactly for Credit/Debt table */
export async function saveLedger(month: string, credits: Snapshot['credits']): Promise<void> {
  try {
    await fetch('/api/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, credits }),
    });
  } catch (e) {
    console.error('Failed to save credit ledger:', e);
  }
}

/** Initialize a New Session Month by copying previous month closing to opening */
export async function createNewSnapshot(sourceMonthKey: string, destMonthKey: string): Promise<Snapshot> {
  // Fetch old state
  const oldSnap = await getSnapshot(sourceMonthKey);
  const [newMonth, newYear] = destMonthKey.split('_');

  const newSnap: Snapshot = {
    ...oldSnap,
    month: `${newMonth} ${newYear}`,
    // Carry over closing to opening!
    opening: { ...oldSnap.closing },
    // Reset closing (or assume it matches opening until touched)
    closing: { ...oldSnap.closing },
    // Blank slate for flow items
    income: [],
    distributions: [],
    expenses: [],
    credits: [],
    totalIncome: 0,
    totalDistribution: 0,
    expenseUnaccounted: 0,
    expenseBudgets: { budget: 0, budgetSmt: 0, budgetUfs: 0, inSettlement: 0, settled: 0 }
  };

  // Push to backend immediately to cement it
  await saveCoreSnapshot(newSnap);
  return newSnap;
}

/** List available snapshot months (for navigation / month picker) */
export async function listSnapshotMonths(): Promise<{ key: string; label: string }[]> {
  try {
    const res = await fetch('/api/snapshots?list=true');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Could not list months');
  }
  return [{ key: 'MAR_2026', label: 'March 2026' }];
}
