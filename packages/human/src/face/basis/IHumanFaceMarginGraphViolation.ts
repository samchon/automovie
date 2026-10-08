import type { IHumanFaceLipMarginPoint } from "./IHumanFaceLipMarginPoint";

/** One actual posed lip graph violation, retaining its original source seats.
 * Values describe geometry rather than a solver residual or clinical norm.
 *
 * @evidence contracts/common.md#principled-implementation Original ordered seats and projected coordinates retain the witness for the graph predicate.
 * @evidence contracts/common.md#clear-and-simple-design One record describes one segment or missing complete span.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual values without a replacement order or tolerance.
 * @evidence contracts/common.md#meaningful-documentation Names the witness, projection and full-span sentinel.
 * @evidence contracts/modeling.md#spatial-conventions Along and opening coordinates are canonical head-frame metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The measurement owner judges existing courses.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly observes its geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no clinical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no anatomical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
 * @author Samchon
 */
export interface IHumanFaceMarginGraphViolation {
  /** Original course whose graph failed. */
  course: "upper" | "lower";

  /** First segment index, or -1 for the complete course's absent span. */
  ordinal: number;

  /** Original graph condition that failed. */
  reason: "reversed-axis" | "multiple-heights" | "no-axis-span";

  /** Sign of the original course's endpoint span on this geometry. */
  direction: number;

  /** Original first source seat. */
  first: IHumanFaceLipMarginPoint;

  /** Original second source seat. */
  second: IHumanFaceLipMarginPoint;

  /** First seat's mandibular-axis coordinate, metres. */
  firstAlongMetres: number;

  /** Second seat's mandibular-axis coordinate, metres. */
  secondAlongMetres: number;

  /** First seat's opening-direction coordinate, metres. */
  firstHeightMetres: number;

  /** Second seat's opening-direction coordinate, metres. */
  secondHeightMetres: number;
}
