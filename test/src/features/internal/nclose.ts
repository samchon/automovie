/** Compare a finite observed scalar with an expected value and absolute tolerance. */
export function nclose(a: number, b: number, eps: number = 1e-6): boolean {
  return Number.isFinite(a) && Math.abs(a - b) <= eps;
}
