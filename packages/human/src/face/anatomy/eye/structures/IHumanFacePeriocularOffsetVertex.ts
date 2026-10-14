import type { IHumanFaceSkinFrame } from "../../skin/IHumanFaceSkinFrame";
import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";

/**
 * The producer's immutable skin attachment used by a crossing witness.
 * Position and both normals are the original host reading, without a new
 * projection, smoothing rule or coordinate reconstruction.
 *
 *
 * @evidence contracts/common.md#principled-implementation Each witnessed emitted identity retains its original actual skin seat and supporting frame.
 * @evidence contracts/common.md#clear-and-simple-design The producer supplies attachments and the mapping reader collects only witnessed identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No second projection, smoothing or coordinate reconstruction manufactures a cause.
 * @evidence contracts/common.md#meaningful-documentation Fields identify emitted vertex, source triangle/weights and original point/normals.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularOffsetVertex is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularOffsetVertex declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularOffsetVertex acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
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
