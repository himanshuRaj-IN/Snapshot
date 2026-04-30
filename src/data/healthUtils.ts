import type { Snapshot } from './schema';

export interface HealthStatus {
  isIncOk: boolean;
  isInvOk: boolean;
  isSavOk: boolean;
  isBufOk: boolean;
  isChkOk: boolean;
  isCgOk: boolean;
  isDtOk: boolean;
  
  expInv: number;
  expSav: number;
  expBuf: number;
  expChk: number;
  expCg: number;
  expDt: number;
  incomeDistributed: number;

  failures: string[];
  allPassed: boolean;
}

export function getHealthStatus(snapshot: Snapshot, computedTotalOverride?: number): HealthStatus {
  const { opening, closing, distributions, income, totalIncome } = snapshot;

  const dist = (lbl: string) => distributions.find(d => d.label === lbl)?.amount || 0;
  const inc = (lbl: string) => income.find(i => i.label === lbl)?.amount || 0;
  const sumDist = (...labels: string[]) => labels.reduce((sum, label) => sum + dist(label), 0);

  const hasExpenses = snapshot.expenses.length > 0;

  const unforeseenExp = hasExpenses
    ? snapshot.expenses
        .filter(e => e.category.toUpperCase() === 'UNFORESEEN')
        .reduce((sum, e) => sum + e.amount, 0)
    : 0;

  const regularExp = hasExpenses
    ? snapshot.expenses
        .filter(e => e.category.toUpperCase() !== 'UNFORESEEN')
        .reduce((sum, e) => sum + e.amount, 0)
    : (dist('Expense') || dist('For Expense')); // fallback for DB-loaded snapshots

  // Expected
  const expInv = opening.investment + dist('Investment');
  const expSav = opening.saving     + dist('Saving') - dist('Credit Given');
  const expBuf = opening.buffer     + dist('Buffer') - unforeseenExp;
  const expChk = opening.checking + dist('Checking') - regularExp;   // Opening + Checking dist - regular expenses
  const expCg  = opening.creditGiven + dist('Credit Given') - inc('Credit Repaid');
  const expDt  = opening.debtTaken   + inc('Debt Taken')   - dist('Debt Repaid');

  // Checks
  // For these assets, having more than expected is considered a pass
  const isInvOk = closing.investment >= expInv - 1;
  const isSavOk = closing.saving >= expSav - 1;
  const isBufOk = closing.buffer >= expBuf - 1;
  const isChkOk = closing.checking >= expChk - 1;
  
  // For liabilities / loans, we still want exact matching
  const isCgOk  = Math.abs(closing.creditGiven - expCg) < 1;
  const isDtOk  = Math.abs(closing.debtTaken - expDt) < 1;

  const incomeDistributed = dist('Investment') + dist('Saving') + sumDist('Buffer', 'Checking');
  const actualIncome = computedTotalOverride !== undefined ? computedTotalOverride : totalIncome;
  
  const isIncOk = Math.abs(actualIncome - incomeDistributed) < 1;

  const failures: string[] = [];
  if (!isIncOk) failures.push('⚖️ Zero-Sum Dist Mismatch');
  if (!isInvOk) failures.push('📈 Investment Balance Mismatch');
  if (!isSavOk) failures.push('🏦 Saving Balance Mismatch');
  if (!isBufOk) failures.push('🧰 Buffer Balance Mismatch');
  if (!isChkOk) failures.push('💳 Checking Balance Mismatch');
  if (!isCgOk)  failures.push('🤝 Credit Given Mismatch');
  if (!isDtOk)  failures.push('💳 Debt Taken Mismatch');

  return {
    isIncOk, isInvOk, isSavOk, isBufOk, isChkOk, isCgOk, isDtOk,
    expInv, expSav, expBuf, expChk, expCg, expDt, incomeDistributed,
    failures,
    allPassed: failures.length === 0
  };
}
