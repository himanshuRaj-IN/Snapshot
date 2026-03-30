import type { Snapshot } from './schema';

// ─── March 2026 Sample Data ──────────────────────────────────────────────────
// This file is the ONLY place to change when migrating to a real database.
// Values taken directly from Personal Finance — MAR_2026.pdf
// ─────────────────────────────────────────────────────────────────────────────

export const MAR_2026: Snapshot = {
  month: 'MARCH 2026',

  // ── Balances ────────────────────────────────────────────────────────────────
  opening: {
    investment: 164000,
    saving: 22158,
    checking: 15578,
    creditGiven: 89000,
    debtTaken: 51000,
  },

  closing: {
    investment: 180000,
    saving: 40001,
    checking: 2365,
    creditGiven: 104000,
    debtTaken: 51000,
  },

  // ── Cash Flow ───────────────────────────────────────────────────────────────
  totalIncome: 75333,
  income: [
    { label: 'FEB_Salary', amount: 75333 },
  ],

  totalDistribution: 326366,
  distributions: [
    { label: 'Investment', amount: 16000 },
    { label: 'Saving', amount: 32842 },
    { label: 'Checking', amount: 26491 },
    { label: 'Credit Repaid', amount: 35000 },
    { label: 'Credit Given', amount: 50000 },
    { label: 'Debt Taken', amount: 0 },
    { label: 'Debt Repaid', amount: 0 },
    { label: 'For Expense', amount: 24704 },
  ],

  // ── Major Expenses ──────────────────────────────────────────────────────────
  expenses: [
    { category: 'FIXED ESSENTIALS', name: 'Rent', amount: 4000 },
    { category: 'FIXED NONESSENTIALS', name: '', amount: 0 },
    { category: 'PERSONAL ESSENTIALS', name: '', amount: 0 },
    { category: 'PERSONAL NONESSENTIALS', name: 'Cash Withdrawal', amount: 1000 },
    { category: 'FIXED ESSENTIALS', name: 'House Help', amount: 1888 },
    { category: 'FIXED ESSENTIALS', name: '', amount: 0 },
    { category: 'UNFORESEEN', name: 'Bike Repair', amount: 10000 },
  ],

  expenseUnaccounted: 5038,

  expenseBudgets: {
    budget: 12000,
    budgetSmt: 8000,
    budgetUfs: 20000,
    inSettlement: 3000,   // Flat NCR in-settlement
    settled: 0,           // Flat NCR settled
  },

  // ── Investments & Savings ───────────────────────────────────────────────────
  investments: [
    { name: 'I-MUTUAL FUND', actual: 131000, expected: null },
    { name: 'I-EQUITY', actual: 48000, expected: null },
    { name: 'S-EMERGENCY FUND', actual: 20000, expected: 80000 },  // ⚠ below target
    { name: 'S-CONTINGENCY FUND', actual: 20000, expected: 20000 },
  ],

  // ── Credit Given / Debt Taken ───────────────────────────────────────────────
  credits: [
    { entity: 'Dipanshu Raj', amount: 30000, lentOrOwe: 50000, settled: 20000, borrowed: 0 },
    { entity: 'Anuj', amount: 0, lentOrOwe: 15000, settled: 15000, borrowed: 0 },
    { entity: 'Amit', amount: 13000, lentOrOwe: 13000, settled: 0, borrowed: 0 },
    { entity: 'Amar', amount: 1000, lentOrOwe: 0, settled: 0, borrowed: 1000 },
    { entity: 'Amit Katu', amount: 50000, lentOrOwe: 0, settled: 0, borrowed: 50000 },
    { entity: 'Shwetank', amount: 10000, lentOrOwe: 10000, settled: 0, borrowed: 0 },
  ],
};
