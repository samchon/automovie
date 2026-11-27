/*
 * Whether one IEEE 754 operation on finite operands overflowed binary64.
 *
 * Rounding a result past `Number.MAX_VALUE` produces a signed infinity (IEEE
 * 754-2019 §7.4), so a caller tests the result of the operation that can
 * overflow, at that operation, rather than validating its inputs.
 * Parameter value: The rounded result of one sum, difference, product or quotient.
 * Returns: True when the operation overflowed.
 */
export function overflowsBinary64(value: number): boolean {
  return value === Infinity || value === -Infinity;
}
