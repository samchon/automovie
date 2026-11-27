/*
 * Return whether a Recovery residual threshold is finite and positive.
 */
export function isRecoveryPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
