import type { IAutoMovieConstructionLevelOrigin } from "./IAutoMovieConstructionLevelOrigin";

/**
 * The level axis: at each station the horizontal plane at that world height,
 * its origin `(x(station), station, z(station))`, `u = +X` and `v = +Z`.
 *
 * The origin's offsets follow a course (`origin`) so a part whose sections
 * drift sideways or forward with height (a trunk whose front and back outlines
 * are not centred on one vertical line) keeps the section's polar centre
 * strictly inside every station's box; null keeps the origin on the vertical
 * line `x = 0`, `z = 0`.
 */
export interface IAutoMovieConstructionLevelAxis {
  /** Discriminator. */
  type: "level";

  /**
   * The origin's horizontal course in height; null for the vertical line
   * through the world origin.
   */
  origin: IAutoMovieConstructionLevelOrigin | null;
}
