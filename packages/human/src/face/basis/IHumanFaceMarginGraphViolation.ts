import type { IHumanFaceLipMarginPoint } from "./IHumanFaceLipMarginPoint";

/** One actual posed lip graph violation, retaining its original source seats.
 * Values describe geometry rather than a solver residual or clinical norm.
 *
 * @evidence contracts/common.md#principled-implementation readHumanFaceMarginGraphViolations preserves actual original course seats when directed axis advancement or single-height/complete-span conditions fail.
 * @evidence contracts/common.md#clear-and-simple-design One record joins the named graph cause and ordinal with original along/height measurements for solver diagnostics and final predicate comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal along/equal height joins remain valid; numerical solver residuals or clinical norms do not replace the exact represented graph predicate.
 * @evidence contracts/common.md#meaningful-documentation Members give course identity, -1 complete-span meaning, cause alternatives and head-frame metre projections.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result performs no graph scan; the graph reader owns it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no requests; candidate and final readers share one predicate.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; returned violations retain seats until their diagnostic owner releases them.
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
