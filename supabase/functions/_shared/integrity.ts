export interface IntegrityCounters {
  pasteAttempts: number;
  copyAttempts: number;
  cutAttempts: number;
  dropAttempts: number;
  tabSwitches: number;
  visibilityChanges: number;
  fullscreenExits: number;
  refreshCount: number;
  multipleSubmitAttempts: number;
}

export type IntegrityStatus = 'green' | 'yellow' | 'red';

/**
 * A simple, defensible heuristic — NOT an automatic disqualification.
 * The admin dashboard always shows this as a starting point and lets a
 * human make the final call (integrity_override).
 */
export function classifyIntegrity(c: IntegrityCounters): IntegrityStatus {
  const tamperSignals = c.pasteAttempts + c.copyAttempts + c.cutAttempts + c.dropAttempts;

  if (tamperSignals > 5 || c.tabSwitches > 5 || c.refreshCount > 5) {
    return 'red';
  }
  if (tamperSignals > 0 || c.tabSwitches > 1 || c.refreshCount > 1 || c.fullscreenExits > 0) {
    return 'yellow';
  }
  return 'green';
}

export function clampCounter(value: unknown, max = 1000): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : 0;
  return Math.max(0, Math.min(max, n));
}
