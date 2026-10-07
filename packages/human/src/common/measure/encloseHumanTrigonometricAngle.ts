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
 * @evidence contracts/common.md#principled-implementation Alternating decreasing Taylor terms bound both transcendental evaluations with exact rational endpoints.
 * @evidence contracts/common.md#clear-and-simple-design One immutable angle query serves every repeated tessellation corner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sample count, tolerance or anatomical dimension controls termination.
 * @evidence contracts/common.md#meaningful-documentation States the internal angle domain, remainder theorem and represented-output termination.
 *
 * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
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
