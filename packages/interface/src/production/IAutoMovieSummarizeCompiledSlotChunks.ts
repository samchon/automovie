import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";
import type { IAutoMoviePlacementSummary } from "./IAutoMoviePlacementSummary";

/**
 * Chunk-addressed and whole-population placement summaries from one ordered
 * slot traversal.
 */
export namespace IAutoMovieSummarizeCompiledSlotChunks {
  /**
   * Caller-owned summaries over every generated world-space placement point, in
   * metres.
   *
   * Each slot from zero through count - 1 is sampled exactly once in ascending
   * order and folded into its chunk and the whole population. Bounds are exact
   * component extrema of placement points, excluding model geometry and later
   * motion; centroids are order-dependent running means. Formation heroes are
   * included here, before materialization adds anonymous counts. Population
   * callers admit positive integer count/chunkSize and finite points. A zero
   * count produces no chunks and an infinite-sentinel whole bound with zero
   * centroid, not an admitted finite population. Callback exceptions propagate
   * before any result is returned; neither the callback nor point history is
   * retained.
   */
  export type IResult = {
    /** Caller-owned chunk records in ascending start order. */
    chunks: Array<{
      /**
       * Zero-based ordinal in this returned array; not a persistent ID
       * independent of chunk size or population ordering.
       */
      index: number;

      /**
       * Inclusive zero-based slot address of the first member in the chunk. The
       * first chunk starts at zero.
       */
      start: number;

      /**
       * Number of slots in [start, start + count), including heroes. Positive
       * for admitted chunks; the final chunk may be smaller than the requested
       * chunk size.
       */
      count: number;

      /**
       * World-metre component extrema of exactly this chunk's placement points;
       * no model-radius or body-height expansion.
       */
      bounds: IAutoMovieFormationBounds;

      /**
       * World-metre running mean of this chunk's points in ascending slot
       * order, not the centre of its bounds.
       */
      centroid: IAutoMovieVector3;
    }>;

    /** Caller-owned bounds and centroid over every placement point. */
    summary: IAutoMoviePlacementSummary;
  };
}
