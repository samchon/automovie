import type { AutoMovieDrawingOpeningBasis } from "./AutoMovieDrawingOpeningBasis";
import type { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One opening as the drawing can see it.
 *
 * Every opening whose host boundary touches a space the view includes gets a
 * mark, whether or not the design gave it a shape and whatever the view's
 * element-kind filter says, so a sheet's openings can be compared with the
 * design's by id. Marks are sorted by opening id.
 *
 * {@link basis} says where the geometry came from, and the answers are not
 * interchangeable. `profile` is the opening's own void placed on its host
 * boundary's face. `fill` is the filling element's extent standing in for a
 * void nobody authored, which is the leaf's size and not the hole's. `none`
 * means the design sizes the opening by neither, and the mark then carries no
 * outline and `null` sizes.
 */
export interface IAutoMovieDrawingOpeningMark {
  /** Opening id, matching the design's own opening record. */
  opening: string;

  /** Boundary the opening is cut through. */
  boundary: string;

  /** Opening kind, such as `door`, `window`, `arch` or `passage`. */
  kind: string;

  /** Filling element id, or `null` for an open cut. */
  fill: string | null;

  /** What {@link polygon}, {@link width} and {@link height} were taken from. */
  basis: AutoMovieDrawingOpeningBasis;

  /**
   * The void's own outline on the page for a `profile` mark, and empty for
   * every other basis.
   *
   * A `fill` mark has no outline because the leaf's extent drawn as the void's
   * shape would put a rectangle on the sheet where the building has no hole.
   * Arc edges are drafted as chords at a fixed angular step; {@link width} and
   * {@link height} are not computed from these chords.
   */
  polygon: IAutoMovieDrawingPoint[];

  /**
   * Width in metres of whatever {@link basis} says was measured, rounded to six
   * decimals, or `null` when it says `none`.
   *
   * A `profile` mark measures the void's bounding hull along the host face's
   * local X axis, which is tight for an arc whose chord is parallel to a face
   * axis and larger than the arc for a tilted chord. A `fill` mark measures the
   * wider of the leaf's world X and Z extents.
   */
  width: number | null;

  /**
   * Height in metres of the same thing, rounded to six decimals, or `null` when
   * `basis` is `none`: along the host face's local Y axis for `profile`, and
   * the world Y extent for `fill`.
   */
  height: number | null;
}
