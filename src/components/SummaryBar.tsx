import { useState } from 'react';
import type { Snapshot, CashFlowEntry } from '../data/schema';
import { getHealthStatus } from '../data/healthUtils';
import './SummaryBar.css';

interface Props {
  snapshot: Snapshot;
  onSave?: (updated: Snapshot) => void;
  readOnly?: boolean;
}

const fmt = (n: number) => n.toLocaleString('en-IN');

const EMPTY_SLOTS = Array.from({ length: 5 }, () => ({ label: '', amount: '' }));

export default function SummaryBar({ snapshot, onSave, readOnly }: Props) {
  const { opening, closing, income, distributions, totalIncome } = snapshot;

  // Income inline editor
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeDraft, setIncomeDraft] = useState<{label: string, amount: string, fixed?: boolean}[]>([]);

  const openIncomeEditor = () => {
    const fixedLabels = ['Credit Repaid', 'Debt Taken'];
    const normalIncome = income.filter(e => !fixedLabels.includes(e.label));
    const cr = income.find(e => e.label === 'Credit Repaid') || { label: 'Credit Repaid', amount: 0 };
    const dt = income.find(e => e.label === 'Debt Taken') || { label: 'Debt Taken', amount: 0 };

    const filled = normalIncome.slice(0, 5).map(e => ({ label: e.label, amount: String(e.amount) }));
    const padded: { label: string; amount: string; fixed?: boolean }[] = [...filled, ...EMPTY_SLOTS].slice(0, 5);
    
    padded.push({ label: 'Credit Repaid', amount: String(cr.amount), fixed: true });
    padded.push({ label: 'Debt Taken', amount: String(dt.amount), fixed: true });

    setIncomeDraft(padded);
    setEditingIncome(true);
  };

  const saveIncome = () => {
    const _filteredIncome: CashFlowEntry[] = incomeDraft
      .filter(s => s.fixed || (s.label.trim() && !isNaN(parseFloat(s.amount))))
      .map(s => ({ label: s.label.trim(), amount: parseFloat(s.amount) || 0 }));
      
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
    investment: '', saving: '', checking: '', buffer: '', creditGiven: '', debtTaken: ''
  });

  const openClosingEditor = () => {
    setClosingDraft({
      investment: String(closing.investment),
      saving: String(closing.saving),
      checking: String(closing.checking),
      buffer: String(closing.buffer),
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
          buffer: parseFloat(closingDraft.buffer) || 0,
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

  // Health Status
  const health = getHealthStatus(snapshot, computedTotal);

  return (
    <section className="summary-section">
      {/* ── Health Check strip ───────────────────────────────────────────── */}
      <div className="hc-strip">
        <div className="hc-badges">
          <HealthBadge label="Zero-Sum"   pass={health.isIncOk} actual={computedTotal}            expected={health.incomeDistributed} icon="⚖️" />
          <HealthBadge label="Investment" pass={health.isInvOk} actual={closing.investment}       expected={health.expInv} icon="📈" />
          <HealthBadge label="Saving"     pass={health.isSavOk} actual={closing.saving}           expected={health.expSav} icon="🏦" />
          <HealthBadge label="Buffer"     pass={health.isBufOk} actual={closing.buffer}           expected={health.expBuf} icon="🧰" />
          <HealthBadge label="Checking"   pass={health.isChkOk} actual={closing.checking}         expected={health.expChk} icon="💳" />
          <HealthBadge label="Credit"     pass={health.isCgOk}  actual={closing.creditGiven}       expected={health.expCg} icon="🤝" />
          <HealthBadge label="Debt"       pass={health.isDtOk}  actual={closing.debtTaken}         expected={health.expDt} icon="📉" />
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
            <SbRow label="Buffer"      value={opening.buffer} />
            <SbRow label="Checking"    value={opening.checking} />
            <SbRow label="Credit Given" value={opening.creditGiven} dim />
            <SbRow label="Debt Taken"  value={opening.debtTaken} red />
          </div>
          <div className="sb-total">
            <span>Total</span>
            <span className="mono">{fmt(opening.investment + opening.saving + opening.checking + opening.buffer + opening.creditGiven)}</span>
          </div>
        </div>

        {/* Cash Flow */}
        <div className="sb-panel sb-panel-flow">
          <div className="sb-flow-cols">
            {/* ── Income column ───────────────────────────────────────── */}
            <div className="sb-flow-col">
              <div className="sb-panel-label">
                Income
                {!editingIncome && !readOnly && (
                  <button className="inc-edit-btn" onClick={openIncomeEditor} title="Edit income">✏</button>
                )}
                {editingIncome && (
                  <>
                    <button className="inc-save-btn" onClick={saveIncome} title="Save">✓</button>
                    <button className="inc-cancel-btn" onClick={() => setEditingIncome(false)} title="Cancel">✕</button>
                  </>
                )}
              </div>

              {/* Edit mode: show normal and fixed slots */}
              {editingIncome ? (
                <div className="inc-edit-slots">
                  {incomeDraft.map((slot, i) => (
                    <div key={i} className="inc-slot-row">
                      {slot.fixed ? (
                        <span className="inc-slot-fixed-label">{slot.label}</span>
                      ) : (
                        <input
                          className="inc-slot-label"
                          type="text"
                          placeholder={`Source ${i + 1}`}
                          value={slot.label}
                          onChange={e => updateSlot(i, 'label', e.target.value)}
                        />
                      )}
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
                {!editingDist && !readOnly && (
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
                  const getOpening = (lbl: string) => {
                    switch (lbl) {
                      case 'Investment': return opening.investment;
                      case 'Saving': return opening.saving;
                      case 'Buffer': return opening.buffer;
                      case 'Checking': return opening.checking;
                      case 'Credit Given': return opening.creditGiven;
                      case 'Debt Taken': return opening.debtTaken;
                      default: return null;
                    }
                  };
                  const op = getOpening(e.label);
                  const netNote = op !== null ? op + e.amount : null;
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
                const inLabels = new Set(['Investment', 'Saving', 'Buffer', 'Checking']);
                const outLabels = new Set(['Credit Given', 'Debt Repaid', 'Expense']);
                const src = editingDist
                  ? distDraft.map(s => ({ label: s.label, amount: parseFloat(s.amount) || 0 }))
                  : distributions;
                const inflow  = src.filter(e => inLabels.has(e.label)).reduce((s, e) => s + e.amount, 0);
                const outflow = src.filter(e => outLabels.has(e.label)).reduce((s, e) => s + e.amount, 0);
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
            {!editingClosing && !readOnly && (
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
                <ClosingInput label="Investment" value={closingDraft.investment} onChange={val => updateClosingDraft('investment', val)} expected={health.expInv} />
                <ClosingInput label="Saving"     value={closingDraft.saving}     onChange={val => updateClosingDraft('saving', val)}     expected={health.expSav} />
                <ClosingInput label="Buffer"     value={closingDraft.buffer}     onChange={val => updateClosingDraft('buffer', val)}     expected={health.expBuf} />
                <ClosingInput label="Checking"   value={closingDraft.checking}   onChange={val => updateClosingDraft('checking', val)}   expected={health.expChk} />
                <ClosingInput label="Credit Given" value={closingDraft.creditGiven} onChange={val => updateClosingDraft('creditGiven', val)} expected={health.expCg} />
                <ClosingInput label="Debt Taken"  value={closingDraft.debtTaken}  onChange={val => updateClosingDraft('debtTaken', val)}  expected={health.expDt} />
              </div>
            ) : (
              <>
                <SbRow label="Investment"  value={closing.investment} expected={health.expInv} accent />
                <SbRow label="Saving"      value={closing.saving}     expected={health.expSav} />
                <SbRow label="Buffer"      value={closing.buffer}     expected={health.expBuf} />
                <SbRow label="Checking"    value={closing.checking}   expected={health.expChk} />
                <SbRow label="Credit Given" value={closing.creditGiven} expected={health.expCg} dim />
                <SbRow label="Debt Taken"  value={closing.debtTaken}  expected={health.expDt} red />
              </>
            )}
          </div>
          <div className="sb-total">
            <span>Total</span>
            <span className="mono">{fmt(closing.investment + closing.saving + closing.checking + closing.buffer + closing.creditGiven)}</span>
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

function HealthBadge({ label, pass, actual, expected, icon }: { label: string; pass: boolean; actual: number; expected: number; icon?: string }) {
  const delta = actual - expected;
  const showDelta = !pass && Math.abs(delta) >= 1;
  
  return (
    <div className={`hc-badge ${pass ? 'hc-pass' : 'hc-fail'}`}>
      <div className="hc-badge-compact">
        {icon && <span className="hc-badge-icon">{icon}</span>}
        <span className="hc-badge-label">{label}</span>
        <span className="hc-badge-status">{pass ? '✓' : '✕'}</span>
      </div>
      <div className="hc-badge-details">
        <span className="mono">Act: {fmt(actual)}</span>
        <span className="mono">Exp: {fmt(expected)}</span>
        {showDelta && <span className="mono hc-delta">Diff: {fmt(delta)}</span>}
      </div>
    </div>
  );
}


