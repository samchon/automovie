import type { IAutoMovieConstructionLevelOrigin } from "./IAutoMovieConstructionLevelOrigin";

/**
 * The level axis: at each station the horizontal plane at that world height, its origin `(x(station), station, z(station))`, `u = +X` and `v = +Z`.
 *
 * The origin's offsets follow a course (`origin`) so a part whose sections drift sideways or forward with height (a trunk whose front and back outlines are not centred on one vertical line) keeps the section's polar centre strictly inside every station's box; null keeps the origin on the vertical line `x = 0`, `z = 0`.
 *
 * @evidence contracts/development/design.md#principled-representation A part whose sections are the level planes (a trunk, a column) needs no tilted frame, and stations in world height keep its knots at their measured heights; a polar section needs its centre inside its box, which an origin course supplies without tilting the planes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record covers the fixed vertical and the drifting centre; the course reuses the outline type every other curve along a part uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The planes stay level: a part that leans needs a straight, curved or jointed axis, not an origin course.
 * @evidence contracts/development/common.md#meaningful-documentation States the planes, the origin with and without its course, the axes, the station's meaning and the null case.
 */
export interface IAutoMovieConstructionLevelAxis {
  /** Discriminator. */
  type: "level";

  /** The origin's horizontal course in height; null for the vertical line through the world origin. */
  origin: IAutoMovieConstructionLevelOrigin | null;
}
