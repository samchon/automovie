import { AutoMovieDrawingOpeningBasis } from "./AutoMovieDrawingOpeningBasis";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

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
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawing` prefers the opening's profile, measured by `autoMovieOpeningExtent` over the outline's bounding hull in face axes, and falls back to `autoMovieOpeningFillExtent` over the fill element's placed triangle corners, reading world `+Y` as height and the wider of world X and Z as width; an opening with neither, or whose fill has no environment-owned model or no triangles, is `none`.
 * @evidence contracts/common.md#clear-and-simple-design Identity fields mirror the design's opening record, and one `basis` field decides how `polygon`, `width` and `height` are read, so a consumer branches once instead of inferring provenance from which fields are empty.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A fill-sized opening gets no outline instead of the leaf's box drawn as a void, and an unsized opening gets `null` sizes instead of zero; the drawing also files `opening-profile` and `opening-geometry` gaps that count those marks.
 * @evidence contracts/common.md#meaningful-documentation States which openings receive a mark, their order, and what each basis means; members give the metre unit, the face axes or world axes behind each size, the chord drafting of arcs, and when the outline is empty.
 * @author Samchon
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
