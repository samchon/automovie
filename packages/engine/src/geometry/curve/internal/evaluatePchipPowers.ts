/*
 * Evaluate the local polynomial or one of its derivatives in finite binary64.
 */
export function evaluatePchipPowers(
  c: readonly number[],
  offset: number,
  derivative: 0 | 1 | 2,
): number {
  const result: number =
    derivative === 2
      ? 6 * c[0]! * offset + 2 * c[1]!
      : derivative === 1
        ? (3 * c[0]! * offset + 2 * c[1]!) * offset + c[2]!
        : ((c[0]! * offset + c[1]!) * offset + c[2]!) * offset + c[3]!;
  if (!Number.isFinite(result))
    throw new Error("Spline evaluation must be finite");
  return result;
}
