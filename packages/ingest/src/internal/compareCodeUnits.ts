/** Compare two exact strings in deterministic JavaScript code-unit order. */
export const compareCodeUnits: (left: string, right: string) => number = (
  left: string,
  right: string,
): number => Number(left > right) - Number(left < right);
