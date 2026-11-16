/**
 * Real polynomial roots on the closed unit interval, from ascending coefficients.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Coefficients are finite and ascending by power; the result contains distinct represented roots from zero through one, including endpoints.
 * @evidence contracts/development/implementation.md#principled-implementation Recursively isolates derivative roots, which partition a polynomial into monotone intervals, then bisects every sign-changing interval to machine resolution. Stationary zeros and interval ends are checked directly. This is floating-point root isolation, not a validated interval certificate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Normalize coefficients, find derivative cuts, inspect cuts and bisect monotone sign changes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No root tolerance, guessed grid or iteration cap replaces sign bracketing; zero leading coefficients reduce the degree exactly.
 * @evidence contracts/development/implementation.md#efficient-algorithms Intended for the quadratic/cubic extrema factors of paired dense polynomials; work grows with polynomial degree and the binary refinements needed to distinguish adjacent doubles.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Derivative roots partition all intervals once, and normalized Horner evaluation serves every bracket.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns degree-sized coefficient, cut and root arrays only during recursion; fresh root values escape with no callback, model or global cache.
 */
export function polynomialUnitRoots(input: readonly number[]): number[] {
  let degree: number = input.length - 1;
  for (const value of input)
    if (!Number.isFinite(value)) throw new Error("Polynomial roots need finite coefficients");
  while (degree >= 0 && input[degree] === 0) degree--;
  if (degree <= 0) return [];
  let scale: number = 0;
  for (let i: number = 0; i <= degree; i++) scale = Math.max(scale, Math.abs(input[i]!));
  const coefficients: number[] = input.slice(0, degree + 1).map((v: number): number => v / scale);
  const read: (x: number) => number = (x: number): number => {
    let value: number = coefficients[degree]!;
    for (let i: number = degree - 1; i >= 0; i--) value = value * x + coefficients[i]!;
    return value;
  };
  const derivative: number[] = coefficients.slice(1).map((v: number, i: number): number => (i + 1) * v);
  const cuts: number[] = [0, ...polynomialUnitRoots(derivative), 1];
  const roots: Set<number> = new Set();
  for (const cut of cuts) if (read(cut) === 0) roots.add(cut);
  for (let i: number = 1; i < cuts.length; i++) {
    let left: number = cuts[i - 1]!;
    let right: number = cuts[i]!;
    let low: number = read(left);
    const high: number = read(right);
    if (low === 0 || high === 0 || (low > 0) === (high > 0)) continue;
    for (;;) {
      const middle: number = left + (right - left) / 2;
      if (!(left < middle && middle < right)) {
        roots.add(middle);
        break;
      }
      const value: number = read(middle);
      if (value === 0) {
        roots.add(middle);
        break;
      }
      if ((value > 0) === (low > 0)) { left = middle; low = value; }
      else right = middle;
    }
  }
  return [...roots].sort((a: number, b: number): number => a - b);
}
