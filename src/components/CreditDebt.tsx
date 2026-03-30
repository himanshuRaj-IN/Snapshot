import type { CreditEntry } from '../data/schema';
import './Sections.css';

interface Props {
  credits: CreditEntry[];
  onSave?: (credits: CreditEntry[]) => void;
}

const fmt = (n: number) => n > 0 ? n.toLocaleString('en-IN') : '—';

export default function CreditDebt({ credits }: Props) {
  const totalLent     = credits.reduce((s, c) => s + c.lentOrOwe, 0);
  const totalSettled  = credits.reduce((s, c) => s + c.settled, 0);
  const totalBorrowed = credits.reduce((s, c) => s + c.borrowed, 0);

  return (
    <div className="card">
      <div className="card-title">
        <span className="card-title-icon" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>⇄</span>
        Credit &amp; Debt
      </div>

      <div className="overflow-x">
        <table className="snap-table">
          <thead>
            <tr>
              <th>Entity</th>
              <th className="right">Amt</th>
              <th className="right">Lent/Owe</th>
              <th className="right">Settled</th>
              <th className="right">Borrowed</th>
            </tr>
          </thead>
          <tbody>
            {credits.map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.entity}</td>
                <td className="val">{fmt(c.amount)}</td>
                <td className="val green">{fmt(c.lentOrOwe)}</td>
                <td className="val muted">{fmt(c.settled)}</td>
                <td className="val red">{fmt(c.borrowed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divider" />

      <div className="credit-summary">
        <div className="credit-summary-row">
          <span className="muted">Total Lent</span>
          <span className="mono green">{totalLent.toLocaleString('en-IN')}</span>
        </div>
        <div className="credit-summary-row">
          <span className="muted">Total Settled</span>
          <span className="mono">{totalSettled.toLocaleString('en-IN')}</span>
        </div>
        <div className="credit-summary-row">
          <span className="muted">Total Borrowed</span>
          <span className="mono red">{totalBorrowed.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
