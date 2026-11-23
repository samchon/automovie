/** Compare strings by locale-independent UTF-16 code-unit order. */
export const compareCodeUnits: (a: string, b: string) => number = (
  a: string,
  b: string,
): number => (a < b ? -1 : a > b ? 1 : 0);
