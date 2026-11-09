import { rootsAutoMovieViewPolynomial } from "./rootsAutoMovieViewPolynomial";

/**
 * Binary64 zero candidates of P(t)+amplitude*sin(offset+span*t) on a closed subinterval of [0,1].
 *
 * P has degree at most four and the angular interval lies in [0,pi]. After degree(P)+1 derivatives only a sine or cosine remains, whose interior zeros are known. Recursing back partitions each derivative into monotone intervals; sign-changing brackets are bisected, while near-zero derivative cuts retain multiple-root observations. The sine is evaluated as sine, never fitted to a polynomial. This is a numerical critical-point observation, not an interval certificate: roots closer than floating-point resolution and near-multiple residuals need not be separately resolved.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Uses analytic differentiation and derivative-root monotone partitioning, terminating at the known zeros of a single sine/cosine on [0,pi]. A bracket requires opposite signs; near-zero cuts separately preserve even-multiplicity candidates.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One bounded scalar helper extends the existing polynomial root owner only for the affine physical-station term of a pole-parameter source.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sampled grid, polynomial sine replacement, source clamp or claim of exact root certification is used; invalid or unrepresentable arithmetic returns a named failure.
 * @evidence contracts/development/common.md#meaningful-documentation States coefficient order, degree, angular/subinterval premises, recursive termination and binary64 multiple-root limits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Degree at most four bounds recursion to five levels, at most 63 returned candidates and 64 bisections per sign-changing monotone bracket; zero amplitude delegates to the existing polynomial owner.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Normalizes the combined terms once and prepares their derivative coefficient rows and sine amplitudes once for all recursive reads.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All coefficient rows, bracket cuts and candidates are invocation-local and bounded by degree; no source, cache or external resource is retained.
 * @param coefficients Finite polynomial coefficients in increasing power order, one through five.
 * @param offset Angular parameter at t=0, radians.
 * @param span Positive angular parameter interval, radians, wholly inside [0,pi].
 * @param amplitude Finite sine coefficient in the same units as P.
 * @param interval Requested closed local parameter subinterval.
 * @returns Interior root candidates or the numerical premise that failed.
 */
export function rootsAutoMovieViewSinPolynomial(
  coefficients: readonly number[],
  offset: number,
  span: number,
  amplitude: number,
  interval: readonly [number, number] = [0, 1],
): number[] | string {
  if (
    coefficients.length < 1 ||
    coefficients.length > 5 ||
    !coefficients.every(Number.isFinite) ||
    !Number.isFinite(amplitude) ||
    !Number.isFinite(offset) ||
    !Number.isFinite(span) ||
    !(span > 0) ||
    offset < 0 ||
    offset + span > Math.PI ||
    !interval.every(Number.isFinite) ||
    !(interval[0] >= 0 && interval[0] < interval[1] && interval[1] <= 1)
  )
    return "affine source root needs finite degree-four terms and an increasing angular subinterval inside [0,pi]";
  if (amplitude === 0)
    return rootsAutoMovieViewPolynomial(coefficients).filter(
      (root: number): boolean => root > interval[0] && root < interval[1],
    );
  const magnitude: number = Math.max(
    Math.abs(amplitude),
    ...coefficients.map(Math.abs),
  );
  const polynomial: number[] = coefficients.map(
    (value: number): number => value / magnitude,
  );
  const sine: number = amplitude / magnitude;
  if (
    sine === 0 ||
    polynomial.some(
      (value: number, i: number): boolean =>
        value === 0 && coefficients[i] !== 0,
    )
  )
    return "affine source derivative terms cannot share a representable normalized scale";
  while (polynomial.length > 1 && polynomial.at(-1) === 0) polynomial.pop();
  const rows: number[][] = [polynomial];
  const amplitudes: number[] = [sine];
  for (let order: number = 1; order <= polynomial.length; order++) {
    rows.push(
      rows[order - 1]!.slice(1).map(
        (value: number, i: number): number => (i + 1) * value,
      ),
    );
    amplitudes.push(amplitudes[order - 1]! * span);
    if (!Number.isFinite(amplitudes[order]!) || amplitudes[order] === 0)
      return "affine source trigonometric derivatives are not finitely representable";
  }
  const value: (order: number, t: number) => number = (
    order: number,
    t: number,
  ): number => {
    let result: number = 0;
    const row: readonly number[] = rows[order]!;
    for (let i: number = row.length - 1; i >= 0; i--)
      result = result * t + row[i]!;
    const angle: number = offset + span * t;
    const wave: number = order % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
    return result + (order % 4 < 2 ? 1 : -1) * amplitudes[order]! * wave;
  };
  const roots: (order: number) => number[] = (order: number): number[] => {
    if (order === polynomial.length) {
      const angle: number = order % 2 === 0 ? 0 : Math.PI / 2;
      const root: number = (angle - offset) / span;
      return root > interval[0] && root < interval[1] ? [root] : [];
    }
    const cuts: number[] = [interval[0], ...roots(order + 1), interval[1]];
    const tolerance: number =
      64 *
      Number.EPSILON *
      (rows[order]!.reduce(
        (sum: number, coefficient: number): number =>
          sum + Math.abs(coefficient),
        0,
      ) +
        Math.abs(amplitudes[order]!));
    const found: number[] = cuts.filter(
      (t: number): boolean =>
        t > interval[0] &&
        t < interval[1] &&
        Math.abs(value(order, t)) <= tolerance,
    );
    for (let i: number = 0; i + 1 < cuts.length; i++) {
      let lo: number = cuts[i]!;
      let hi: number = cuts[i + 1]!;
      const sign: number = Math.sign(value(order, lo));
      const lastSign: number = Math.sign(value(order, hi));
      if (sign === 0 || lastSign === 0 || sign === lastSign) continue;
      for (let step: number = 0; step < 64; step++) {
        const middle: number = lo + (hi - lo) / 2;
        if (middle === lo || middle === hi) break;
        const at: number = value(order, middle);
        if (at === 0) {
          lo = middle;
          hi = middle;
          break;
        }
        if (Math.sign(at) === sign) lo = middle;
        else hi = middle;
      }
      const root: number = lo + (hi - lo) / 2;
      if (root > interval[0] && root < interval[1]) found.push(root);
    }
    return [...new Set(found)].sort((a: number, b: number): number => a - b);
  };
  return roots(0);
}
