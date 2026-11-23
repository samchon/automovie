import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * Fullness owned by a tube's taut-tape girth: at each station the one common
 * shoulder whose section's convex-hull perimeter is the girth, plus each
 * quarter's departure from it.
 *
 * The perimeter rises from the rhombus `2 sqrt(W^2 + D^2)` toward the rectangle
 * `2 (W + D)` of the box's breadth `W` and depth `D`, so one girth gives one
 * shoulder; a girth outside the shoulders the section can reach keeps the
 * reach's end shape and records one diagnostic naming the part, the station and
 * the numbers.
 */
export interface IAutoMovieConstructionGirth {
  /** Discriminator. */
  type: "girth";

  /** The taut-tape girth, metres, knots at the published tape sites. */
  girth: IAutoMovieConstructionOutline;

  /**
   * Each quarter's departure from the solved common shoulder, in shoulder
   * share, by increasing angle (quarter `q` from the touch at `q pi / 2` to the
   * next); null for none.
   */
  departures:
    | [
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
        IAutoMovieConstructionOutline,
      ]
    | null;
}
