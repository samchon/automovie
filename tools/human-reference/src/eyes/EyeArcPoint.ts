import type { V3 } from "../geometry/V3.ts";

/**
 * Locates an observed physical arc station and its one-sided section directions.
 * Tangents are dP/d(arcMm) on the reference polyline. A fitted consumer publishes
 * its own analytic boundary derivatives before claiming a smooth shared seam.
 *
 * @evidence contracts/common.md#principled-implementation Keeps incoming and outgoing unit tangents distinct at a faceted source knot.
 * @evidence contracts/common.md#clear-and-simple-design One record describes one sampled station without assigning anatomical correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not substitute a source tangent for a fitted surface derivative.
 * @evidence contracts/common.md#meaningful-documentation States tangent units, one-sided meaning and the consumer's continuity responsibility.
 * @evidence contracts/performance.md#efficient-algorithms This interface performs no computation and stores a fixed number of triples.
 * @evidence contracts/performance.md#reuse-equivalent-work Position and both tangents belong to one source parameter value.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fixed-size value; no handle or cache is retained.
 *
 * @author Samchon
 */
export interface EyeArcPoint {
  /** Native-frame source position at the requested physical arc station, millimetres. */
  p: V3;

  /** Unit direction approaching this station as source arclength increases. */
  tangentIncoming: V3;

  /** Unit direction leaving this station; differs at a source polyline corner. */
  tangentOutgoing: V3;
}
