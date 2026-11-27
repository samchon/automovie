/*
 * Compare two exact strings in deterministic JavaScript code-unit order.
 */
export function compareCodeUnits(left: string, right: string): number {
  return Number(left > right) - Number(left < right);
}
