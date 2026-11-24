import type { IAutoMovieLayoutText } from "./IAutoMovieLayoutText";

/**
 * Data contracts of turning laid-out text into glyph geometry, flat on a face
 * or raised into lettering.
 *
 * Coordinates are the layout's box frame in metres, origin at the box's
 * bottom-left corner, `+x` right, `+y` up, with `+z` out of the face toward the
 * reader.
 */
export namespace IAutoMovieBuildTextGeometry {
  /** Text to set and how finely to follow its curves. */
  export interface IProps extends IAutoMovieLayoutText.IProps {
    /**
     * Largest distance, metres, between a glyph's quadratic arc and the chords
     * that replace it; positive, default 0.05 mm. Each segment takes the fewest
     * equal parameter steps whose chord error bound `|P0 − 2P1 + P2| / (4n²)`
     * stays within it.
     */
    tolerance?: number;
  }

  /** Text extruded into raised lettering. */
  export interface IRaisedProps extends IProps {
    /**
     * Positive relief depth along `+z`, metres: the letters rise from `z = 0`
     * to `z = depth`.
     */
    depth: number;
  }
}
