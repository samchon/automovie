/*
 * Return whether a Recovery population limit is a usable positive count.
 */
export function isRecoveryPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}
