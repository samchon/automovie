import type { IHumanExactFraction } from "./IHumanExactFraction";

/** A root-bearing exact interval whose contents round to one represented binary64 parameter; it need not contain only one real root.
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
 * @evidence contracts/common.md#principled-implementation A root-bearing exact interval whose contents round to one represented binary64 parameter; it need not contain only one real root.
 * @evidence contracts/common.md#clear-and-simple-design Named members keep the represented quantities and their correspondence in one result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual represented data without a clinical default, hidden tolerance or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Member documentation preserves the numerical meaning, units and ownership required by the consumer.
 *
 * @author Samchon
 */
export interface IHumanPolynomialRoot {
  /** Exact lower endpoint of the root-bearing interval. */
  lower: IHumanExactFraction;

  /** Exact upper endpoint of the same interval. */
  upper: IHumanExactFraction;

  /** Common rounded binary64 parameter of the interval, dimensionless in [0,1]. */
  parameter: number;
}
