/**
 * The level axis: at each station the horizontal plane at that world height, its origin `(0, station, 0)`, `u = +X` and `v = +Z`.
 *
 * @evidence contracts/common.md#principled-implementation A part whose sections are the level planes (a trunk, a column) needs no frame of its own, and stations in world height keep its knots at their measured heights.
 * @evidence contracts/common.md#clear-and-simple-design A record with only its discriminator states the default frame without restating its numbers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The frame is exactly the level planes; a part that leans needs a straight or curved axis instead.
 * @evidence contracts/common.md#meaningful-documentation States the origin, the axes and the station's meaning.
 */
export interface IAutoMovieConstructionLevelAxis {
  /** Discriminator. */
  type: "level";
}
