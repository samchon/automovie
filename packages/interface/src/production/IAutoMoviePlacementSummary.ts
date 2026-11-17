import type { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Extrema and ordered running mean of world-space placement points in metres.
 *
 * createCompiledSlotSummary produces this record for range and chunk summaries.
 * Bounds exclude member geometry and later motion. An empty fold has infinite
 * bound sentinels and a zero centroid; callers admit nonempty finite populations.
 * Wrappers are new, but finish shares the accumulator's live vectors: stop
 * adding before publishing a stable summary. Range and chunk producers release
 * their accumulator after returning, leaving the vectors owned by the caller.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines units, point-only bounds, ordered arithmetic, empty sentinels and the accumulator's shared-vector lifetime.
 * @evidence contracts/development/design.md#principled-representation The same bounds and centroid describe a whole population or a contiguous subset without encoding a different spatial concept for each traversal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Incremental, range and chunk producers exchange this single summary with population materializers and terrain selection.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The centroid is not a box centre or an unweighted mean of chunk means, and finite/nonempty admission remains the supplying population's responsibility.
 */
export interface IAutoMoviePlacementSummary {
  /** Component extrema over placement points in world metres, excluding model extent. */
  bounds: IAutoMovieFormationBounds;

  /** Running mean in input slot order, in world metres; zero for an empty fold. */
  centroid: IAutoMovieVector3;
}
