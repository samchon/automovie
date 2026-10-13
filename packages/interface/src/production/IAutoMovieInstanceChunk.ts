import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";

/** One independently regenerable range of a general instance set. */
export interface IAutoMovieInstanceChunk {
  /** Zero-based stable chunk index. */
  index: number;

  /** Inclusive first slot. */
  start: number;

  /** Number of slots in this chunk. */
  count: number;

  /** Exact world-space range bounds. */
  bounds: IAutoMovieFormationBounds;

  /** Exact arithmetic centroid of the range. */
  centroid: IAutoMovieVector3;
}
