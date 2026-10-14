import type { IHumanExactFraction } from "./IHumanExactFraction";

/** Exact rational enclosures of sine and cosine at one represented angle.
 *
 *
 * @evidence contracts/common.md#principled-implementation Ordered exact rational endpoint pairs enclose real sine/cosine at one represented radian angle, as encloseHumanTrigonometricAngle supplies.
 * @evidence contracts/common.md#clear-and-simple-design Sine and cosine intervals retain exact arithmetic bounds separately from any rounded tessellation output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not replace the enclosure with Math.sin/Math.cos results or an anatomical error tolerance.
 * @evidence contracts/common.md#meaningful-documentation The declaration identifies represented-angle enclosures and members state dimensionless ordered bounds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interval shape chooses no Taylor-series or rational arithmetic strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The bounds define no cache invalidation; the ocular metric owner keys reuse by its represented angle.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Concrete endpoint fractions are caller-held, and the declaration acquires no cache, native resource or task.
 *
 * @author Samchon
 */
export interface IHumanTrigonometricBounds {
  /** Dimensionless lower and upper enclosure of the real sine. */
  sin: readonly [IHumanExactFraction, IHumanExactFraction];

  /** Dimensionless lower and upper enclosure of the real cosine. */
  cos: readonly [IHumanExactFraction, IHumanExactFraction];
}
