import type { Snapshot } from './schema';

export interface HealthStatus {
  isIncOk: boolean;
  isInvOk: boolean;
  isSavOk: boolean;
  isChkOk: boolean;
  isCgOk: boolean;
  isDtOk: boolean;
  
  expInv: number;
  expSav: number;
  expChk: number;
  expCg: number;
  expDt: number;
  incomeDistributed: number;

  failures: string[];
  allPassed: boolean;
}

export function getHealthStatus(snapshot: Snapshot, computedTotalOverride?: number): HealthStatus {
  const { opening, closing, distributions, totalIncome } = snapshot;

  const dist = (lbl: string) => distributions.find(d => d.label === lbl)?.amount || 0;
  const sumDist = (...labels: string[]) => labels.reduce((sum, label) => sum + dist(label), 0);

  // Expected
  const expInv = opening.investment + dist('Investment');
  const expSav = opening.saving     + dist('Saving') + dist('Credit Repaid') - dist('Credit Given');
  const expChk = (opening.checking + opening.buffer) + sumDist('Buffer', 'Checking') - dist('For Expense');
  const expCg  = opening.creditGiven + dist('Credit Given') - dist('Credit Repaid');
  const expDt  = opening.debtTaken   + dist('Debt Taken')   - dist('Debt Repaid');

  // Checks
  const isInvOk = Math.abs(closing.investment - expInv) < 1;
  const isSavOk = Math.abs(closing.saving - expSav) < 1;
  const isChkOk = Math.abs((closing.checking + closing.buffer) - expChk) < 1;
  const isCgOk  = Math.abs(closing.creditGiven - expCg) < 1;
  const isDtOk  = Math.abs(closing.debtTaken - expDt) < 1;

  const incomeDistributed = dist('Investment') + dist('Saving') + sumDist('Buffer', 'Checking');
  const actualIncome = computedTotalOverride !== undefined ? computedTotalOverride : totalIncome;
  const isIncOk = Math.abs(actualIncome - incomeDistributed) < 1;

  const failures: string[] = [];
  if (!isIncOk) failures.push('💰 Cashflow Mismatch');
  if (!isInvOk) failures.push('📈 Investment Balance Mismatch');
  if (!isSavOk) failures.push('🏦 Saving Balance Mismatch');
  if (!isChkOk) failures.push('🧰 Buffer Balance Mismatch');
  if (!isCgOk)  failures.push('🤝 Credit Given Mismatch');
  if (!isDtOk)  failures.push('💳 Debt Taken Mismatch');

  return {
    isIncOk, isInvOk, isSavOk, isChkOk, isCgOk, isDtOk,
    expInv, expSav, expChk, expCg, expDt, incomeDistributed,
    failures,
    allPassed: failures.length === 0
  };
}
