import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";

/**
 * One independently regenerable contiguous range of a general instance set.
 *
 * @evidence contracts/common.md#principled-implementation The compiled kernel aggregates slot positions into component-wise bounds and an arithmetic centroid for the half-open range; regenerating those slots uses the same instanceSlot law as rendering and inspection.
 * @evidence contracts/common.md#clear-and-simple-design Stores range metadata rather than every instance transform, leaving prototype and variation rules on the containing compiled set.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bounds describe positions, not guessed prototype size or only visible members; exact slot counts are retained even when seeded visibility hides an instance.
 * @evidence contracts/common.md#meaningful-documentation Defines stable chunk index, inclusive start and count, world-meter position bounds and arithmetic centroid.
 */
export interface IAutoMovieInstanceChunk {
  /** Zero-based stable chunk index. */
  index: number;

  /** Inclusive first slot. */
  start: number;

  /** Number of slots in this chunk. */
  count: number;

  /** Exact world-space slot-position bounds, excluding model extents. */
  bounds: IAutoMovieFormationBounds;

  /** Binary64 running-mean centroid of the generated range positions. */
  centroid: IAutoMovieVector3;
}
