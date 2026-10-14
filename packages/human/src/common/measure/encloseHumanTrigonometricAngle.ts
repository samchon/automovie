import { HumanExactFraction as Fraction } from "./HumanExactFraction";
import type { IHumanExactFraction } from "./IHumanExactFraction";
import type { IHumanTrigonometricBounds } from "./IHumanTrigonometricBounds";

/**
 * Enclose the real sine and cosine of a represented tessellation angle.
 * These internal angles span at most one revolution. Once alternating Taylor
 * terms decrease, the next term encloses the remainder. Exact rational sums
 * continue until both bounds round to the same binary64 value; the original
 * enclosure remains available, rather than declaring Math.sin correctly rounded.
 *
 *
 * @evidence contracts/common.md#principled-implementation Exact rational alternating Taylor terms enclose real sine/cosine once term magnitudes decrease; finite represented angles are restricted to one revolution, and sums continue until both endpoints round identically. There is no global iteration cap.
 * @evidence contracts/common.md#clear-and-simple-design The enclosure owner keeps both interval endpoints while HumanExactFraction supplies arithmetic; the ocular metric decides represented-angle reuse.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The one-revolution domain is the actual tessellation caller domain, not a specimen epsilon; no Math.sin answer is substituted for an unresolved rational enclosure.
 * @evidence contracts/common.md#meaningful-documentation The comment states angle domain, decreasing-term remainder rule, binary64 stopping criterion and retained exact intervals.
 * @evidence contracts/performance.md#efficient-algorithms For K terms with growing B-bit rationals, GCD/product/division costs dominate and are repeated for two series; K has no explicit cap and no geometry is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work The exact angle and squared angle are computed once and shared by sine/cosine; the ocular metric's angle Map owns cross-request reuse by represented radian value.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Terms and sums remain call-local, with BigInt magnitude driven by convergence; only four endpoint fractions transfer to the caller, and this function holds no persistent cache or task.
 */
export function encloseHumanTrigonometricAngle(
  angle: number,
): IHumanTrigonometricBounds {
  if (!Number.isFinite(angle) || Math.abs(angle) > 2 * Math.PI)
    throw new Error(
      "A tessellation angle must lie within one finite revolution.",
    );
  const x: IHumanExactFraction = Fraction.from(angle);
  const square: IHumanExactFraction = Fraction.multiply(x, x);
  const series: (
    sine: boolean,
  ) => readonly [IHumanExactFraction, IHumanExactFraction] = (
    sine: boolean,
  ): readonly [IHumanExactFraction, IHumanExactFraction] => {
    let term: IHumanExactFraction = sine ? x : Fraction.create(1n);
    let sum: IHumanExactFraction = term;
    let degree: bigint = sine ? 1n : 0n;
    if (angle === 0) return [sum, sum];
    for (;;) {
      const divisor: IHumanExactFraction = Fraction.create(
        (degree + 1n) * (degree + 2n),
      );
      const next: IHumanExactFraction = Fraction.negate(
        Fraction.divide(Fraction.multiply(term, square), divisor),
      );
      const magnitude: IHumanExactFraction =
        next.numerator < 0n ? Fraction.negate(next) : next;
      if (Fraction.compare(square, divisor) < 0) {
        const lower: IHumanExactFraction = Fraction.add(
          sum,
          Fraction.negate(magnitude),
        );
        const upper: IHumanExactFraction = Fraction.add(sum, magnitude);
        if (Fraction.number(lower) === Fraction.number(upper))
          return [lower, upper];
      }
      sum = Fraction.add(sum, next);
      term = next;
      degree += 2n;
    }
  };
  return { sin: series(true), cos: series(false) };
}
