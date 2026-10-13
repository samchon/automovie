import { AutoMovieDrawingOpeningBasis } from "./AutoMovieDrawingOpeningBasis";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One opening as the drawing can see it.
 *
 * The mark exists so a plan's openings and the 3D design's openings can be
 * compared by id rather than by eye: every opening the view covers appears
 * here, whether or not the design gave it a shape.
 *
 * {@link basis} says where the shape came from, and the three answers are not
 * interchangeable. `profile` is the opening's own void placed on its host
 * boundary's face — the design answering the question directly. `fill` is the
 * filling element's extent standing in for a void nobody authored, which is a
 * door's size and not the hole's. `none` is the design declining to answer, and
 * the mark then carries no geometry at all rather than a zero-sized one.
 *
 * @author Samchon
 */
export interface IAutoMovieDrawingOpeningMark {
  /** Opening identity, matching the design's own opening id. */
  opening: string;

  /** Boundary the opening is cut through. */
  boundary: string;

  /** Opening kind, such as `door`, `window`, `arch` or `passage`. */
  kind: string;

  /** Filling element id, or `null` for an open cut. */
  fill: string | null;

  /** Where the geometry below came from. */
  basis: AutoMovieDrawingOpeningBasis;

  /**
   * The void's own outline projected onto the page, and empty for every other
   * basis.
   *
   * A `fill` mark carries a size and no outline on purpose: it measures the
   * leaf standing in the hole, and drafting that leaf's extent as the void's
   * shape would put a rectangle on the sheet the building has no hole for.
   *
   * Arc edges are drafted as chords at a fixed density, which is what vector
   * linework is; the dimensions below are computed from the arcs themselves and
   * never from these chords.
   */
  polygon: IAutoMovieDrawingPoint[];

  /**
   * Width in metres of whatever {@link basis} says was measured, or `null` when
   * it says `none`.
   *
   * A `profile` mark measures the void; a `fill` mark measures the leaf that
   * stands in one. Reading either as the other is the mistake {@link basis}
   * exists to prevent, so neither is called the void's size here.
   */
  width: number | null;

  /** Height in metres of the same thing, or `null` when `basis` is `none`. */
  height: number | null;
}
