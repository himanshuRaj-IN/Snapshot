// ─── Data Service ─────────────────────────────────────────────────────────────
// This is the ONLY file to edit when migrating away from sample data.
// Replace the function bodies with `fetch('/api/snapshots/...')` calls.
// The return types stay the same — components never import sampleData directly.
// ─────────────────────────────────────────────────────────────────────────────
import type { Snapshot } from '../data/schema';
import { MAR_2026 } from '../data/sampleData';

// Simulated async latency (remove when using real API).
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

/** Fetch the snapshot for a given month key, e.g. "MAR_2026" */
export async function getSnapshot(_monthKey: string): Promise<Snapshot> {
  await delay();
  // TODO: return fetch(`/api/snapshots/${_monthKey}`).then(r => r.json())
  return MAR_2026;
}

/** List available snapshot months (for navigation / month picker) */
export async function listSnapshotMonths(): Promise<{ key: string; label: string }[]> {
  await delay(100);
  // TODO: return fetch('/api/snapshots').then(r => r.json())
  return [{ key: 'MAR_2026', label: 'March 2026' }];
}
