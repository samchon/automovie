/**
 * A represented guide interval with a certified exact open-interval owner.
 * Bounds round actual ordered crossings; the sign is read between their
 * exact root enclosures, not from a rounded midpoint that could be a tie.
 *
 * @evidence contracts/common.md#principled-implementation Retains the interval bounds and exact distance-order sign that partition one actual feature-domain overlap.
 * @evidence contracts/common.md#clear-and-simple-design One result distinguishes represented boundaries from certified open-interval ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No epsilon or root omission changes ownership.
 * @evidence contracts/common.md#meaningful-documentation States boundary rounding and the separate exact sign certificate.
 * @evidence contracts/modeling.md#spatial-conventions Guide parameters and comparison signs are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines numerical correspondence on existing skin.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no shaping control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The course compiler owns native transition admission.
 * @evidenceExclude contracts/modeling.md#rendered-observation Relief callers own actual observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no measured biological quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Asserts numerical representation, not a clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal sculpting input.
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionOwnership {
  /** Lower represented guide parameter of the interval. */
  lower: number;
  /** Upper represented guide parameter of the interval. */
  upper: number;
  /** Negative selects the first feature, positive the second, zero a whole-interval tie. */
  sign: number;
}
