import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";

/** One bounded slot range regenerated independently by viewer workers. */
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

  /** Binary64 running-mean centroid of the generated range positions. */
  centroid: IAutoMovieVector3;
}
