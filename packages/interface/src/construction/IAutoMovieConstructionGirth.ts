import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * Fullness owned by a tube's taut-tape girth: at each station the one common shoulder whose section's convex-hull perimeter is the girth, plus each quarter's departure from it.
 *
 * The perimeter rises from the rhombus `2 sqrt(W^2 + D^2)` toward the rectangle `2 (W + D)` of the box's breadth `W` and depth `D`, so one girth gives one shoulder; a girth outside the shoulders the section can reach keeps the reach's end shape and records one diagnostic naming the part, the station and the numbers.
 *
 * @evidence contracts/common.md#principled-implementation The taut tape is the convex hull's perimeter, monotone in the shoulder, so the girth is solved by a bracketing root finder rather than by scaling a section about its centre.
 * @evidence contracts/common.md#clear-and-simple-design One girth curve and an optional set of departures are the whole owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Departures need a published source or a derivation; the record carries them as inputs and never fits them, and an unreachable girth is reported rather than forced.
 * @evidence contracts/common.md#meaningful-documentation States the girth's definition, its range in the box, the solve's uniqueness, the out-of-reach effect and the departures' meaning and null.
 */
export interface IAutoMovieConstructionGirth {
  /** Discriminator. */
  type: "girth";

  /** The taut-tape girth, metres, knots at the published tape sites. */
  girth: IAutoMovieConstructionOutline;

  /**
   * Each quarter's departure from the solved common shoulder, in shoulder share, by increasing angle (quarter `q` from the touch at `q pi / 2` to the next); null for none.
   */
  departures: [IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline] | null;
}
