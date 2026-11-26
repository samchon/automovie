/** Compare strings by locale-independent UTF-16 code-unit order. */
export function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
