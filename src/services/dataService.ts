// ─── Data Service ─────────────────────────────────────────────────────────────
// This is the ONLY file to edit when migrating away from sample data.
// Replace the function bodies with `fetch('/api/snapshots/...')` calls.
// The return types stay the same — components never import sampleData directly.
// ─────────────────────────────────────────────────────────────────────────────
import type { Snapshot } from '../data/schema';
import { MAR_2026 } from '../data/sampleData';

/** Fetch the snapshot for a given month key */
export async function getSnapshot(_monthKey: string): Promise<Snapshot> {
  try {
    const [month, year] = _monthKey.split('_'); 
    const res = await fetch(`/api/snapshots?month=${month || 'MARCH'}&year=${year || 2026}`);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        // Hydrate missing lists so UI doesn't crash prior to multi-table rollout
        return { 
          ...data, 
          expenses: MAR_2026.expenses, 
          credits: MAR_2026.credits 
        };
      }
    }
  } catch (e) {
    console.warn('API not available, falling back to mock data');
  }
  // Fallback ensures UI renders if Neon DB is empty
  return MAR_2026; 
}

/** Upsert the snapshot payload to Neon */
export async function saveSnapshot(snapshot: Snapshot): Promise<void> {
  try {
    await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    console.log('Saved to Neon!');
  } catch (e) {
    console.error('Failed to save snapshot:', e);
  }
}

/** List available snapshot months (for navigation / month picker) */
export async function listSnapshotMonths(): Promise<{ key: string; label: string }[]> {
  return [{ key: 'MAR_2026', label: 'March 2026' }];
}
