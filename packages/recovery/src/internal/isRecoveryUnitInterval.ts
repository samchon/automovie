/*
 * Return whether a Recovery rank threshold is finite and strictly in (0, 1).
 */
export function isRecoveryUnitInterval(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value < 1;
}
