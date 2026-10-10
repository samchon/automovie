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
 */
export function encloseHumanTrigonometricAngle(
  angle: number,
): IHumanTrigonometricBounds {
  if (!Number.isFinite(angle) || Math.abs(angle) > 2 * Math.PI)
    throw new Error(
      "A tessellation angle must lie within one finite revolution.",
    );
  const x = Fraction.from(angle),
    square = Fraction.multiply(x, x);
  const series = (
    sine: boolean,
  ): readonly [IHumanExactFraction, IHumanExactFraction] => {
    let term = sine ? x : Fraction.create(1n),
      sum = term,
      degree = sine ? 1n : 0n;
    if (angle === 0) return [sum, sum];
    for (;;) {
      const divisor = Fraction.create((degree + 1n) * (degree + 2n));
      const next = Fraction.negate(
        Fraction.divide(Fraction.multiply(term, square), divisor),
      );
      const magnitude = next.numerator < 0n ? Fraction.negate(next) : next;
      if (Fraction.compare(square, divisor) < 0) {
        const lower = Fraction.add(sum, Fraction.negate(magnitude));
        const upper = Fraction.add(sum, magnitude);
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
