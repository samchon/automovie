import type { IHumanFaceLipMarginPoint } from "./IHumanFaceLipMarginPoint";

/** One actual posed lip graph violation, retaining its original source seats.
 * Values describe geometry rather than a solver residual or clinical norm.
 *
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
