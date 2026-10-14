
/** Compare equal-length dense numeric outputs with Object.is, preserving NaN equality and signed-zero distinction. Array.every skips absent actual slots, so dense buffers are a caller premise; this helper supplies no tolerance or independent expected value. */
export const exactArray: (actual: readonly number[], expected: readonly number[]) => boolean = (
  actual: readonly number[],
  expected: readonly number[],
): boolean =>
  actual.length === expected.length &&
  actual.every((value: number, index: number): boolean => Object.is(value, expected[index]));
