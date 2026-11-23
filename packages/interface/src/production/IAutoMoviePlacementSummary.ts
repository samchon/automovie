import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";

/**
 * Extrema and ordered running mean of world-space placement points in metres.
 *
 * CreateCompiledSlotSummary produces this record for range and chunk summaries.
 * Bounds exclude member geometry and later motion. An empty fold has infinite
 * bound sentinels and a zero centroid; callers admit nonempty finite
 * populations. Wrappers are new, but finish shares the accumulator's live
 * vectors: stop adding before publishing a stable summary. Range and chunk
 * producers release their accumulator after returning, leaving the vectors
 * owned by the caller.
 */
export interface IAutoMoviePlacementSummary {
  /**
   * Component extrema over placement points in world metres, excluding model
   * extent.
   */
  bounds: IAutoMovieFormationBounds;

  /** Running mean in input slot order, in world metres; zero for an empty fold. */
  centroid: IAutoMovieVector3;
}
