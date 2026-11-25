/**
 * Compare an observed scalar with an expected value and absolute tolerance. A
 * NaN or an infinite difference is never within a tolerance, so a non-finite
 * observation fails without a separate check.
 */
export function nclose(a: number, b: number, eps: number = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}
