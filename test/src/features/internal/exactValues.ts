
/** Compare equal-length dense soft-body numeric outputs with Object.is, preserving NaN equality and signed-zero distinction. Sparse actual slots are skipped by Array.every; this arrow remains distinct from exactArray and supplies no expected-value derivation or approximate tolerance. */
export const exactValues: (actual: readonly number[], expected: readonly number[]) => boolean = (
  actual: readonly number[],
  expected: readonly number[],
): boolean =>
  actual.length === expected.length &&
  actual.every((value: number, index: number): boolean => Object.is(value, expected[index]));
