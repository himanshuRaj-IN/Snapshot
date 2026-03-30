import { useState } from 'react';
import type { Snapshot, CashFlowEntry } from '../data/schema';
import './SummaryBar.css';

interface Props {
  snapshot: Snapshot;
  onSave?: (updated: Snapshot) => void;
}

const fmt = (n: number) => n.toLocaleString('en-IN');

const EMPTY_SLOTS = Array.from({ length: 5 }, () => ({ label: '', amount: '' }));

export default function SummaryBar({ snapshot, onSave }: Props) {
  const { opening, closing, income, distributions, totalIncome } = snapshot;

  // Income inline editor
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeDraft, setIncomeDraft] = useState(EMPTY_SLOTS);

  const openIncomeEditor = () => {
    // Pre-fill draft from current income (up to 5 slots)
    const filled = income.slice(0, 5).map(e => ({ label: e.label, amount: String(e.amount) }));
    const padded = [...filled, ...EMPTY_SLOTS].slice(0, 5);
    setIncomeDraft(padded);
    setEditingIncome(true);
  };

  const saveIncome = () => {
    const _filteredIncome: CashFlowEntry[] = incomeDraft
      .filter(s => s.label.trim() && !isNaN(parseFloat(s.amount)))
      .map(s => ({ label: s.label.trim(), amount: parseFloat(s.amount) }));
      
    if (onSave) onSave({ ...snapshot, income: _filteredIncome });
    setEditingIncome(false);
  };

  const updateSlot = (i: number, field: 'label' | 'amount', val: string) => {
    setIncomeDraft(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  // Distribution inline editor
  const [editingDist, setEditingDist] = useState(false);
  const [distDraft, setDistDraft] = useState<{label: string, amount: string}[]>([]);

  const openDistEditor = () => {
    setDistDraft(distributions.map(e => ({ label: e.label, amount: String(e.amount) })));
    setEditingDist(true);
  };

  const saveDist = () => {
    const _filteredDist: CashFlowEntry[] = distDraft.map(s => ({
      label: s.label,
      amount: parseFloat(s.amount) || 0
    }));
    if (onSave) onSave({ ...snapshot, distributions: _filteredDist });
    setEditingDist(false);
  };

  const updateDistSlot = (i: number, val: string) => {
    setDistDraft(prev => prev.map((s, idx) => idx === i ? { ...s, amount: val } : s));
  };

  // Derive current displayed income + total (use draft when editing)
  const displayedIncome = editingIncome
    ? incomeDraft.filter(s => s.label || s.amount)
    : income;
  const computedTotal = editingIncome
    ? incomeDraft.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
    : totalIncome;

  // Closing inline editor
  const [editingClosing, setEditingClosing] = useState(false);
  const [closingDraft, setClosingDraft] = useState({
    investment: '', saving: '', checking: '', creditGiven: '', debtTaken: ''
  });

  const openClosingEditor = () => {
    setClosingDraft({
      investment: String(closing.investment),
      saving: String(closing.saving),
      checking: String(closing.checking),
      creditGiven: String(closing.creditGiven),
      debtTaken: String(closing.debtTaken)
    });
    setEditingClosing(true);
  };

  const saveClosing = () => {
    if (onSave) {
      onSave({
        ...snapshot,
        closing: {
          investment: parseFloat(closingDraft.investment) || 0,
          saving: parseFloat(closingDraft.saving) || 0,
          checking: parseFloat(closingDraft.checking) || 0,
          creditGiven: parseFloat(closingDraft.creditGiven) || 0,
          debtTaken: parseFloat(closingDraft.debtTaken) || 0
        }
      });
    }
    setEditingClosing(false);
  };

  const updateClosingDraft = (field: keyof typeof closingDraft, val: string) => {
    setClosingDraft(prev => ({ ...prev, [field]: val }));
  };

  // Formula helper
  const dist = (lbl: string) => distributions.find(d => d.label === lbl)?.amount || 0;

  // Expected calculations
  const expInv = opening.investment + dist('Investment');
  const expSav = opening.saving     + dist('Saving') + dist('Credit Repaid') - dist('Credit Given');
  const expChk = opening.checking   + dist('Checking') - dist('For Expense');
  const expCg  = opening.creditGiven + dist('Credit Given') - dist('Credit Repaid');
  const expDt  = opening.debtTaken   + dist('Debt Taken')   - dist('Debt Repaid');

  return (
    <section className="summary-section">
      {/* ── Health Check strip (Placeholder) ─────────────────────────────── */}
      <div className="hc-strip">
        <span className="hc-strip-label" style={{ fontWeight: 600 }}>Health</span>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75em', textTransform: 'none', letterSpacing: 'normal' }}>
          Placeholder card for future use
        </div>
      </div>

      {/* ── Balance panels ───────────────────────────────────────────────── */}
      <div className="summary-bar">
        {/* Opening */}
        <div className="sb-panel">
          <div className="sb-panel-label">Opening</div>
          <div className="sb-panel-grid">
            <SbRow label="Investment"  value={opening.investment} accent />
            <SbRow label="Saving"      value={opening.saving} />
            <SbRow label="Checking"    value={opening.checking} />
            <SbRow label="Credit Given" value={opening.creditGiven} dim />
            <SbRow label="Debt Taken"  value={opening.debtTaken} red />
          </div>
          <div className="sb-total">
            <span>Total</span>
            <span className="mono">{fmt(opening.investment + opening.saving + opening.checking + opening.creditGiven)}</span>
          </div>
        </div>

        {/* Cash Flow */}
        <div className="sb-panel sb-panel-flow">
          <div className="sb-flow-cols">
            {/* ── Income column ───────────────────────────────────────── */}
            <div className="sb-flow-col">
              <div className="sb-panel-label">
                Income
                {!editingIncome && (
                  <button className="inc-edit-btn" onClick={openIncomeEditor} title="Edit income">✏</button>
                )}
                {editingIncome && (
                  <>
                    <button className="inc-save-btn" onClick={saveIncome} title="Save">✓</button>
                    <button className="inc-cancel-btn" onClick={() => setEditingIncome(false)} title="Cancel">✕</button>
                  </>
                )}
              </div>

              {/* Edit mode: show all 5 slots */}
              {editingIncome ? (
                <div className="inc-edit-slots">
                  {incomeDraft.map((slot, i) => (
                    <div key={i} className="inc-slot-row">
                      <input
                        className="inc-slot-label"
                        type="text"
                        placeholder={`Source ${i + 1}`}
                        value={slot.label}
                        onChange={e => updateSlot(i, 'label', e.target.value)}
                      />
                      <input
                        className="inc-slot-amount mono"
                        type="number"
                        placeholder="0"
                        value={slot.amount}
                        onChange={e => updateSlot(i, 'amount', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* View mode: only non-empty rows */
                displayedIncome.map((e, i) => (
                  <div key={i} className="sb-flow-row">
                    <span className="sb-flow-label">{e.label}</span>
                    <span className="mono sb-flow-val">{(e as CashFlowEntry).amount > 0 ? fmt((e as CashFlowEntry).amount) : '—'}</span>
                  </div>
                ))
              )}

              <div className="sb-total">
                <span>Total</span>
                <span className="mono green">{fmt(computedTotal)}</span>
              </div>
            </div>
            {/* Distribution */}
            <div className="sb-flow-col">
              <div className="sb-panel-label">
                Distribution
                {!editingDist && (
                  <button className="inc-edit-btn" onClick={openDistEditor} title="Edit distribution">✏</button>
                )}
                {editingDist && (
                  <>
                    <button className="inc-save-btn" onClick={saveDist} title="Save">✓</button>
                    <button className="inc-cancel-btn" onClick={() => setEditingDist(false)} title="Cancel">✕</button>
                  </>
                )}
              </div>

              {editingDist ? (
                <div className="inc-edit-slots">
                  {distDraft.map((slot, i) => (
                    <div key={i} className="inc-slot-row">
                      <span className="inc-slot-fixed-label">{slot.label}</span>
                      <input
                        className="inc-slot-amount mono"
                        type="number"
                        placeholder="0"
                        value={slot.amount}
                        onChange={e => updateDistSlot(i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                distributions.map((e, i) => {
                  const netNote =
                    e.label === 'Saving'   ? opening.saving   + e.amount :
                    e.label === 'Checking' ? opening.checking + e.amount : null;
                  return (
                    <div key={i} className="sb-flow-row">
                      <span className="sb-flow-label">{e.label}</span>
                      <span className="sb-flow-val-stack">
                        <span className="mono sb-flow-val">{e.amount > 0 ? fmt(e.amount) : '—'}</span>
                        {netNote !== null && <span className="mono sb-flow-net-stacked">{fmt(netNote)}</span>}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Net Flow */}
              {(() => {
                const outLabels = new Set(['Credit Given', 'Debt Repaid', 'For Expense']);
                const src = editingDist
                  ? distDraft.map(s => ({ label: s.label, amount: parseFloat(s.amount) || 0 }))
                  : distributions;
                const inflow  = src.filter(e => !outLabels.has(e.label)).reduce((s, e) => s + e.amount, 0);
                const outflow = src.filter(e =>  outLabels.has(e.label)).reduce((s, e) => s + e.amount, 0);
                const net = inflow - outflow;
                return (
                  <div className="sb-total">
                    <span>Net Flow</span>
                    <span className={`mono ${net >= 0 ? 'green' : 'red'}`}>
                      {net >= 0 ? '+' : ''}{fmt(net)}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Closing */}
        <div className="sb-panel">
          <div className="sb-panel-label">
            Closing
            {!editingClosing && (
              <button className="inc-edit-btn" onClick={openClosingEditor} title="Edit closing">✏</button>
            )}
            {editingClosing && (
              <>
                <button className="inc-save-btn" onClick={saveClosing} title="Save">✓</button>
                <button className="inc-cancel-btn" onClick={() => setEditingClosing(false)} title="Cancel">✕</button>
              </>
            )}
          </div>

          <div className="sb-panel-grid">
            {editingClosing ? (
              <div className="inc-edit-slots">
                <ClosingInput label="Investment" value={closingDraft.investment} onChange={val => updateClosingDraft('investment', val)} expected={expInv} />
                <ClosingInput label="Saving"     value={closingDraft.saving}     onChange={val => updateClosingDraft('saving', val)}     expected={expSav} />
                <ClosingInput label="Checking"   value={closingDraft.checking}   onChange={val => updateClosingDraft('checking', val)}   expected={expChk} />
                <ClosingInput label="Credit Given" value={closingDraft.creditGiven} onChange={val => updateClosingDraft('creditGiven', val)} expected={expCg} />
                <ClosingInput label="Debt Taken"  value={closingDraft.debtTaken}  onChange={val => updateClosingDraft('debtTaken', val)}  expected={expDt} />
              </div>
            ) : (
              <>
                <SbRow label="Investment"  value={closing.investment} expected={expInv} accent />
                <SbRow label="Saving"      value={closing.saving}     expected={expSav} />
                <SbRow label="Checking"    value={closing.checking}   expected={expChk} />
                <SbRow label="Credit Given" value={closing.creditGiven} expected={expCg} dim />
                <SbRow label="Debt Taken"  value={closing.debtTaken}  expected={expDt} red />
              </>
            )}
          </div>
          <div className="sb-total">
            <span>Total</span>
            <span className="mono">{fmt(closing.investment + closing.saving + closing.checking + closing.creditGiven)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SbRow({ label, value, expected, accent, dim, red }: { label: string; value: number; expected?: number; accent?: boolean; dim?: boolean; red?: boolean }) {
  return (
    <div className={`sb-row ${accent ? 'sb-row-accent' : ''} ${dim ? 'sb-row-dim' : ''} ${red ? 'sb-row-red' : ''}`}>
      <span className="sb-row-label">{label}</span>
      <div className="sb-row-val-stack">
        <span className="mono sb-row-val">{fmt(value)}</span>
        {expected !== undefined && (
          <span className="mono sb-row-expected">
            {fmt(expected)}
          </span>
        )}
      </div>
    </div>
  );
}

function ClosingInput({ label, value, onChange, expected }: { label: string, value: string, onChange: (val: string) => void, expected: number }) {
  return (
    <div className="inc-slot-row">
      <span className="inc-slot-fixed-label" style={{ fontSize: '0.74rem' }}>{label}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
        <input
          className="inc-slot-amount mono"
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: '100%' }}
        />
        <span className="mono" style={{ fontSize: '0.64rem', color: 'var(--text-muted)', paddingRight: '4px' }}>{fmt(expected)}</span>
      </div>
    </div>
  );
}


