import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One authored child-branch direction and emergence point in its parent's deterministic local frame.
 *
 * @evidence contracts/common.md#principled-implementation Nonzero direction is normalized in the parent's axis frame, whose perpendicular basis follows the shared stable vector construction; offset selects a fraction of the parent's current length.
 * @evidence contracts/common.md#clear-and-simple-design Child identity and two placement inputs form the reusable branching law without species-specific angles or hierarchy objects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero vectors and out-of-range offsets refuse; direction need not already be unit and no named plant selects a hidden branching preset.
 * @evidence contracts/common.md#meaningful-documentation Defines stable child id, parent-axis coordinate convention and closed-unit emergence fraction.
 * @author Samchon
 */
export interface IAutoMoviePlantingChild {
  /** Stable child identity within the structure. */
  id: string;

  /**
   * Direction in the parent's frame, non-zero and need not be unit. `+y` is the parent's own growth axis; `+x` and `+z` are a deterministic perpendicular pair derived from that axis alone, so the same child vector means the same thing wherever the parent points.
   */
  direction: IAutoMovieVector3;

  /** Where along the parent it emerges, in `[0, 1]` of the parent's length. */
  offset: number;
}
