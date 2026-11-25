import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One authored child-branch direction and emergence point in its parent's
 * deterministic local frame.
 */
export interface IAutoMoviePlantingChild {
  /** Stable child identity within the structure. */
  id: string;

  /**
   * Direction in the parent's frame, non-zero and need not be unit. `+y` is the
   * parent's own growth axis; `+x` and `+z` are a deterministic perpendicular
   * pair derived from that axis alone, so the same child vector means the same
   * thing wherever the parent points.
   */
  direction: IAutoMovieVector3;

  /**
   * Emergence fraction in `[0, 1]` of the parent's growth-extended length
   * before pruning; a cut can remove that emergence point.
   */
  offset: number;
}
