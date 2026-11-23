import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";

/** One independently regenerable contiguous range of a general instance set. */
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
