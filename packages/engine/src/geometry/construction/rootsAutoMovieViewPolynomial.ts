/**
 * Isolated binary64 roots of a source derivative polynomial of degree at most four inside the unit interval.
 *
 * Derivative roots partition monotone intervals before 60 bisections. A cut whose residual is within 64 epsilon times the normalized coefficient sum is retained as a multiple-root observation. Constant polynomials have no isolated roots. This is inspection sampling, not an interval certificate.
 *
 * @evidence contracts/common.md#principled-implementation Recursively partitions at derivative roots, then bisects every sign-changing monotone interval and retains near-zero partition cuts for repeated roots.
 * @evidence contracts/common.md#clear-and-simple-design One bounded-degree helper supplies the additional sample parameters of quintic source spans.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not fit sampled values or label a zero polynomial's continuum as isolated roots; its floating residual test is stated rather than presented as certification.
 * @evidence contracts/common.md#meaningful-documentation States coefficient order, degree/domain, iterations, residual allowance and numerical proof limit.
 * @evidence contracts/performance.md#efficient-algorithms Degree is at most four; recursion depth and monotone intervals are bounded by that degree, with 60 bisections per sign change.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One pure observation schedules no reusable effects; the caller can retain its source critical stations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Recursion and arrays are bounded by degree and invocation-local; the returned scalar roots retain no curve.
 * @param coefficients Finite coefficients in increasing power order, at most five.
 */
export function rootsAutoMovieViewPolynomial(coefficients: readonly number[]): number[] {
  const magnitude: number = Math.max(...coefficients.map(Math.abs));
  if (magnitude === 0) return [];
  const c: number[] = coefficients.map((v: number): number => v / magnitude);
  while (c.length > 1 && c[c.length - 1] === 0) c.pop();
  if (c.length <= 1) return [];
  if (c.length === 2) {
    const root: number = -c[0]! / c[1]!;
    return root > 0 && root < 1 ? [root] : [];
  }
  const value: (t: number) => number = (t: number): number => {
    let y: number = 0;
    for (let i: number = c.length - 1; i >= 0; i--) y = y * t + c[i]!;
    return y;
  };
  const cuts: number[] = [0, ...rootsAutoMovieViewPolynomial(c.slice(1).map((v: number, i: number): number => (i + 1) * v)), 1];
  const tolerance: number = 64 * Number.EPSILON * c.reduce((sum: number, v: number): number => sum + Math.abs(v), 0);
  const roots: number[] = cuts.filter((t: number): boolean => t > 0 && t < 1 && Math.abs(value(t)) <= tolerance);
  for (let i: number = 0; i + 1 < cuts.length; i++) {
    let lo: number = cuts[i]!;
    let hi: number = cuts[i + 1]!;
    const sign: number = Math.sign(value(lo));
    if (sign === 0 || Math.sign(value(hi)) === 0 || sign === Math.sign(value(hi))) continue;
    for (let k: number = 0; k < 60; k++) {
      const middle: number = (lo + hi) / 2;
      if (Math.sign(value(middle)) === sign) lo = middle;
      else hi = middle;
    }
    const root: number = (lo + hi) / 2;
    if (root > 0 && root < 1) roots.push(root);
  }
  return [...new Set(roots)].sort((a: number, b: number): number => a - b);
}
