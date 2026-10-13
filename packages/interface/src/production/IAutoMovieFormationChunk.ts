import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";

/**
 * One bounded slot range regenerated independently by viewer workers.
 *
 * @evidence contracts/common.md#principled-implementation Stores a contiguous half-open slot range and its position bounds and arithmetic centroid; anonymousCount subtracts named hero exceptions without changing the designed range.
 * @evidence contracts/common.md#clear-and-simple-design Range metadata lets workers regenerate members from the compiled formation rather than serializing every anonymous scene node.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Heroes are excluded from instanced drawing by their explicit slots; bounds and centroid still summarize all designed positions rather than pretending to measure only currently visible members.
 * @evidence contracts/common.md#meaningful-documentation States index and range conventions, anonymous hero exclusion and the position-only bounds and centroid meaning.
 * @author Samchon
 */
export interface IAutoMovieFormationChunk {
  /** Zero-based stable chunk index. */
  index: number;

  /** Inclusive first slot. */
  start: number;

  /** Number of slots in this chunk. */
  count: number;

  /** Anonymous slots rendered through instancing after hero exclusion. */
  anonymousCount: number;

  /** Exact world-space slot-position bounds, excluding model extents. */
  bounds: IAutoMovieFormationBounds;

  /** Exact arithmetic centroid of the range. */
  centroid: IAutoMovieVector3;
}
