import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";

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

  /** Exact world-space range bounds. */
  bounds: IAutoMovieFormationBounds;

  /** Exact arithmetic centroid of the range. */
  centroid: IAutoMovieVector3;
}
