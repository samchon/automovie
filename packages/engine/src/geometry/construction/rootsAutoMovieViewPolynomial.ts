/**
 * Binary64 root candidates of a source polynomial of degree at most nine inside the unit interval.
 *
 * Derivative-root candidates partition intervals before 60 bisections. A cut whose residual is within 64 epsilon times the normalized coefficient sum is retained as a multiple-root observation. Constant polynomials have no isolated roots. Ill-conditioned or nearby multiple roots need not be separated; near-zero cuts may add observations. This is not an interval certificate or a root-completeness guarantee.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Recursively partitions at derivative roots, then bisects every sign-changing monotone interval and retains near-zero partition cuts for repeated roots.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One bounded-degree helper supplies source critical and squared-distance candidates while preserving the existing arithmetic for degrees at most four.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not fit sampled values or label a zero polynomial's continuum as isolated roots; its floating residual test is stated rather than presented as certification.
 * @evidence contracts/development/common.md#meaningful-documentation States coefficient order, degree/domain, iterations, residual allowance and numerical proof limit.
 * @evidence contracts/development/implementation.md#efficient-algorithms Degree d is at most nine; a conservative candidate bound is 2^d-1 because residual observations may exceed d. Horner evaluation and 60 bisections give O(60*d*2^d) work including the derivative recursion, plus bounded candidate sorting.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One pure observation schedules no reusable effects; the caller can retain its source critical stations.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Depth at most nine and O(2^d+d^2) invocation-local candidate/coefficient storage retain no curve; at most 511 candidates are returned.
 * @param coefficients Finite coefficients in increasing power order, at most ten; empty or constant rows return no isolated roots. Invalid rows throw RangeError.
 */
export function rootsAutoMovieViewPolynomial(
  coefficients: readonly number[],
): number[] {
  if (coefficients.length > 10 || !coefficients.every(Number.isFinite))
    throw new RangeError(
      "source polynomial roots need at most ten finite coefficients (degree at most nine)",
    );
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
  const cuts: number[] = [
    0,
    ...rootsAutoMovieViewPolynomial(
      c.slice(1).map((v: number, i: number): number => (i + 1) * v),
    ),
    1,
  ];
  const tolerance: number =
    64 *
    Number.EPSILON *
    c.reduce((sum: number, v: number): number => sum + Math.abs(v), 0);
  const roots: number[] = cuts.filter(
    (t: number): boolean => t > 0 && t < 1 && Math.abs(value(t)) <= tolerance,
  );
  for (let i: number = 0; i + 1 < cuts.length; i++) {
    let lo: number = cuts[i]!;
    let hi: number = cuts[i + 1]!;
    const sign: number = Math.sign(value(lo));
    if (
      sign === 0 ||
      Math.sign(value(hi)) === 0 ||
      sign === Math.sign(value(hi))
    )
      continue;
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
