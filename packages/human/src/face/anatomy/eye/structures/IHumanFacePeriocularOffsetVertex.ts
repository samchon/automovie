import type { IHumanFaceSkinFrame } from "../../skin/IHumanFaceSkinFrame";
import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";

/**
 * The producer's immutable skin attachment used by a crossing witness.
 * Position and both normals are the original host reading, without a new
 * projection, smoothing rule or coordinate reconstruction.
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
