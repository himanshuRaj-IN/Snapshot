// ─── Snapshot Data Schema ────────────────────────────────────────────────────
// All interfaces mirror the March 2026 spreadsheet columns exactly.
// When migrating to a real API, only `src/services/dataService.ts` needs
// to change — these types stay as the contract between UI and backend.

/** Opening / closing balances for one account row */
export interface AccountBalance {
  investment: number;
  saving: number;
  checking: number;
  creditGiven: number;  // money we lent out
  debtTaken: number;    // money we borrowed from others
}

/** A single income / distribution entry */
export interface CashFlowEntry {
  label: string;       // e.g. "FEB_Salary", "INVESTMENT", "CREDIT REPAID"
  amount: number;
}

/** A line item in the Major Expenses table */
export interface ExpenseItem {
  category: string;    // e.g. "FIXED ESSENTIALS", "UNACCOUNTED"
  name: string;        // e.g. "Rent"
  amount: number;
}

/** Expense budget buckets */
export interface ExpenseBudgets {
  budget: number;       // main budget
  budgetSmt: number;    // SMT budget
  budgetUfs: number;    // UFS budget
  inSettlement: number; // flat NCR
  settled: number;      // flat NCR settled
}

/** One investment / saving fund row */
export interface InvestmentItem {
  name: string;         // e.g. "MUTUAL FUND"
  actual: number;
  expected: number | null;  // null means no target set
}

/** One person entry in the credit / debt table */
export interface CreditEntry {
  entity: string;
  amount: number;
  lentOrOwe: number;
  settled: number;
  borrowed: number;
}

/** Root document — one month's complete snapshot */
export interface Snapshot {
  month: string;                   // e.g. "MARCH 2026"
  opening: AccountBalance;
  income: CashFlowEntry[];
  distributions: CashFlowEntry[];
  closing: AccountBalance;
  totalIncome: number;
  totalDistribution: number;
  expenses: ExpenseItem[];
  expenseBudgets: ExpenseBudgets;
  expenseUnaccounted: number;
  investments: InvestmentItem[];
  credits: CreditEntry[];
  isFreezed?: boolean;
}
