import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Nearest support-hull pivot and horizontal fall direction suggested for an overhang.
 *
 * @evidence contracts/common.md#principled-implementation detectSupportToppling chooses the nearest support edge, normalizes its horizontal center-to-edge offset and reports excess distance beyond the authored support margin.
 * @evidence contracts/common.md#clear-and-simple-design The advice carries explicit geometric quantities rather than hiding pivot choice in a generated animation or physics state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The pivot comes from supplied point support, not a proven solid contact surface; dynamic stability and application of the suggestion remain outside this record.
 * @evidence contracts/common.md#meaningful-documentation Defines metre overshoot, borrowed edge endpoints and unit XZ direction with Y zero; the producer's finite geometry premises apply.
 * @evidence contracts/performance.md#efficient-algorithms The record executes no hull or nearest-segment operation; those costs belong to the support detector.
 * @evidence contracts/performance.md#reuse-equivalent-work One nearest-edge result supplies both pivot and direction, with no retained support-result cache in the row.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh direction and scalar; edge endpoints borrow input support references and no solver or scene task is acquired.
 */
export interface IAutoMovieToppling {
  /** One end of the pivot edge (the nearest support hull edge). */
  tipEdgeStart: IAutoMovieVector3;

  /** The other end of the pivot edge. */
  tipEdgeEnd: IAutoMovieVector3;

  /** Unit horizontal direction (XZ, y=0) the object falls toward. */
  fallDirection: IAutoMovieVector3;

  /** How far past the margin the COM overhangs, in meters. */
  overshoot: number;
}
