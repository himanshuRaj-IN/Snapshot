import { useState } from 'react';
import type { Snapshot } from '../data/schema';
import './LiquidCashFooter.css';

interface Props { snapshot: Snapshot }

const fmt = (n: number) => n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmtRaw = (n: number) => n.toLocaleString('en-IN');

export default function LiquidCashFooter({ snapshot }: Props) {
  const [visible, setVisible] = useState(false);

  const { closing, expenses, expenseUnaccounted, investments } = snapshot;

  const acc    = closing.checking + closing.saving;
  const xpLeft = (snapshot.expenseBudgets.budget) -
                 (expenses.reduce((s, e) => s + e.amount, 0) + expenseUnaccounted);
  const sav    = investments.reduce((s, i) => s + i.actual, 0);
  const liquid = acc + xpLeft;

  return (
    <footer className="lcf">
      <div className="lcf-inner">
        <div className="lcf-formula mono">
          <span className="lcf-prompt">$</span>
          <span className="lcf-code">
            liquid_cash = acc(<span className="lcf-val blue">{fmtRaw(acc)}</span>)
            {' '}+ xp_left(<span className={`lcf-val ${xpLeft >= 0 ? 'green' : 'red'}`}>{fmtRaw(xpLeft)}</span>)
          </span>
        </div>
        <div className="lcf-result">
          <button
            className="lcf-eye"
            onClick={() => setVisible(v => !v)}
            title={visible ? 'Hide' : 'Show'}
            aria-label={visible ? 'Hide liquid cash' : 'Show liquid cash'}
          >
            {visible ? '◉' : '○'}
          </button>
          <span className="lcf-amount mono">
            {visible ? fmt(liquid) : '₹ ••••••'}
          </span>
        </div>
      </div>
      <div className="lcf-note">
        acc = checking + saving &nbsp;·&nbsp; xp_left = budget − spent &nbsp;·&nbsp; sav = {fmtRaw(sav)}
      </div>
    </footer>
  );
}
