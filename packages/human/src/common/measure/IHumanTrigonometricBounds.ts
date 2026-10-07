import type { IHumanExactFraction } from "./IHumanExactFraction";

/** Exact rational enclosures of sine and cosine at one represented angle.
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
 *
 * @evidence contracts/common.md#principled-implementation Ordered exact rational bounds of sine and cosine at the same represented radian angle.
 * @evidence contracts/common.md#clear-and-simple-design Named members keep the represented quantities and their correspondence in one result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual represented data without a clinical default, hidden tolerance or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Member documentation preserves the numerical meaning, units and ownership required by the consumer.
 *
 * @author Samchon
 */
export interface IHumanTrigonometricBounds {
  /** Dimensionless lower and upper enclosure of the real sine. */
  sin: readonly [IHumanExactFraction, IHumanExactFraction];

  /** Dimensionless lower and upper enclosure of the real cosine. */
  cos: readonly [IHumanExactFraction, IHumanExactFraction];
}
