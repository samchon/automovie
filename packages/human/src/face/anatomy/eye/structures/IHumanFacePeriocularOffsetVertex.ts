import type { IHumanFaceSkinFrame } from "../../skin/IHumanFaceSkinFrame";
import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";

/**
 * The producer's immutable skin attachment used by a crossing witness.
 * Position and both normals are the original host reading, without a new
 * projection, smoothing rule or coordinate reconstruction.
 *
 * @evidence contracts/common.md#principled-implementation Carries the exact attachment and frame used by normal-distance construction.
 * @evidence contracts/common.md#clear-and-simple-design One emitted vertex identity joins every crossing to its producer frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not replace or alter the source normal.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes retained construction values from another sampling operation.
 * @evidence contracts/modeling.md#spatial-conventions Frame positions are head-frame metres and normal vectors are unitless.
 * @evidence contracts/modeling.md#shared-boundaries Both offset sheets reference the same underlying material vertex.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularOffsetVertex {
  /** Actual emitted vertex identity, shared by the two offset sheets. */
  vertex: number;
  /** Exact source-host triangle and ordered barycentric weights. */
  seat: IHumanFaceSkinSeat;
  /** Actual source skin position, smooth normal and supporting face normal. */
  frame: IHumanFaceSkinFrame;
}
