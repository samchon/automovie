import type { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

/**
 * Solve U-transpose U x=b by the original two banded triangular sweeps. Upper
 * row i stores U(i,i+j) for j in [0,min(band,n-1-i)]; forward row i stores its
 * finalized U(t,i) in increasing t order. The same finite nonsingular factor
 * serves ADMM and every active-set refinement step.
 *
 * @param factor Canonical upper factor plus exact forward-row copies from the
 *   same completed Cholesky recurrence; its n matches both vectors.
 * @param b Right-hand side, read before its corresponding destination entry is
 *   overwritten.
 * @param x Caller-owned destination, distinct from the factor.
 * @param relaxed Optional distinct n-entry vector updated as
 *   alpha*x+(1-alpha)*old after each final x component is produced; it must
 *   alias neither b nor x.
 * @param alpha Finite relaxation coefficient, one by default; ADMM supplies its
 *   existing 1.6.
 */
export function HumanQuadraticSubstitute(
  factor: Work.IFactor,
  b: Float64Array,
  x: Float64Array,
  relaxed?: Float64Array,
  alpha: number = 1,
): void {
  const n: number = factor.n;
  const u: Float64Array[] = factor.system;
  if (factor.band === 0) {
    for (let i: number = 0; i < n; ++i) {
      const diagonal: number = u[i]![0]!;
      const value: number = b[i]! / diagonal / diagonal;
      x[i] = value;
      if (relaxed !== undefined)
        relaxed[i] = alpha * value + (1 - alpha) * relaxed[i]!;
    }
    return;
  }
  const forward: Float64Array = factor.forward;
  const starts: Float64Array = factor.forwardStart;
  for (let i: number = 0; i < n; ++i) {
    let v: number = b[i]!;
    const start: number = starts[i]!;
    const length: number = starts[i + 1]! - start;
    const first: number = i - length;
    for (let j: number = 0; j < length; ++j)
      v -= forward[start + j]! * x[first + j]!;
    x[i] = v / u[i]![0]!;
  }
  for (let i: number = n - 1; i >= 0; --i) {
    const row: Float64Array = u[i]!;
    let v: number = x[i]!;
    const end: number = i + row.length;
    for (let t: number = i + 1; t < end; ++t) v -= row[t - i]! * x[t]!;
    const value: number = v / row[0]!;
    x[i] = value;
    if (relaxed !== undefined)
      relaxed[i] = alpha * value + (1 - alpha) * relaxed[i]!;
  }
}
