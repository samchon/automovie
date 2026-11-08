import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Nearest support-hull pivot and horizontal fall direction suggested for an overhang.
 *
 * @evidence contracts/development/design.md#principled-representation detectSupportToppling chooses the nearest support edge, normalizes its horizontal center-to-edge offset and reports excess distance beyond the authored support margin.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The advice carries explicit geometric quantities rather than hiding pivot choice in a generated animation or physics state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pivot comes from supplied point support, not a proven solid contact surface; dynamic stability and application of the suggestion remain outside this record.
 * @evidence contracts/development/common.md#meaningful-documentation Defines metre overshoot, borrowed edge endpoints and unit XZ direction with Y zero; the producer's finite geometry premises apply.
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
