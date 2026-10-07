/**
 * Order content locators and compiler filesystem names by JavaScript string
 * code units, without locale or implicit value coercion. This makes graph
 * serialization independent of the machine's language and keeps the same
 * ordering convention for observed and compiler-reported directory entries.
 */
export function compareHumanSourceNames(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
